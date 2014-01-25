'use strict';

var fs =require('fs');		//for image upload file handling
var im = require('imagemagick');		//for image cropping

var express = require('express');
var app = express();

var port =3000;
var host ='localhost';
var serverPath ='/';
var staticPath ='/';

var staticFilePath = __dirname + serverPath;
// remove trailing slash if present
if(staticFilePath.substr(-1) === '/'){
	staticFilePath = staticFilePath.substr(0, staticFilePath.length - 1);
}

app.configure(function(){
	// compress static content
	app.use(express.compress());
	app.use(serverPath, express.static(staticFilePath));		//serve static files
	
	app.use(express.bodyParser());		//for post content / files - not sure if this is actually necessary?
});

app.post('/imageUpload', function(req, res) {
	var ret ={
		files: req.files,		//node.js puts files in the req.files object - this is an array of all files uploaded
		reqBody: req.body		//rest of post data is here
	};
	
	var dirPath =__dirname + "/"+req.body.fileData.uploadDir;		//use post data 'uploadDir' parameter to set the directory to upload this image file to
	//make uploads directory if it doesn't exist
	var exists =fs.existsSync(dirPath);
	if(!exists) {
		fs.mkdirSync(dirPath);
	}
	
	var fileInputName ='myFile';		//hardcoded - must match what's set for serverParamNames.file in image-upload directive (defaults to 'file')
	var imageFileName =req.files[fileInputName].name;		//just keep the file name the same as the name that was uploaded - NOTE: it's probably best to change to avoid bad characters, etc.
	ret.fileNameSave =imageFileName;		//hardcoded 'fileNameSave' must match what's set in imageServerKeys.imgFileName value for image-upload directive. THIS MUST BE PASSED BACK SO WE CAN SET NG-MODEL ON THE FRONTEND AND DISPLAY THE IMAGE!
	
	//copy (read and then write) the file to the uploads directory. Then return json.
	fs.readFile(req.files[fileInputName].path, function (err, data) {
		var newPath = dirPath +"/"+imageFileName;
		fs.writeFile(newPath, data, function (err) {
			// res.redirect("back");
			res.json(ret);
		});
	});
});

// @param {Object} req.body
	// @param {String} fileName The file name (from the original upload - should already be in the uploads directory)
	// @param {Object} cropCoords
		// @param {String} left
		// @param {String} top
		// @param {String} right
		// @param {String} bottom
	// @param {Object} fullCoords Convenience coordinates for the full size of the image
		// @param {String} left
		// @param {String} top
		// @param {String} right
		// @param {String} bottom
	// @param {Object} cropOptions
		// @param {String} cropDuplicateSuffix
app.post('/imageCrop', function(req, res) {
	var ret ={
		code: 0,
		msg: '',
		reqBody: req.body		//rest of post data is here
	};
	
	// var dirPath =__dirname + "/"+req.body.fileData.uploadDir;		//use post data 'uploadDir' parameter to set the directory to upload this image file to
	var dirPath =__dirname;		//filename already has uploadDir prepended to it
	
	//uploads directory should already exist from pre-crop upload so don't need to make it
	
	var fileName =req.body.fileName;
	//form crop named version
	var index1 =fileName.lastIndexOf('.');
	var fileNameCrop =fileName.slice(0, index1)+req.body.cropOptions.cropDuplicateSuffix+fileName.slice(index1, fileName.length);
	
	//actually do the cropping here (i.e. using ImageMagick)
	//File names relative to the root project directory
	var input_file = dirPath +"/"+fileName;
	var output_file = dirPath +"/"+fileNameCrop;
	var new_width = (req.body.cropCoords.right -req.body.cropCoords.left);
	var new_height = (req.body.cropCoords.bottom -req.body.cropCoords.top);
	var x_off = req.body.cropCoords.left;
	var y_off = req.body.cropCoords.top;
	
	var geometry = new_width + 'x' + new_height + '+' + x_off + '+' + y_off;	//Format: 120x80+30+15
	console.log('geometry: '+geometry+' input_file: '+input_file+' output_file: '+output_file);
	
	var args = [input_file, "-crop", geometry, output_file];
	
	im.convert(args, function(err)
	{
		if(err)
		{
			ret.code = 1;
			ret.msg += err;
			// deferred.reject(ret);
		}
		else
		{
			ret.code = 0;
			ret.cropped_path = output_file;
			// deferred.resolve(ret);
		}
		res.json(ret);
	});

});

//catch all route to serve index.html (main frontend app)
app.get('*', function(req, res){
	res.sendfile(staticFilePath + staticPath+ 'index.html');
});

app.listen(port);

console.log('Server running at http://'+host+':'+port.toString()+'/');