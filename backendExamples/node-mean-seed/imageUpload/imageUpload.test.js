/**
Tests for all /api/imageUpload endpoints

NOTE: "it" blocks with modularized/nested function and async code can be finicky - I don't think nested "it" blocks are allowed BUT need an outer "it" block to ensure the async code gets run (otherwise it will just complete immediately before running any tests). So if and when to use "done" for the it blocks and where to put them is sometimes hard to follow/trace. When in doubt, try an "it" block and if it errors or doesn't complete, try just putting an "expect" there directly - it's likely already in an "it" block..

@toc
public methods
1. ImageUpload
2. ImageUpload.run
private methods
3.5. clearData
3. before
4. after
5. go
	6. todo
*/

'use strict';

var https = require("https");
var request = require('request');
var async = require('async');
var lodash = require('lodash');
var Q = require('q');

var dependency =require('../../../dependency.js');
var pathParts =dependency.buildPaths(__dirname, {});

var MongoDBMod =require(pathParts.services+'mongodb/mongodb.js');

var self, db, api;

//NOTE: make sure to namespace all values to ensure no conflicts with other modules that run asynchronously and may be altering the same data otherwise - leading to odd and very hard to debug errors..
//NOTE: make sure to namespace all values to ensure no conflicts with other modules that run asynchronously and may be altering the same data otherwise - leading to odd and very hard to debug errors..
var ns ='imageUpload_';		//namespace
var TEST_TODO =[
	{
		title: ns+'title1'		//TODO
	},
	{
		title: ns+'title2'		//TODO
	},
	{
		title: ns+'TiTle 3'		//TODO
	},
	{
		title: ns+'titLe 4'		//TODO
	}
];

/**
Variable to store variables we need to use in multiple tests (i.e. counters)
@property globals
@type Object
*/
var globals ={
};

module.exports = ImageUpload;

/**
Main function/object (will be exported)
@toc 1.
@method ImageUpload
@param {Object} params
	@param {Object} db
	@param {Object} api
	// @param {Object} MongoDBMod
*/
function ImageUpload(params) {
	db =params.db;
	api =params.api;
	// MongoDBMod =params.MongoDBMod;
	
	self =this;
}

/**
@toc 2.
@method ImageUpload.run
@param {Object} params
*/
ImageUpload.prototype.run =function(params) {
	var deferred =Q.defer();
	
	describe('ImageUploadModule', function() {
		it("should test all imageUpload calls", function(done)
		{
			var promise =before({});
			promise.then(function(ret1) {
				done();
				deferred.resolve(ret1);
			}, function(err) {
				deferred.reject(err);
			});
		});
	});
	
	return deferred.promise;
};

/**
@toc 3.5.
@method clearData
@param {Object} params
@return {Promise} This will ALWAYS resolve (no reject)
*/
function clearData(params) {
	var deferred =Q.defer();
	var ret ={msg: ''};
	
	//drop test data
	var titles =[];		//TODO
	var ii;
	for(ii =0; ii<TEST_TODO.length; ii++) {
		titles[ii] =TEST_TODO[ii].title;		//TODO
	}
	db.todo.remove({title: {$in:titles} }, function(err, numRemoved) {		//TODO
		if(err) {
			ret.msg +="db.todo.remove Error: "+err;
		}
		else if(numRemoved <1) {
			ret.msg +="db.todo.remove Num removed: "+numRemoved;
		}
		else {
			ret.msg +="db.todo.remove Removed "+numRemoved;
		}
		
		deferred.resolve(ret);
		
	});
	
	return deferred.promise;
}

/**
@toc 3.
@method before
@param {Object} params
*/
function before(params) {
	var deferred =Q.defer();
	
	var promiseClearData =clearData({})
	.then(function(ret1) {
		console.log('\nImageUpload BEFORE: '+ret1.msg);

		var promise =go({});
		promise.then(function(ret1) {
			var promiseAfter =after({});
			promiseAfter.then(function(retAfter) {
				deferred.resolve(ret1);
			}, function(err) {
				deferred.reject(err);
			});
		}, function(err) {
			deferred.reject(err);
		});
	});

	return deferred.promise;
}

/**
Do clean up to put database back to original state it was before ran tests (remove test data, etc.)
@toc 4.
@method after
@param {Object} params
*/
function after(params) {
	var deferred =Q.defer();
	
	var promiseClearData =clearData({})
	.then(function(ret1) {
		console.log('\nImageUpload AFTER: '+ret1.msg);
		deferred.resolve({});
	});
	
	return deferred.promise;
}

/**
@toc 5.
@method go
@param {Object} params
*/
function go(params) {
	var deferred =Q.defer();
	var reqObj;
	
	/**
	@toc 6.
	@method todo
	@param {Object} opts
	*/
	var todo =function(opts) {
		var params =
		{
			param1: 'TODO'		//TODO
		};
		api.expectRequest({method:'ImageUpload.todo'}, {data:params}, {}, {})
		.then(function(res) {
			var data =res.data.result;
			//TODO - add expects here
			
			deferred.resolve({});
		});
		
	};
	
	todo({});		//start all the calls going
	
	return deferred.promise;
}