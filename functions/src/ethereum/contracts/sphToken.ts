import web3 from '../services/web3';
import * as SPHToken from '../build/SPHToken.json';

const contractAbi = SPHToken.abi as any;
const contractAddress = '0xd0d383a4D93C1B9e11a71Fc013f8d7AD98481B00';

const instance = new web3.eth.Contract(contractAbi, contractAddress);

export default instance;
