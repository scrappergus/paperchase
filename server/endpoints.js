Picker.route('/api/index/:pii', function(params, req, res) {
	// index signle article by pii
	Meteor.call('indexDoc', params.pii, function(err) {
		if (err) {
			res.statusCode = 400;
			return res.end(err.message);
		}

		res.end('indexed ' + params.pii);
	});
});

Picker.route('/api/index/', function(params, req, res) {
	// index entire journal
	Meteor.call('indexJournal', function(err) {
		console.log(err? err : 'indexing journal');
		message = err? err.message: 'indexing journal';
		res.statusCode = err? 400: 202;
		res.end(message);
	});
});