import * as functions from 'firebase-functions';
import { UserAccount } from '../models';

// Firestore function

export const transferTokens = functions.https.onCall(async (data, context: functions.https.CallableContext) => {
  validateRequest(data, context);

  const userFrom = context && context.auth ? context.auth.uid : '';
  const { userTo, amount } = data as TransferRequest;

  await UserAccount.transferFrom(userFrom, userTo, amount);

  return;
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
