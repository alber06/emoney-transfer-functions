import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { utils } from '../ethereum/services';
import collections from './collections';

const db = admin.firestore();

export default class UserAccount {
  public uid?: string;
  public ethAccountAddress: string;
  public ethAccountPrivateKey: string;
  public email?: string;
  public amount?: number;

  constructor({ ethAccountAddress, ethAccountPrivateKey, email, amount, uid }: UserAccountType) {
    this.uid = uid;
    this.ethAccountAddress = ethAccountAddress;
    this.ethAccountPrivateKey = ethAccountPrivateKey;
    this.email = email;
    this.amount = amount;
  }

  /**
   * Returns the user info in object format
   *
   * @returns UserAccountType
   */
  public getInfo(): UserAccountType {
    return {
      uid: this.uid,
      ethAccountAddress: this.ethAccountAddress,
      ethAccountPrivateKey: this.ethAccountPrivateKey,
      email: this.email,
      amount: this.amount,
    };
  }

  /**
   * Updates a user account with it's balance in the ETH address
   *
   * @param  {FirebaseFirestore.Transaction} transaction
   * @returns Promise<FirebaseFirestore.Transaction>
   */
  public async updateAccount(transaction: FirebaseFirestore.Transaction): Promise<FirebaseFirestore.Transaction> {
    const userRef = db.collection(collections.USER_COLLECTION).doc(this.uid || '');
    this.amount = await utils.balanceOf(this.ethAccountAddress);

    console.debug(`Updating account ${this.uid} with balance ${this.amount}`);
    return transaction.update(userRef, this.getInfo());
  }

  /**
   * Transfers amount of tokens from one user to another
   *
   * @param  {string} userFrom
   * @param  {string} userTo
   * @param  {number} amount
   * @returns Promise<void>
   */
  public static async transferFrom(userFrom: string, userTo: string, amount: number): Promise<void> {
    await db.runTransaction(async (transaction) => {
      const senderAccount: UserAccount = await this.getUserAccount(userFrom, transaction);
      const receiverAccount: UserAccount = await this.getUserAccount(userTo, transaction);

      this.validateTransferConditions(senderAccount, receiverAccount, amount);

      await utils.transferFrom(senderAccount, receiverAccount.ethAccountAddress, amount);

      console.debug('Updating user accounts...');
      await senderAccount.updateAccount(transaction);
      await receiverAccount.updateAccount(transaction);
    });
  }

  /**
   * Returns a user account by it's uid
   *
   * @param  {string} uid
   * @param  {FirebaseFirestore.Transaction} transaction
   * @returns Promise<UserAccount>
   */
  private static async getUserAccount(uid: string, transaction: FirebaseFirestore.Transaction): Promise<UserAccount> {
    const userRef = db.collection(collections.USER_COLLECTION).doc(uid);
    const userAccountSnapshot = await transaction.get(userRef);

    return new UserAccount(userAccountSnapshot.data() as UserAccountType);
  }

  /**
   * Validates transfer pre conditions
   *
   * @param  {UserAccountType} senderAccount
   * @param  {UserAccountType} receiverAccount
   * @param  {number} amount
   * @returns void
   */
  private static validateTransferConditions(senderAccount: UserAccountType, receiverAccount: UserAccountType, amount: number): void {
    if (!senderAccount || !receiverAccount) {
      throw new functions.https.HttpsError('not-found', 'Some of the users does not exist');
    }

    if (amount > (senderAccount.amount || 0)) {
      throw new functions.https.HttpsError('failed-precondition', 'User does not have enough funds');
    }
  }
}
