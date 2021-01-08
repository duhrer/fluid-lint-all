"use strict";
var fluid = require("infusion");
var path = require("path");
var markdownlint = require("markdownlint");

fluid.require("fluid-glob");

require("./check");

fluid.defaults("fluid.lintAll.markdownlint", {
    gradeNames: ["fluid.lintAll.check"],
    key: "markdownlint",
    invokers: {
        runChecks: {
            funcName: "fluid.lintAll.markdownlint.runChecks"
        }
    }
});

/**
 *
 * Run the `markdownlint` checks, i.e. ensure that all Markdown files follow our linting rules.
 *
 * @param {Object} that - The `fluid.lintAll.markdownlint` component.
 * @param {Array<String>} [checksToRun] - An array of check "keys" indicating which checks should be run.  If omitted,
 * all checks are run.
 * @return {Promise <CheckResults>} - A promise that will resolve with the results of the check.
 */
fluid.lintAll.markdownlint.runChecks = function (that, checksToRun) {
    var wrappedPromise = fluid.promise();

    if (that.options.config.enabled && (!checksToRun || checksToRun.includes(that.options.key))) {
        // Use fluid-glob to get the list of files.
        var filesToScan = fluid.glob.findFiles(that.options.rootPath, that.options.config.includes, that.options.config.excludes, that.options.minimatchOptions);

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

                    that.results.checked = filesToScan.length;
                    that.results.valid = that.results.checked - that.results.invalid;

                    wrappedPromise.resolve(that.results);
                }
            });
        }
        else {
            wrappedPromise.resolve(that.results);
        }
    }
    else {
        wrappedPromise.resolve(that.results);
    }

    return wrappedPromise;
};
