"use strict";
var fluid = require("infusion");
const {ESLint} = require("eslint");
var path = require("path");

fluid.require("fluid-glob");

require("eslint-plugin-markdown");
require("eslint-plugin-jsdoc");

fluid.registerNamespace("fluid.lintAll");

fluid.lintAll.eslint = function (options) {
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

    if (filesToScan.length) {
        try {
            var eslint = new ESLint(options.options);
            var validationPromise = eslint.lintFiles(filesToScan);
            validationPromise.then(
                function (validationResults) {
                    fluid.each(validationResults, function (singleFileResults) {
                        toReturn.checked++;
                        if (singleFileResults.errorCount) {
                            toReturn.invalid++;
                            var formattedErrors = [];
                            fluid.each(singleFileResults.messages, function (singleMessage) {
                                var formattedMessage = singleMessage.message + " (" + singleMessage.ruleId + ")";
                                formattedErrors.push({
                                    line: singleMessage.line,
                                    column: singleMessage.column,
                                    message: formattedMessage
                                });
                            });
                            if (formattedErrors.length) {
                                var relativePath = path.relative(options.rootPath, singleFileResults.filePath);
                                toReturn.errorsByPath[relativePath] = formattedErrors;
                            }
                        }
                        else {
                            toReturn.valid++;
                        }
                    });
                    wrappedPromise.resolve(toReturn);
                },
                function (error) {
                    fluid.log(fluid.logLevel.WARN, "ERROR: ESLint check failed: " + error.message);
                    wrappedPromise.resolve(toReturn);
                }
            );
        }
        catch (error) {
            fluid.log(fluid.logLevel.WARN, "ERROR: ESLint check threw an error: " + error.message);
            wrappedPromise.resolve(toReturn);
        }
    }

    return wrappedPromise;
};
