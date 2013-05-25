# StatsD backend for Mongo DB

## Overview
This is a pluggable backend for [StatsD](https://github.com/etsy/statsd), which publishes stats to mongodb.

## How it works
This backend uses Mongo's capped collections to have near file system performance for logging data points from StatsD.

## Installation

`$ npm install mongo-statsd-backend`

## Configuration

Inside of your StatsD server config file, use the following parameters:

````
{
	mongoHost: 'user:pass@localhost',
	mongoPort: 27017,
	mongoMax: 2160, 
	mongoPrefix: true, 
	mongoName: 'databaseName',
	backends: ['/path/to/module/lib/index.js']
}

````

* `mongoHost`: the ip address or hostname of the mongo server. Default is `localhost`.
* `mongoMax`: the number of data points to cap the collection with. Default is `2160`. With Statsd's default of 10 seconds, this gives 6 hours of 'near real-time' data.
* `mongoPrefix`: Boolean. If true, then the statsd "bucket" names contain a prefix which deterine the database name. For example, if a counter is called 'web-server.page_hits' then the database name will be 'web-server' and the collection name will be 'page_hits'. Otherwise, the database name will be 'statsd' and the collection name will be 'web-server.page_hits'.

## Schema

The schema follows the StatsD namespace.

`database.collection.tite.flush_rate`

`bucket.metric.metric_title_flushrate`

#### `db.counters`

````
{
	time: 1234567890, // time_stamp from statsd
	count: 124 // Integer from statsd
}

````

#### `db.timers`

````
{
	time: 1234567890, // time_stamp from statsd
	durations: [0, 1, 2] // Array from statsd
}
````

#### `db.timer_data`

````
{
	time: 1234567890, // time_stamp from statsd
	mean_90: 1.1764705882352942,
	upper_90: 3,
	sum_90: 80,
	std: 60.18171889277414,
	upper: 526,
	lower: 0,
	count: 75,
	count_ps: 7.5,
	sum: 652,
	mean: 8.693333333333333,
	median: 1
}
````

#### `db.sets`

````
{
	time: 1234567890, // time_stamp from statsd
	set: ['name1', 'name2'] // Array from statsd
}
````


  
## Dependencies
- [mongodb](https://github.com/mongodb/node-mongodb-native)

## Development
- [Bugs](https://github.com/dynmeth/mongo-statsd-backend/issues)
