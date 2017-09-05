var express = require('express')
var app = express()
var fundIT = require('./api/controllers/fundITController')

app.use(express.static('app/build'))
app.use(express.static('data'))

var Task = require('./api/models/fundITModel'),
	bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var routes = require('./api/routes/fundITRoutes');
routes(app);

app.listen(8080, "0.0.0.0")

console.log('todo list RESTful API server started on: ' + 8080)