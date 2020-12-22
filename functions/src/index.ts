import * as admin from 'firebase-admin';
admin.initializeApp();

import * as createUser from './auth-triggers/create-user-trigger';
import * as transfer from './transfer/transfer-tokens';

export const createUserTrigger = createUser.createUserTrigger;
export const transferTokens = transfer.transferTokens;
