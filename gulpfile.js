const gulp = require('gulp');

// task: build-full
gulp.task('build-full', (done) => {
    require('./build/tasks/build.js').build(done, true);
});

// task: build
gulp.task('build', (done) => {
    require('./build/tasks/build.js').build(done);
});

// task: test
gulp.task('test', (done) => {
    require('./build/tasks/test.js').test(done);
});

// task: package
gulp.task('package', (done) => {
    require('./build/tasks/package.js').pack(done);
});

// task: release
gulp.task('release', ['build-full', 'test', 'package'], () => {
});
