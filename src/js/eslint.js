"use strict";
var fluid = require("infusion");
var eslint = require("eslint");
var path = require("path");

fluid.require("fluid-glob");

require("eslint-plugin-markdown");

fluid.registerNamespace("fluid.lintAll");

fluid.lintAll.eslint = function (options) {
    var engine = new eslint.CLIEngine(options.options);

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
            var validationResults = engine.executeOnFiles(filesToScan);
            fluid.each(validationResults.results, function (singleFileResults) {
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
        }
        catch (error) {
            fluid.log(fluid.logLevel.WARN, "Unable to run ESLint check(s): " + error.message);
        }
    }

    return toReturn;
};
