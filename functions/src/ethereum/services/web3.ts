import Web3 from 'web3';
import { config } from '../../config';

const web3 = new Web3(config.nodeServiceApiKey);

export default web3;
