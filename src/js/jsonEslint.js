"use strict";
var fluid = require("infusion");
var fs = require("fs");
var eslint = require("eslint");
var path = require("path");

fluid.require("fluid-glob");

fluid.registerNamespace("fluid.lintAll");

fluid.lintAll.jsonEslint = function (options) {
    // A string template to wrap JSON(5) content in minimal valid Javascript code so that we can lint it with ESLint.
    var wrapperTemplate = "/* eslint-env node */\n\"use strict\";\n//eslint-disable-next-line no-unused-vars\nvar wrappedVar = %jsonContent;\n";

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

    fluid.each(filesToScan, function (pathToFile) {
        var jsonContent = fs.readFileSync(pathToFile, { encoding: "utf8"});
        var wrappedContent = fluid.stringTemplate(wrapperTemplate, { jsonContent: jsonContent });

        try {
            var validationResults = engine.executeOnText(wrappedContent, false);
            var fileErrorCount    = fluid.get(validationResults, "errorCount");
            if (fileErrorCount) {
                toReturn.invalid++;
                var relativePath = path.relative(options.rootPath, pathToFile);
                toReturn.errorsByPath[relativePath] = [];
                fluid.each(validationResults.results, function (singleError) {
                    fluid.each(singleError.messages, function (singleMessage) {
                        // Our "wrapper" adds three lines of code before the first line.
                        var adjustedLine = singleMessage.line - 3;
                        // Our "wrapper" adds 17 characters to the first line.
                        var adjustedColumn = adjustedLine === 1 ? singleMessage.column - 17 : singleMessage.column;

                        toReturn.errorsByPath[relativePath].push({
                            line: adjustedLine,
                            column: adjustedColumn,
                            message: singleMessage.message
                        });
                    });
                });
            }
            else {
                toReturn.valid++;
            }
        } catch (err) {
            fluid.fail(err);
        }

        toReturn.checked++;
    });

    return toReturn;
};
