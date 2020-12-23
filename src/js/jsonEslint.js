"use strict";
var fluid = require("infusion");
var fs = require("fs");
const {ESLint} = require("eslint");
var path = require("path");

fluid.require("fluid-glob");

fluid.registerNamespace("fluid.lintAll");

require("eslint-plugin-markdown");
require("eslint-plugin-jsdoc");

fluid.lintAll.jsonEslint = function (options) {
    var wrappedPromise = fluid.promise();

    // A string template to wrap JSON(5) content in minimal valid Javascript code so that we can lint it with ESLint.
    var wrapperTemplate = "/* eslint-env node */\n\"use strict\";\n//eslint-disable-next-line no-unused-vars\nvar wrappedVar = %jsonContent;\n";

    // Accumulate list of valid and invalid files, including whatever details we can provide about the way in which they are invalid.
    var toReturn = {
        valid:   0,
        invalid: 0,
        checked: 0,
        errorsByPath: {}
    };

    // Use fluid-glob to get the list of files.
    var filesToScan = fluid.glob.findFiles(options.rootPath, options.includes, options.excludes, options.minimatchOptions);

    var eslint = new ESLint(options.options);
    var eslintPromises = [];
    // Track this separately so we can stash the file paths, with our approach, ESLint flags them all as "<text>".
    var eslintResults = [];

    fluid.each(filesToScan, function (pathToFile) {
        var jsonContent = fs.readFileSync(pathToFile, { encoding: "utf8"});
        var wrappedContent = fluid.stringTemplate(wrapperTemplate, { jsonContent: jsonContent });

        try {
            var validationPromise = eslint.lintText(wrappedContent);
            eslintPromises.push(validationPromise);
            validationPromise.then(function (results) {
                fluid.each(results, function (singleResult) {
                    singleResult.filePath = pathToFile;
                    eslintResults.push(singleResult);
                });
            });
        } catch (err) {
            fluid.fail(err);
        }

        toReturn.checked++;
    });

    var eslintSequence = fluid.promise.sequence(eslintPromises);
    eslintSequence.then(
        function () {
            fluid.each(eslintResults, function (singleError) {
                var relativePath = path.relative(options.rootPath, singleError.filePath);

                var fileErrorCount    = fluid.get(singleError, "errorCount");
                if (fileErrorCount) {
                    toReturn.invalid++;
                    toReturn.errorsByPath[relativePath] = [];

                }
                else {
                    toReturn.valid++;
                }

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
            wrappedPromise.resolve(toReturn);
        },
        wrappedPromise.reject
    );

    return wrappedPromise;
};
