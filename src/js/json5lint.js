"use strict";

var fluid = require("infusion");
var fs = require("fs");
var path = require("path");
var JSON5 = require("json5");

require("./check");

fluid.require("%fluid-glob");

fluid.defaults("fluid.lintAll.json5lint", {
    gradeNames: ["fluid.lintAll.check"],
    key: "json5lint",
    invokers: {
        checkImpl: {
            funcName: "fluid.lintAll.json5lint.runChecks"
        }
    }
});

/**
 *
 * Run the `json5lint` checks, i.e. ensure that all JSON5 files are valid.
 *
 * @param {Object} that - The `fluid.lintAll.json5lint` component.
 * @param {Array<String>} filesToScan - An array of files to check.
 * @return {Promise <CheckResults>} - A promise that will resolve with the results of the check.
 */
fluid.lintAll.json5lint.runChecks = function (that, filesToScan) {

    // TODO: Consider using parse instead if it provides better feedback on where failures are.
    filesToScan.forEach( function (pathToFile) {
        try {
            var fileContent = fs.readFileSync(pathToFile, { encoding: "utf8"});
            JSON5.parse(fileContent);
            that.results.valid++;
        }
        catch (e) {
            const relativePath = path.relative(that.options.rootPath, pathToFile);
            that.results.invalid++;

            const cleanedMessage = e.message.replace(/^.+JSON5: /, "");

            // This check can only return a single error, so we don't need to concat arrays.
            that.results.errorsByPath[relativePath] = [{
                line: e.lineNumber,
                column: e.columnNumber,
                message: cleanedMessage
            }];
        }
    });

    return that.results;
};
