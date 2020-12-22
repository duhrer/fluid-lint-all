"use strict";
var fluid = require("infusion");

require("json5/lib/register");

fluid.registerNamespace("fluid.lintAll.logger");

fluid.lintAll.logger.sortByPosition = function (a, b) {
    if (a.line && b.line) {
        if (a.line === b.line) {
            if (a.column && b.column) {
                return a.column - b.column;
            }
            else if (a.column) {
                return 1;
            }
            else if (b.column) {
                return -1;
            }
            else {
                return 0;
            }
        }
        else {
            return a.line - b.line;
        }
    }
    else if (a.line) {
        return 1;
    }
    else if (b.line) {
        return -1;
    }
    else {
        return 0;
    }
};

fluid.lintAll.logger.outputSummary = function (overallResults) {
    var supportedChecks = require("../json/supportedChecks.json5");
    fluid.each(supportedChecks, function (checkDef, checkKey) {
        var singleCheckResults = fluid.get(overallResults, checkKey);
        if (singleCheckResults) {
            if (checkDef.subchecks) {
                fluid.each(checkDef.subchecks, function (subcheckDef, subcheckSuffix) {
                    var subcheckKey = [checkKey, subcheckSuffix].join(".");
                    var subcheckResults = fluid.get(singleCheckResults, subcheckSuffix);
                    if (subcheckResults) {
                        fluid.lintAll.logger.outputSingleCheckResults(subcheckKey, subcheckResults);
                    }
                });
            }
            else {
                fluid.lintAll.logger.outputSingleCheckResults(checkKey, singleCheckResults);
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

fluid.lintAll.logger.outputCheckStats = function (checkPrefix, checkResults) {
    var percentValid = checkResults.checked ? Math.round((checkResults.valid / checkResults.checked) * 10000) / 100 : "n/a ";
    fluid.log(fluid.logLevel.IMPORTANT, checkPrefix + ": " + percentValid + "% (" + checkResults.valid + "/" + checkResults.checked + ") files checked are valid.");
    fluid.log(fluid.logLevel.IMPORTANT);
};

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

fluid.lintAll.logger.outputSingleCheckResults = function (checkKey, singleCheckResults) {
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
