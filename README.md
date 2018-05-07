:no_entry_sign: This project is no longer maintained

# Location Tracker Envoy Server

The Location Tracker Envoy Server is a Node.js application to be used in conjunction with the [Location Tracker app](https://github.com/ibm-cds-labs/location-tracker-client-swift).

The Location Tracker Envoy Server connects to IBM Cloudant and provides RESTful APIs for creating/managing users and creating/querying locations using [Cloudant Geo](https://docs.cloudant.com/geo.html). 

The Location Tracker Envoy Server uses [Cloudant Envoy](https://github.com/cloudant-labs/envoy). It directs the iOS app to sync locations through Envoy rather than syncing locations directly to user-specific databases in Cloudant. Envoy allows the iOS app to adopt a database-per-user design pattern, with a copy of a user's data stored on the device and synced to the cloud when online, while invisibly storing all the users' data in one large database.

## How it works

When you install the Location Tracker Envoy Server three databases will be created in your Cloudant instance:

1. `envoyusers` - This database is used by the server and by Cloudant Envoy to manage and authenticate users.
2. `lt_locations_all_envoy` - This database is used to keep track of all locations synced from iOS devices to Cloudant through Envoy.
3. `lt_places` - This database contains a list of places that the Location Tracker app will query.

The `lt_locations_all_envoy` and `lt_places` database will each be created with a geo index allowing you to make geo queries and take advantage of the integrated map visuals in the Cloudant Dashboard. The `lt_places` database will be populated with 50 sample places that follow the path of the "Freeway Drive" debug location:
 
 ![Location Tracker Sample Places](http://developer.ibm.com/clouddataservices/wp-content/uploads/sites/47/2016/05/locationTracker2CloudantPlaces2.png)

Follow the instructions below to get the Location Tracker Envoy Server up and running. Once you are finished follow the instructions to download and run the [Location Tracker app](https://github.com/ibm-cds-labs/location-tracker-client-swift).

## Prerequisites

The Location Tracker Envoy Server uses [Cloudant Envoy](https://github.com/cloudant-labs/envoy) which requires CouchDB features not currently available in the official release of Cloudant. Before you can run the Location Tracker Envoy Server please configure a new Cloudant instance in IBM Cloud called `cloudant-location-tracker-db`. If you have already deployed the non-Envoy version of the Location Tracker Server you may already have a Cloudant instance by this name and can continue to the next step.

After you create your Cloudant instance you will need to request that the account be moved to the Cloudant cluster "Porter" with an email to support@cloudant.com stating your account name.

## Running on IBM Cloud

Be sure to finish the steps documented in the Prerequisites section above before continuing.

The Location Tracker Envoy Server requires a running instance of [Cloudant Envoy](https://github.com/cloudant-labs/envoy). To simplify deployment the Location Tracker Envoy Server includes a wrapped version of Envoy. This provides an easy way to deploy Cloudant Envoy and the Location Tracker Envoy Server using a single command.

Clone this project and change into the project directory:

    $ git clone https://github.com/ibm-watson-data-lab/location-tracker-server-envoy.git
    $ cd location-tracker-server-envoy
    
Open the manifest.yml file and specify a unique host name for Envoy and the Location Tracker Envoy Server:

1. Replace `cloudant-envoy-XXXX` with a unique path in IBM Cloud. For example, `cloudant-envoy-mwatson`. If the path is already taken the deploy to IBM Cloud will fail and you will have to find a new path. Note: there are two places to change this value in the manifest.yml file:

    `host: cloudant-envoy-XXXX` - This specifies the path that should be assigned to Envoy. 

    `ENVOY_HOST: cloudant-envoy-XXXX.mybluemix.net` - This tells the Location Tracker Envoy Server the path at which Envoy can be found.

2. Replace `location-tracker-envoy-XXXX` with a unique path in IBM Cloud. For example, `location-tracker-envoy-mwatson`. 

You can deploy the Location Tracker Envoy Server to IBM Cloud from your local instance using the Cloud Foundry command line interface. If you haven't already, follow these steps to get the Cloud Foundry CLI installed and configured:

1. [Install the Cloud Foundry command line interface.](https://www.ng.bluemix.net/docs/#starters/install_cli.html)
2. Follow the instructions at the above link to connect to IBM Cloud.
3. Follow the instructions at the above link to log in to IBM Cloud.

To deploy to IBM Cloud run the following command:

    $ cf push

After you have deployed Cloudant Envoy and the Location Tracker Envoy Server to IBM Cloud be sure to update the Location Tracker app to point to your new server. You can find this setting in AppConstants.swift. Here is an example:

`static let baseUrl: String = "http://location-tracker-envoy-XXXX.mybluemix.net"`

> Note: Be sure to omit the trailing <code>/</code> on your `baseUrl` string.

## Privacy Notice

Refer to https://github.com/IBM/metrics-collector-client-node#privacy-notice

### Disabling Deployment Tracking

Deployment tracking can be disabled by removing or commenting out the following line in `app.js':

require("metrics-tracker-client").track();

## License

Licensed under the [Apache License, Version 2.0](LICENSE.txt).
