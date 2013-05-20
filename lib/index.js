'use strict';

var mongodb = require('mongodb'),
	util = require('util'),
	options = {
		debug: false,
		prefix: true,
		size: 100,
		max: 2610,
		name: 'statsd',
		host: '127.0.0.1',
		port: 27017
	};

/**
 *	Prefix the db correctly
 */
var dbPrefix = function(metric) {
	return options.prefix ? metric.split('.')[0] : options.name;
};

/**
 *	Prefix a collection name	
 */
var colPrefix = function(metric_type, metric) {
	var ary = metric.split('.');
	if (options.prefix) ary.shift();
	ary.unshift(metric_type);
	return ary.join('.')+'_'+options.rate;
};

/**
 *	Aggregate the metrics
 */
var aggregate = {
	/**
	 *	Aggregate some metrics bro
	 *	@param {Number} time
	 *	@param {Stirng} key
	 *	@param {String} val
	 */
	gauges: function(time, key, val) {
		return {
			db: dbPrefix(key),
			col: colPrefix('gauges', key),
			data: {
				time: time,
				gauge: val
			},
		};
	},
	/**
	 *	Aggregate some timer_data bro
	 *	@param {Number} time
	 *	@param {Stirng} key
	 *	@param {String} vals
	 */
	timer_data: function(time, key, val) {
		val.time = time;
		return {
			db: dbPrefix(key),
			col: colPrefix('timers', key),
			data: val
		};
	},
	/**
	 *	Aggregate some timers bro
	 *	@param {Number} time
	 *	@param {Stirng} key
	 *	@param {String} vals
	 */
	timers: function(time, key, val) {
		return {
			db: dbPrefix(key),
			col: colPrefix('timers', key),
			data: {
				time: time,
				durations: val
			},
		};
	},
	/**
	 *	Aggregate some counters bro
	 *	@param {Number} time
	 *	@param {Stirng} key
	 *	@param {String} val
	 */
	counters: function(time, key, val) {
		return {
			db: dbPrefix(key),
			col: colPrefix('counters', key),
			data: {
				time: time,
				count: val
			},
		};
	},
	/**
	 *	Aggregate some sets bro
	 *	@param {Number} time
	 *	@param {Stirng} key
	 *	@param {String} val
	 */
	sets: function(time, key, val) {
		return {
			db: dbPrefix(key),
			col: colPrefix('sets', key),
			data: {
				time: time,
				set: val
			},
		};
	}
};

/**
 *	Insert the data to the database
 *	@method insert
 *	@param {String} database
 *	@param {String} collection
 *	@param {Object} metric
 *	@param {Function} callback
 */
var insert = function(dbName, collection, metric, callback) {
	var colInfo = {capped:true, size:options.size*options.max, max:options.max},
		dbString = util.format("mongodb://%s:%s/%s", options.host, options.port, dbName);

	mongodb.Db.connect(dbString, function(err, db) {
		if (err) {
			db.close();
			return callback(err);
		};

		db.createCollection(collection, colInfo, function(err, collClient) {      
			collClient.insert(metric, function(err, data){
				if (err) callback(err);
				if (!err) callback(false);
				db.close();
			});
		});
	});
};

/**
 *	our `flush` event handler
 */
var onFlush = function(time, metrics) {
	var metricTypes = ['gauges', 'timer_data', 'timers', 'counters', 'sets'];

	metricTypes.forEach(function(type, i){
		var obj;

		for (var key in metrics[type]) {
			obj = aggregate[type](time, key, metrics[type][key]);
			insert(obj.db, obj.col, obj.data, function(err){
				if (err) console.log('stat not saved for '+key);
				if (err) console.log(err);
				if (options.debug) console.log('Saved key %s', key);
			});
		};
	});
};

/**
 *	Expose our init function to StatsD
 *	@param {Number} startup_time
 *	@param {Object} config
 *	@param {Object} events
 */
exports.init = function(startup_time, config, events) {
	if (!startup_time || !config || !events) return false;

	options.debug = config.debug;

	if (typeof config.mongoPrefix == 'boolean' && typeof config.mongoName !== 'string') {
		console.log('config.mongoPrefix is false, config.mongoName must be set.');
		return false;
	};

	options.rate = parseInt(config.flushInterval/1000, 10);
	options.max = config.mongoMax ? parseInt(config.mongoMax, 10) : 2160;
	options.host = config.mongoHost || '127.0.0.1';
	options.prefix = typeof config.mongoPrefix == 'boolean' ? config.mongoPrefix : true;
	options.name = config.mongoName;

	events.on('flush', onFlush);

	return true;
};
