
const userReference = require('electron-settings');
const R = require('ramda');
let request = require('request');
const crypto = require("crypto");

const main = require('../main');

const include = require("../include");
const logger = require('./logger');
const common = require('./common');
const address_book = require('./addressbook');
const websocket_client = require('../websocket/websocket_client');

const app_config = include.app_config;
const ERRORS = include.constants.ERRORS;
const CONSTANTS = include.constants.CONSTANTS;
const mozo_service_host = app_config.mozo_services.api.host;


function setIntervalImmediately(func, timer) {
  func();
  return setInterval(func, timer);
}

function extractWalletData(walletInfo) {
  if (!walletInfo || !walletInfo.encryptSeedPhrase) {
    userReference.set(
      CONSTANTS.IS_NEW_WALLET_KEY,
      "true"
    );
    return;
  }

  if (userReference.get(CONSTANTS.IS_NEW_WALLET_KEY)) {
    // If we have wallets from the server,
    // and NEW wallets from local, we will delete all from local
    // and use the info from the server
    userReference.delete(CONSTANTS.IS_NEW_WALLET_KEY);
    userReference.delete("@DbExisting:key");
    userReference.delete("App");
    userReference.delete("Address");
    main.mainWindow.loadURL(`file://${__dirname}/../index.html`);
  }

  let app_info = userReference.get("App");
  if (app_info &&
      app_info[0].mnemonic == walletInfo.encryptSeedPhrase) {
    return;
  }

  let pin = null;
  if (app_info && app_info[0].pin) {
    pin = app_info[0].pin;
  }

  app_info = [
    {
      pin: pin,
      mnemonic: walletInfo.encryptSeedPhrase
    }
  ];
  userReference.set("App", app_info);

  if (userReference.get(CONSTANTS.IS_NEW_WALLET_KEY)) {
    userReference.delete(CONSTANTS.IS_NEW_WALLET_KEY);
  }
}

function getOffchainTokenInfo() {
  const log = logger.getLogger("getOffchainTokenInfo");
  let options = common.setRequestData();
  if (!options) {
    return;
  }

  options.url = mozo_service_host +
    "/solo/contract/solo-token";

  log.debug(options);

  request(options, function(error, response, body) {
    if (!error) {
      if (response.statusCode == 200) {
        log.debug(body);
        token_info = JSON.parse(body);
        userReference.set(CONSTANTS.OFFCHAIN_TOKEN_INFO, token_info);
      } else {
        log.error(response.statusCode);
        log.error(body);
      }
    } else {
      log.error(error);
    }
  });
}

function getExchangeRateInfo() {
  const log = logger.getLogger("getExchangeRateInfo");
  let options = common.setRequestData();
  if (!options) {
    return;
  }

  let network_name = "MOZOX";

  for (var index = 0; index < CONSTANTS.CURRENCY_EXCHANGE_RATE.length; ++index) {
    let exchange_rate_name = network_name + "_" +
        CONSTANTS.CURRENCY_EXCHANGE_RATE[index];
    options.url = mozo_service_host +
      "/exchange/rate?currency=" + CONSTANTS.CURRENCY_EXCHANGE_RATE[index] +
      "&symbol=" + network_name;

    log.debug(options);

    request(options, function(error, response, body) {
      if (!error) {
        if (response.statusCode == 200) {
          log.debug(body);
          exchange_info = JSON.parse(body);
          userReference.set(exchange_rate_name, exchange_info);
        } else {
          log.error(response.statusCode);
          log.error(body);
        }
      } else {
        log.error(error);
      }
    });

  }
}

function updateWalletBalance() {
  const log = logger.getLogger("updateWalletBalance");
  let wallet_addrs = userReference.get("Address");

  if (!wallet_addrs) {
    return;
  }

  let address = null;

  for (var index = 0; index < wallet_addrs.length; ++index) {
    let addr = wallet_addrs[index];
    if (addr.network == "SOLO") {
      address = addr.address;
      break;
    }
  }

  if (!address) {
    return;
  }

  let options = common.setRequestData();
  if (!options) {
    return;
  }

  options.url = mozo_service_host +
    "/solo/contract/solo-token/balance/" + address;

  log.debug(options);

  request(options, function(error, response, body) {
    if (!error) {
      if (response.statusCode == 200) {
        let balance_info = JSON.parse(body);
        userReference.set("Wallet_Balance_SOLO", balance_info);
      } else {
        log.error(response.statusCode);
        log.error(body);
      }
    } else {
      log.error(error);
    }
  });
}

let exchange_rate_interval = null;
let update_wallet_balance_interval = null;

function getUserProfile() {
  const log = logger.getLogger("getUserProfile");
  return new Promise(function(resolve, reject) {
    let options = common.setRequestData();
    if (!options) {
      return;
    }

    request(options, function(error, response, body) {
      if (!error) {
        if (response.statusCode == 200) {
          log.debug("User profile: " + body);
          user_profile = JSON.parse(body);
          getExchangeRateInfo();
          getOffchainTokenInfo();
          extractWalletData(user_profile.walletInfo);
          address_book.download();
          updateWalletBalance();
          if (!exchange_rate_interval) {
            // Get exchange every 10 minutes
            exchange_rate_interval = setInterval(
              getExchangeRateInfo, 600000);
          }

          if (!update_wallet_balance_interval) {
            update_wallet_balance_interval = setInterval(
              updateWalletBalance, 15000);
          }

          let uuid = crypto.randomBytes(32).toString("hex");
          websocket_client.connect(
            app_config.mozo_services.notification.host + "/user/" +
            "desktop-" + uuid);
          websocket_client.addListener('services', handleNotification);
          resolve(null);
        } else if (response.statusCode == 401)  {
          userReference.deleteAll();
        } else {
          log.error(response.statusCode);
          log.error(body);
          reject(body);
        }
      } else {
        log.error(error);
        reject(error);
      }
    });
  });
}
getUserProfile().then(function() {}, function() {});

function handleNotification(json_data) {
  if (json_data && json_data.content && json_data.content.event) {
    if (json_data.content.event == "balance_changed") {
      updateWalletBalance();
    }
  }
}


function logOut() {
  userReference.deleteAll();
  userReference.set("MOZO_APP_CONFIG", app_config);
  if (exchange_rate_interval) {
    clearInterval(exchange_rate_interval);
    exchange_rate_interval = null;
    clearInterval(update_wallet_balance_interval);
    update_wallet_balance_interval = null;
    websocket_client.disconnect();
  }
  var sess = main.mainWindow.webContents.session;
  sess.clearCache(function() {
    sess.clearStorageData();
    main.mainWindow.loadURL(`file://${__dirname}/../index.html`);
  });
}


let send_wallet_info_interval = null;

function cleanUpUpdateWalletInfoInverval() {
  clearInterval(send_wallet_info_interval);
  send_wallet_info_interval = null;
}

function updateWalletInfo() {
  const log = logger.getLogger("updateWalletInfo");
  return new Promise(function(resolve, reject) {
    if (!!send_wallet_info_interval) {
      resolve(null);
      return;
    }
    send_wallet_info_interval = setIntervalImmediately(function() {
      getUserProfile().then(function() {
        const is_new_wallet = userReference.get(CONSTANTS.IS_NEW_WALLET_KEY);
        if (!is_new_wallet) {
          resolve(null);
          cleanUpUpdateWalletInfoInverval();
          return;
        }

        const app_info = userReference.get("App");
        if (!app_info) {
          resolve(null);
          cleanUpUpdateWalletInfoInverval();
          return;
        }

        let encrypted_mnemonic = app_info[0].mnemonic;
        let offchain_address = null;
        let wallet_addrs = userReference.get("Address");
        if (!wallet_addrs) {
          resolve(null);
          cleanUpUpdateWalletInfoInverval();
          return;
        }

        for (var index = 0; index < wallet_addrs.length; ++index) {
          let addr = wallet_addrs[index];
          if (addr.network == "SOLO") {
            offchain_address = addr.address;
            break;
          }
        }

        if (!offchain_address) {
          // The addresses and keys are not initilized correctly
          // We need to delete all and reset to login view
          cleanUpUpdateWalletInfoInverval();
          logOut();
          return;
        }

        let options = common.setRequestData();
        options.url = mozo_service_host + "/user-profile/wallet";
        options.method = "PUT";
        options.json = true;
        options.body = {
          encryptSeedPhrase : encrypted_mnemonic,
          offchainAddress : offchain_address
        };

        request(options, function(error, response, body) {
          if (!error) {
            if (response.statusCode == 200) {
              userReference.delete(CONSTANTS.IS_NEW_WALLET_KEY);
              log.debug("User profile: " + JSON.stringify(body));
              resolve(body);
              clearInterval(send_wallet_info_interval);
              send_wallet_info_interval = null;
            } else {
              log.error(response.statusCode);
              log.error(body);
            }
          } else {
            log.error(error);
          }
        });
      }, function(err) {});
    }, 2000);
  }, function(err) {});

};

function getTokenInfo() {
  return userReference.get(CONSTANTS.OFFCHAIN_TOKEN_INFO);
};

function createTransaction(tx_info) {
  const log = logger.getLogger("createTransaction");
  if (!(tx_info && tx_info.from && tx_info.to && tx_info.value)) {
    return new Promise((resolve, reject) => {
      reject(ERRORS.INVALID_REQUEST);
    });
  }

  tx_info.to = tx_info.to.trim();

  let balance_info = common.getWalletBalance("SOLO");
  if (!balance_info) {
    return new Promise((resolve, reject) => {
      reject(ERRORS.NO_WALLET);
    });
  }

  if (balance_info.balance == 0 || balance_info.balance < tx_info.value) {
    return new Promise((resolve, reject) => {
      reject(ERRORS.NOT_ENOUGH_BALANCE);
    });
  }

  let tx_req = {
    gas_price : 0,
    gas_limit : 4300000,
    inputs: [
      {
        addresses: [ tx_info.from ]
      }
    ],
    outputs: null
  };

  let options = common.setRequestData();
  options.url = mozo_service_host + "/solo/contract/solo-token/transfer";
  options.method = "POST";
  options.json = true;
  options.body = tx_req;

  log.debug("Request data: " + JSON.stringify(options));
  const token_info = getTokenInfo();
  return new Promise((resolve, reject) => {
    if (token_info) {
      let outputs_tx = [
        {
          addresses: [ tx_info.to ],
          value: tx_info.value * Math.pow(10, token_info.decimals)
        }
      ];
      options.body.outputs = outputs_tx;
      request(options, function(error, response, body) {
        if (!error) {
          if (response.statusCode == 200) {
            log.debug("Transaction info: " + JSON.stringify(body));
            let tx_data = body;
            tx_data.tx.outputs = outputs_tx;
            resolve(tx_data);
          } else {
            log.error(response.statusCode);
            log.error(body);
            reject(ERRORS.INTERNAL_ERROR);
          }
        } else {
          log.error(error);
          reject(ERRORS.INTERNAL_ERROR);
        }
      });
    } else {
      reject(ERRORS.INTERNAL_ERROR);
    }
  });
};

/**
 * Global variable for callback, work around in
 * waiting confirmation screen case
 * Currently can only handle 1 transaction at 1 time only
 */
var signHttpCallback = null;
var previous_state = null;

function confirmTransaction(tx_server_req, res_callback) {
  if (signHttpCallback) {
    if (res_callback) {
      let response_data = {
        status: "ERROR",
        error: ERRORS.PENDING_TRANSACTION
      };
      res_callback({ result : response_data });
    }
    return;
  }
  let request_data = {
    coinType: "SOLO",
    network: "SOLO",
    action: "SIGN",
    params: tx_server_req,
  };

  if (main.mainWindow.isMinimized()) {
    previous_state = "minimized";
  }
  main.mainWindow.webContents.send('open-confirm-transaction-screen', request_data);
  signHttpCallback = res_callback;
  isFinishedConfirmationInput = false;
};

function sendSignRequestToServer(signed_req) {
  const log = logger.getLogger("sendSignRequestToServer");
  return new Promise((resolve, reject) => {
    let options = common.setRequestData();
    options.url = mozo_service_host + "/solo/contract/solo-token/send-signed-tx";
    options.method = "POST";
    options.json = true;
    options.body = signed_req;

    log.debug(options);

    request(options, function(error, response, body) {
      if (!error) {
        if (response.statusCode == 200) {
          resolve(body);
        } else {
          log.error(response.statusCode);
          log.error(body);
          reject(ERRORS.INTERNAL_ERROR);
        }
      } else {
        log.error(error);
        reject(ERRORS.INTERNAL_ERROR);
      }
    });
  });
}

function sendSignRequest(signed_req) {
  let response_data = {
    status: "ERROR",
    error: ERRORS.CANCEL_REQUEST
  };

  if (signed_req.result.error) {
    if (signHttpCallback) {
      response_data.error = signed_req.result.error;
      signHttpCallback.send({ result : response_data});
      signHttpCallback = null;
      if (previous_state && previous_state == "minimized") {
        previous_state = null;
        main.mainWindow.minimize();
      }
    }
    return;
  }
  let sign_req_data = JSON.parse(signed_req.result.signedTransaction);

  sendSignRequestToServer(sign_req_data).then((tx_data) => {
    if (signHttpCallback) {
      response_data = {
        status: "SUCCESS",
        data: tx_data
      };
      signHttpCallback.send({ result : response_data });
      signHttpCallback = null;
    }

  }, (error) => {
    if (signHttpCallback) {
      response_data.error = error;
      signHttpCallback.send({ result : response_data });
      signHttpCallback = null;
    }

  });

  if (previous_state && previous_state == "minimized") {
    previous_state = null;
    main.mainWindow.minimize();
  }
}

function getTransactionHistory(network, page_num, size_num) {
  const log = logger.getLogger("getTransactionHistory");
  return new Promise(function(resolve, reject) {
    let wallet_addrs = userReference.get("Address");

    if (!wallet_addrs) {
      resolve(null);
      return;
    }

    let address = null;

    for (var index = 0; index < wallet_addrs.length; ++index) {
      let addr = wallet_addrs[index];
      if (addr.network == network) {
        address = addr.address;
        break;
      }
    }

    if (!address) {
      resolve(null);
      return;
    }

    let options = common.setRequestData();
    if (!options) {
      resolve(null);
      return;
    }

    options.url = mozo_service_host +
      "/solo/contract/solo-token/txhistory/" + address +
      "?page=" + page_num + "&size=" + size_num;

    log.debug(options);

    request(options, function(error, response, body) {
      if (!error) {
        if (response.statusCode == 200) {
          let txhistory = JSON.parse(body);
          txhistory = R.map(x => {
            if (x.decimal) {
              x.amount /= Math.pow(10, x.decimal);
            }
            x.exchange_rates = R.map(y => {
              let exchange_rate_data = userReference.get(network + "_" + y);
              if (exchange_rate_data) {
                return {
                  currency : exchange_rate_data.currency,
                  value: x.amount * exchange_rate_data.rate
                };
              }
            }, CONSTANTS.CURRENCY_EXCHANGE_RATE);

            x.address_book_name = null;
            x.addressFrom = x.addressFrom.toLowerCase();
            x.addressTo = x.addressTo.toLowerCase();
            let address_book_data = address_book.get();
            let temp_address_book_data = null;
            if (address_book_data) {
              for (var index = 0; index < address_book_data.length; ++index) {
                temp_address_book_data =
                  address_book_data[index].soloAddress.toLowerCase();
                if (x.addressFrom == temp_address_book_data ||
                    x.addressTo == temp_address_book_data) {
                  x.address_book_name = address_book_data[index].name;
                  break;
                }
              }
            }
            return x;
          }, txhistory);
          resolve(txhistory);
        } else {
          log.error(response.statusCode);
          log.error(body);
          resolve(null);
        }
      } else {
        log.error(error);
        reject(error);
      }
    });
  });
};

function getTxHashStatus(txhash) {
  const log = logger.getLogger("getTxHashStatus");
  return new Promise(function(resolve, reject) {
    if (!txhash) {
      return;
    }

    let options = common.setRequestData();
    options.url = mozo_service_host + "/eth/solo/txs/" + txhash + "/status";

    log.debug(options);

    request(options, function(error, response, body) {
      if (!error) {
        let body_parsed = JSON.parse(body);
        if (response.statusCode == 200) {
          resolve(body_parsed);
        } else {
          log.error(response.statusCode);
          log.error(body);
          reject(body_parsed);
        }
      } else {
        log.error(error);
        reject(error);
      }
    });
  });
};

exports.createTransaction = createTransaction;
exports.confirmTransaction = confirmTransaction;
exports.getTxHashStatus = getTxHashStatus;
exports.getTransactionHistory = getTransactionHistory;
exports.getUserProfile = getUserProfile;
exports.sendSignRequest = sendSignRequest;
exports.sendSignRequestToServer = sendSignRequestToServer;
exports.logOut = logOut;
exports.updateWalletInfo = updateWalletInfo;