"use strict";
var fluid = require("infusion");
var path = require("path");
var markdownlint = require("markdownlint");

fluid.require("%fluid-glob");

require("./check");

fluid.defaults("fluid.lintAll.markdownlint", {
    gradeNames: ["fluid.lintAll.check"],
    key: "markdownlint",
    invokers: {
        checkImpl: {
            funcName: "fluid.lintAll.markdownlint.runChecks"
        }
    }
});

/**
 *
 * Run the `markdownlint` checks, i.e. ensure that all Markdown files follow our linting rules.
 *
 * @param {Object} that - The `fluid.lintAll.markdownlint` component.
 * @param {Array<String>} filesToScan - An array of files to check.
 * @return {Promise <CheckResults>} - A promise that will resolve with the results of the check.
 */
fluid.lintAll.markdownlint.runChecks = function (that, filesToScan) {
    var wrappedPromise = fluid.promise();

    if (filesToScan.length) {
        // If we use fluid.copy here, the line-length option will not be visible to markdownlint.
        var markdownLintOptions = JSON.parse(JSON.stringify(that.options.config.options));
        markdownLintOptions.files = filesToScan;

        markdownlint(markdownLintOptions, function (error, markdownLintResults) {
            if (error) {
                wrappedPromise.reject(error);
            }
            else {
                fluid.each(markdownLintResults, function (fileErrors, pathToFile) {
                    if (fileErrors.length) {
                        var relativePath = path.relative(that.options.rootPath, pathToFile);
                        that.results.invalid++;
                        that.results.errorsByPath[relativePath] = [];
                        fluid.each(fileErrors, function (fileError) {
                            var formattedMessage = fileError.ruleNames.join(":");
                            if (fileError.errorDetail) {
                                formattedMessage +=  " - " + fileError.errorDetail;
                            }

                            that.results.errorsByPath[relativePath].push({
                                line: fileError.lineNumber,
                                message: formattedMessage
                            });
                        });
                    }
                });

                that.results.valid = that.results.checked - that.results.invalid;

                wrappedPromise.resolve(that.results);
            }
        });
    }
    else {
        wrappedPromise.resolve(that.results);
    }

    return wrappedPromise;
};
