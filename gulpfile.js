const gulp = require('gulp')
const path = require('path')

const rootFolder = path.join(__dirname)
const templates = 'templates'
const templatesDir = path.join(rootFolder, templates)
const distFolder = path.join(rootFolder, 'dist')

gulp.task("templates", function() {
    return gulp.src([`${templatesDir}/**/*`, `${templatesDir}/**/.*`])
    .pipe(gulp.dest(path.join(distFolder, templates)))
})

gulp.task('default', ['templates'])