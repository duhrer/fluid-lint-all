"use strict";
var fluid = require("infusion");
var fs = require("fs");
const {ESLint} = require("eslint");
var path = require("path");

fluid.require("%fluid-glob");

require("eslint-plugin-markdown");
require("eslint-plugin-jsdoc");

require("./check");

fluid.defaults("fluid.lintAll.jsonEslint", {
    gradeNames: ["fluid.lintAll.check"],
    key: "jsonEslint",
    invokers: {
        checkImpl: {
            funcName: "fluid.lintAll.jsonEslint.runChecks"
        }
    }
});

/**
 *
 * Run the `jsonEslint` checks, i.e. JSON blocks wrapped in Javascript, then linted using our standard ESLint rules.
 *
 * Note that as with other "sub-checks" (under the ESLint and lintspaces headings), this function does not examine the
 * `checks` parameter used by other checks.  Instead, the `fluid.lintAll.holder` grade that contains the sub-check
 * examines the list of checks and decides whether to run the sub-check.
 *
 * @param {Object} that - The `fluid.lintAll.jsonEslint` component.
 * @param {Array<String>} filesToScan - An array of files to check.
 * @return {Promise <CheckResults>} - A promise that will resolve with the results of the check.
 *
 */
fluid.lintAll.jsonEslint.runChecks = function (that, filesToScan) {
    // A string template to wrap JSON(5) content in minimal valid Javascript code so that we can lint it with ESLint.
    var wrapperTemplate = "/* eslint-env node */\n\"use strict\";\n//eslint-disable-next-line no-unused-vars\nvar wrappedVar = %jsonContent;\n";

    var eslint = new ESLint(that.options.config.options);
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
    });

    var eslintSequence = fluid.promise.sequence(eslintPromises);

    var wrappedPromise = fluid.promise.map(eslintSequence, function () {
        fluid.each(eslintResults, function (singleError) {
            var relativePath = path.relative(that.options.rootPath, singleError.filePath);

            var fileErrorCount = fluid.get(singleError, "errorCount");
            if (fileErrorCount) {
                that.results.invalid++;
                that.results.errorsByPath[relativePath] = [];
            }
            else {
                that.results.valid++;
            }

            fluid.each(singleError.messages, function (singleMessage) {
                // Our "wrapper" adds three lines of code before the first line, see `wrapperTemplate` above.
                var adjustedLine = singleMessage.line - 3;
                // Our "wrapper" adds 17 characters to the first line, see `wrapperTemplate` above.
                var adjustedColumn = adjustedLine === 1 ? singleMessage.column - 17 : singleMessage.column;

                that.results.errorsByPath[relativePath].push({
                    line: adjustedLine,
                    column: adjustedColumn,
                    message: singleMessage.message
                });
            });
        });

        return that.results;
    });

    return wrappedPromise;
};
