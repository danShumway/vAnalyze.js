module.exports = function(grunt) {

    // 1. All configuration goes here
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        concat: {
            dist: {
                src: [
                    //Intro
                    'develop/setup.js',
                    'develop/infect.js',
                    //Main
                    'develop/base/**/*.js',
                    'develop/wares/**/*.js'
                    //Outro
                ],
                dest: 'dist/vAnalyze.js'
            }
        },

        uglify: {
            build: {
                src: 'dist/vAnalyze.js',
                dest: 'dist/vAnalyze.min.js'
            }
        },

        jshint: {
            options: {
                proto: true
            },
            files: {
                src: ['develop/**/*.js']
            }
        },

        qunit: {
            all: ['docs/tests/*.html']
        },

        watch: {
            scripts: {
                files: ['develop/*.js', 'develop/*/*.js'],
                tasks: ['build', 'yuidoc'],
                options: {
                    spawn: false
                }
            }
        },

        yuidoc: {
            compile: {
                name: 'vAnalyze.js',
                description: 'Middleware debugging and runtime analysis',
                version: '0.0.1',
                url: '',
                options: {
                    paths: 'develop',
                    outdir: 'docs/yuidoc/'
                }
            }
        }

    });

    // 3. Where we tell Grunt we plan to use this plug-in.
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-yuidoc');


    // 4. Where we tell Grunt what to do when we type "grunt" into the terminal.
    grunt.registerTask('build', ['concat', 'uglify', 'yuidoc']);
    grunt.registerTask('test', ['jshint', 'qunit']);
    grunt.registerTask('full', ['build', 'test' /*, log*/, 'yuidoc']); //ToDo: Logger function to show results of test, recompile some docs, etc...
    grunt.registerTask('travis', ['full']);
};
