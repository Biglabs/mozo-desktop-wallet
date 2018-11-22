import React from 'react';
import {Platform, StyleSheet, View} from 'react-native';
import {Actions} from 'react-native-router-flux';
import Keycloak from 'keycloak-js';

import {colorPrimary, colorScreenBackground, dimenScreenWidth, icons} from '../../res';
import {Button, SvgView, Text} from "../components";
import { strings } from '../../helpers/i18nUtils';

import Globals from '../../services/GlobalService';

const userReference = require('electron-settings');

export default class KeyCloakScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      keycloak: null,
      authenticated: null,
      token: null
    };

    if (this.props.token) {
      this.state.token = this.props.token;
    }
  }

  componentDidMount() {
    let keycloak_url = "https://staging.keycloak.mozocoin.io";
    let oauth2_client_id = "desktop_app";
    let mozo_app_config = userReference.get("MOZO_APP_CONFIG");
    if (mozo_app_config) {
      keycloak_url = mozo_app_config.mozo_services.oauth2.host;
      oauth2_client_id = mozo_app_config.mozo_services.oauth2.client.id;
    }
    keycloak_url += "/auth";
    console.log(keycloak_url);

    const keycloak = Keycloak({
      url : keycloak_url,
      realm: "mozo",
      clientId: oauth2_client_id
    });
    keycloak.init({
      onLoad: "check-sso",
      responseMode: "query"
    }).then(authenticated => {
      if (authenticated) {
        this.setState({
          keycloak: keycloak,
          authenticated: authenticated
        });
      }
    });
    keycloak.login({
      redirectUri : "http://127.0.0.1:33013/oauth2-getcode",
      scope: "offline_access",
      kcLocale: "en"
    });
  }

  render() {
    if (this.state.keycloak) {
      if (this.state.authenticated) return (
          <div>
          <p>This is a Keycloak-secured component of your application. You shouldn't be able
          to see this unless you've authenticated with Keycloak.</p>
          </div>
      );
    }
    return (
        <div>Loading Login screen...</div>
    );
  }
}
