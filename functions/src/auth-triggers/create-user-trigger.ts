import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import AES from 'crypto-js/aes';
import { web3, utils } from '../ethereum/services';
import { config } from '../config';

const INITIAL_SPH_AMOUNT = 100;
const INITIAL_ETH_AMOUNT = '0.005';

// Firestore function

export const createUserTrigger = functions.auth.user().onCreate(async (user) => {
  try {
    const account = await web3.eth.accounts.create();
    const myAddress = config.adminAccountAddress;

    await utils.transferFrom(
      {
        ethAccountAddress: myAddress,
        ethAccountPrivateKey: config.adminAccountPrivateKey,
      },
      account.address,
      INITIAL_SPH_AMOUNT
    );

    await utils.sendEtherFrom(
      {
        ethAccountAddress: myAddress,
        ethAccountPrivateKey: config.adminAccountPrivateKey,
      },
      account.address,
      INITIAL_ETH_AMOUNT
    );

    const userDoc: UserAccount = buildUserAccount(user, account);
    const result = await admin.firestore().collection('users').doc(user.uid).set(userDoc);

    console.info(`User Created result: ${result}`);
  } catch (err) {
    console.error(`Error: ${err}`);
  }
});

// Private functions

/**
 * Builds a User Account model
 * @param  {admin.auth.UserRecord} user
 * @param  {any} account
 * @returns UserAccount
 */

const buildUserAccount = (user: admin.auth.UserRecord, account: any): UserAccount => ({
  email: user.email,
  ethAccountAddress: account.address,
  ethAccountPrivateKey: AES.encrypt(account.privateKey.split('0x')[1], config.cryptoSecretKey).toString(),
  amount: INITIAL_SPH_AMOUNT,
});
