import web3 from './web3';
import TF from './build/TestFund.json';

export default (address) => {
    return new web3.eth.Contract(JSON.parse(TF.interface), address);
};