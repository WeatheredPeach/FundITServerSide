'use strict'

const NUMBER_OF_DESCRIPTIONS = 10

var express = require('express')
var path    = require("path")
const request = require('request')
const fs = require('fs')
var http = require("http-request")
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest
var synq = new XMLHttpRequest()
var searchparser = require ('search-parser')

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
	/*/
	si.flush(function(err) {
		if (!err) console.log('success!')
	})
    request(localDescURL)
      .pipe(si.feed()
      .on('finish', searchCLI))*/
	searchCLI()
	//setUp()
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
		var overhead = {}

		for(var j = 0, len = topics.length; j < len; j++) {
			
			//if (j > 10) {break;}
			
			//GET html page containing Description JSON from H2020
			synq.open('GET', descriptionsURL + topics[j]["topicFileName"] + ".json", false);
			synq.send(null);

			if (synq.status === 200) {
				
				topics[j]["description"] = JSON.parse(synq.responseText);
				
			}
			
			fs.appendFile("./tmp/test", JSON.stringify(topics[j]) + "\n", function(err) {
				if(err) {
					return console.log(err);
				}

			})
			
			overhead["topicId"] = "Read"
			
		}
		fs.appendFile("./tmp/overhead", JSON.stringify(overhead) + "\n", function(err) {
			if(err) {
				return console.log(err);
			}
		})
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
		var searchString = req.url.substr(8)
		var searchScopes = []
		var tmpString
		
		if(searchString.substr(0, 6) === 'scope:'){
			searchString = searchString.substr(6)
			
			for(var i = 0, end = searchString.length; i < end; i++) {
		
				if(searchString[i] === ','){
					tmpString = searchString.substr(0, i)
					searchScopes.push(tmpString)
					searchString = searchString.substr(i + 1)
					i = 0
					end = searchString.length
				}
				if(searchString[i] === '&'){
					tmpString = searchString.substr(0, i)
					searchScopes.push(tmpString)
					searchString = searchString.substr(i + 1)
					i = 0
					end = searchString.length
					break
				}
			}
		}
		
		console.log("Scopes = " + searchScopes)
		
		//If the next part of the URL contains search string
		if(searchString.substr(0,7) === 'string:'){
			searchString = decodeURI(searchString.substr(7))
		}
		else{
			
			//TO-DO: Error message
		}
		
		var newString = ''
		var aggregateString
		
		console.log("Search = " + searchString)
		
		//Remove ()s
		for(var i = 0, end = searchString.length; i < end; i++){
			if(searchString[i] === '('){
				searchString = searchString.substr(0, i) + searchString.substr(i + 1)
			}
			if(searchString[i] === ')'){
				searchString = searchString.substr(0, i) + searchString.substr(i + 1)
			}
		}
		
		console.log("Search = " + searchString)
		
		//Apply scopes
		for(var i = 0, end = searchString.length; i < end; i++){
			if(searchString[i] === ' '){
				if(searchString.substr(0, i + 1) === 'AND '){
					newString = newString + 'AND '
					searchString = searchString.substr(i + 1)
					i = 0
					end = searchString.length
				}
				else if(searchString.substr(0, i + 1) === 'NOT '){
					newString = newString + 'NOT '
					searchString = searchString.substr(i + 1)
					i = 0
					end = searchString.length
				}
				else if(searchString.substr(0, i + 1) === 'OR '){
					newString = newString + 'OR '
					searchString = searchString.substr(i + 1)
					i = 0
					end = searchString.length
				}
				else{
					aggregateString = '('
					tmpString = searchString.substr(0, i)
					for(var j = 0, end2 = searchScopes.length; j < end2; j++){
						
						aggregateString = aggregateString + searchScopes[j] + ':' + tmpString
						if(j + 1 < end2){
							aggregateString = aggregateString + ' OR '
						}
						else{
							aggregateString = aggregateString + ') '
						}
					}
					newString = newString + aggregateString
					searchString = searchString.substr(i + 1)
					i = 0
					end = searchString.length
				}
			}
			else if(searchString[i] === ':'){
				
				for(;; i++){
					if(searchString[j] === ' '){
						tmpString = searchString.substr(0, i)
						newString = newString + tmpString
						searchString = searchString.substr(i + 1)
						i = 0
						end = searchString.length
						break
					}
					if(i === searchString.length){
						newString = newString + searchString
						break
					}
				}
			}
			else if((i + 1) === end){
				aggregateString = '('
				tmpString = searchString.substr(0, i + 1)
				for(var j = 0, end2 = searchScopes.length; j < end2; j++){
					
					aggregateString = aggregateString + searchScopes[j] + ':' + tmpString
					if(j + 1 < end2){
						aggregateString = aggregateString + ' OR '
					}
					else{
						aggregateString = aggregateString + ')'
					}
				}
				newString = newString + aggregateString
			}
		}
		searchString = newString
		
		//Add together all words separated by spaces as if they were connected by ANDs
		for(var i = 0, end = searchString.length; i < end; i++){
			if(searchString[i] === ')'){
				if(searchString.substr(i, 3) === ') ('){
					searchString = searchString.substr(0, i) + ') AND (' + searchString.substr(i + 3)
				}
			}
		}
		
		console.log("Search = " + searchString)
		
		//Parse search string to query-like structure, implement logic
		var tmpParsed = searchparser.parse(searchString)
		
		console.log(JSON.stringify(tmpParsed))
		
		var queryStructure = [], partialQuery, tmpKey
		
		//Turn searchparser response into search-index query
		for(var i = 0, end = tmpParsed.length; i < end; i++){
			partialQuery = {}
			for(var j = 0, end2 = tmpParsed[i].length; j < end2; j++){
				tmpKey = Object.keys(tmpParsed[i][j])
				if(!(tmpKey in partialQuery)){
					partialQuery[tmpKey] = []
				}
				partialQuery[tmpKey].push(tmpParsed[i][j][tmpKey]['include'])
			}
			
			queryStructure.push({AND: partialQuery})
		}
		
		var tmpQuery = {}
		
		tmpQuery['query'] = queryStructure
		
		console.log('\n\n\n' + JSON.stringify(tmpQuery))
		
		var hitsCount
		si.totalHits(tmpQuery, function (err, count) {
			hitsCount = count
			
		console.log(hitsCount)
		})
		
		var dataCollection = []
		dataCollection.push([0])
		si.search(tmpQuery).on('data', function (data) {
			
			dataCollection.push(data["document"])
			dataCollection[0][0] = dataCollection[0][0] + 1

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