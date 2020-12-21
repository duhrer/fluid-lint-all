"use strict";
var fluid = require("infusion");
var path = require("path");
var Validator = require("lintspaces");

fluid.registerNamespace("fluid.lintAll");

fluid.lintAll.lintspaces = function (options) {
    var validator = new Validator(options.options);

    // Use fluid-glob to get the list of files.
    var filesToScan = fluid.glob.findFiles(options.rootPath, options.includes, options.excludes, options.minimatchOptions);

    // Accumulate list of valid and invalid files, including whatever details we can provide about the way in which they are invalid.
    var toReturn = {
        valid:   0,
        invalid: 0,
        checked: 0,
        errorsByPath: {}
    };

    fluid.each(filesToScan, function (fileToScan) {
        validator.validate(fileToScan);
    });

    var fileErrorsByPath = validator.getInvalidFiles();
    fluid.each(fileErrorsByPath, function (fileErrors, pathToFile) {
        var relativePath = path.relative(options.rootPath, pathToFile);
	    toReturn.invalid++;
	    toReturn.errorsByPath[relativePath] = [];
	    fluid.each(fileErrors, function (fileErrorArray) {
	        fluid.each(fileErrorArray, function (fileError) {
                toReturn.errorsByPath[relativePath].push({
                    line: fileError.line,
                    message: fileError.message
                });
            });
        });
    });

    toReturn.checked = filesToScan.length;
    toReturn.valid = toReturn.checked - toReturn.invalid;

    return toReturn;
};
