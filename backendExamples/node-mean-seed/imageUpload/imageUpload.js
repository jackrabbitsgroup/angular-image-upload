/**
@module imageUpload
@class imageUpload

@toc
1. upload
2. crop
3. createDirs
4. copyFile
*/

'use strict';

var Q = require('q');
var lodash = require('lodash');

var fs =require('fs');
var im = require('imagemagick');

// var dependency =require('../../../dependency.js');
// var pathParts =dependency.buildPaths(__dirname, {});

var self;

var defaults = {
};

/**
ImageUpload module constructor
@class ImageUpload
@constructor
@param options {Object} constructor options
**/
function ImageUpload(options){
    this.opts = lodash.merge({}, defaults, options||{});

	self = this;
}

/**
@toc 1.
@method upload
@param {Object} data
	@param {Object} files
	@param {Object} fileData
		@param {String} uploadDir
@param {Object} params
@return {Object} (via Promise)
		@param {Number} code
		@param {String} msg
**/
ImageUpload.prototype.upload = function(db, data, params) {
	var deferred = Q.defer();
	var ret ={code:0, msg:'ImageUpload.upload '};

	var pathPart =data.fileData.uploadDir;                //use post data 'uploadDir' parameter to set the directory to upload this image file to
	var retDir =self.createDirs(pathPart, {});
	var dirPath =retDir.dirPath;
	
	var fileInputName ='myFile';                //hardcoded - must match what's set for serverParamNames.file in image-upload directive (defaults to 'file')
	var imageFileName =data.files[fileInputName].name;                //just keep the file name the same as the name that was uploaded - NOTE: it's probably best to change to avoid bad characters, etc.
	ret.fileNameSave =imageFileName;                //hardcoded 'fileNameSave' must match what's set in imageServerKeys.imgFileName value for image-upload directive. THIS MUST BE PASSED BACK SO WE CAN SET NG-MODEL ON THE FRONTEND AND DISPLAY THE IMAGE!
	
	//copy (read and then write) the file to the uploads directory. Then return json.
	fs.readFile(data.files[fileInputName].path, function (err1, data1)
	{
		var newPath = dirPath +"/"+imageFileName;
		fs.writeFile(newPath, data1, function (err2)
		{
			//Auto crop the image (crop the middle of it and make it as large as the smallest dimension)
			im.identify(newPath, function(err3, features)
			{
				// { format: 'JPEG', width: 3904, height: 2622, depth: 8 }
				
				var crop_data =
				{
					'fileName': data.fileData.uploadDir + '/' + imageFileName,
					'cropOptions': {'cropDuplicateSuffix': '_crop'},		//hardcoded
					'cropCoords': {},
					'fullCoords': {'left': 0, 'top': 0, 'right': features.width, 'bottom': features.height}
				};
				//Crop to square
				if(features.width > features.height)
				{
					crop_data.cropCoords.top = 0;
					crop_data.cropCoords.bottom = features.height;
					crop_data.cropCoords.left = ((features.width - features.height) / 2);
					crop_data.cropCoords.right = features.width - ((features.width - features.height) / 2);
				}
				else
				{
					crop_data.cropCoords.left = 0;
					crop_data.cropCoords.right = features.width;
					crop_data.cropCoords.top = ((features.height - features.width) / 2);
					crop_data.cropCoords.bottom = features.height - ((features.height - features.width) / 2);
				}
				
				var crop_promise = self.crop(db, crop_data, {});
				crop_promise.then(
					function(ret1)
					{
						ret.code = 0;
						deferred.resolve(ret);
					},
					function(ret2)
					{
						ret.code = 1;
						deferred.reject(ret2);
					}
				);
			});
		});
	});

	return deferred.promise;
};

/**
Crop an image
@toc 2.
@method crop
@param {Object} data
	@param {String} fileName The file name (from the original upload - should already be in the uploads directory)
	@param {Object} cropCoords
		@param {String} left
		@param {String} top
		@param {String} right
		@param {String} bottom
	@param {Object} fullCoords Convenience coordinates for the full size of the image
		@param {String} left
		@param {String} top
		@param {String} right
		@param {String} bottom
	@param {Object} cropOptions
		@param {String} cropDuplicateSuffix
@param {Object} params
@return {Object} (via Promise)
	@param {String} cropped_path Path to the newly created image
**/
ImageUpload.prototype.crop = function(db, data, params)
{
	var deferred = Q.defer();
	var ret ={code:0, msg:'ImageUpload.crop ', 'cropped_path': ''};
	var ii;
	
	var fileName =data.fileName;
	//form crop named version
	var index1 =fileName.lastIndexOf('.');
	var fileNameCrop =fileName.slice(0, index1)+data.cropOptions.cropDuplicateSuffix+fileName.slice(index1, fileName.length);
	
	var pathPart =fileName;
	var retDir =self.createDirs(pathPart, {});
	var input_file =retDir.dirPath;
	
	pathPart =fileNameCrop;
	retDir =self.createDirs(pathPart, {});
	var output_file =retDir.dirPath;
	
	//actually do the cropping here (i.e. using ImageMagick)
	//File names relative to the root project directory
	// var input_file = dirPath +"/"+fileName;
	// var output_file = dirPath +"/"+fileNameCrop;
	var new_width = (data.cropCoords.right -data.cropCoords.left);
	var new_height = (data.cropCoords.bottom -data.cropCoords.top);
	var x_off = data.cropCoords.left;
	var y_off = data.cropCoords.top;
	
	var geometry = new_width + 'x' + new_height + '+' + x_off + '+' + y_off;	//Format: 120x80+30+15
	
	var args = [input_file, "-crop", geometry, output_file];
	
	im.convert(args, function(err)
	{
		if(err)
		{
			ret.code = 1;
			ret.msg += err;
			deferred.reject(ret);
		}
		else
		{
			ret.code = 0;
			// ret.cropped_path = output_file;
			deferred.resolve(ret);
		}
	});
	
	return deferred.promise;
};

/**
Takes a full path and checks if ALL directories exist up until that path and creates them if they do not
@toc 3.
@method createDirs
@param {String} pathPart The path (from the 'app' directory) to use / create
@param {Object} params
@return {Object}
	@param {String} dirPath The final directory path to use, with all directories created if they didn't already exist so this folder / path will still exist
*/
ImageUpload.prototype.createDirs = function(pathPart, params) {
	var ret ={code:0, msg:'', dirPath:''};
	
	var dirPath =__dirname + "/../../..";		//hardcoded relative path from this directory to app
	if(pathPart[0] !=='/') {
		dirPath +='/';
	}
	var dirPathRoot =dirPath;		//save
	dirPath +=pathPart;
	// console.log('dirPath: '+dirPath+' dirname: '+__dirname+' pathPart: '+pathPart);		//TESTING
	//make uploads directory if it doesn't exist
	var exists;
	//need to create ALL paths up until the final path (in case parent directories don't exist either)
	var curPath =pathPart;
	if(curPath[0] =='/') {		//ensure doesn't start with a slash
		curPath =curPath.slice(1, curPath.length);
	}
	var curDir =dirPathRoot;
	var indexSlash =false;
	var ii =0;
	while(curPath.indexOf('/') >-1) {
		exists =fs.existsSync(curDir);
		if(!exists) {
			fs.mkdirSync(curDir);
		}
		//cut curPath and add to curDir for next time
		indexSlash =curPath.indexOf('/');
		curDir =curDir+'/'+curPath.slice(0, indexSlash);
		curPath =curPath.slice((indexSlash+1), curPath.length);
		ii++;
		//on last one, create the last dir too
		if(curPath.indexOf('/') <0) {
			exists =fs.existsSync(curDir);
			if(!exists) {
				fs.mkdirSync(curDir);
			}
		}
	}
	
	//check final path too IF not a file (do NOT create a directory that's the same name as the filename!)
	var indexExt =dirPath.lastIndexOf('.');
	if(indexExt <=(dirPath.length -5)) {		//if no dot OR if it's before the last 5 characters, then it's likely not a file (no extension)
		exists =fs.existsSync(dirPath);
		if(!exists) {
			fs.mkdirSync(dirPath);
		}
	}
	
	ret.dirPath =dirPath;
	return ret;
};

/**
Copies a file from one folder to another - since node.js doesn't have a native copy function
@todo - move this to a separate file service? It's not really ImageUpload specific..
@toc 4.
@method copyFile
@param {String} pathFrom The path to the file we want to copy
@param {String} pathTo The path to the folder we want to copy into
@param {Object} params
@return {Object} (via Promise)
*/
ImageUpload.prototype.copyFile = function(pathFrom, pathTo, params) {
	var deferred = Q.defer();
	var ret ={code:0, msg:'ImageUpload.copyFile '};
	
	//copy (read and then write) the file to new directory
	fs.readFile(pathFrom, function (errRead, dataRead) 
	{
		if(errRead) {
			console.log('read err');
			console.log(errRead);
			ret.error =errRead;
			ret.msg+=errRead;
			ret.code =1;
			deferred.reject(ret);
		}
		else {
			fs.writeFile(pathTo, dataRead, function (errWrite)
			{
				if(errWrite) {
					console.log('write err');
					console.log(errWrite);
					ret.error =errWrite;
					ret.msg+=errWrite;
					ret.code =1;
					deferred.reject(ret);
				}
				else {
					deferred.resolve(ret);
				}
			});
		}
	});
	
	return deferred.promise;
};


/**
Module exports
@method exports
@return {ImageUpload} ImageUpload constructor
**/
module.exports = new ImageUpload({});