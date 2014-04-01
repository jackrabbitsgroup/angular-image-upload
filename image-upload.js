/**
NOTE: for editing an existing image (i.e. if ngModel is set), the image file should ALREADY be in $scope.opts.uploadDirectory (i.e. if you moved it out on save or clear that temporary directory, you'll need to move it BACK (on the backend) BEFORE calling this directive to get it back to the state as if it were an image just uploaded - this is the only (easy) way to be able to crop the existing image).

@todo
- for crop:false option, remove more/all crop stuff? (i.e. right we're JUST hidding the 'crop thumbnail' button..)
- theme / style (remove existing styles and make it more barebones)
- test (unit tests & manually w/ backend)
	- do / test upload by url and other options & combinations
- remove old / obsolete & commented out code, i.e.
	- finalDirectory
	
@dependencies
- required
	- angular-array (jrgArray)
- optional
	- angular-area-select (jrgAreaSelect)
	
@toc
0. init
0.5. $scope.$watch('ngModel',..
1. function checkFileType
2. function getFileExtension
3. $scope.fileSelected =function
4. $scope.uploadFile =function
5. function uploadProgress
6. function uploadComplete
6.25. function ajaxUploadComplete
6.5. function afterComplete
7. function uploadFailed
8. function uploadCanceled
9. $scope.startCrop
10. $scope.cropCancel
11. $scope.crop
12. startCropping
12.5 stopCropping
13. ajaxCall

@param {Object} scope (attrs that must be defined on the scope (i.e. in the controller) - they can't just be defined in the partial html). REMEMBER: use snake-case when setting these on the partial!
	@param {String} ngModel Variable for storing the file name of the uploaded file
	@param {Object} opts
		@param {String} uploadPath Path to upload file to (backend script)
		@param {String} uploadDirectory Directory to store file in - NOTE: this must be relative to the ROOT of the server!!
		// @param {String} finalDirectory Directory to load file from (for initial load or change of ngModel - when image likely will NOT be in the temporary uploadDirectory anymore) - NOTE: this must be relative to the ROOT of the server!! - UPDATE - this doesn't actually help since while it can display the image the first time, it won't allow editing / cropping so it's basically useless. Instead the file should be moved BACK into the uploads directory prior to editing/viewing
		@param {Object} imageServerKeys Items that tell what keys hold the following info after returned from backend. These can be in dot notation as well to get to nested objects/arrays, i.e. 'result.fileName' would access data.result.fileName from the data returned from the backend.
			@param {String} imgFileName Key for variable that holds image file name / partial path ONLY (not the full path; uploadDirectory variable will be prepended). This VALUE can have a folder as part of it - i.e. 'image1.jpg' OR 'original/image1.jpg'
			@param {Number} picHeight
			@param {Number} picWidth
			@param {String} imgFileNameCrop Key for variable that holds the file name of the newly cropped image. This can also have a folder in front of it - i.e. '200/image1.jpg'
		@param {Object} [serverParamNames] Form names to submit (so can interact with any server). Note, additional information will be passed back in "fileData" object and "cropOptions" object
			@param {String} [file ='file']
			@param {String} [byUrl ='fileData[fileUrl]']
		@param {Object} [postData] Any (custom) data to send to the backend - will be passed back in a 'postData' key/field
		@param {Object} [postDataCrop] Any (custom) data to send to the backend for the crop call - will be passed back in a 'postDataCrop' key/field
		@param {String} [uploadCropPath] (required for cropping) Path to handle the cropping (backend script)
		@param {Array} [fileTypes] 1D array [] of valid file types (i.e. ['png', 'jpg', 'jpeg', 'bmp', 'gif'])
		@param {Object} cropOptions Items with defaults for cropping
			@param {Boolean} [crop =true] True to allow cropping
			// @param {Number} [cropAspectRatio =1] Number to indicate how to crop, 1 = square, 2 = twice as wide as tall, .5 =twice as tall as wide		//passed in as attribute now - see crop-aspect-ratio
			// @param {Number} [cropMinHeight =100] Minimum pixel height for cropped version
			// @param {Number} [cropMinWidth =100] Minimum pixel width for cropped version
			// @param {Number} [cropMaxHeight =300] Max pixel height for cropped version
			// @param {Number} [cropMaxWidth =300] Max pixel width for cropped version
			@param {String} [cropDuplicateSuffix ="_crop"] Suffix to add to image for the cropped version
		@param {Object} callbackInfo
			@param {String} evtName Angular event name to broadcast
			@param {Array} args Function arguments ('data' will be appended as additional argument to end)
		//standardAjaxForUrl =boolean true if want to use jquery/standard ajax for submitting url as opposed to form data

@param {Object} attrs REMEMBER: use snake-case when setting these on the partial! i.e. my-attr='1' NOT myAttr='1'
	@param {Number} [useUploadButton=0] True if want to show an upload button for confirming the upload (otherwise, as soon as picture is selected, it will be uploaded & shown for a preview)
	@param {String} [type =dragNDrop] What type of user interface - one of: 'dragNDrop', 'byUrl' (to paste a link from another website)
	@param {String} [htmlDisplay] Complete html for what to put in drag box
	@param {String} [htmlUrlInstructions] Complete html for what to put below upload by url input field
	@param {String} [htmlUploading] Html to display during upload INSTEAD of upload progress bar (i.e. in case backend is doing more than just uploading the image (heavy image process that takes many seconds) in which case the progress bar will only show the upload progress but backend may not be done yet..)
	@param {Number} [cropAspectRatio =1] Number to indicate how to crop, 1 = square, 2 = twice as wide as tall, .5 =twice as tall as wide


@usage
partial / html:
<div jrg-image-upload opts='uploadOpts' ng-model='image'></div>

controller / js:
$scope.image ='';
//NOTE: the $scope.$on evt is optional since using ngModel will automatically update this $scope value accordingly
var evtImageUpload ='TestCtrlImageUpload';
$scope.uploadOpts =
{
	//'type':'byUrl',
	'uploadPath':'/imageUpload',
	'uploadDirectory':'/uploads',
	'serverParamNames': {
		'file': 'myFile'
	},
	'uploadCropPath':'/imageCrop',
	// 'callbackInfo':{'evtName':evtImageUpload, 'args':[{'var1':'yes'}]},
	'imageServerKeys':{'imgFileName':'result.fileNameSave', 'picHeight':'picHeight', 'picWidth':'picWidth', 'imgFileNameCrop':'result.newFileName'},		//hardcoded must match: server return data keys
	//'htmlDisplay':"<div class='ig-form-pic-upload'><div class='ig-form-pic-upload-button'>Select Photo</div></div>",
	'cropOptions': {'crop':true}
};

//OPTIONAL
$scope.$on(evtImageUpload, function(evt, args) {
	//do extra post upload handling here..
	//$scope.formVals.image =args[1].imgFileName;
});


BACKEND (required to actually accept the file - note it's just like a standard input type='file' upload - the file data will be POSTed to the backend along with some other parameters. You basically need to do the following:
1. copy the uploaded file (to a final location)
	1. this may require creating a new directory for the image(s) if the directory doesn't already exist. Also choosing a file name for the new image if you don't want to use the existing name of the uploaded image.
2. pass back the name of the file as a key defined in $scope.opts.imageServerKeys.imgFileName

node.js example (though works with ANY backend / language - adapt to whatever you're using)
var im = require('imagemagick');

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

//end: usage
*/

'use strict';

angular.module('jackrabbitsgroup.angular-image-upload', []).directive('jrgImageUpload', ['jrgImageUploadData', '$timeout', 'jrgArray',
function (jrgImageUploadData, $timeout, jrgArray) {
	
	return {
		restrict: 'A',
		scope: {
			opts:'=',
			ngModel:'='
		},

		replace: true,
		template: function(element, attrs) {
			var xx;
			var defaults ={'type':'dragNDrop', 'useUploadButton':'0', 'classes':{'dragText':'jrg-image-upload-drag-text', 'orText':'jrg-image-upload-or-text', 'uploadText':'jrg-image-upload-upload-text', 'browseInput':'jrg-image-upload-browse-input', 'browseButton':'jrg-image-upload-browse-button', 'uploadButton':'jrg-image-upload-upload-button'}, 'htmlUploading':'', 'showProgress':true,
				cropAspectRatio: 1
			};
			if(attrs.htmlUploading !==undefined) {
				defaults.showProgress =false;
			}

			for(xx in defaults) {
				if(attrs[xx] ===undefined) {
					if(typeof(defaults[xx]) =='object') {		//don't extend objects - will do that after this
						attrs[xx] ={};
					}
					else {
						attrs[xx] =defaults[xx];
					}
				}
			}
			for(xx in defaults.classes) {
				if(attrs.classes[xx] ===undefined) {
					attrs.classes[xx] =defaults.classes[xx];
				}
			}
		
			//convert to int
			var attrsToInt =['useUploadButton'];
			for(var ii=0; ii<attrsToInt.length; ii++) {
				attrs[attrsToInt[ii]] =parseInt(attrs[attrsToInt[ii]], 10);
			}
			
			//NOTE: these will all be updated later in link function so it works with ng-repeat and these ids are all unique but need to set here too..
			if(attrs.id ===undefined) {
				attrs.id ="jrgImageUpload"+Math.random().toString(36).substring(7);
			}
			var id1 =attrs.id;
			var ids ={
				'input':{
					'fileFake':id1+"FileFake",
					'file':id1+"File",
					'byUrl':id1+"ByUrl"
				},
				'areaSelect':{
					instId: id1+"AreaSelect"
				}
			};
			attrs.ids =ids;		//save for later
			
			var fileTypeDisplay ="Image";
			var htmlDisplay, htmlUrlInstructions;
			if(attrs.htmlDisplay !==undefined)
			{
				htmlDisplay =attrs.htmlDisplay;
				htmlDisplay +="<input ng-model='fileFake' id='"+ids.input.fileFake+"' class='jrg-image-upload-id-filefake' type='hidden' disabled=disabled name='fakeupload' />";		//add in fake input to avoid errors when trying to fill it later
			}
			else
			{
				htmlDisplay ="<span class='"+attrs.classes.dragText+"'>Drag "+fileTypeDisplay+" Here</span><br />";
				htmlDisplay+="<span class='"+attrs.classes.orText+"'>--OR--</span><br />";
				htmlDisplay+="<span class='"+attrs.classes.uploadText+"'>Upload File:</span><br />";
				htmlDisplay+="<input ng-model='fileFake' id='"+ids.input.fileFake+"' type='text' disabled=disabled name='fakeupload' class='"+attrs.classes.browseInput+" jrg-image-upload-id-filefake' /><span class='"+attrs.classes.browseButton+"'>Browse</span>";
			}
			if(attrs.htmlUrlInstructions !==undefined)
			{
				htmlUrlInstructions =attrs.htmlUrlInstructions;
			}
			else
			{
				htmlUrlInstructions ="<span class='jrg-image-upload-by-url-instructions'>1. Right click an image on the web, 2. Choose \"Copy image URL\", 3. Paste it above!</span>";
			}
			
			//@todo - don't have access to cropOptions yet - in $scope..
			attrs.cropOptions ={
				'cropAspectRatio':attrs.cropAspectRatio
			};
			var widthAspectDummyPercent =Math.floor(100 / attrs.cropOptions.cropAspectRatio);
			widthAspectDummyPercent =0;		//@todo - this doesn't seem to be working otherwise..
			
			var ngShow ={
				'dragNDrop':false,
				'uploadButton':false
			};
			if(attrs.type =='dragNDrop') {
				ngShow.dragNDrop =true;
				if(!attrs.useUploadButton) {
					ngShow.uploadButton =false;
				}
			}
			
			var html ="";
			html+="<div class='jrg-image-upload-form-container'>";
			html+="<form class='jrg-image-upload-form' enctype='multipart/form-data' method='post' action='{{uploadPath}}'>";
			
			html+="<div class='jrg-image-upload-fake-input-container' ng-show='"+ngShow.dragNDrop+"'>";
			html+="<div class='jrg-image-upload-fake-input-container-inner' ng-show='!imgSrc'>";
				html+="<div class='jrg-image-upload-aspect-ratio-dummy' style='padding-top:"+widthAspectDummyPercent+"%;'></div>";
				html+="<div class='jrg-image-upload-aspect-ratio-element'>";
					html+=htmlDisplay;
				html+="</div>";		//end: jrg-image-upload-aspect-ratio-element
			html+="</div>";		//end: dragNDropContainerDisplay
			
			html+="<div class='jrg-image-upload-picture-container {{classes.pictureContainer}}' style='z-index:{{zIndex.cropPicture}};' ng-show='{{show.pictureContainer}}'>";
				html+="<div class='jrg-image-upload-aspect-ratio-dummy' style='padding-top:"+widthAspectDummyPercent+"%;'></div>";
				html+="<div class='jrg-image-upload-aspect-ratio-element'>";
					html+="<div class='jrg-image-upload-picture-container-img-outer'>";
						html+="<div jrg-area-select coords='areaSelectCoords' select-buffer='8' aspect-ratio='"+attrs.cropAspectRatio+"' opts='optsAreaSelect'>";
							html+="<img class='jrg-image-upload-picture-container-img' style='z-index:{{zIndex.img}};' ng-src='{{imgSrc}}' />";
							html+="<img class='jrg-image-upload-picture-container-img-crop' style='z-index:{{zIndex.imgCrop}};' ng-src='{{imgSrcCrop}}' />";
						html+="</div>";
					html+="</div>";
				html+="</div>";		//end: jrg-image-upload-aspect-ratio-element
			html+="</div>";		//end: picture container
			//html+="<input ng-model='file' type='file' name='"+ids.input.file+"' id='"+ids.input.file+"' class='jrg-image-upload-input jrg-image-upload-id-file' ng-change='fileSelected({})' />";		//ng-change apparently doesn't work..  have to use onchange instead.. https://groups.google.com/forum/?fromgroups=#!topic/angular/er8Yci9hAto
			// html+="<input ng-model='file' type='file' name='"+ids.input.file+"' id='"+ids.input.file+"' class='jrg-image-upload-input jrg-image-upload-id-file' onchange='angular.element(this).scope().fileSelected({})' />";		//no longer works in Angular 1.2.0, using jqLite listener in javascript
			html+="<input ng-model='file' type='file' name='"+ids.input.file+"' id='"+ids.input.file+"' class='jrg-image-upload-input jrg-image-upload-id-file' style='z-index:{{zIndex.inputUpload}};' />";
			// html+="<div class='jrg-image-upload-picture-container-below' ng-show='{{show.pictureContainerBelow}}'>";
			html+="<div class='jrg-image-upload-picture-container-below {{classes.pictureContainerBelow}}'>";
				html+="<div ng-show='opts.cropOptions.crop' class='jrg-image-upload-picture-crop-div {{classes.cropStartBtn}}'><span class='jrg-image-upload-picture-crop-button' ng-click='startCrop({})'>Crop Thumbnail</span></div>";
				html+="<div class='jrg-image-upload-picture-container-text {{classes.picInstructions}}'>Click or drag onto the picture to change images</div>";
				html+="<div class='jrg-image-upload-picture-container-text {{classes.cropBtns}}'>"+
					"<div class='jrg-image-upload-picture-crop-button' ng-click='cropCancel({})'>Cancel</div>"+
					"<div class='jrg-image-upload-picture-crop-button' ng-click='crop({})'>Crop</div>"+
				"</div>";
				html+="<div class='jrg-image-upload-picture-container-text {{classes.cropInstructions}}'>Click and drag on the picture to crop</div>";
			html+="</div>";
			html+="<div class='jrg-image-upload-picture-crop-container'>";
			html+="</div>";
			html+="</div>";		//end: dragNDropContainer
			
			//if(attrs.type !='dragNDrop') {
			if(1) {
				html+="<div class='jrg-image-upload-by-url-container' ng-hide='"+ngShow.dragNDrop+"'>";
				html+="<span class='jrg-image-upload-by-url-text'>Upload From Other Website</span><br /><br />";
				html+="<input ng-model='fileByUrl' id='"+attrs.ids.input.byUrl+"' type='text' class='jrg-image-upload-by-url-input jrg-image-upload-id-byurl' placeholder='Copy & Paste URL here' />";
				html+=htmlUrlInstructions;
				html+="</div>";		//end: byUrlContainer
			}
			
			html+="</form>";
			html+="<div class='jrg-image-upload-upload-upload-button-container' ng-show='"+ngShow.uploadButton+"'><span class='"+attrs.classes.uploadButton+"' ng-click='uploadFile({})'>Upload</span></div>";
			html+="<div class='jrg-image-upload-notify' ng-show='{{show.notify}}'>"+attrs.htmlUploading+"</div>";
			html+="<div class='jrg-image-upload-progress-bar {{classes.progress}}'><div class='jrg-image-upload-progress-bar-inner' style='{{styles.progress}}'>&nbsp;</div></div>";
			html+="<div>{{progressNumber}}</div>";
			html+="<div>{{fileInfo.name}}</div>";
			html+="<div>{{fileInfo.size}}</div>";
			html+="<div>{{fileInfo.type}}</div>";
			
			//TESTING
			// html+="show: {{show}}";
			// html+="imgSrc: {{imgSrc}}";
			// html+="imgSrcCrop: {{imgSrcCrop}}";
			// html+="opts: {{opts}}";
			// html+="classes: {{classes}}";
			//end: TESTING

			html+="</div>";		//end: form container
	
			return html;
		},
		
		link: function(scope, element, attrs) {
			//if was in an ng-repeat, they'll have have the same compile function so have to set/over-write the id here, NOT in the compile function (otherwise they'd all be the same..)
			var oldIds =jrgArray.copy(attrs.ids, {});		//save for updating later since .find isn't working with classes.. wtf?
			// if(attrs.id ===undefined) {
			if(1) {		//(re)set no matter what
				attrs.id ="jrgImageUpload"+Math.random().toString(36).substring(7);
			}
			var id1 =attrs.id;
			var ids ={
				'input':{
					'fileFake':id1+"FileFake",
					'file':id1+"File",
					'byUrl':id1+"ByUrl"
				},
				'areaSelect':{
					instId: id1+"AreaSelect"
				}
			};
			attrs.ids =ids;		//(re)save for later
			// scope.id =attrs.id;
			
			//update the OLD ids with the new ones
			//NOT working with classes...
			// element.find('input .jrg-image-upload-id-filefake').attr('id', attrs.ids.input.fileFake);
			// element.find('input .jrg-image-upload-id-file').attr('id', attrs.ids.input.file);
			// element.find('input .jrg-image-upload-id-file').attr('name', attrs.ids.input.file);		//file needs name attribute set too
			// element.find('input .jrg-image-upload-id-byurl').attr('id', attrs.ids.input.byUrl);
			var eles ={
				fileFake: angular.element(document.getElementById(oldIds.input.fileFake)),
				file: angular.element(document.getElementById(oldIds.input.file)),
				byUrl: angular.element(document.getElementById(oldIds.input.byUrl))
			};
			eles.fileFake.attr('id', attrs.ids.input.fileFake);
			eles.file.attr('id', attrs.ids.input.file);
			eles.file.attr('name', attrs.ids.input.file);		//file needs name attribute set too
			eles.byUrl.attr('id', attrs.ids.input.byUrl);
			
			scope.optsAreaSelect ={
				instId: attrs.ids.areaSelect.instId
			};
			
			angular.element(document.getElementById(attrs.ids.input.file)).on('change', function(evt) {
				scope.fileSelected({});
			});
		},
		
		controller: function($scope, $element, $attrs) {
			var defaults ={'cropOptions':jrgArray.copy(jrgImageUploadData.cropOptionsDefault, {}), 'serverParamNames':{'file':'file', 'byUrl':'fileData[fileUrl]'} };
			if($scope.opts ===undefined) {
				$scope.opts ={};
			}
			for(var xx in defaults) {
				if($scope.opts[xx] ===undefined) {
					if(typeof(defaults[xx]) =='object') {		//avoid backward over-writing later
						$scope.opts[xx] =jrgArray.copy(defaults[xx], {});
					}
					else {
						$scope.opts[xx] =defaults[xx];
					}
				}
				else {
					$scope.opts[xx] =angular.extend(defaults[xx], $scope.opts[xx]);
				}
			}
			/*
			attrs.serverParamNames =$.extend({}, defaults.serverParamNames, params.serverParamNames);
			if(params.cropOptions !==undefined) {
				params.cropOptions =$.extend({}, defaults.cropOptions, params.cropOptions);
			}
			*/
			
			$scope.opts.cropOptions.cropAspectRatio =$attrs.cropAspectRatio;		//copy onto scope since now passed in as an attr for use in jrg-area-select directive
			
			/**
			@property imgInfo Will hold information on the image (after it's uploaded)
			@type Object
				@param {String} imgSrc
				@param {Number} picHeight
				@param {Number} picWidth
				@param {String} imgSrcCrop
				@param {Number} picHeightCrop
				@param {Number} picWidthCrop
			*/
			var imgInfo ={
				haveCroppedFile: false
			};
				
			/**
			@toc 0.
			@method init
			*/
			function init(params) {
				$scope.areaSelectCoords ={};
				
				$scope.file ='';
				$scope.fileByUrl ='';
				$scope.imgSrc ='';
				$scope.imgSrcCrop ='';
				$scope.show ={
					'notify':false,
					// 'pictureContainer':false,
					'pictureContainer':true,		//can't dynamically change since doesn't show fast enough for image to be written/displayed properly
					'pictureContainerBelow':false
				};
				$scope.classes ={
					'pictureContainer':'',
					'pictureContainerBelow':'hidden',
					// 'inputUpload':'',
					// 'cropPicture':'',
					'cropStartBtn': '',
					'picInstructions': '',
					'cropBtns': 'hidden',
					'cropInstructions': 'hidden',
					'progress': ''		//will be changed to 'loading' or 'complete'
				};
				$scope.zIndex ={
					'inputUpload':2,
					'cropPicture':1,
					'img':2,
					'imgCrop':1
				};
				$scope.styles ={
					'progress': ''	//for setting width
				};
				
				imgInfo ={
					haveCroppedFile: false
				};
				
				//set initial value / image, if exists
				if($scope.ngModel && $scope.ngModel.length >0) {
					$scope.classes.pictureContainer ='';
					//form data to mimic what server would return so can use the same function
					var xx;
					var data1 ={};
					var serverVals1 ={};
					for(xx in $scope.opts.imageServerKeys) {
						if(xx =='imgFileName') {
							// data1[$scope.opts.imageServerKeys[xx]] =$scope.ngModel;
							serverVals1[xx] =$scope.ngModel;
						}
					}
					
					afterComplete({type:'regular', serverVals:serverVals1, fromInit:true}, data1);
					$timeout(function() {
						stopCropping({});
					}, 100);
				}
				else if($scope.ngModel ===undefined || $scope.ngModel.length <1) {
					clearImage({});
				}
			}
			
			/**
			@toc 0.5.
			@method $scope.$watch('ngModel',..
			*/
			$scope.$watch('ngModel', function(newVal, oldVal) {
				if(!angular.equals(oldVal, newVal)) {		//very important to do this for performance reasons since $watch runs all the time
					init({});
				}
			});
			
			/**
			@toc 0.6.
			@method clearImage
			*/
			function clearImage(params) {
				//doesn't actually blank out image..
				// $scope.imgSrc ='';
				// $scope.imgSrcCrop ='';
				// $scope.imgSrc =false;
				// $scope.imgSrcCrop =false;
				$scope.imgSrc =0;
				$scope.imgSrcCrop =0;
				$scope.classes.pictureContainer ='hidden';
			}
			
			/**
			@toc 1.
			@param params
				fileTypes =mixed: string of "image" OR 1D array [] of valid file types
			@return
				valid =boolean true if valid
				errorMsg =string of msg to display
			*/
			function checkFileType(fileName, params) {
				var returnArray ={'valid':true, 'errorMsg':''};
				var fileExtension =getFileExtension(fileName, params);
				if(params.fileTypes)
				{
					if(typeof(params.fileTypes) =='string')
					{
						if(params.fileTypes =='image')
						{
							params.fileTypes =['png', 'jpg', 'jpeg', 'bmp', 'gif'];
						}
						else
							params.fileTypes ='any';		//all will be valid
					}
					if(params.fileTypes !='any')
					{
						returnArray.valid =false;
						returnArray.errorMsg ="Allowed file types are: ";
						for(var ii=0; ii<params.fileTypes.length; ii++)
						{
							returnArray.errorMsg +=params.fileTypes[ii].toLowerCase();
							if(ii<(params.fileTypes.length-1))
								returnArray.errorMsg +=", ";
							if(params.fileTypes[ii].toLowerCase() ==fileExtension)
							{
								returnArray.valid =true;
								//break;		//don't break since want to complete error message
							}
						}
					}
				}
				return returnArray;
			}

			/**
			@toc 2.
			*/
			function getFileExtension(fileName, params)
			{
				var ext =fileName.slice((fileName.lastIndexOf(".")+1), fileName.length).toLowerCase();
				return ext;
			}
			
			/**
			@toc 3.
			*/
			$scope.fileSelected =function(params) {
				var file, retArray;
				if($attrs.type =='byUrl')
				{
					file =document.getElementById($attrs.ids.input.byUrl).value;
					//file =$scope.fileByUrl;		//not working?
					retArray =checkFileType(file, {'fileTypes':$scope.opts.fileTypes});
					if(!retArray.valid)		//invalid file type extension
					{
						document.getElementById($attrs.ids.input.byUrl).value ='';
						//$scope.fileByUrl ='';		//not working?
						alert(retArray.errorMsg);
					}
				}
				else		//drag n drop (regular file input)
				{
					file = document.getElementById($attrs.ids.input.file).files[0];
					//file = $scope.file;		//not working?
					if (file)
					{
						var fileSize = 0;
						if (file.size > 1024 * 1024) {
							fileSize = (Math.round(file.size * 100 / (1024 * 1024)) / 100).toString() + 'MB';
						}
						else {
							fileSize = (Math.round(file.size * 100 / 1024) / 100).toString() + 'KB';
						}
					}
					if(file)
					{
						retArray =checkFileType(file.name, {'fileTypes':$scope.opts.fileTypes});
						if(!retArray.valid)		//invalid file type extension
						{
							document.getElementById($attrs.ids.input.file).value ='';
							//$scope.file ='';		//not working?
							alert(retArray.errorMsg);
						}
						else		//update fake file input (match with actual file input)
						{
							document.getElementById($attrs.ids.input.fileFake).value =document.getElementById($attrs.ids.input.file).value;
							//$scope.fileFake =$scope.file;		//not working?
						}
					}
				}
	
				//if not using upload button, immediately upload as well
				if(!$attrs.useUploadButton && $attrs.type =='dragNDrop') {
					$scope.uploadFile(params);
				}
			};
			
			/**
			@toc 4.
			*/
			$scope.uploadFile =function(params) {
				var fileVal;
				if($attrs.htmlUploading) {
					$scope.show.notify =true;
				}
				if($attrs.fileUrl !==undefined) {
					fileVal =$attrs.fileUrl;
				}
				else if($attrs.type =='byUrl')
				{
					//LLoading.show({});
					fileVal =document.getElementById($attrs.ids.input.byUrl).value;
					//fileVal =$scope.fileByUrl;		//not working?
				}
				else {
					fileVal =document.getElementById($attrs.ids.input.file).value;
					//fileVal =$scope.file;		//not working?
				}
				//alert(fileVal);
				if(fileVal.length >0)
				{
					$scope.styles.progress ='width:0%;';
					if($attrs.showProgress) {
						$scope.classes.progress ='loading';
					}
					else {
						//LLoading.show({});		//todo
					}
					
					ajaxCall({type:'regular', paramsOrig:params, fileVal:fileVal});
				
				}		//end: if(fileVal.length >0)
			};
			
			/**
			@toc 5.
			*/
			function uploadProgress(evt) {
				if (evt.lengthComputable) {
					var percentComplete = Math.round(evt.loaded * 100 / evt.total);
					$scope.progressNumber =percentComplete.toString() + '%';
					$scope.styles.progress ='width:'+percentComplete.toString()+'%;';
				}
				else {
					$scope.progressNumber = 'unable to compute';
				}
			}
			
			/**
			@toc 6.
			@param params
				callback =array {'evtName':string, 'args':[]}
				uploadFileSimple =boolean true if no display
			*/
			function uploadComplete(evt, params) {
				/* This event is raised when the server send back a response */
				//alert(evt.target.responseText);
				
				$scope.styles.progress ='width:100%;';
				$scope.classes.progress ='loading complete';
				$scope.progressNumber ='';

				// var data =$.parseJSON(evt.target.responseText);
				var data =angular.fromJson(evt.target.responseText);
				//if(params.closeOnComplete)
					//DPopupObj.destroy({});
				afterComplete(params, data);
			}
			
			/**
			@toc 6.25.
			*/
			function ajaxUploadComplete(params, data) {
				if(typeof(data) =='string') {
					// data =$.parseJSON(data);
					data =angular.fromJson(data);
				}
				afterComplete(params, data);
			}
			
			/**
			@toc 6.5.
			@param {Object} params
				@param {String} [type] One of 'crop' or 'regular'
				@param {Object} [serverVals] The direct vals to use (i.e. when coming from init)
				// @param {Boolean} [fromInit] True when coming from init, in which case will use finalDirectory as prepended path if exists
			*/
			function afterComplete(params, data) {
				var xx;
				
				if(params.type ===undefined) {
					params.type ='regular';
				}
				if(params.type =='crop') {
					imgInfo.haveCroppedFile =true;
					$scope.zIndex.imgCrop =2;
					$scope.zIndex.img =1;
				}
				else {
					$scope.zIndex.imgCrop =1;
					$scope.zIndex.img =2;
				}
				
				$scope.classes.pictureContainer ='';		//show
				
				//form server vals from imageServerKeys (in case any dot notation / nested keys)
				var serverVals ={};
				for(xx in $scope.opts.imageServerKeys) {
					if(params.serverVals !==undefined && params.serverVals[xx] !==undefined) {
						serverVals[xx] =params.serverVals[xx];
					}
					else if($scope.opts.imageServerKeys[xx].indexOf('.') >-1) {		//if dot notation
						serverVals[xx] =jrgImageUploadData.evalArray(data, $scope.opts.imageServerKeys[xx], {});
					}
					else {
						serverVals[xx] =data[$scope.opts.imageServerKeys[xx]];
					}
				}
					
				//if(params.imageServerKeys !==undefined) {
				if(1) {
	
					//show uploaded image
					// $scope.show.pictureContainer =true;		//too late to change here.. doesn't work (image doesn't display)
					// $scope.show.pictureContainerBelow =true;		//not working...
					$scope.classes.pictureContainerBelow ='';
					
					if(params.type =='regular') {
						//thisObj.saveInstanceData(params.instanceId, data, params);
						if(serverVals.imgFilePath !==undefined) {
							imgInfo.imgSrc =serverVals.imgFilePath;
							//thisObj.curData[params.instanceId][params.imageServerKeys.imgFilePath] =imgInfo.imgSrc;
						}
						else if(serverVals.imgFileName !==undefined) {
							// if(params.fromInit && $scope.opts.finalDirectory) {
							if(0) {
								imgInfo.imgSrc =$scope.opts.finalDirectory+"/"+serverVals.imgFileName;
							}
							else {
								imgInfo.imgSrc =$scope.opts.uploadDirectory+"/"+serverVals.imgFileName;
							}
							//thisObj.curData[params.instanceId][params.imageServerKeys.imgFileName] =data[params.imageServerKeys.imgFileName];
						}
						//console.log("afterComplete: "+imgInfo.imgSrc);
						if(serverVals.picHeight !==undefined) {
							imgInfo.picHeight =serverVals.picHeight;
						}
						if(serverVals.picWidth !==undefined) {
							imgInfo.picWidth =serverVals.picWidth;
						}
						//thisObj.curData[params.instanceId][params.imageServerKeys.picHeight] =imgInfo.picHeight;
						//thisObj.curData[params.instanceId][params.imageServerKeys.picWidth] =imgInfo.picWidth;
						imgInfo.imgSrcCrop =imgInfo.imgSrc;
						imgInfo.picHeightCrop =imgInfo.picHeight;
						imgInfo.picWidthCrop =imgInfo.picWidth;
						if(imgInfo.picHeight ===undefined || !imgInfo.picHeight) {
							imgInfo.picHeight =imgInfo.picHeightCrop;
						}
						if(imgInfo.picWidth ===undefined || !imgInfo.picWidth) {
							imgInfo.picWidth =imgInfo.picWidthCrop;
						}
					}
					if($scope.opts.cropOptions.crop && imgInfo.haveCroppedFile) {		//only try to show cropped version if already have it
						var index1 =imgInfo.imgSrc.lastIndexOf('.');
						imgInfo.imgSrcCrop =imgInfo.imgSrc.slice(0, index1)+$scope.opts.cropOptions.cropDuplicateSuffix+imgInfo.imgSrc.slice(index1, imgInfo.imgSrc.length);
						// imgInfo.picWidthCrop =$scope.opts.cropOptions.cropMaxWidth;		//CURRENTLY NOT SUPPORTED
						// imgInfo.picHeightCrop =$scope.opts.cropOptions.cropMaxHeight;	//CURRENTLY NOT SUPPORTED
					}
					
					$scope.imgSrc =imgInfo.imgSrc;		//just in case doesn't work below (sometimes doesn't show up the first time otherwise)
					$scope.imgSrcCrop =imgInfo.imgSrcCrop+'?'+Math.random().toString(36).substring(7);		//ensure reloads
					var img = new Image();
					img.onload = function() {
						$scope.imgSrc =img.src;
						params.imgInfo =imgInfo;		//for passing through
						imgInfo.picHeightCrop =img.height;
						imgInfo.picWidthCrop =img.width;
						
						if(imgInfo.picHeight ===undefined || !imgInfo.picHeight) {
							imgInfo.picHeight =imgInfo.picHeightCrop;
						}
						if(imgInfo.picWidth ===undefined || !imgInfo.picWidth) {
							imgInfo.picWidth =imgInfo.picWidthCrop;
						}
					
						/*
						//@todo??
						thisObj.fixImageSizing({'divId':params.instanceId, 'id':params.ids.pictureContainerImgOuter, 'imgInfo':{'height':imgInfo.picHeightCrop, 'width':imgInfo.picWidthCrop} }, thisObj.afterCompleteResizing, [params, data]);
						//call again after timeout just in case since sadly the above doesn't work... - //to do - fix so it ALWAYS works and doesn't use a timeout (or continues to loop until it's non-zero width?? / the image is displayed??)
						setTimeout(function() {
							thisObj.fixImageSizing({'divId':params.instanceId, 'id':params.ids.pictureContainerImgOuter, 'imgInfo':{'height':imgInfo.picHeightCrop, 'width':imgInfo.picWidthCrop} }, thisObj.afterCompleteResizing, [params, data]);
						}, 1000);
						*/
					};
					//img.src =imgInfo.imgSrcCrop+'?'+LString.random(8,{});		//ensure new image shows up
					img.src =imgInfo.imgSrc;
					/*
					//@todo
					if(img.height ==0) {		//invalid url; try uploads path
						//update BOTH (regular and crop) paths to upload
						if($scope.opts.cropOptions.crop) {
							imgInfo.imgSrc =$scope.opts.uploadDirectory+serverVals.imgFileName;
							imgInfo.imgSrcCrop =$scope.opts.uploadDirectory+LString.addFileSuffix(serverVals.imgFileName, $scope.opts.cropOptions.cropDuplicateSuffix, {});
							var imgPath1 =imgInfo.imgSrcCrop+'?'+LString.random(8,{});
						}
						else {
							imgInfo.imgSrc =$scope.opts.uploadDirectory+serverVals.imgFileName;
							imgInfo.imgSrcCrop =$scope.opts.uploadDirectory+serverVals.imgFileName;
							var imgPath1 =imgInfo.imgSrcCrop+'?'+LString.random(8,{});
						}
						img.src =imgPath1;
					}
					*/
				}
				
				if(serverVals.imgFileName !==undefined && $scope.ngModel !==serverVals.imgFileName) {
					$scope.ngModel =serverVals.imgFileName;		//set ngModel
				}
				
				if($scope.opts.callbackInfo && ($scope.opts.callbackInfo ===undefined || !params.noCallback))
				{
					var args =$scope.opts.callbackInfo.args;
					args =args.concat(data);
					//$scope.$broadcast($scope.opts.callbackInfo.evtName, args);
					$scope.$emit($scope.opts.callbackInfo.evtName, args);
				}
				//LLoading.close({});
				$scope.show.notify =false;
				
				//ensure back in angular world so events fire now
				if(!$scope.$$phase && !$scope.$root.$$phase) {
					$scope.$apply();
				}
			}
			
			/**
			@toc 7.
			*/
			function uploadFailed(evt) {
				alert("There was an error attempting to upload the file. Please try again or try a different file.");
				//LLoading.close({});
			}

			/**
			@toc 8.
			*/
			function uploadCanceled(evt) {
				alert("The upload has been canceled by the user or the browser dropped the connection.");
				//LLoading.close({});
			}
			
			/**
			@toc 9.
			@method $scope.startCrop
			*/
			$scope.startCrop =function(params) {
				startCropping({});
				
				/*
				//UPDATE: don't need to since area-select directive gives us both the width of the element and the cropped section so can figure out scale from that
				//figure out aspect ratio & scale for cropping
				var displayWidth =document.getElementById($attrs.ids.img).offset.width;
				if(imgInfo.picWidth >displayWidth) {
					imgInfo.scale =displayWidth /imgInfo.picWidth;
				}
				else {
					imgInfo.scale =1;
				}
				console.log('displayWidth: '+displayWidth+' scale: '+imgInfo.scale);		//TESTING
				*/
			
				//re-init area select
				$scope.$broadcast('jrgAreaSelectReInit', {instId:$attrs.ids.areaSelect.instId});
			};
			
			/**
			@toc 10.
			@method $scope.cropCancel
			*/
			$scope.cropCancel =function(params) {
				stopCropping({});
			};
			
			/**
			@toc 11.
			@method $scope.crop
			*/
			$scope.crop =function(params) {
				var cropCoords ={}, scale =1, fullCoords ={};
				//adjust for scale
				// console.log('imgInfo.picWidth: '+imgInfo.picWidth+' $scope.areaSelectCoords.ele.width: '+$scope.areaSelectCoords.ele.width);		//TESTING
				// console.log('imgInfo.picHeight: '+imgInfo.picHeight+' $scope.areaSelectCoords.ele.height: '+$scope.areaSelectCoords.ele.height);		//TESTING
				if(imgInfo.picWidth >$scope.areaSelectCoords.ele.width) {
					scale =$scope.areaSelectCoords.ele.width / imgInfo.picWidth;
				}
				else if(imgInfo.picHeight >$scope.areaSelectCoords.ele.height) {
					scale =$scope.areaSelectCoords.ele.height /imgInfo.picHeight;
				}
		
				if(scale >1) {
					cropCoords.left =$scope.areaSelectCoords.select.left *scale;
					cropCoords.top =$scope.areaSelectCoords.select.top *scale;
					cropCoords.right =$scope.areaSelectCoords.select.right *scale;
					cropCoords.bottom =$scope.areaSelectCoords.select.bottom *scale;
					
					fullCoords.left =$scope.areaSelectCoords.ele.left *scale;
					fullCoords.top =$scope.areaSelectCoords.ele.top *scale;
					fullCoords.right =$scope.areaSelectCoords.ele.right *scale;
					fullCoords.bottom =$scope.areaSelectCoords.ele.bottom *scale;
				}
				else {
					cropCoords.left =$scope.areaSelectCoords.select.left /scale;
					cropCoords.top =$scope.areaSelectCoords.select.top /scale;
					cropCoords.right =$scope.areaSelectCoords.select.right /scale;
					cropCoords.bottom =$scope.areaSelectCoords.select.bottom /scale;
					
					fullCoords.left =$scope.areaSelectCoords.ele.left /scale;
					fullCoords.top =$scope.areaSelectCoords.ele.top /scale;
					fullCoords.right =$scope.areaSelectCoords.ele.right /scale;
					fullCoords.bottom =$scope.areaSelectCoords.ele.bottom /scale;
				}
				
				// console.log('scale: '+scale+' cropCoords: '+JSON.stringify(cropCoords));		//TESTING
				// console.log('fullCoords: '+JSON.stringify(fullCoords));		//TESTING
				// console.log('imgInfo: '+JSON.stringify(imgInfo));		//TESTING
				
				//make backend AJAX call
				ajaxCall({type:'crop', cropCoords:cropCoords, fullCoords:fullCoords});
				
				stopCropping({});
			};
			
			/**
			@toc 12.
			@method startCropping
			*/
			function startCropping(params) {
				$scope.zIndex.imgCrop =1;
				$scope.zIndex.img =2;
					
				$scope.zIndex.inputUpload =1;
				$scope.zIndex.cropPicture =2;
				$scope.classes.cropBtns ='';
				$scope.classes.cropInstructions ='';
				$scope.classes.cropStartBtn ='hidden';
				$scope.classes.picInstructions ='hidden';
			}
			
			/**
			@toc 12.5.
			@method stopCropping
			*/
			function stopCropping(params) {
				$scope.zIndex.inputUpload =2;
				$scope.zIndex.cropPicture =1;
				$scope.classes.cropBtns ='hidden';
				$scope.classes.cropInstructions ='hidden';
				$scope.classes.cropStartBtn ='';
				$scope.classes.picInstructions ='';
				
				//hide area select
				$scope.$broadcast('jrgAreaSelectHide', {instId:$attrs.ids.areaSelect.instId});
			}
			
			/**
			@toc 13.
			@method ajaxCall
			@param {Object} params
				@param {String} type One of 'crop' or 'regular'
				@param {Object} [paramsOrig] The original params (to pass through on ajax complete / status calls)
				@param {String} [fileVal] Required for 'regular' type if byUrl
				@param {Object} [cropCoords] Required for 'crop' type
					@param {String} left
					@param {String} top
					@param {String} right
					@param {String} bottom
				@param {Object} [fullCoords] Required for 'crop' type
					@param {String} left
					@param {String} top
					@param {String} right
					@param {String} bottom
			*/
			function ajaxCall(params) {
				var xx;
				
				if(params.paramsOrig ===undefined) {
					params.paramsOrig ={};
				}
				params.paramsOrig.type =params.type;		//add in
				
				var fd = new FormData();
				//add custom data, if exists
				if(params.type =='regular' && $scope.opts.postData !==undefined) {
					fd.append('postData', $scope.opts.postData);
				}
				if(params.type =='crop' && $scope.opts.postDataCrop !==undefined) {
					fd.append('postDataCrop', $scope.opts.postDataCrop);
				}
				
				if(params.type =='regular') {
					if($attrs.type =='byUrl') {
						fd.append($scope.opts.serverParamNames.byUrl, params.fileVal);
					}
					else {
						fd.append($scope.opts.serverParamNames.file, document.getElementById($attrs.ids.input.file).files[0]);
						//fd.append($scope.opts.serverParamNames.file, $scope.file);		//not working?
					}
				}
				if(params.type =='crop') {
					fd.append('fileName', imgInfo.imgSrc);
				}
				
				fd.append('fileData[uploadDir]', $scope.opts.uploadDirectory);
				if($scope.opts.cropOptions !==undefined) {
					for(xx in $scope.opts.cropOptions) {
						fd.append('cropOptions['+xx+']', $scope.opts.cropOptions[xx]);
					}
				}
				
				if(params.cropCoords !==undefined) {
					for(xx in params.cropCoords) {
						fd.append('cropCoords['+xx+']', params.cropCoords[xx]);
					}
				}
				if(params.fullCoords !==undefined) {
					for(xx in params.fullCoords) {
						fd.append('fullCoords['+xx+']', params.fullCoords[xx]);
					}
				}
				var sendInfo =fd;
				
				var xhr = new XMLHttpRequest();
				if(params.type =='regular' && $attrs.showProgress) {
					xhr.upload.addEventListener("progress", uploadProgress, false);
				}
				xhr.onload =function(ee){uploadComplete(ee, params.paramsOrig); };
				//xhr.addEventListener("load", uploadComplete, false);
				xhr.onerror =function(ee){uploadFailed(ee, params.paramsOrig); };		//doesn't seem to work..
				//xhr.addEventListener("error", uploadFailed, false);		//doesn't seem to work..
				xhr.addEventListener("abort", uploadCanceled, false);
				if(params.type =='regular') {
					xhr.open("POST", $scope.opts.uploadPath);
				}
				else if(params.type =='crop') {
					xhr.open("POST", $scope.opts.uploadCropPath);
				}
				xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
				xhr.onreadystatechange =function(){
					if(xhr.readyState ==4 && xhr.status !=200)
					{
						uploadFailed('', params.paramsOrig);
					}
				};
				xhr.send(sendInfo);
			}
			
			init({});		//init (called once when directive first loads)
		}
	};
}])
.factory('jrgImageUploadData', [ function () {
var inst ={
	cropOptionsDefault: {'crop':true, 'cropAspectRatio':1, 'cropMinHeight':100, 'cropMinWidth':100, 'cropMaxHeight':300, 'cropMaxWidth':300, 'cropDuplicateSuffix':"_crop"},		//'cropAspectRatio' =integer (1 = square, 2 = twice as wide as tall, .5 =twice as tall as wide)
	cropCoords: {'left':0, 'right':0, 'top':0, 'bottom':0},		//will hold 1D associative array of left, right, top, bottom
	cropCurrentImageSrc: "",
	cropInfoEdit: {'JcropApi':false, 'cropping':false},
	curData: {},		//will hold info such as the current file path; one per instance id
	
	/**
	Returns the value of an array/object given the keys
	@toc
	@method evalArray
	@param {Array|Object} base The base object or array to read from
	@param {Array|String} keys Keys (in order) OR dot notation (i.e. 'p1.p2'). Numbers map to arrays and strings map to objects. Can mix and match numbers and strings for arrays inside objects and vice versa.
	@param {Object} params
	@return {Mixed} The value
	@usage
	var base ={
		key1: [
			{
				key3: 'the value!'
			}
		]
	};
	evalArray(base, ['key1', 0, 'key3'], {});
	*/
	evalArray: function(base, keys, params) {
		if(typeof(keys) =='string') {
			keys =keys.split('.');
		}
		//first make a copy since we'll be altering keys and do NOT want these changes to leak outside the function!
		var keysCopy =angular.copy(keys);
		
		//simpler and infinitely nested version from: http://stackoverflow.com/questions/8051975/access-object-child-properties-using-a-dot-notation-string
		while(keysCopy.length && (base = base[keysCopy.shift()]));
		return base;
	}
};
return inst;
}])
;