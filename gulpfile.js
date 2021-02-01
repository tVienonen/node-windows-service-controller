const gulp = require('gulp'),
    mocha = require('gulp-mocha');

function test() {
    return gulp.src('test/unit/*.js', { read: false })
        .pipe(mocha({ reporter: 'spec' }));
}

function acceptance() {
    return gulp.src('test/acceptance/*.js', { read: false })
        .pipe(mocha({ reporter: 'spec' }));
};

exports.test = test;
exports.acceptance = acceptance; 
exports.default = test;