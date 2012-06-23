# StatsD backend for Mongo DB

## Overview
This is a pluggable backend for [StatsD](https://github.com/etsy/statsd), which
publishes stats to mongodb.
## How it works
This backend uses Mongo's capped collections to have near file system performance for logging data points from StatsD.

## Installation

    npm install mongo-statsd-backend

## Configuration
You have to give basic information about your mongodb server to use
```
{ mongoHost: 'localhost'
, mongoMax: 2160
, mongoPrefix: true
}
```

* `mongoHost`: the ip address or hostname of the mongo server. Default is `localhost`.
* `mongoMax`: the number of data points to cap the collection with. Default is `2160`. With Statsd's default of 10 seconds, this gives 6 hours of 'near real-time' data.
* `mongoPrefix`: true or false. If true, then the statsd "bucket" names contain a prefix which deterine the database name. For example, if a counter is called 'web-server.page_hits' then the database name will be 'web-server' and the collection name will be 'page_hits'. Otherwise, the database name will be 'statsd' and the collection name will be 'web-server.page_hits'.
  
## Dependencies
- [mongodb](https://github.com/mongodb/node-mongodb-native)

## Development
- [Bugs](https://github.com/dynmeth/mongo-statsd-backend/issues)
