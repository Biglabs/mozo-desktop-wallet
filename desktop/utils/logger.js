const log4js = require('log4js');
log4js.configure({
  appenders: {
    out: {
      type: "stdout",
      layout: {
        type: "coloured"
      }
    },
    app: {
      type: "file",
      filename: "mozowallet.log",
      flags: "w",
      layout: {
        type: "basic"
      }
    }
  },
  categories: {
    default: { appenders: [ 'out', 'app' ], level: 'debug' }
  }
});

function getLogger(logger_name) {
  return log4js.getLogger(logger_name);
}

function shutdown(cb) {
  log4js.shutdown(cb);
}

exports.getLogger = getLogger;
exports.shutdown = shutdown;