pragma solidity ^0.4.17;

contract TestFund {
    /*
    Существует фонд, при создании которого определяются его владельцы и их доли. 
    Фонд может получать прибыль в эфириуме или в токенах. 
    Участники фонда могут устраивать голосования на следующие события:
    
    1. Распределение части входящих дивидендов по адресам участников пропорционально их долям
    2. Перевод средств на определенный адрес
    3. Добавление нового участника в фонд
    
    Предложения исполняются при наборе квалифицированного большинства голосов  в 2/3.
    
    Голосования должны быть ограничены по времени. 
    Если за заданное время голоса не набираются, инициатива не выполняется. 
    Работа фонда должна быть реализована на смарт контракте в тестовом блокчейне ethereum (rinkeby).
    */
    
    event Withdraw(
        address indexed _to,
        uint _value
    );

    address public manager;
    address public manager2;
    bool public manager2IsAdded;
    uint256 public totalContribution;       //общее количество внесенных средств
    uint256 public allCalcSumm;             //рассчитанная общая сумма к выдаче
    address public myAddress = this;        //адрес контракта
    uint public fundersCount; //счетчик участников

    
    // структура Участник
    struct Funder {
        string fName;
        address fAddress;
    }
    
    // структура Коэффициент долевого участия
    struct Frate {
            address fAddress;
            uint    fRate;
    }
    
    struct RequestWdProfit {        // структура Запрос на вывод прибыли
        uint value;                 // сумма к выдаче
        uint requestTime;            // финальное время, после которого запрос не может быть исполнен
        bool complete;
        uint approvalCount; // счетчик голосов
        mapping(address => bool) approvals;
    }

    RequestWdProfit[] public requestsWdProfit;  // массив запросов на вывод прибыли    
    Frate[] public rates; // массив для хранения рассчитанных значений "к выдаче"
    Funder[] public funders; // массив участников
    
    mapping(address => bool) public isFunder;
    mapping(address => uint256) public fContribution;


    function TestFund() public {
        manager = msg.sender;
    }

    modifier restricted() {
        require(msg.sender == manager || msg.sender == manager2);
        _;
    }   

    function getFundersCount() public view returns(uint){
        return funders.length;
    }

    function addManager2() public {
        require(!manager2IsAdded);
        manager2 = msg.sender;
        manager2IsAdded = true;
    }

    function addFunder(string _fName, address _fAddress) public restricted {
        // Добавление нового участника в фонд
        require (!isFunder[_fAddress]);
        //добавляю участника
        Funder memory tempFunder = Funder({
            fName : _fName,
            fAddress : _fAddress
        });
        
        funders.push(tempFunder);
        fContribution[_fAddress] = 0;        
        isFunder[_fAddress] = true;
        fundersCount ++;
    }

    function createRequestWdProfit(uint value, uint controlTime) public restricted {
        // Создание запроса на выдачу прибыли
        RequestWdProfit memory newRequest = RequestWdProfit({
            value: value, 
            requestTime: controlTime, 
            complete: false, 
            approvalCount: 0
        });
        
        requestsWdProfit.push(newRequest);
    }

    function approveRequestWdProfit(uint index) public {
        // Утверждение запроса на выдачу прибыли
        RequestWdProfit storage request = requestsWdProfit[index];  //получаем переменную текущего запроса в хранилище
        
        require(isFunder[msg.sender]); //проверка, что человек является участником
        require(!request.approvals[msg.sender]); //проверка, что участник еще не голосовал по данному запросу
        
        request.approvals[msg.sender] = true;   //добавляем участника в список проголосовавших по данному запросу
        request.approvalCount++;    //увеличиваем счетчик голосов
        
    }
    
        function finalizeRequestWdProfit(uint index) public payable restricted {
        RequestWdProfit storage request = requestsWdProfit[index];
        require(now < request.requestTime); // проверка, что время запроса еще не вышло
        require(request.approvalCount >= (fundersCount * 2 / 3)); //проверка, что число проголосовавших >= 2/3 общего числа участников
        require(!request.complete); // проверка, что запрос еще не был выполнен

        request.complete = true;    // установка флага - выполнен
        withdrawProfit(request.value); // вызов функции распределения прибыли
        
        
    }
    
    function Contribution () public payable {
        uint summContribution = msg.value;
        address addressContributor = msg.sender;
        require(isFunder[addressContributor]);
        
        fContribution[addressContributor] += summContribution;
        totalContribution += summContribution;
        
        // пересчет долей участников
        calcProfit();
    }
    
    function transferTo (address _to, uint256 _value) public payable restricted returns (bool) {
        //Перевод средств на определенный адрес
        require(_to != address(0));
        require(_value <= myAddress.balance);

        return _to.send(_value);
    
    }
    
    function calcProfit () private {
        // Кодсчет фактического коэффициента участия (доли каждого участника)
        //Записывает данные в массив rates[]
        
        require(funders.length>0);
        
        uint currentRate;
        address currentAddress;
        uint currentContribution;
        
        delete rates;

        for (uint i = 0; i < funders.length; i++) {
            currentAddress = funders[i].fAddress;
            currentContribution = fContribution[currentAddress];
            
            //считаем текущую долю участника в %
            currentRate = 100 * currentContribution / totalContribution;

            Frate memory tempRate = Frate({
                fAddress : currentAddress,
                fRate : currentRate
            });
            rates.push(tempRate);
        }
        
    }
    
    function withdrawProfit (uint _value) private restricted {
        // Распределение части входящих дивидендов по адресам участников пропорционально их долям
        // _value - количество средств, предназначенных для распределения между участниками
        
        require(_value <= myAddress.balance);
        
        address currentAddress;
        uint currentSumm;
        
        for (uint i = 0; i < rates.length; i++) {
            currentAddress = rates[i].fAddress;
            currentSumm = _value * rates[i].fRate / 100;
            require (currentSumm <= myAddress.balance);
            if (currentAddress.send(currentSumm)){
                emit Withdraw(currentAddress, currentSumm);
            }
        }        
        
    }
    
    function getBalance () public view  returns(uint256){
        // для тестирования
        return myAddress.balance;
    }
    
    function AddBalanceContract () public payable {
        // для пополнения баланса при тестировании
    }

    function getReqCount () public view returns(uint) {
        //получение количества запросов - для тестирования
        return requestsWdProfit.length;
    }
}