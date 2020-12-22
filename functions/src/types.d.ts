interface UserAccount {
  ethAccountAddress: string;
  ethAccountPrivateKey: string;
  email?: string;
  amount?: number;
}

interface TransferRequest {
  userTo: string;
  amount: number;
}

interface SignedTransactionInput {
  addressFrom: string;
  addressTo: string;
  privateKey: string;
}

type TransactionPayload = Record<string, unknown>;
