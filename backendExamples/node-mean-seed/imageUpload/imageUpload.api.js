/**
@module imageUpload
@class imageUploadApi

@toc
1. rpcUpload
2. rpcCrop
*/

'use strict';

var lodash = require('lodash');
var inherits = require('util').inherits;

var dependency =require('../../../dependency.js');
var pathParts =dependency.buildPaths(__dirname, {});

// var Base = require('./base');
// var Base = require('../../../routes/api/base.js');		//can't pass this in since it's used with inherits (which has to be outside the function definition??)
var Base =require(pathParts.routes+'api/base.js');

var ImageUploadMod = require(pathParts.controllers+'imageUpload/imageUpload.js');

var sampleImageUploadReturn = {
	_id: "objectid",
	//TODO
};

var defaults = {
	group: 'imageUpload',
	info: 'ImageUpload API',
	namespace: 'ImageUpload'
};

var db;

module.exports = ImageUploadApi;

/**
@param {Object} options
	@param {Object} db
*/
function ImageUploadApi(options){
	this.opts = lodash.extend({}, defaults, options||{});
	Base.call(this, this.opts);
	
	db =this.opts.db;
}

inherits(ImageUploadApi, Base);

ImageUploadApi.prototype.getRpcMethods = function(){
	return {
		upload: this.rpcUpload(),
		crop: this.rpcCrop(),
	};
};

/**
@toc 1.
@method rpcUpload
**/
ImageUploadApi.prototype.rpcUpload = function(){
	var self = this;

	return {
		info: 'Upload an image',
		params: {
			files: { type: 'object', required: true, info: "The image files to upload" },
			fileData: { type: 'object', info: "Has at least an 'uploadDir' key" }
		},
		returns: {
			code: 'string',
			msg: 'string'
		},
		/**
		@method action
		@param {Object} params
			@param {Object} data
		@param {Object} out callback object which provides `win` and `fail` functions for handling `success` and `fail` callbacks
			@param {Function} win Success callback
			@param {Function} fail Fail callback
		**/
		action: function(params, out) {
			var promise =ImageUploadMod.upload(db, params, {});
			promise.then(function(ret1) {
				out.win(ret1);
			}, function(err) {
				self.handleError(out, err, {});
			});
		}
	};
};

/**
@toc 2.
@method rpcCrop
**/
ImageUploadApi.prototype.rpcCrop = function(){
	var self = this;

	return {
		info: 'Crop an image',
		params: {
			fileName: { type: 'string', required: true, info: "Name of the file to crop" },
			cropCoords: { type: 'object', info: "left, top, right, bottom for where to crop" },
			fullCoords: { type: 'object', info: "Convenience info of left, top, right, bottom for the full sized image" },
			cropOptions: { type: 'object', info: "cropDuplicateSuffix and other keys for how to crop" }
		},
		returns: {
			code: 'string',
			msg: 'string',
			cropped_path: 'string'
		},
		/**
		@method action
		@param {Object} params
			@param {Object} data
		@param {Object} out callback object which provides `win` and `fail` functions for handling `success` and `fail` callbacks
			@param {Function} win Success callback
			@param {Function} fail Fail callback
		**/
		action: function(params, out) {
			var promise =ImageUploadMod.crop(db, params, {});
			promise.then(function(ret1) {
				out.win(ret1);
			}, function(err) {
				self.handleError(out, err, {});
			});
		}
	};
};