
const R = require('ramda');
const userReference = require('electron-settings');

const include = require("../include");
const oauth2 = require('./oauth2');

const CONSTANTS = include.constants.CONSTANTS;
const app_config = include.app_config;
const mozo_service_host = app_config.mozo_services.api.host;

function setRequestData() {
  let token_header = oauth2.tokenHeader();
  if (!token_header) {
    return null;
  }
  let options = {
    url: mozo_service_host + "/user-profile",
    headers: {
      'Authorization' : token_header
    },
    method: 'GET'
  };
  return options;
}

function getWalletBalance(network_data) {
  if (!network_data) {
    return null;
  }

  let network = network_data.toUpperCase();
  let balance_info = userReference.get("Wallet_Balance_" + network);
  if (!balance_info) {
    return balance_info;
  }
  if (balance_info.decimals && balance_info.decimals > 0) {
    balance_info.balance /= Math.pow(10, balance_info.decimals);
  }
  let exchange_rates = R.map(x => {
    let exchange_rate_data = userReference.get(network + "_" + x);
    if (exchange_rate_data) {
      return {
        currency : exchange_rate_data.currency,
        value: balance_info.balance * exchange_rate_data.rate
      };
    }
  }, CONSTANTS.CURRENCY_EXCHANGE_RATE);
  balance_info.exchange_rates = exchange_rates;
  return balance_info;
};

exports.setRequestData = setRequestData;
exports.getWalletBalance = getWalletBalance;
