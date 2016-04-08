var gulp = require('gulp');
var closureCompiler = require('gulp-closure-compiler');
var del = require('del');
var sourcemaps = require('gulp-sourcemaps');
var concat = require('gulp-concat');
var addsrc = require('gulp-add-src');
var uglify = require('gulp-uglify');

var config = {
	js: [
		'public/js/canvas/input.js',
		'public/js/canvas/util.js',
		'public/js/functions.js',
		'public/js/canvas/tools/tools.js',
		'public/js/canvas/tools/brush.js',
		'public/js/canvas/tools/text-tool.js',
		'public/js/canvas/tools/shape-tool.js',
		'public/js/canvas/tools/dropper.js',
		'public/js/canvas/global.js',
		'public/js/canvas/fill-bucket.js',
		'public/js/canvas/colour-picker.js',
		'public/js/canvas/tabs.js',
		'public/js/closure/exports.js',
		'public/js/closure/functions-exports.js'
	],
	css: [
		'public/css/**/.css'
	],

	tasks: {
		default: ['clean', 'canvasjs', 'functionsjs', 'chartjs'],
		dev: ['clean', 'dev-canvas', 'dev-functions', 'chartjs']
	}
}

gulp.task('canvasjs', function() {
	return gulp.src(config.js)
		.pipe(uglify())
		.pipe(concat('dn.min.js'))
/*		.pipe(closureCompiler({
			compilerPath: 'node_modules/google-closure-compiler/compiler.jar',
			compilerFlags: {
				compilation_level: 'ADVANCED_OPTIMIZATIONS',
				externs: [
					'public/js/closure/socket.io-externs.js'
				],
				warning_level: 'QUIET',
			},
			fileName: 'dn.min.js',
		}))*/
		.pipe(gulp.dest('public/js'));
});

gulp.task('functionsjs', function() {
	return gulp.src(['public/js/functions.js'])
		.pipe(closureCompiler({
			compilerPath: 'node_modules/google-closure-compiler/compiler.jar',
			compilerFlags: {
				warning_level: 'QUIET',
			},
			fileName: 'functions.min.js',
		}))
		.pipe(gulp.dest('public/js'));
});

gulp.task('clean', function(){
	return del(['public/js/dn.min.js', 'public/js/functions.min.js']);
});

gulp.task('dev-canvas', ['clean'], function(){
	return gulp.src(config.js)
	.pipe(sourcemaps.init())
	.pipe(concat('dn.min.js'))
	.pipe(sourcemaps.write())
	.pipe(gulp.dest('public/js'));
});

gulp.task('dev-functions', ['clean'], function(){
	return gulp.src('public/js/functions.js')
	.pipe(sourcemaps.init())
	.pipe(concat('functions.min.js'))
	.pipe(sourcemaps.write())
	.pipe(gulp.dest('public/js'));
});

gulp.task('chartjs', function() {
	return addsrc('node_modules/chart.js/Chart.min.js')
	.pipe(gulp.dest('public/js'));
});

gulp.task('default', config.tasks.default);
gulp.task('dev', config.tasks.dev);
