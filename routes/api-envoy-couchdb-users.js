var crypto = require('crypto');
var request = require('request');
var Q = require("q");
var querystring = require("querystring");

/**
 * Logs in the user. Returns the name of the location database associated with the user
 * along with the api key and password, and the cloudant account (for device/cloudant sync).
 * @param req - The request from the client which contains the user's username and password
 * @param res - The response to be sent to the client
 * @returns {*}
 */
module.exports.loginUser = function(req, res) {
  var app = req.app;
  var cloudant = app.get('cloudant-location-tracker-db');
  if (!cloudant) {
    return res.status(500).json({ error: 'No database server configured' })
  }
  if (!req.body) {
    return res.sendStatus(400);
  }
  cloudant.auth(req.body.username, req.body.password, function(err, data) {
    if (!err && data) {
      res.json({
        ok: true,
        api_key: req.body.username,
        api_password: req.body.password,
        location_db_name: app.get('envoy-db-name'),
        location_db_host: app.get('envoy-host'),
        location_db_host_protocol: app.get('envoy-host-protocol')
      });
    } else {
      res.status(500).json({error: 'Internal Server Error'});
    }
  });
};

/**
 * Creates a new user along with a location database specifically for that user.
 * Sets up continuous replication between the user's location database and the lt_locations_all database.
 * @param req - The request from the client which contains the user's registration information
 * @param res - The response to be sent to the client
 * @returns {*}
 */
module.exports.createUser = function(req, res) {
  var cloudant = req.app.get('cloudant-location-tracker-db');
  if (!cloudant) {
    return res.status(500).json({ error: 'No database server configured' })
  }
  if (!req.body) {
    return res.sendStatus(400);
  }
  checkIfUserExists(req, cloudant, req.params.id)
    .then(function () {
      return saveUser(req, cloudant);
    })
    .then(function (user) {
      res.status(201).json({
        ok: true,
        id: user._id,
        rev: user.rev
      });
    }, function (err) {
      console.error("Error registering user.", err.toString());
      if (err.statusCode && err.statusMessage) {
        res.status(err.statusCode).json({error: err.statusMessage});
      }
      else {
        res.status(500).json({error: 'Internal Server Error'});
      }
    });
};

/**
 * Checks if the user with the specified id exists in the users database.
 * @param cloudant - An instance of cloudant
 * @param id - The id of the user to check
 * @returns {*|promise}
 */
var checkIfUserExists = function(req, cloudant, id) {
  var deferred = Q.defer();
  var usersDb = cloudant.use('_users');
  var userId = 'org.couchdb.user:' + id;
  usersDb.get(userId, function(err, user) {
    if (err) {
      if (err.statusCode && err.statusCode == 404) {
        deferred.resolve();
      }
      else {
        deferred.reject(err);
      }
    }
    else {
      if (user) {
        deferred.reject({statusCode:409,statusMessage:"User already exists"});
      }
      else {
        deferred.resolve();
      }
    }
  });
  return deferred.promise;
}

/**
 * Saves a user to the users database.
 * @param req - The request from the client which contains the user's id and password
 * @param cloudant - An instance of cloudant
 * @returns {*|promise}
 */
var saveUser = function(req, cloudant) {
  var deferred = Q.defer();
  var user;
  var shaRequired = (req.app.get('cloudant-version') == '1.0.2');
  if (! shaRequired) {
    user = {
      _id: 'org.couchdb.user:' + req.params.id,
      name: req.params.id,
      type: 'user',
      roles: [],
      password: req.body.password
    };
  }
  else {
    var salt = crypto.randomBytes(16).toString('hex');
    var hash = crypto.createHash('sha1');
    hash.update(req.body.password + salt);
    var password_sha = hash.digest('hex');
    user = {
      _id: 'org.couchdb.user:' + req.params.id,
      name: req.params.id,
      type: 'user',
      roles: [],
      password_sha: password_sha,
      salt: salt
    };
  }
  var usersDb = cloudant.use('_users');
  usersDb.insert(user, user._id, function (err, body) {
    if (err) {
      deferred.reject(err);
    }
    else {
      deferred.resolve(user);
    }
  });
};
