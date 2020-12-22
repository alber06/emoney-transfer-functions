import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { utils } from '../ethereum/services';
import { collections } from '../models';

const db = admin.firestore();

// Firestore function

export const transferTokens = functions.https.onCall(async (data, context: functions.https.CallableContext) => {
  validateRequest(data, context);

  const userFrom = context && context.auth ? context.auth.uid : '';
  const { userTo, amount } = data as TransferRequest;

  await db.runTransaction(async (transaction) => {
    const senderAccount = await getUserAccount(userFrom, transaction);
    const receiverAccount = await getUserAccount(userTo, transaction);

    validateConditions(senderAccount, receiverAccount, amount);

    await utils.transferFrom(senderAccount, receiverAccount.ethAccountAddress, amount);

    console.debug('Updating user accounts...');
    await updateUserAccount(userFrom, senderAccount, transaction);
    await updateUserAccount(userTo, receiverAccount, transaction);
  });

  return {};
});

// Private functions

const validateRequest = (data: TransferRequest, context: functions.https.CallableContext): void => {
  if (!context.auth) {
    throw new functions.https.HttpsError('failed-precondition', 'The user must be authenticated');
  }

  if (!data.userTo) {
    throw new functions.https.HttpsError('failed-precondition', 'Address to send tokens must be provided');
  }

  if (!data.amount) {
    throw new functions.https.HttpsError('failed-precondition', 'Amount of tokens must be provided');
  }
};

const getUserAccount = async (uid: string, transaction: FirebaseFirestore.Transaction): Promise<UserAccount> => {
  const userRef = db.collection(collections.USER_COLLECTION).doc(uid);
  const userAccountSnapshot = await transaction.get(userRef);

  return userAccountSnapshot.data() as UserAccount;
};

const validateConditions = (senderAccount: UserAccount, receiverAccount: UserAccount, amount: number): void => {
  if (!senderAccount || !receiverAccount) {
    throw new functions.https.HttpsError('not-found', 'Some of the users does not exist');
  }

  if (amount > (senderAccount.amount || 0)) {
    throw new functions.https.HttpsError('failed-precondition', 'User does not have enough funds');
  }
};

const updateUserAccount = async (
  uid: string,
  userAccount: UserAccount,
  transaction: FirebaseFirestore.Transaction
): Promise<FirebaseFirestore.Transaction> => {
  const userRef = db.collection(collections.USER_COLLECTION).doc(uid);
  userAccount.amount = await utils.balanceOf(userAccount.ethAccountAddress);

  return transaction.update(userRef, userAccount);
};
