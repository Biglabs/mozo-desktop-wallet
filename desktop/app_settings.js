
const APP_SETTINGS = {
  app: {
    deeplink: "solosigner"
  },

  proxy_server: {
    host: "127.0.0.1",
    public_host: "127.0.0.1",
    port: 33013
  },

  websocket_server: {
    host: "127.0.0.1",
    public_host: "127.0.0.1",
    port: 33014
  },

  mozo_services: {
    api: {
      host: "https://staging.gateway.mozocoin.io/solomon"
    },
    store_api: {
      host: "https://staging.gateway.mozocoin.io/store"
    },
    notification: {
      host: "ws://52.76.238.125:8089/websocket"
    },
    oauth2: {
      host: "https://staging.keycloak.mozocoin.io",
      client: {
        id: "desktop_app",
        secret: "559a752a-d9b6-4b2c-8dcb-93b5b3ed1c79"
      }
    }
  }
};

exports.APP_SETTINGS = APP_SETTINGS;
