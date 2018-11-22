
var WebSocketServer = require('websocket').server;
var http = require('http');
const R = require('ramda');

const include = require("../include");
const app_config = include.app_config;
const CONSTANTS = include.constants.CONSTANTS;
const ERRORS = include.constants.ERRORS;

const logger = require('../utils/logger');
const log = logger.getLogger("websocket-server");

const websocket_client = require('./websocket_client');

const port = app_config.websocket_server.port;
const public_host = app_config.websocket_server.public_host;

let clients = [];

function handleNotification(json_data) {
  if (json_data && json_data.content && json_data.content.event) {
    R.map(x => {
      x.sendUTF(JSON.stringify(json_data));
    }, clients);
  }
}

let startServer = module.exports.start = function() {
  const server = http.createServer(function(request, response) {
    // process HTTP request. Since we're writing just WebSockets
    // server we don't have to implement anything.
  });
  server.listen(port, public_host, async () => {
    log.info("Websocket server is listen on host: " + public_host +
               " port: " + port + "!");
    websocket_client.addListener("websocket_server", handleNotification);
  });

  // create the server
  let wsServer = new WebSocketServer({
    httpServer: server
  });

  // WebSocket server
  wsServer.on('request', function(request) {
    let connection = request.accept(null, request.origin);
    let index = clients.push(connection) - 1;

    // This is the most important callback for us, we'll handle
    // all messages from users here.
    connection.on('message', function(message) {
      if (message.type === 'utf8') {
        // process WebSocket message
        log.debug(message.utf8Data);
      }
    });

    connection.on('close', function(connection) {
      clients.splice(index, 1);
      // close user connection
    });
  });
}

exports.sendMsgClient = function(message) {
  R.map(x => {
    x.sendUTF(JSON.stringify(message));
  }, clients);
};
