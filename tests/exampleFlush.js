module.exports = { 
	counters: {
		'statsd.bad_lines_seen': 0,
		'statsd.packets_received': 150,
		'central.api_requests': 75
	},
	timers: {
		'central.reponse_time': 
			[ 0, 3, 3, 3, 3, 10, 13, 14, 526 ]
	},
	gauges: {
		'central.request_time': 0,
		'central.request_time1': 1,
		'central.request_time2': 2,
		'central.request_time3': 3,
		'central.request_time4': 4,
		'central.request_time5': 5,
		'central.request_time6': 6
	},
	timer_data: {
		'central.reponse_time': {
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
	},
	counter_rates: {
		'statsd.bad_lines_seen': 0,
		'statsd.packets_received': 15,
		'central.api_requests': 7.5
	},
	sets: {
		'central.unique': [ 'value' ] 
	},
	pctThreshold: [ 90 ]
};
