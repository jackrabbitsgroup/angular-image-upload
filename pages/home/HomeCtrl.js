/**
*/

'use strict';

angular.module('myApp').controller('HomeCtrl', ['$scope', function($scope) {
	// $scope.image ='';
	// $scope.image ='uploads/1110137034728.jpg';
	$scope.image ='1110137034728.jpg';
	
	//NOTE: the $scope.$on evt is optional since using ngModel will automatically update this $scope value accordingly
	// var evtImageUpload ='HomeCtrlImageUpload';
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
		'imageServerKeys':{'imgFileName':'fileNameSave', 'picHeight':'picHeight', 'picWidth':'picWidth', 'imgFileNameCrop':'newFileName'},		//hardcoded must match: server return data keys
		//'htmlDisplay':"<div class='ig-form-pic-upload'><div class='ig-form-pic-upload-button'>Select Photo</div></div>",
		// 'cropOptions': {'cropMaxHeight':500, 'cropMaxWidth':500}
		'cropOptions': {crop: true}
		// 'cropOptions': {crop: false}
		//'values':{'dirPath':'/uploads'}
	};
	
	$scope.clearImage =function(params) {
		$scope.image ='';
	};
}]);