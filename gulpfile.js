var gulp = require('gulp');
var closureCompiler = require('gulp-closure-compiler');

gulp.task('canvasjs', function() {
	return gulp.src([
		'public/js/functions.js',
		'public/js/gl-matrix.js',
		'public/js/canvas/shaders.js',
		'public/js/canvas/room.js',
		'public/js/canvas/tools/tools.js',
		'public/js/canvas/tools/brush.js',
		'public/js/canvas/tools/text-tool.js',
		'public/js/canvas/tools/shape-tool.js',
		'public/js/canvas/global.js',
		'public/js/canvas/fill-bucket.js',
		'public/js/canvas/colour-picker.js',
		'public/js/canvas/tabs.js',
		'public/js/closure/exports.js',
		'public/js/closure/functions-exports.js'])
		.pipe(closureCompiler({
			compilerPath: 'node_modules/google-closure-compiler/compiler.jar',
			compilerFlags: {
				compilation_level: 'ADVANCED_OPTIMIZATIONS',
				externs: [
					'public/js/closure/socket.io-externs.js'
				],
				warning_level: 'QUIET',
			},
			fileName: 'dn.min.js',
		}))
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

gulp.task('default', ['canvasjs','functionsjs']);
