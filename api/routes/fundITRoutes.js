'use strict';
module.exports = function(app) {
	var fundIT = require('../controllers/fundITController');

	app.route('/')
		.get(fundIT.sendWebpage);

	app.route('/search*')
		.get(fundIT.search);
		
	app.route('/update')
		.get(fundIT.updateDatabase);
		
	app.route('/fetchData')
		.get(fundIT.sendData);
};