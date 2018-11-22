
let socket = require('atmosphere.js');

let oauth2 = require('../utils/oauth2');
const logger = require('../utils/logger');

let listeners = {};

let request = {
  url: "",
  contentType : "application/json",
  headers : {
    'Authorization' : ""
  },
  logLevel : 'debug',
  transport : 'websocket',
  fallbackTransport: 'long-polling',
  reconnectInterval: 5000,
  ackInterval: 5000,
  maxReconnectOnClose: 99
};

let socket_client = null;
const log = logger.getLogger("websocket-client");

request.onOpen = function(response) {
  log.debug("On Open - " + response.responseBody);
};

request.onMessage = function (response) {
  let response_body = response.responseBody;
  let split_data = response_body.split("|");
  let json_data = null;
  if (split_data.length > 1) {
    try {
      json_data = JSON.parse(split_data[1]);
    } catch (err) {
      log.error("On message: - " + response_body);
    }
  }

  if (json_data) {
    log.debug("On message: - " + JSON.stringify(json_data));
    if (json_data.content) {
      try {
        json_data.content = JSON.parse(json_data.content);
      } catch (err) {
      }
    }
    for(var key in listeners) {
      listeners[key](json_data);
    }
  }
};

request.onError = function(response) {
  log.error("On Error - " + response.responseBody);
};

function addListener(listener, callback) {
  log.debug("Add listener: " + listener);
  listeners[listener] = callback;
}

function removeListener(listener) {
  log.debug("Remove listener: " + listener);
  delete listeners[listener];
}

function connect(connection_uri) {
  if (socket_client) {
    return;
  }
  let token_header = oauth2.tokenHeader();
  if (token_header) {
    request.url = connection_uri;
    request.headers.Authorization = token_header;
    socket_client = socket.subscribe(request);
  }
};

function disconnect() {
  if (socket_client) {
    socket.unsubscribe(request);
    socket_client = null;
  }
}

function sendMsg(json_data) {
  log.debug("Send message: " + JSON.stringify(json_data));
  socket_client.push(JSON.stringify(json_data));
};


exports.connect = connect;
exports.disconnect = disconnect;
exports.sendMsg = sendMsg;
exports.addListener = addListener;
exports.removeListener = removeListener;
