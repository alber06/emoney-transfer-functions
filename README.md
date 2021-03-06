# emoney-transfer-functions

Firebase project for the e-money transfer POC backend

## Configuration

In order to deploy the functions in this repo, first youneed to install firebase-tools globally:

`npm i -g firebase-tools`

You also need to have this env variables set in your firebase project:

```javascript
 "emoney_transfer": {
    "admin_account_address": "0xAf...", // Address that contains all the tokens for the initial transfer
    "sph_contract_address": "0x1B...", // ERC20 Token address
    "node_service_api_key": "https://rinkeby.infura.io/v3/<your-project-id>", // url for the node service
    "admin_account_private_key": "48...", // Private key for the admin account address. 0x stripped
    "crypto_secret_key": "19x..." // Secret key for Cypto encrypt/decrypt
  }
```

To set the variables:

`firebase functions:config:set emoney_transfer.admin_account_address=<your-address>`

To check that they are correctly set:

`firebase functions:config:get`

## Deployment

To deploy the functions, you need to run the following command after installing all the project's dependencies and that's it, they will be deployed in your project:

`firebase deploy`
