
const main = require('../main');
const include = require('../include');
const logger = require('./logger');

const log = logger.getLogger("oauth2");
const app_config = include.app_config;
const constants = include.constants.CONSTANTS;

const oauth_credentials = {
  client: {
    id: app_config.mozo_services.oauth2.client.id,
    secret: app_config.mozo_services.oauth2.client.secret
  },
  auth: {
    tokenHost: app_config.mozo_services.oauth2.host,
    tokenPath: "/auth/realms/mozo/protocol/openid-connect/token",
    authorizePath: "/auth/realms/mozo/protocol/openid-connect/auth"
  },
  options: {
    authorizationMethod: 'body',
  }
};

// Initialize the OAuth2 Library
const oauth2 = require('simple-oauth2').create(oauth_credentials);
const userReference = require('electron-settings');

userReference.set("MOZO_APP_CONFIG", app_config);

let access_token = null;

if (userReference.get(constants.OAUTH2TOKEN_KEY)) {
  access_token = oauth2.accessToken.create(userReference.get("OAuth2Token"));
}

function isTokenValid() {
  if (!access_token) {
    return false;
  }

  if (!access_token.expired()) {
    return true;
  }

  access_token.refresh().then(function(result) {
    access_token = result;
    userReference.set("OAuth2Token", access_token.token);
    return true;
  }, function(err) {
    log.error('Error refreshing access token: ', error.message);
    userReference.deleteAll();
    userReference.set("MOZO_APP_CONFIG", app_config);
    main.mainWindow.loadURL(`file://${__dirname}/../index.html`);
    return false;
  });
}

exports.accessToken = function() {
  if (isTokenValid()) {
    return access_token;
  } else {
    return null;
  }
};

exports.tokenHeader = function() {
  if (isTokenValid()) {
    return "Bearer " + access_token.token.access_token;
  } else {
    return null;
  }
}

exports.getTokenFromAuthCode = function(auth_code, redirect_uri) {
  const token_config = {
    code: auth_code,
    redirect_uri: redirect_uri
  };
  return new Promise(function(resolve, reject) {
    oauth2.authorizationCode.getToken(token_config).then(function(result) {
      access_token = oauth2.accessToken.create(result);
      userReference.set(constants.OAUTH2TOKEN_KEY, access_token.token);
      resolve(access_token);
    }, function(err) {
      log.error(err);
      reject(err);
    });
  });
};
