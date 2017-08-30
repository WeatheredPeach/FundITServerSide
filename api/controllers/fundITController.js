'use strict'

const NUMBER_OF_DESCRIPTIONS = 10

var express = require('express')
var path    = require("path")
const request = require('request')
const fs = require('fs')
var mongoose = require('mongoose')
var http = require("http-request")
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest
var synq = new XMLHttpRequest()

var topics, calls, descriptions, temp, descLoaded = false

const topicsURL = 'http://ec.europa.eu/research/participants/portal/data/call/h2020/topics.json'
const descriptionsURL = 'http://ec.europa.eu/research/participants/portal/data/call/topics/'
const callsURL = 'http://ec.europa.eu/research/participants/portal/data/call/h2020/calls.json'
const localDescURL = 'http://localhost:3000/fetchData'

var si
var options =
{
  batchSize: 2500,
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
const indexData = function(err, newIndex) {
  if (!err) {
    si = newIndex
	si.flush(function(err) {
		if (!err) console.log('success!')
	})
    request(localDescURL)
      .pipe(si.feed()
      .on('finish', searchCLI))
	searchCLI()
  }
}
require('search-index')(options, indexData)

const searchCLI = function () {
	descLoaded = true
	console.log("Descriptions ready for search")
}

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
		fs.writeFile("./tmp/test", "", function(err) {
			if(err) {
				return console.log(err);
			}
			console.log("The file was emptied!")
		})

		for(var j = 0, len = topics.length; j < len; j++) {
			
			//if (j > 10) {break;}
			
			//GET html page containing Description JSON from H2020
			synq.open('GET', descriptionsURL + topics[j]["topicFileName"] + ".json", false);
			synq.send(null);

			if (synq.status === 200) {
				//descriptions.push(JSON.parse(synq.responseText))
				/*
				si.concurrentAdd({}, descriptions[j], function(err) {
					if (!err) {console.log('indexed!')}
					else console.log(err)

				})*/
				
				fs.appendFile("./tmp/test", synq.responseText + "\n", function(err) {
					if(err) {
						return console.log(err);
					}

					console.log("The file was appended to!");
				})

			}
			
			//if(j > NUMBER_OF_DESCRIPTIONS) break
			
		}
		//console.log(descriptions)
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
	
	if(descLoaded === false){
		console.log("false")
		res.send("Not done loading yet")
	}
	else{
		
		var tmpQuery = JSON.parse(req.get('query'))
		
		
		
		var hitsCount
		si.totalHits(tmpQuery, function (err, count) {
			hitsCount = count
			
		console.log(hitsCount)
		})
		
		var dataCollection = []
		var i = 0
		si.search(tmpQuery).on('data', function (data) {
			
			dataCollection.push(data["document"])

		})
		.on('finish', function (){

			res.json(dataCollection)
		})
	}
}

exports.updateDatabase = function(req, res) {
	
	console.log("Updating local H2020 data database")
	
	descLoaded = false
	
	si.flush(function(err) {
		if (!err) console.log('success!')
	})
    request(localDescURL)
      .pipe(si.feed()
      .on('finish', searchCLI))
	searchCLI()
	
}

exports.sendWebpage = function(req, res) {
	res.sendFile(path.join(__dirname + '/../../app/public/index.html'))
}

exports.sendData = function(req, res) {
	res.sendFile(path.join(__dirname + '/../../data/test'))
}