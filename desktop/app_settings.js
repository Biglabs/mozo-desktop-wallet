
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
      host: "https://staging.gateway.mozocoin.io/solomon/api/app"
    },
    store_api: {
      host: "https://staging.gateway.mozocoin.io/store/api/app"
    },
    notification: {
      host: "ws://52.76.238.125:8089/websocket"
    },
    oauth2: {
      host: "https://staging.keycloak.mozocoin.io",
      client: {
        id: "desktop_app",
        secret: "4546b9b1-5fcc-48b6-9922-a8ad9789fb71"
      }
    }
  }
};

exports.APP_SETTINGS = APP_SETTINGS;
