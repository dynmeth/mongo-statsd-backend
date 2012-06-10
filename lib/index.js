var async = require('async'),
	mongo = require('mongodb'),
	util = require('util'),
	options = {
		debug: false,
		prefix: true,
		size: 100,
		max: 2610,
		name: 'statsd',
		host: 'localhost'
	};

var prefix = function(metric) {
	return (options.prefix ? metric.split('.').shift() : options.name);
};

var metric = function(metric_type, metric) {
	var ary = metric.split('.');

	if(options.prefix) {
		ary.shift();
	}

	ary.unshift(metric_type);

	return ary.join('.') + '_' + options.rate;
};

var aggregate = {
	gauges: function(time_stamp, key, value, callback) {
		var db = prefix(key),
			col = metric('gauges', key);

		callback(null, db, col, {t: time_stamp, v: value});
	},

	timers: function(time_stamp, key, values, callback) {
		var db = prefix(key),
			col = metric('timers', key),
			vals = values.sort(function(a,b) { return a-b; }),
			count = vals.length,
			min = (count > 0 ? vals[0] : 0),
			max = (count > 0 ? vals[count-1] : 0),
			total = 0,
			avg = 0;

		async.reduce(
			vals, 
			0, 
			function(m, v, cb) { 
				cb(null, m+v); 
			},
			function(err, result) {
				total = result;
				avg = (count > 0 ? total/count : 0);

				callback(null, db, col, {t: time_stamp, min: min, max: max, count: count, total: total, avg: avg});
		});
	},

	counters: function(time_stamp, key, value, callback) {
		var db = prefix(key),
			col = metric('counters', key);

		callback(null, db, col, {t: time_stamp, v: value, rate: value/options.rate});
	}
};

var insert = function(err, db_name, col_name, doc, callback) {
	if(options.debug) util.log('mongo-statsd-backend: database: ' + db_name + ', collection: ' + col_name);

	new mongo.Db(db_name, new mongo.Server(options.host, 27017, {auto_reconnect: true, poolSize: 4})).open(function(err, db) {
		if(err) {
			callback(err);
		} else {
			db.createCollection(col_name, {capped: true, size: options.size*options.max, max: options.max}, function(err, col) {
				if(err) {
					callback(err);
				} else {
					col.insert(doc, function(err, items) {
						if(err) callback(err);

						db.close();
					});	
				}
			});
		}
	});
};

var onFlush = function(time_stamp, metrics) {
	if(options.debug) util.log('mongo-statsd-backend: flush() event');

	['gauges', 'timers', 'counters'].forEach(function(t) {
		for(var k in metrics[t]) {
			aggregate[t](
				time_stamp, 
				k, 
				metrics[t][k], 
				function(err, db_name, col_name, doc) {
					insert(
						err, 
						db_name, 
						col_name, 
						doc, 
						function(err) {
							if(err) util.log('mongo-statsd-backend: (error)' + err);
						});
				});	
		}
	});
};

var onStatus = function(error, backend_name, stat_name, stat_value) {

};

exports.init = function(startup_time, config, events) {
	options.debug = config.debug;

	if(typeof config.mongoPrefix == 'boolean' && typeof config.mongoName != 'string') {
		util.log('mongo-statsd-backend: if prefix is false, mongoName must be defined.');
		return false;
	}

	options.rate = parseInt(config.flushInterval/1000);
	options.max = parseInt(config.mongoMax || 2160);
	options.host = config.mongoHost || 'localhost';
	options.prefix = (typeof config.mongoPrefix == 'boolean' ? config.mongoPrefix : true);
	options.name = config.mongoName;

	if(options.debug) {
		util.log('mongo-statsd-backend: rate = ' + options.rate);
		util.log('mongo-statsd-backend: max = ' + options.max);
		util.log('mongo-statsd-backend: host = ' + options.host);
		util.log('mongo-statsd-backend: prefix = ' + options.prefix);
		util.log('mongo-statsd-backend: name = ' + options.name);
	}

	events.on('flush', onFlush);
	events.on('status', onStatus);

	return true;
};