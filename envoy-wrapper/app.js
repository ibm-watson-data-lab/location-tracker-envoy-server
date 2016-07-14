var envoy;

var envoyOpts = {
    databaseName: 'lt_locations_all_envoy'
};
envoy = require('cloudant-envoy/app.js')(envoyOpts);