var express = require('express')
var http = require("http-request")
var app = express()

var topics, calls;

const topicsURL = 'http://ec.europa.eu/research/participants/portal/data/call/h2020/topics.json';
const callsURL = 'http://ec.europa.eu/research/participants/portal/data/call/h2020/calls.json';

var myLogger = function (req, res, next) {
  console.log('LOGGED')
  next()
}

app.use(myLogger)

app.get('/', function (req, res) {
  res.send(calls)
})

function setUp(){

	//GET html page containing Topics JSON from H2020
	http.get(topicsURL, function (err, res) {
		if (err) {
			console.error(err)
			return
		}
		
		topics = JSON.parse(res.buffer.toString())
		
	})

	//GET html page containing Calls JSON from H2020
	http.get(callsURL, function (err, res) {
		if (err) {
			console.error(err)
			return
		}
		
		calls = JSON.parse(res.buffer.toString())
		
	})
}

setUp()

app.listen(3000)