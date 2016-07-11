var dotenv = require('dotenv');
var envoy;

dotenv.load();

var service;
if (process.env.VCAP_SERVICES) {
  var vcapServices = JSON.parse(process.env.VCAP_SERVICES);
  if (vcapServices.cloudantNoSQLDB && vcapServices.cloudantNoSQLDB.length > 0) {
    service = vcapServices.cloudantNoSQLDB[0];
  }
}
var envoyOpts = {
  couchHost: service.credentials.url,
  databaseName: 'lt_locations_all_envoy',
  port: process.env.ENVOY_PORT || 8001
};
envoy = require('cloudant-envoy/app.js')(envoyOpts);