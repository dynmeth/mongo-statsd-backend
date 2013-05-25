'use strict';

var backend = require('../lib/'),
	events = require('events'),
	flush = require('./exampleFlush.js'),
	assert = require('chai').assert;

var eventer = new events.EventEmitter(),
	config = {
		mongoHost: '127.0.0.1',
		flushInterval: 5000,
		debug: true
	},
	backendRef;

describe('the mongodb statsd backend', function(){

	describe('verifying some deps', function(){
		it('check existance of stubbed dependencies', function(d){
			assert.ok(eventer);
			assert.ok(flush);
			d();
		});
	});

	describe('backend#init()', function(){
		it('initializes the backend', function(d){
			backendRef = backend.init(new Date().getTime(), config, eventer);
			assert.ok(backendRef);
			d();
		});
	});

	describe('eventer#emit("flush")', function(){
		it('emits a flush event to the backend', function(d){
			eventer.emit('flush', new Date().getTime(), flush);
			setTimeout(function(){
				assert.ok(true);
				d();
			}, 1500);
		});
	});
});
