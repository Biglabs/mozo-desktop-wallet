const userReference = require('electron-settings');
const R = require('ramda');
let request = require('request');

const ERRORS = require("../constants").ERRORS;
const CONSTANTS = require("../constants").CONSTANTS;
const main = require("../main");

const logger = require('./logger');
const log = logger.getLogger("store");

const common = require('./common');

const app_config = require("../app_settings").APP_SETTINGS;
const store_service_host = app_config.mozo_services.store_api.host;


function createAirDropEvent(airdrop_event) {
  let wallet_balance = common.getWalletBalance("SOLO");
  if (!wallet_balance) {
    return new Promise(function(resolve, reject) {
      reject(ERRORS.NO_WALLET);
    });
  }

  let options = common.setRequestData();
  if (!options) {
    return new Promise(function(resolve, reject) {
      reject(ERRORS.NO_WALLET);
    });
  }

  airdrop_event.address = wallet_balance.address;

  options.url = store_service_host + "/api/air-drops/prepare-event";
  options.method = "POST";
  options.json = true;
  options.body = airdrop_event;

  return new Promise(function(resolve, reject) {
    request(options, function(error, response, body) {
      if (!error) {
        if (response.statusCode == 200) {
          // Set the value being 0
          body[1].tx.outputs[0].value = airdrop_event.totalNumMozoOffchain;
          log.debug(body);
          resolve(body)
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
    action: "SIGN_AIRDROP_SMARTCONTRACT",
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
  let options = common.setRequestData();
  if (!options) {
    return new Promise((resolve, reject) => {
      reject(ERRORS.NO_WALLET);
    });
  }

  options.url = store_service_host + "/api/air-drops/sign";
  options.method = "POST";
  options.json = true;
  options.body = signed_req;

  log.debug(options);
  return new Promise((resolve, reject) => {
    request(options, function(error, response, body) {
      if (!error) {
        if (response.statusCode == 200) {
          log.debug(body);
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
  
  let sign_req_data_arr = R.map(x => {
    return JSON.parse(x);
  }, signed_req.result.signedTransaction);

  sendSignRequestToServer(sign_req_data_arr).then((tx_data) => {
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

function checkSmartContractHash(smart_contract_hash) {
  let options = common.setRequestData();
  if (!options) {
    return new Promise((resolve, reject) => {
      reject(ERRORS.NO_WALLET);
    });
  }

  options.url = store_service_host +
      "/api/air-drops/check/" + smart_contract_hash;

  return new Promise((resolve, reject) => {
    request(options, function(error, response, body) {
      if (!error) {
        if (response.statusCode == 200) {
          log.debug(body);
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

function beaconGetBeacon() {
  let options = common.setRequestData();
  if (!options) {
    return new Promise((resolve, reject) => {
      reject(ERRORS.NO_WALLET);
    });
  }

  options.url = store_service_host + "/api/retailer/beacon";

  return new Promise((resolve, reject) => {
    request(options, function(error, response, body) {
      if (!error) {
        if (response.statusCode == 200) {
          log.debug(body);
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

module.exports = {
  'beacon' : {
    'get' : beaconGetBeacon
  },
  'createAirDropEvent' : createAirDropEvent,
  'confirmTransaction' : confirmTransaction,
  'sendSignRequest' : sendSignRequest,
  'checkSmartContractHash' : checkSmartContractHash
};