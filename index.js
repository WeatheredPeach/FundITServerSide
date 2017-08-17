var express = require('express')
var app = express()
var fundIT = require('./api/controllers/fundITController')

app.use(express.static('app/build'))
app.use(express.static('data'))

var mongoose = require('mongoose'),
	Task = require('./api/models/fundITModel'),
	bodyParser = require('body-parser');

var myLogger = function (req, res, next) {
  console.log('LOGGED')
  next()
}

app.use(myLogger)
  
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/Tododb'); 

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


var routes = require('./api/routes/fundITRoutes');
routes(app);

app.listen(3000)

console.log('todo list RESTful API server started on: ' + 3000)