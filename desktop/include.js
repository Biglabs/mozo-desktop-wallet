const fs = require("fs");

let app_settings_file = "./app_settings";
if (fs.existsSync(`${__dirname}/.app_settings.js`)) {
  app_settings_file = "./.app_settings"
}
const app_settings = require(app_settings_file);

const constants = require("./constants");
const app_config = app_settings.APP_SETTINGS;

exports.app_settings = app_settings;
exports.app_config = app_config;
exports.constants = constants;