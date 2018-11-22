
const userReference = require('electron-settings');
var request = require('request');
const R = require('ramda');

const main = require('../main');
const include = require('../include');
const logger = require('./logger');
const log = logger.getLogger("address-book");
const oauth2 = require('./oauth2');
const common = require('./common');
const CONSTANTS = require("../constants").CONSTANTS;

const app_config = include.app_config;
const mozo_service_host = app_config.mozo_services.api.host;


function downloadAddressBook(callback) {
  let options = common.setRequestData();
  if (!options) {
    return;
  }

  options.url = mozo_service_host + "/api/contacts";

  request(options, function(error, response, body) {
    if (!error) {
      if (response.statusCode == 200) {
        log.debug(body);
        const address_book = JSON.parse(body);
        userReference.set(CONSTANTS.ADDRESS_BOOK, address_book);
        if (callback) {
          callback(address_book);
        }
      } else {
        log.error(response.statusCode);
        log.error(body);
        callback(null);
      }
    } else {
      log.error(error);
    }
  });
}

function getAddressBook() {
  let address_book_data = userReference.get(CONSTANTS.ADDRESS_BOOK);
  if (!address_book_data) {
    return null;
  }
  return address_book_data;
}

function findFromAddressBook(keyword) {
  const address_book = getAddressBook();
  if (!address_book) {
    return [];
  }

  let found_address_book = R.filter(
    x => x.name.includes(keyword) || x.soloAddress.includes(keyword),
    address_book
  );
  return found_address_book;
}

function addAddressBook(data) {
  let options = common.setRequestData();
  if (!options) {
    return;
  }

  options.url = mozo_service_host + "/api/contacts";
  options.method = "POST";
  options.json = true;
  options.body = {
    'name' : data.name,
    'soloAddress' : data.soloAddress
  };

  return new Promise(function(resolve, reject) {
    request(options, function(error, response, body) {
      if (!error) {
        if (response.statusCode >= 200 && response.statusCode < 202) {
          downloadAddressBook();
          resolve(body);
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
}

function updateAddressBook(data) {
  let options = common.setRequestData();
  if (!options) {
    return;
  }

  options.url = mozo_service_host + "/api/contacts" + data.id;
  options.method = "PUT";
  options.json = true;
  options.body = {
    'id' : data.id,
    'name' : data.name,
    'soloAddress' : data.soloAddress
  };

  return new Promise(function(resolve, reject) {
    request(options, function(error, response, body) {
      if (!error) {
        if (response.statusCode >= 200 && response.statusCode < 202) {
          downloadAddressBook();
          resolve(body);
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
}

function deleteAddressBook(id) {
  let options = common.setRequestData();
  if (!options) {
    return;
  }

  options.url = mozo_service_host + "/api/contacts" + data.id;
  options.method = "DELETE";

  return new Promise(function(resolve, reject) {
    request(options, function(error, response, body) {
      if (!error) {
        if (response.statusCode == 200) {
          log.debug(body);
          downloadAddressBook();
          resolve(body);
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
}

exports.download = downloadAddressBook;
exports.get = getAddressBook;
exports.find = findFromAddressBook;
exports.add = addAddressBook;
exports.update = updateAddressBook;
exports.delete = deleteAddressBook;
