"use strict";
var fluid = require("infusion");

require("json5/lib/register");

fluid.registerNamespace("fluid.lintAll.logger");

/**
 * @typedef {Object} Position
 * @param {number} [line] - The line number on which the error was encountered.
 * @param {number} [column] - The column on which the error was encountered.
 */

/**
 *
 * Sorting function used to ensure that errors for a single file are reported by line number, the column.
 *
 * @param {Position} a - The position data for one error.
 * @param {Position} b - The position data for another error.
 * @return {number} - Return a negative number if `a` occurs earlier, 0 if the positions are the same, or a positive
 * number if `b` occurs earlier.
 *
 */
fluid.lintAll.logger.sortByPosition = function (a, b) {
    var lineDiff = a.line - b.line;
    if (lineDiff) {
        return lineDiff;
    }
    else {
        return a.column - b.column;
    }
};

/**
 *
 * Output a summary of all check results.
 *
 * @param {Object} overallResults - A nested set of `CheckResults` objects, grouped by the type of check.
 * @param {ParsedArgs} argsOptions - Parsed command line arguments.
 *
 */
fluid.lintAll.logger.outputSummary = function (overallResults, argsOptions) {
    var supportedChecks = require("../json/supportedChecks.json5");
    fluid.each(supportedChecks, function (checkDef, checkKey) {
        var singleCheckResults = fluid.get(overallResults, checkKey);
        if (singleCheckResults) {
            if (checkDef.subchecks) {
                fluid.each(checkDef.subchecks, function (subcheckDef, subcheckSuffix) {
                    var subcheckKey = [checkKey, subcheckSuffix].join(".");
                    var subcheckResults = fluid.get(singleCheckResults, subcheckSuffix);
                    if (subcheckResults) {
                        fluid.lintAll.logger.outputSingleCheckResults(subcheckKey, subcheckResults, argsOptions);
                    }
                });
            }
            else {
                fluid.lintAll.logger.outputSingleCheckResults(checkKey, singleCheckResults, argsOptions);
            }
        }
    });

    fluid.lintAll.logger.outputCheckStats("Summary", overallResults);

    if (overallResults.invalid) {
        fluid.log(fluid.logLevel.FAIL, "================================================");
        fluid.log(fluid.logLevel.FAIL, " FAIL - One or more linting checks have errors.");
        fluid.log(fluid.logLevel.FAIL, "================================================");
    }
    else {
        fluid.log(fluid.logLevel.IMPORTANT, "======================================");
        fluid.log(fluid.logLevel.IMPORTANT, " PASS - All linting checks succeeded.");
        fluid.log(fluid.logLevel.IMPORTANT, "======================================");
    }
};

/**
 *
 * Output summary statistics for a single level of the check results.
 *
 * @param {string} checkPrefix - The key (i.e. `jsonlint`) for the check.
 * @param {CheckResults} checkResults - The results of the check.
 *
 */
fluid.lintAll.logger.outputCheckStats = function (checkPrefix, checkResults) {
    var percentValid = checkResults.checked ? Math.round((checkResults.valid / checkResults.checked) * 10000) / 100 : "n/a ";
    fluid.log(fluid.logLevel.IMPORTANT, checkPrefix + ": " + percentValid + "% (" + checkResults.valid + "/" + checkResults.checked + ") files checked are valid.");
    fluid.log(fluid.logLevel.IMPORTANT);
};


/**
 *
 * Output the errors for a single file together.
 *
 * @param {String} pathToFile - The path to the file in question.
 * @param {Array<SingleError>} pathErrors - The errors found in the file.
 *
 */
fluid.lintAll.logger.outputPathErrors = function (pathToFile, pathErrors) {
    fluid.log(fluid.logLevel.FAIL, "  - "  + pathToFile + ":");
    pathErrors.sort(fluid.lintAll.logger.sortByPosition);
    fluid.each(pathErrors, function (error) {
        const positionMarker = error.line ? "(" + error.line + ":" + (error.column || "-") + ") " : "";
        const formattedMessage = "    " + positionMarker + error.message;
        fluid.log(fluid.logLevel.FAIL, formattedMessage);
    });
    fluid.log(fluid.logLevel.FAIL);
};

/**
 *
 * Output the results of a single check.
 *
 * @param {String} checkKey - The "key" for the check, such as `mdjsonlint`.
 * @param {CheckResults} singleCheckResults - The results of the check.
 * @param {ParsedArgs} argsOptions - Parsed command line arguments.
 *
 */
fluid.lintAll.logger.outputSingleCheckResults = function (checkKey, singleCheckResults, argsOptions) {
    if (argsOptions.showCheckedFiles) {
        fluid.log(fluid.logLevel.FAIL, "Files checked by " + checkKey + ":");
        fluid.each(singleCheckResults.checkedPaths, function (pathToFile) {
            fluid.log(fluid.logLevel.FAIL, "  - "  + pathToFile);
        });
        fluid.log(fluid.logLevel.FAIL, " ");
    }

    if (singleCheckResults.invalid) {
        fluid.log(fluid.logLevel.FAIL, "Errors returned by " + checkKey + ":");
        fluid.log(fluid.logLevel.FAIL);
        fluid.each(singleCheckResults.errorsByPath, function (pathErrors, path) {
            fluid.lintAll.logger.outputPathErrors(path, pathErrors);
        });
        fluid.log(fluid.logLevel.FAIL);
    }

    fluid.lintAll.logger.outputCheckStats(checkKey, singleCheckResults);
};
