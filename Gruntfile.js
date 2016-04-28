module.exports = function(grunt) {

  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),
    manifest: grunt.file.readJSON('manifest.json'),
    crx: {
      staging: {
        "src": [
          "./",
          "!node_modules",
          "!.{git,svn}",
          "!*.pem"
        ],
        "dest": "dist/staging/src/<%= pkg.name %>-<%= manifest.version %>-dev.crx",
        "options": {
          "baseURL": "http://my.app.intranet/files/",
          "filename": "",
          //"privateKey": "dist/key.pem",
          "maxBuffer": 3000 * 1024 //build extension with a weight up to 3MB
        }
      },
      production: {
        "src": [
          "src/**/*",
          "!.{git,svn}",
          "!*.pem",
          "!dev/**"
        ],
        "dest": "dist/production/src/<%= pkg.name %>-<%= manifest.version %>-dev.crx",
        "zipDest": "dist/production/src/<%= pkg.name %>-<%= manifest.version %>-dev.zip",
        "options": {
          "baseURL": "http://my.app.net/files/",
          "maxBuffer": 3000 * 1024 //build extension with a weight up to 3MB
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-crx');

  grunt.registerTask('default', ['crx']);

};
