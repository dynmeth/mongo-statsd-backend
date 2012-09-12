var async = require('async'),
	mongo = require('mongodb'),
	util = require('util'),
	dbs = {},
	options = {
		debug: false,
		prefix: true,
		size: 100,
		max: 2610,
		name: 'statsd',
		host: '127.0.0.1',
		port: 27017
	};

var log = function(data, force) {
	if (options.debug||force) util.log('mongo-statsd-backend: ' + data);
};

var connection_queue = async.queue(function(task, callback) {
	if(dbs[task.name]) {
		log('connection_queue: re-using connection ' + task.name);

		callback(null, dbs[task.name]);
	} else {
		log('connection_queue: creating connection ' + task.name);
		
		new mongo.Db(task.name, new mongo.Server(options.host, options.port)).open(function(err, db) {
			if (err) {
				log(err, true);
				callback(err);
			} else {
				dbs[task.name] = db;
				callback(null, db);	
			}
		});
	}
}, 1);

connection_queue.drain = function() {
	console.log('connection_queue.drain()');
};

var database = function(name, callback) {
	if(dbs[name]) {
		log('database: re-using connection ' + name);
		callback(null, dbs[name]);	
	} else {
		log('database: queuing connection request ' + name);
		connection_queue.push({name: name}, function(err) {
			callback(err, dbs[name]);
		});
	}
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

		total = vals.reduce(function(a,b) {return a+b}, 0);
		avg = (count > 0 ? total/count : 0);
		callback(null, db, col, {t: time_stamp, min: min, max: max, count: count, total: total, avg: avg});
	},

	counters: function(time_stamp, key, value, callback) {
		var db = prefix(key),
			col = metric('counters', key);
			
		callback(null, db, col, {t: time_stamp, v: value, rate: value/options.rate});
	}
};

var insert = function(err, db_name, col_name, doc, callback) {
	log('database: ' + db_name + ', collection: ' + col_name);

	database(db_name, function(err, db) {
		if(err) {
			callback(err);
		} else {
			db.createCollection(col_name, {capped: true, size: options.size*options.max, max: options.max}, function(err, col) {
				if(err) {
					callback(err);
				} else {
					col.insert(doc, function(err, items) {
						if(err) {
							callback(err);	
						} else {
							callback(null);
						}
					});	
				}
			});
		}
	});
};

var onFlush = function(time_stamp, metrics) {
	var start = new Date().getTime();

	log('flush() event');

	async.forEach(['gauges', 'timers', 'counters'], function(item, callback) {
		var items = [];
		for(var k in metrics[item]) {
			aggregate[item](
				time_stamp, 
				k, 
				metrics[item][k], 
				function(err, db_name, col_name, doc) {
					insert(
						err, 
						db_name, 
						col_name, 
						doc, 
						function(err) {
							log('completed ' + item + ', ' + k + ' ' + metrics[item][k]);
							callback();
						});
				});
		}
	}, function(err) {
		if(err) util.log(err, true);
	});
};

var onStatus = function(error, backend_name, stat_name, stat_value) {

};

exports.init = function(startup_time, config, events) {
	options.debug = config.debug;

	if(typeof config.mongoPrefix == 'boolean' && typeof config.mongoName != 'string') {
		log('if prefix is false, mongoName must be defined.', true);
		return false;
	}

	options.rate = parseInt(config.flushInterval/1000);
	options.max = parseInt(config.mongoMax || 2160);
	options.host = config.mongoHost || '127.0.0.1';
	options.prefix = (typeof config.mongoPrefix == 'boolean' ? config.mongoPrefix : true);
	options.name = config.mongoName;

	log('rate = ' + options.rate);
	log('max = ' + options.max);
	log('host = ' + options.host);
	log('prefix = ' + options.prefix);
	log('name = ' + options.name);
	log('host = ' + options.host);

	events.on('flush', onFlush);
	events.on('status', onStatus);

	return true;
};
