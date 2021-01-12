"use strict";
var fluid = require("infusion");
const {ESLint} = require("eslint");
var path = require("path");

fluid.require("%fluid-glob");

require("eslint-plugin-markdown");
require("eslint-plugin-jsdoc");

require("./rollup");
require("./check");
require("./jsonEslint");

fluid.defaults("fluid.lintAll.eslint", {
    gradeNames: ["fluid.lintAll.rollup"],
    key: "eslint",
    components: {
        js: {
            type: "fluid.lintAll.eslint.singleCheck",
            options: {
                key: "eslint.js",
                config: "{fluid.lintAll.eslint}.options.config.js"
            }
        },
        json: {
            type: "fluid.lintAll.jsonEslint",
            options: {
                key: "eslint.json",
                config: "{fluid.lintAll.eslint}.options.config.json"
            }
        },
        md: {
            type: "fluid.lintAll.eslint.singleCheck",
            options: {
                key: "eslint.md",
                config: "{fluid.lintAll.eslint}.options.config.md"
            }
        }
    }
});

fluid.defaults("fluid.lintAll.eslint.singleCheck", {
    gradeNames: ["fluid.lintAll.check"],
    invokers: {
        runChecks: {
            funcName: "fluid.lintAll.eslint.runSingleCheck"
        }
    }
});


/**
 *
 * Core function that backs two of the ESLint link check grades.
 *
 * Note that as with other "sub-checks", this function does not examine the `checks` parameter used by other checks.
 * Instead, the `fluid.lintAll.holder` grade that contains the sub-check examines the list of checks and decides whether
 * to run the sub-check.
 *
 * @param {Object} that - The `fluid.lintall.eslint.singleCheck` component.
 * @return {Promise <CheckResults>} - A promise that will resolve with the results of the check.
 *
 */
fluid.lintAll.eslint.runSingleCheck = function (that) {
    var wrappedPromise = fluid.promise();

    if (that.options.config.enabled ) {
        // Use fluid-glob to get the list of files.
        var filesToScan = fluid.glob.findFiles(that.options.rootPath, that.options.config.includes, that.options.config.excludes, that.options.minimatchOptions);

        if (filesToScan.length) {
            try {
                var eslint = new ESLint(that.options.config.options);
                var validationPromise = eslint.lintFiles(filesToScan);
                validationPromise.then(
                    function (validationResults) {
                        fluid.each(validationResults, function (singleFileResults) {
                            that.results.checked++;
                            if (singleFileResults.errorCount) {
                                that.results.invalid++;
                                fluid.lintAll.combineFormattedErrors(that, singleFileResults);
                            }
                            else {
                                that.results.valid++;
                            }
                        });
                        wrappedPromise.resolve(that.results);
                    },
                    function (error) {
                        fluid.log(fluid.logLevel.WARN, "ERROR: ESLint check failed: " + error.message);
                        wrappedPromise.resolve(that.results);
                    }
                );
            }
            catch (error) {
                fluid.log(fluid.logLevel.WARN, "ERROR: ESLint check threw an error: " + error.message);
                wrappedPromise.resolve(that.results);
            }
        }
    }
    else {
        wrappedPromise.resolve(that.results);
    }

    return wrappedPromise;
};

/**
 *
 * Register the linting errors encountered for a single file in our member variable that holds the check results.
 *
 * @param {Object} that - The `fluid.lintall.eslint.singleCheck` component.
 * @param {Object} singleFileResults - The ESLint output for a single file that failed the linting checks.
 *
 */
fluid.lintAll.combineFormattedErrors = function (that, singleFileResults) {
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
        var relativePath = path.relative(that.options.rootPath, singleFileResults.filePath);
        that.results.errorsByPath[relativePath] = formattedErrors;
    }
};
