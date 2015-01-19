var gulp = require('gulp');
var tsc = require('gulp-tsc');

gulp.task('default', ['ts']);

gulp.task('ts', function () {
  return gulp.src('src/**/*.ts')
    .pipe(tsc({
      module: 'commonjs',
      target: 'ES5',
      sourcemap: true,
      declaration: true
    }))
    .pipe(gulp.dest('src'));
});

gulp.task('watch', function () {
  gulp.watch('src/**/*.ts', ['ts']);
});
