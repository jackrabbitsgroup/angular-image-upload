# AngularJS image upload directive

Image upload directive with a custom display, progress bar, and displaying of image.
Coming soon: cropping functionality.

## Demo
http://jackrabbitsgroup.github.io/angular-image-upload/

## Dependencies
- required
	- angular-array
- optional
	- angular-area-select (required for crop support)
	- ImageMagick (npm plugin and actually installing ImageMagick - required for node backend cropping functionality - though you can substitute this for any backend crop plugin/library/code)

See `bower.json` and `index.html` in the `gh-pages` branch for a full list / more details

## Install
1. download the files
	1. Bower
		1. add `"angular-image-upload": "latest"` to your `bower.json` file then run `bower install` OR run `bower install angular-image-upload`
2. include the files in your app
	1. `image-upload.min.js`
	2. `image-upload.less` OR `image-upload.min.css` OR `image-upload.css`
3. include the module in angular (i.e. in `app.js`) - `jackrabbitsgroup.angular-image-upload`

See the `gh-pages` branch, files `bower.json` and `index.html` for a full example.


## Documentation
See the `image-upload.js` file top comments for usage examples and documentation
https://github.com/jackrabbitsgroup/angular-image-upload/blob/master/image-upload.js

See the `backendExamples` folder on the `gh-pages` branch for examples of backend code to handle the image upload


## Development

1. `git checkout gh-pages`
	1. run `npm install && bower install`
	2. write your code then run `grunt`
	3. git commit your changes
2. copy over core files (.js and .css/.less for directives) to master branch
	1. `git checkout master`
	2. `git checkout gh-pages image-upload.js image-upload.min.js image-upload.less image-upload.css image-upload.min.css`
3. update README, CHANGELOG, bower.json, and do any other final polishing to prepare for publishing
	1. git commit changes
	2. git tag with the version number, i.e. `git tag v1.0.0`
4. create github repo and push
	1. [if remote does not already exist or is incorrect] `git remote add origin [github url]`
	2. `git push origin master --tags` (want to push master branch first so it is the default on github)
	3. `git checkout gh-pages`
	4. `git push origin gh-pages`
5. (optional) register bower component
	1. `bower register angular-image-upload [git repo url]`
	