const userReference = require('electron-settings');
const R = require('ramda');
let request = require('request');

const ERRORS = require("../constants").ERRORS;
const STORE_ERRORS = require("../constants").STORE_ERRORS;
const CONSTANTS = require("../constants").CONSTANTS;
const main = require("../main");

const logger = require('./logger');
const log = logger.getLogger("store");

const common = require('./common');

const app_config = require("../app_settings").APP_SETTINGS;
const store_service_host = app_config.mozo_services.store_api.host;


function getStoreInfo() {
  let options = common.setRequestData();
  if (!options) {
    return new Promise((resolve, reject) => {
      reject(ERRORS.NO_WALLET);
    });
  }

  options.url = store_service_host + "/api/retailer/info";

  return new Promise((resolve, reject) => {
    request(options, function(error, response, body) {
      if (!error) {
        let data = JSON.parse(body);
        if (response.statusCode == 200) {
          log.debug(body);
          resolve(data);
        } else {
          log.error(response.statusCode);
          log.error(body);
          let error_data = STORE_ERRORS.INVALID_RETAILER;
          error_data.code = data.errorKey;
          error_data.title = data.title;
          error_data.detail = data.detail;
          reject(error_data);
        }
      } else {
        log.error(error);
        reject(ERRORS.INTERNAL_ERROR);
      }
    });
  });

}

function returnCreateAirDropEvent(options, resolve, reject) {
  request(options, function(error, response, body) {
    if (!error) {
      if (response.statusCode == 200) {
        // Set the value being 0
        body[1].tx.outputs[0].value = options.body.totalNumMozoOffchain;
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
}

function createAirDropEvent(airdrop_event) {
  return new Promise(function(resolve, reject) {
    let wallet_balance = common.getWalletBalance("SOLO");
    if (!wallet_balance) {
        reject(ERRORS.NO_WALLET);
    }

    let options = common.setRequestData();
    if (!options) {
        reject(ERRORS.NO_WALLET);
    }

    airdrop_event.active = true;
    airdrop_event.address = wallet_balance.address;

    options.url = store_service_host + "/api/air-drops/prepare-event";
    options.method = "POST";
    options.json = true;
    options.body = airdrop_event;

    if (!airdrop_event.beaconInfoId) {
      beaconGetBeacon().then(function(info) {
        if (info.length < 1) {
          reject(STORE_ERRORS.CANNOT_CREATE_AIR_DROP);
        }
        options.body.beaconInfoId = info[0].id;
        returnCreateAirDropEvent(options, resolve, reject);

      }, function(err) {
        reject(STORE_ERRORS.CANNOT_CREATE_AIR_DROP);
      });
    } else {
      returnCreateAirDropEvent(options, resolve, reject);
    }
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
        let data = JSON.parse(body);
        if (response.statusCode == 200) {
          log.debug(body);
          if (data.status == "SUCCESS") {
            resolve(data);
          } else {
            reject(STORE_ERRORS.CANNOT_CREATE_AIR_DROP);
          }
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

function airdropGetAirdrops(request_data) {
  let options = common.setRequestData();
  if (!options) {
    return new Promise((resolve, reject) => {
      reject(ERRORS.NO_WALLET);
    });
  }

  options.url = store_service_host + "/api/retailer/airdrops?";

  let temp_data = null;
  for (let request_key in request_data) {
    temp_data = request_data[request_key];
    if (typeof request_data[request_key] === 'string') {
      options.url += request_key + '=';
      options.url += request_data[request_key] + '&';
    } else if (temp_data.length > 0 ){
      for (let index = 0; index < temp_data.length; ++index) {
        options.url += request_key + '=';
        options.url += temp_data[index] + '&'
      }
    }
  }

  log.debug(options.url);

  return new Promise((resolve, reject) => {
    request(options, function(error, response, body) {
      if (!error) {
        let data = JSON.parse(body);
        if (response.statusCode == 200) {
          log.debug(body);
          let info_data = {
            'data' : data
          };
          let response_headers = response.headers;
          info_data.headers = {
            'total-page' : response_headers['total-page'],
            'current-page' : response_headers['current-page'],
            'elements-per-page' : response_headers['elements-per-page']
          };
          resolve(info_data);
        } else {
          log.error(response.statusCode);
          log.error(body);
          let error_data = STORE_ERRORS.INVALID_RETAILER;
          reject(error_data);
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
        let data = JSON.parse(body);
        if (response.statusCode == 200) {
          log.debug(body);
          resolve(data);
        } else {
          log.error(response.statusCode);
          log.error(body);
          let error_data = STORE_ERRORS.INVALID_RETAILER;
          reject(error_data);
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
  'airdrop' : {
    'get' : airdropGetAirdrops
  },
  'getStoreInfo' : getStoreInfo,
  'createAirDropEvent' : createAirDropEvent,
  'confirmTransaction' : confirmTransaction,
  'sendSignRequest' : sendSignRequest,
  'checkSmartContractHash' : checkSmartContractHash
};