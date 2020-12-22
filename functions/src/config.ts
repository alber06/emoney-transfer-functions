import * as functions from 'firebase-functions';
const configData = functions.config().emoney_transfer;

export const config = {
  nodeServiceApiKey: configData.node_service_api_key,
  adminAccountAddress: configData.admin_account_address,
  adminAccountPrivateKey: configData.admin_account_private_key,
  sphContractAddress: configData.sph_contract_address,
  cryptoSecretKey: configData.crypto_secret_key,
};
