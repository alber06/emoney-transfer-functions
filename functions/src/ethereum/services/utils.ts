import { Transaction as EthereumTx } from 'ethereumjs-tx';
import CryptoJS from 'crypto-js';
import web3 from './web3';
import { sphToken } from '../contracts';
import { config } from '../../config';

export default class Utils {
  /**
   * Transfers tokens between accounts
   *
   * @param  {UserAccountType} accountFrom
   * @param  {string} addressTo
   * @param  {number} amount
   * @returns Promise<void>
   */
  static transferFrom = async (accountFrom: UserAccountType, addressTo: string, amount: number): Promise<void> => {
    Utils.validateTransferParams(accountFrom, addressTo, amount);

    const { ethAccountAddress: addressFrom, ethAccountPrivateKey: privateKey } = accountFrom;
    const contractAddress = config.sphContractAddress;

    console.debug(`Sending ${amount} tokens from ${addressFrom} to ${addressTo}...`);
    await Utils.sendSignedTransaction(
      {
        addressFrom,
        addressTo: contractAddress,
        privateKey: CryptoJS.AES.decrypt(privateKey, config.cryptoSecretKey).toString(CryptoJS.enc.Utf8),
      },
      { data: sphToken.methods.transfer(addressTo, amount).encodeABI() }
    );
    console.debug('Transfer finished!');
  };

  /**
   * Sends ether between accounts
   *
   * @param  {UserAccountType} accountFrom
   * @param  {string} addressTo
   * @param  {number} amount
   * @returns Promise<void>
   */
  static sendEtherFrom = async (accountFrom: UserAccountType, addressTo: string, amount: string): Promise<void> => {
    const { ethAccountAddress: addressFrom, ethAccountPrivateKey: privateKey } = accountFrom;

    console.debug(`Sending ${amount} ether from ${addressFrom} to ${addressTo}`);
    await Utils.sendSignedTransaction(
      {
        addressFrom,
        addressTo,
        privateKey: CryptoJS.AES.decrypt(privateKey, config.cryptoSecretKey).toString(CryptoJS.enc.Utf8),
      },
      { value: web3.utils.toHex(web3.utils.toWei(amount, 'ether')) }
    );
    console.debug('Sending ether finished!');
  };

  /**
   * Validates transfer parameters
   *
   * @param  {UserAccountType} accountFrom
   * @param  {string} addressTo
   * @param  {number} amount
   * @returns void
   */
  private static validateTransferParams(accountFrom: UserAccountType, addressTo: string, amount: number): void {
    if (!addressTo) {
      throw new Error('Address to transfer data must be provided');
    }

    if (!amount) {
      throw new Error('Amount to transfer must be provided');
    }

    if (!accountFrom || !accountFrom.ethAccountAddress || !accountFrom.ethAccountPrivateKey) {
      throw new Error('Sender account data not provided');
    }
  }

  /**
   * Sends an ethereum transactions signed with private key
   *
   * @param  {string} addressFrom
   * @param  {string} addressTo
   * @param  {string} privateKey
   * @param  {TransactionPayload} transactionPayload
   * @returns Promise<void>
   */
  private static sendSignedTransaction = async (
    { addressFrom, addressTo, privateKey }: SignedTransactionInput,
    transactionPayload: TransactionPayload
  ): Promise<void> => {
    const count = await web3.eth.getTransactionCount(addressFrom);
    const rawTransaction = {
      from: addressFrom,
      nonce: web3.utils.toHex(count),
      gasPrice: '0xEE6B2800',
      gasLimit: '0xDBBA0',
      to: addressTo,
      ...transactionPayload,
    };
    const tx = new EthereumTx(rawTransaction, {
      chain: 'rinkeby',
    });
    const bufferedPrivateKey = Buffer.from(privateKey, 'hex');

    tx.sign(bufferedPrivateKey);

    await web3.eth.sendSignedTransaction(`0x${tx.serialize().toString('hex')}`);
  };

  static balanceOf = (address: string): number => {
    return sphToken.methods.balanceOf(address).call();
  };
}
