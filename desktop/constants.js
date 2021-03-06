
const CONSTANTS = {
  ADDRESS_BOOK : "AddressBook",
  CURRENCY_EXCHANGE_RATE : [ "KRW" ],
  EXCHAGE_RATE_KEY : "ExchangeRate",
  IS_NEW_WALLET_KEY : "IsNewWallet",
  OAUTH2TOKEN_KEY : "OAuth2Token",
  OFFCHAIN_TOKEN_INFO : "OffchainTokenInfo"
};

const ERRORS = {
  CANCEL_REQUEST: {
    code: "ERR-002",
    title: "Cancel request",
    detail: "User cancelled the request.",
    type: "Business"
  },

  TRANSACTION_REQUEST_TIMEOUT: {
    code: "ERR-012",
    title: "Transaction confirmation timeout",
    detail: "No transaction confirmation input from user.",
    type: "Business"
  },

  NOT_ENOUGH_BALANCE: {
    code: "ERR-094",
    title: "Not enough balance",
    detail: "Not enough balance to make a transaction.",
    type: "Business"
  },

  INVALID_REQUEST: {
    code: "ERR-095",
    title: "Invalid request",
    detail: "Not enough or incorrect parameters.",
    type: "Business"
  },

  NO_WALLET_NETWORK: {
    code: "ERR-096",
    title: "No network in request",
    detail: "No network in the request parameter.",
    type: "Business"
  },

  PENDING_TRANSACTION : {
    code: "ERR-097",
    title: "Pending transaction confirmation",
    detail: "Previous transaction has not been confirmed or cancelled.",
    type: "Business"
  },

  NO_WALLET : {
    code: "ERR-098",
    title: "No wallet",
    detail: "User has not logined",
    type: "Business"
  },

  INTERNAL_ERROR : {
    code: "ERR-099",
    title: "Internal error request",
    detail: "Internal error",
    type: "Infrastructure"
  }
};

const STORE_ERRORS = {
  INVALID_RETAILER: {
    code: "ERR-STORE-001",
    title: "Not a valid retailer",
    detail: "The user is not a valid retailer",
    type: "Business"
  },
  CANNOT_CREATE_AIR_DROP: {
    code: "ERR-STORE-002",
    title: "Air drop creation failed",
    detail: "The air drop event was created failed.",
    type: "Business"
  }
};

exports.CONSTANTS = CONSTANTS;
exports.ERRORS = ERRORS;
exports.STORE_ERRORS = STORE_ERRORS;