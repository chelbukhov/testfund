const assert = require ('assert');              // утверждения
const ganache = require ('ganache-cli');        // тестовая сеть
const Web3 = require ('web3');                  // библиотека для подключения к ефириуму
const web3 = new Web3(ganache.provider());      // настройка провайдера

require('events').EventEmitter.defaultMaxListeners = 0;

const compiledContract = require('../ethereum/build/TestFund.json');

let accounts;
let factory;
let contractAddress;
let contract;






console.log ('Begin testing...');


beforeEach(async () => {
    accounts = await web3.eth.getAccounts();
    contract = await new web3.eth.Contract(JSON.parse(compiledContract.interface),)
    .deploy({ data: compiledContract.bytecode })
    .send({ from: accounts[0], gas: '6000000'});
    

});


describe('Testing a contract...', () => {

    it('Test a contract manager', async () => {
        const cManager = await contract.methods.manager().call();
        assert.equal(accounts[0], cManager);
    });

    it('Test a contract manager2', async () => {
        await contract.methods.addManager2().send({
            from: accounts[1],
            gas: '1000000'
        });
        const cManager2 = await contract.methods.manager2().call();
        assert.equal(accounts[1], cManager2);

        console.log("..test of repeate call addManager2() function..");
        try {
            await contract.methods.addManager2().send({
                from: accounts[2],
                gas: '1000000'
            });
            assert(false);
        } catch (error) {
            assert(error);

        }

    });


    it('Test a contract balance', async () => {
        const cBalance = web3.utils.fromWei(await contract.methods.getBalance().call(), 'ether');
        //const cBalance = web3.utils.fromWei(await web3.eth.getBalance(accounts[0]), 'ether');
        //assert.ok(cBalance>99);
        //console.log("Account[0]: ", accounts[0]);        
        console.log("Balance of contract in Ether: ", cBalance);
    });

    it('Test array of funders', async () => {
        let funders = await contract.methods.getFundersCount().call();
        assert.ok(funders == 0);
        console.log("funders.length: ", funders);        
    });
    
    it('Test contract to receive an transfer money...', async () => {
        let funders = await contract.methods.AddBalanceContract().send({
            from: accounts[0],
            value: 6*10**18,
            gas: '1000000'
        });
        let realBalance = web3.utils.fromWei(await contract.methods.getBalance().call(), 'ether');
        assert.ok(realBalance > 0);
        console.log("newBalance in Ether: ", realBalance); 

        realBalance = web3.utils.fromWei(await contract.methods.getBalance().call(), 'ether');
        realBalance = realBalance / 2 * (10**18);
        await contract.methods.transferTo(accounts[5], realBalance).send({
            from: accounts[0],
            gas: '1000000'
        });
        realBalance = web3.utils.fromWei(await contract.methods.getBalance().call(), 'ether');
        console.log("Balance of contract after transfer in Ether: ", realBalance);        

        realBalance = web3.utils.fromWei(await web3.eth.getBalance(accounts[5]), 'ether');
        console.log("Balance of account 5 in Ether: ", realBalance);        

    });
    

    it('Test functions...', async () => {


        console.log("Add 1-st...");
        await contract.methods.addFunder("First", accounts[1]).send({
            from: accounts[0],
            gas: '1000000'
        });
        funders = await contract.methods.getFundersCount().call();
        assert.ok(funders == 1);

        console.log("Add 2-nd...");
        await contract.methods.addFunder("Second", accounts[2]).send({
            from: accounts[0],
            gas: '1000000'
        });
        funders = await contract.methods.getFundersCount().call();
        assert.ok(funders == 2);

        console.log("Add 3-d...");
        await contract.methods.addFunder("Last", accounts[3]).send({
            from: accounts[0],
            gas: '1000000'
        });
        funders = await contract.methods.getFundersCount().call();
        assert.ok(funders == 3);

        console.log("'Listen balances...'");
        let cBalance1 = web3.utils.fromWei(await web3.eth.getBalance(accounts[1]), 'ether');
        assert.ok(cBalance1>99);
        console.log("Balance of mr.First in Ether: ", cBalance1);

        let cBalance2 = web3.utils.fromWei(await web3.eth.getBalance(accounts[2]), 'ether');
        assert.ok(cBalance2>99);
        console.log("Balance of mr.Second in Ether: ", cBalance2);

        let cBalance3 = web3.utils.fromWei(await web3.eth.getBalance(accounts[3]), 'ether');
        assert.ok(cBalance3>99);
        console.log("Balance of mr.Last in Ether: ", cBalance3);



        console.log("Add contrbutions...");
        console.log("mr  First - 10...");
        let conrt1 = await contract.methods.Contribution().send({
            from: accounts[1],
            value: 10*10**18,
            gas: '1000000'
        });
        console.log("mr  Second - 20...");
        let conrt2 = await contract.methods.Contribution().send({
            from: accounts[2],
            value: 20*(10**18),
            gas: '1000000'
        });
        console.log("mr  Last - 50...");
        let conrt3 = await contract.methods.Contribution().send({
            from: accounts[3],
            value: 50*(10**18),
            gas: '1000000'
        });

        console.log("'Listen balance of contract after contr...'");
        const  newBalance2 = web3.utils.fromWei(await contract.methods.getBalance().call(), 'ether');
        assert.ok(newBalance2 > 15);
        console.log("New Balance of contract in Ether: ", newBalance2);

        console.log("'Listen balances...'");
        let cBalance4 = web3.utils.fromWei(await web3.eth.getBalance(accounts[1]), 'ether');
        console.log("Balance of mr.First in Ether: ", cBalance4);

        let cBalance5 = web3.utils.fromWei(await web3.eth.getBalance(accounts[2]), 'ether');
        console.log("Balance of mr.Second in Ether: ", cBalance5);

        let cBalance6 = web3.utils.fromWei(await web3.eth.getBalance(accounts[3]), 'ether');
        console.log("Balance of mr.Last in Ether: ", cBalance6);

               
        console.log("..Test of creating request to withdraw profit...");
        await contract.methods.createRequestWdProfit(10*(10**18), 1522594882+100000).send({
            from: accounts[0],
             gas: '1000000'
        });
        const reqCount = await contract.methods.getReqCount().call();
        assert.ok(reqCount == 1);

        console.log("..Test of approve request to withdraw profit...");
        await contract.methods.approveRequestWdProfit(0).send({
            from: accounts[1],
             gas: '1000000'
        });
        await contract.methods.approveRequestWdProfit(0).send({
            from: accounts[2],
             gas: '1000000'
        });

        console.log("..Test of zinalize request to withdraw profit...");
        console.log("..must be withdraw profit 10 Ether...");
        await contract.methods.finalizeRequestWdProfit(0).send({
            from: accounts[0],
             gas: '1000000'
        });
        


/*
        console.log("..Test of withdraw profit 10 Ether...");
        let mySummToWithdraw = 10 * (10**18);
        await contract.methods.withdrawProfit(mySummToWithdraw).send({
           from: accounts[0],
            gas: '1000000'
        });
*/






        console.log("'Listen balances...'");
        cBalance1 = web3.utils.fromWei(await web3.eth.getBalance(accounts[1]), 'ether');
        //assert.ok(cBalance1>99);
        console.log("Balance of mr.First in Ether: ", cBalance1);

        cBalance2 = web3.utils.fromWei(await web3.eth.getBalance(accounts[2]), 'ether');
        //assert.ok(cBalance2>99);
        console.log("Balance of mr.Second in Ether: ", cBalance2);

        cBalance3 = web3.utils.fromWei(await web3.eth.getBalance(accounts[3]), 'ether');
        //assert.ok(cBalance3>99);
        console.log("Balance of mr.Last in Ether: ", cBalance3);

        const  newBalance3 = web3.utils.fromWei(await contract.methods.getBalance().call(), 'ether');
        console.log("New Balance of contract after widthraw: ", newBalance3);

        

    });








});

