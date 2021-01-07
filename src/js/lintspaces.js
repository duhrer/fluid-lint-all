"use strict";
var fluid = require("infusion");
var path = require("path");
var Validator = require("lintspaces");

fluid.registerNamespace("fluid.lintAll");

require("./rollup");
require("./check");

fluid.defaults("fluid.lintAll.lintspaces", {
    gradeNames: ["fluid.lintAll.rollup"],
    key: "lintspaces",
    components: {
        jsonindentation: {
            type: "fluid.lintAll.lintspaces.singleCheck",
            options: {
                key: "lintspaces.jsonindentation",
                config: "{fluid.lintAll.lintspaces}.options.config.jsonindentation"
            }
        },
        newlines: {
            type: "fluid.lintAll.lintspaces.singleCheck",
            options: {
                key: "lintspaces.newlines",
                config: "{fluid.lintAll.lintspaces}.options.config.newlines"
            }
        }
    }
});

fluid.defaults("fluid.lintAll.lintspaces.singleCheck", {
    gradeNames: ["fluid.lintAll.check"],
    invokers: {
        runChecks: {
            funcName: "fluid.lintAll.lintspaces.runSingleCheck"
        }
    }
});

fluid.lintAll.lintspaces.runSingleCheck = function (that) {
    if (that.options.config.enabled) {
        var validator = new Validator(that.options.config.options);

        // Use fluid-glob to get the list of files.
        var filesToScan = fluid.glob.findFiles(that.options.rootPath, that.options.config.includes, that.options.config.excludes, that.options.minimatchOptions);

        fluid.each(filesToScan, function (fileToScan) {
            validator.validate(fileToScan);
        });

        var fileErrorsByPath = validator.getInvalidFiles();
        fluid.each(fileErrorsByPath, function (fileErrors, pathToFile) {
            var relativePath = path.relative(that.options.rootPath, pathToFile);
            that.results.invalid++;
            that.results.errorsByPath[relativePath] = [];
            fluid.each(fileErrors, function (fileErrorArray) {
                fluid.each(fileErrorArray, function (fileError) {
                    that.results.errorsByPath[relativePath].push({
                        line: fileError.line,
                        message: fileError.message
                    });
                });
            });
        });

        that.results.checked = filesToScan.length;
        that.results.valid = that.results.checked - that.results.invalid;
    }

    return that.results;
};
