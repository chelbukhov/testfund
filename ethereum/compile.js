const path = require('path');
const solc = require('solc');
const fs = require('fs-extra');

const buildPath = path.resolve(__dirname, 'build');
fs.removeSync(buildPath);
// removeSync - одна из улучшенных ф-ий пакета fs-extra. Удаляет папку вместе со всем содержимым

const contractPath = path.resolve(__dirname, 'contracts', 'TestFund.sol');
const source = fs.readFileSync(contractPath, 'utf8');

const output = solc.compile(source, 1).contracts;

fs.ensureDirSync(buildPath); // создание папки build

for (let contract in output) {
    fs.outputJsonSync(
        path.resolve(buildPath, contract.replace(':','') + '.json'), 
        output[contract]
    );
}

