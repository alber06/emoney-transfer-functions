import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import AES from 'crypto-js/aes';
import { web3, utils } from '../ethereum/services';
import { config } from '../config';
import { UserAccount } from '../models';

const INITIAL_SPH_AMOUNT = 100;
const INITIAL_ETH_AMOUNT = '0.005';

// Firestore function

export const createUserTrigger = functions.auth.user().onCreate(async (user) => {
  const { adminAccountAddress, adminAccountPrivateKey } = config;
  try {
    const account = await web3.eth.accounts.create();

    await utils.transferFrom(
      {
        ethAccountAddress: adminAccountAddress,
        ethAccountPrivateKey: adminAccountPrivateKey,
      },
      account.address,
      INITIAL_SPH_AMOUNT
    );

    await utils.sendEtherFrom(
      {
        ethAccountAddress: adminAccountAddress,
        ethAccountPrivateKey: adminAccountPrivateKey,
      },
      account.address,
      INITIAL_ETH_AMOUNT
    );

    const userDoc = new UserAccount({
      uid: user.uid,
      email: user.email,
      ethAccountAddress: account.address,
      ethAccountPrivateKey: AES.encrypt(account.privateKey.split('0x')[1], config.cryptoSecretKey).toString(),
      amount: INITIAL_SPH_AMOUNT,
    });
    const result = await admin.firestore().collection('users').doc(user.uid).set(userDoc.getInfo());

    console.info(`User Created result: ${result}`);
  } catch (err) {
    console.error(`Error: ${err}`);
  }
});
