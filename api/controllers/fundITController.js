'use strict'

const NUMBER_OF_DESCRIPTIONS = 10

var express = require('express')
var path    = require("path")

var mongoose = require('mongoose')

var topics, calls, descriptions, temp

const topicsURL = 'http://ec.europa.eu/research/participants/portal/data/call/h2020/topics.json'
const descriptionsURL = 'http://ec.europa.eu/research/participants/portal/data/call/topics/'
const callsURL = 'http://ec.europa.eu/research/participants/portal/data/call/h2020/calls.json'

var http = require("http-request")
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest
var synq = new XMLHttpRequest()

var si
var options =
{
  batchSize: 1000,
  fieldedSearch: true,
  fieldOptions: {},
  preserveCase: false,
  storeable: true,
  searchable: true,
  indexPath: 'index',
  logLevel: 'error',
  nGramLength: 1,
  nGramSeparator: ' ',
  separator: /[\|' \.,\-|(\n)]+/,
  stopwords: require('stopword').en,
}
var searchIndex = require('search-index')
const initIndex = function (err, index){
	// si is now a new search index
	si = index
	
	setUp()
}
searchIndex(options,initIndex)

function setUp(){

	//GET html page containing Topics JSON from H2020
	http.get(topicsURL, function (err, res) {
		if (err) {
			console.error(err)
			return
		}
		
		topics = JSON.parse(res.buffer.toString())
		topics = topics["topicData"]["Topics"]
		descriptions = []

		for(var j = 0, len = topics.length; j < len; j++) {
			
			//if (j > 10) {break;}
			
			//GET html page containing Description JSON from H2020
			synq.open('GET', descriptionsURL + topics[j]["topicFileName"] + ".json", false);
			synq.send(null);

			if (synq.status === 200) {
				descriptions.push(JSON.parse(synq.responseText))
				descriptions[j]["topicID"] = topics[j]["topicFileName"]
				
				si.concurrentAdd({}, descriptions[j], function(err) {
					if (!err) {console.log('indexed!')}
					else console.log(err)

				})

			}
			
			if(j > NUMBER_OF_DESCRIPTIONS) break
			
		}
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

exports.search = function(req, res) {
	
	si.search({
		query: [{
			AND: {'*': ['new']}
		}]
	}).on('data', function (data) {
		console.log(data)
		res.json(data)
	})
}

exports.sendWebpage = function(req, res) {
	res.sendFile(path.join(__dirname + '/../../app/public/index.html'))
}

