var gulp = require('gulp');
var uglify = require('gulp-uglify');
var del = require('del');
var sourcemaps = require('gulp-sourcemaps');
var concat = require('gulp-concat');
var addsrc = require('gulp-add-src');

var config = {
	js: [
		'client/js/canvas/input.js',
		'client/js/canvas/util.js',
		'client/js/functions.js',
		'client/js/canvas/tools/tools.js',
		'client/js/canvas/tools/brush.js',
		'client/js/canvas/tools/text-tool.js',
		'client/js/canvas/tools/shape-tool.js',
		'client/js/canvas/tools/dropper.js',
		'client/js/canvas/global.js',
		'client/js/canvas/fill-bucket.js',
		'client/js/canvas/colour-picker.js',
		'client/js/canvas/tabs.js'
	],
	css: [
		'client/css/**/.css'
	],

	tasks: {
		default: ['clean', 'canvasjs', 'functionsjs', 'chartjs'],
		dev: ['clean', 'dev-canvas', 'dev-functions', 'chartjs']
	}
}

gulp.task('canvasjs', function() {
	return gulp.src(config.js)
		.pipe(sourcemaps.init())
		.pipe(uglify())
		.pipe(concat('dn.min.js'))
		.pipe(sourcemaps.write())
		.pipe(gulp.dest('client/js'));
});

gulp.task('functionsjs', function() {
	return gulp.src(['client/js/functions.js'])
		.pipe(sourcemaps.init())
		.pipe(uglify())
		.pipe(concat('functions.min.js'))
		.pipe(sourcemaps.write())
		.pipe(gulp.dest('client/js'));
});

gulp.task('clean', function(){
	return del(['client/js/dn.min.js', 'client/js/functions.min.js']);
});

gulp.task('dev-canvas', ['clean'], function(){
	return gulp.src(config.js)
	.pipe(sourcemaps.init())
	.pipe(concat('dn.min.js'))
	.pipe(sourcemaps.write())
	.pipe(gulp.dest('client/js'));
});

gulp.task('dev-functions', ['clean'], function(){
	return gulp.src('client/js/functions.js')
	.pipe(sourcemaps.init())
	.pipe(concat('functions.min.js'))
	.pipe(sourcemaps.write())
	.pipe(gulp.dest('client/js'));
});

gulp.task('chartjs', function() {
	return addsrc('node_modules/chart.js/Chart.min.js')
	.pipe(gulp.dest('client/js'));
});

gulp.task('default', config.tasks.default);
gulp.task('dev', config.tasks.dev);
