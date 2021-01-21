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
        runChecks: {
            funcName: "fluid.lintAll.json5lint.runChecks"
        }
    }
});

/**
 *
 * Run the `json5lint` checks, i.e. ensure that all JSON5 files are valid.
 *
 * @param {Object} that - The `fluid.lintAll.json5lint` component.
 * @param {Array<String>} [checksToRun] - An array of check "keys" indicating which checks should be run.  If omitted,
 * all checks are run.
 * @return {Promise <CheckResults>} - A promise that will resolve with the results of the check.
 */
fluid.lintAll.json5lint.runChecks = function (that, checksToRun) {
    if (that.options.config.enabled && !checksToRun || checksToRun.includes(that.options.key)) {
        // Use fluid-glob to get the list of files.
        var filesToScan = fluid.glob.findFiles(that.options.rootPath, that.options.config.includes, that.options.config.excludes, that.options.minimatchOptions);

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
            finally {
                that.results.checked++;
            }
        });
    }

    return that.results;
};
