"use strict";
var fluid = require("infusion");
var path = require("path");
var Validator = require("lintspaces");

fluid.registerNamespace("fluid.lintAll");

require("./rollup");
require("./check");

fluid.defaults("fluid.lintAll.lintspaces", {
    gradeNames: ["fluid.lintAll.rollup"],
    key: "lintspaces",
    components: {
        jsonindentation: {
            type: "fluid.lintAll.lintspaces.singleCheck",
            options: {
                key: "lintspaces.jsonindentation",
                config: "{fluid.lintAll.lintspaces}.options.config.jsonindentation"
            }
        },
        newlines: {
            type: "fluid.lintAll.lintspaces.singleCheck",
            options: {
                key: "lintspaces.newlines",
                config: "{fluid.lintAll.lintspaces}.options.config.newlines"
            }
        }
    }
});

fluid.defaults("fluid.lintAll.lintspaces.singleCheck", {
    gradeNames: ["fluid.lintAll.check"],
    invokers: {
        checkImpl: {
            funcName: "fluid.lintAll.lintspaces.runSingleCheck"
        }
    }
});

/**
 *
 * Common function that backs all of the `lintspaces` checks.
 *
 * Note that as with other "sub-checks" (under the ESLint and lintspaces headings), this function does not examine the
 * `checks` parameter used by other checks.  Instead, the `fluid.lintAll.holder` grade that contains the sub-check
 * examines the list of checks and decides whether to run the sub-check.
 *
 * @param {Object} that - The `fluid.lintAll.lintspaces.singleCheck` component.
 * @param {Array<String>} filesToScan - An array of files to check.
 * @return {Promise <CheckResults>} - A promise that will resolve with the results of the check.
 *
 */
fluid.lintAll.lintspaces.runSingleCheck = function (that, filesToScan) {
    var validator = new Validator(that.options.config.options);

    fluid.each(filesToScan, function (fileToScan) {
        validator.validate(fileToScan);
    });

    var fileErrorsByPath = validator.getInvalidFiles();
    fluid.each(fileErrorsByPath, function (fileErrors, pathToFile) {
        var relativePath = path.relative(that.options.rootPath, pathToFile);
        that.results.invalid++;
        that.results.errorsByPath[relativePath] = [];
        fluid.each(fileErrors, function (fileErrorArray) {
            fluid.each(fileErrorArray, function (fileError) {
                that.results.errorsByPath[relativePath].push({
                    line: fileError.line,
                    message: fileError.message
                });
            });
        });
    });

    that.results.valid = that.results.checked - that.results.invalid;

    return that.results;
};
