var bodyParser = require('body-parser');
var cfenv = require('cfenv');
var cloudant = require('cloudant');
var dotenv = require('dotenv');
var express = require('express');
var path = require('path');
var url = require('url');

var api = require('./routes/api');
var apiEnvoy;

dotenv.load();

var app = express();
var appEnv = cfenv.getAppEnv();

(function(app) {
  if (process.env.VCAP_SERVICES) {
    var vcapServices = JSON.parse(process.env.VCAP_SERVICES);
    app.set('vcapServices', vcapServices);
    if (vcapServices.cloudantNoSQLDB && vcapServices.cloudantNoSQLDB.length > 0) {
      var service = vcapServices.cloudantNoSQLDB[0];
      if (service.credentials) {
        var db = cloudant({
          username: service.credentials.username,
          password: service.credentials.password,
          account: service.credentials.username,
          url: service.credentials.url
        });
        app.set('cloudant-location-tracker-db', db);
        db.request('', function(err, body) {
          if (!err) {
            app.set('cloudant-version', body.version);
          }
        });
      }
    }
  }
  var envoyDbName = 'lt_locations_all_envoy';
  var envoyHost = process.env.ENVOY_HOST;
  var envoyHostProtocol = process.env.ENVOY_HOST_PROTOCOL || 'https';
  var envoyAuth = process.env.ENVOY_AUTH || 'default';
  if (envoyAuth == 'default') {
    apiEnvoy = require('./routes/api-envoy-default');
  }
  else {
    apiEnvoy = require('./routes/api-envoy-couchdb-users');
  }
  app.set('envoy-db-name', envoyDbName);
  app.set('envoy-host', (envoyHost + ':' + envoyPort));
  app.set('envoy-host-protocol', envoyHostProtocol);
})(app);

var jsonParser = bodyParser.json();

app.get('/api/places', jsonParser, api.getPlaces);
app.put('/api/users/:id', jsonParser, apiEnvoy.createUser);
app.post('/api/login', jsonParser, apiEnvoy.loginUser);

// Serve static assets
app.use(express.static(path.join(__dirname, 'public')));

// start server on the specified port and binding host
app.listen(appEnv.port, '0.0.0.0', function() {
  console.log("server starting on " + appEnv.url);
});