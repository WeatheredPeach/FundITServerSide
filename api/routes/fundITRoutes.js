'use strict';
module.exports = function(app) {
	var fundIT = require('../controllers/fundITController');

	app.route('/')
		.get(fundIT.sendWebpage);

	app.route('/search')
		.get(fundIT.search);
};