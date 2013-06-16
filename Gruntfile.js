/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    requirejs: {
      compile: {
        options: {
          almond: true,
          wrap: true,
          baseUrl:'js',
          name: '../components/almond/almond',
          include: ['app'],
          out: "optimized.js",
          optimize: 'none',
          paths: {
            "jquery": "../components/jquery/jquery",
            "Bacon": "../components/baconjs/dist/Bacon",
            "lodash": "../components/lodash/lodash",
            "html": "../html"
          }
        }
      }
    },
    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        unused: true,
        boss: true,
        eqnull: true,
        browser: true,
        globals: {
          jQuery: true
        }
      },
      gruntfile: {
        src: 'Gruntfile.js'
      }
    },
    watch: {
      gruntfile: {
        files: ['js/*.js', 'html/*.html'],
        tasks: ['requirejs']
      }
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-requirejs');

  // Default task.
  grunt.registerTask('default', ['jshint']);

};
