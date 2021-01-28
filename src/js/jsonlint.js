"use strict";
var fluid = require("infusion");
var fs = require("fs");
var path = require("path");
var jsonlint = require("jsonlint");

fluid.require("%fluid-glob");

require("./check");

fluid.registerNamespace("fluid.lintAll");

// Adapted from https://github.com/fluid-project/kettle/blob/main/lib/dataSource-core.js#L65
fluid.lintAll.parseJSONError = function (str, hash) {
    var message = "Found: \'" + hash.token + "\' - expected: " + hash.expected.join(", ");
    var error = new SyntaxError(message);
    error.lineNumber = hash.loc.first_line;
    error.columnNumber = hash.loc.last_column;
    throw error;
};

jsonlint.parser.parseError = jsonlint.parser.lexer.parseError = fluid.lintAll.parseJSONError;

fluid.defaults("fluid.lintAll.jsonlint", {
    gradeNames: ["fluid.lintAll.check"],
    key: "jsonlint",
    invokers: {
        checkImpl: {
            funcName: "fluid.lintAll.jsonlint.runChecks"
        }
    }
});

/**
 *
 * Run the `jsonlint` checks, i.e. ensure that all JSON files are valid.
 *
 * @param {Object} that - The `fluid.lintAll.jsonlint` component.
 * @param {Array<String>} filesToScan - An array of files to check.
 * @return {Promise <CheckResults>} - A promise that will resolve with the results of the check.
 */
fluid.lintAll.jsonlint.runChecks = function (that, filesToScan) {
    fluid.each(filesToScan, function (pathToFile) {
        const relativePath = path.relative(that.options.rootPath, pathToFile);
        var toParse = fs.readFileSync(pathToFile, { encoding: "utf8"});
        try {
            jsonlint.parse(toParse);
            that.results.valid++;
        }
        catch (e) {
            that.results.invalid++;

            // This check can only return a single error, so we don't need to concat arrays.
            that.results.errorsByPath[relativePath] = [{
                line: e.lineNumber,
                column: e.columnNumber,
                message: e.message
            }];
        }
    });

    return that.results;
};
