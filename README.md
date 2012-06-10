# StatsD backend for Mongo DB

## Overview
This is a pluggable backend for [StatsD](https://github.com/etsy/statsd), which
publishes stats to mongodb.

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

## Dependencies
- [mongodb](https://github.com/mongodb/node-mongodb-native)

## Development
- [Bugs](https://github.com/dynmeth/mongo-statsd-backend/issues)
