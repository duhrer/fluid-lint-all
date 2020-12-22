"use strict";
var fluid = require("infusion");
var path = require("path");
var markdownlint = require("markdownlint");

fluid.require("fluid-glob");

fluid.lintAll.markdownlint = function (options) {
    var wrappedPromise = fluid.promise();

    // Accumulate list of valid and invalid files, including whatever details we can provide about the way in which they are invalid.
    var toReturn = {
        valid:   0,
        invalid: 0,
        checked: 0,
        errorsByPath: {}
    };

    // Use fluid-glob to get the list of files.
    var filesToScan = fluid.glob.findFiles(options.rootPath, options.includes, options.excludes, options.minimatchOptions);

    // If we use fluid.copy here, the line-length option will not be visible to markdownlint.
    var markdownLintOptions = JSON.parse(JSON.stringify(options.options));
    markdownLintOptions.files = filesToScan;

    markdownlint(markdownLintOptions, function (error, markdownLintResults) {
        if (error) {
            wrappedPromise.reject(error);
        }
        else {
            fluid.each(markdownLintResults, function (fileErrors, pathToFile) {
                if (fileErrors.length) {
                    var relativePath = path.relative(options.rootPath, pathToFile);
                    toReturn.invalid++;
                    toReturn.errorsByPath[relativePath] = [];
                    fluid.each(fileErrors, function (fileError) {
                        var formattedMessage = fileError.ruleNames.join(":");
                        if (fileError.errorDetail) {
                            formattedMessage +=  " - " + fileError.errorDetail;
                        }

                        toReturn.errorsByPath[relativePath].push({
                            line: fileError.lineNumber,
                            message: formattedMessage
                        });
                    });
                }
            });

            toReturn.checked = filesToScan.length;
            toReturn.valid = toReturn.checked - toReturn.invalid;

            wrappedPromise.resolve(toReturn);
        }
    });

    return wrappedPromise;
};
