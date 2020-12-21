"use strict";
var fluid = require("infusion");
var fs = require("fs");
var path = require("path");
var process = require("process");

require("json5/lib/register");

require("./eslint");
require("./extractCheckKeys");
require("./json5lint");
require("./jsonEslint");
require("./jsonlint");
require("./lintspaces");
require("./logger");
require("./markdownlint");
require("./mdjsonlint");
require("./stylelint");

fluid.registerNamespace("fluid.lintAll");

fluid.lintAll.runSingleCheck = function (fnName, rootOptions, options, checkKey, resultsAccumulator) {
    var checkOptions = fluid.extend(true, {}, rootOptions, fluid.get(options, checkKey));
    var checkFn = fluid.getGlobalValue(fnName);
    var checkResultsPromise = fluid.toPromise(checkFn(checkOptions));

    checkResultsPromise.then(function (checkResults) {
        fluid.set(resultsAccumulator, checkKey, checkResults);

        resultsAccumulator.valid   += checkResults.valid;
        resultsAccumulator.invalid += checkResults.invalid;
        resultsAccumulator.checked += checkResults.checked;
    });

    return checkResultsPromise;
};

fluid.lintAll.runAllChecks = function (argsOptions) {
    var allChecksPromise = fluid.promise();

    var checkPromises = [];

    const supportedChecks = require("../json/supportedChecks.json5");
    var supportedCheckKeys = fluid.lintAll.extractCheckKeys(supportedChecks);

    // Read defaults from this package.
    var defaultOptions = require("../json/defaults.json5");

    var impliedRootOptions = { rootPath: process.cwd() };
    var defaultRootOptions = fluid.filterKeys(defaultOptions, ["rootPath"]);
    var rootOptions  = fluid.extend(true, {}, impliedRootOptions, defaultRootOptions);

    var options = fluid.copy(defaultOptions);

    var configFile = fluid.get(argsOptions, "configFile") || ".fluidlintallrc.json";
    var configFilePath = path.resolve(rootOptions.rootPath, configFile);
    if (fs.existsSync(configFilePath)) {
        var configFileOptions = require(configFilePath);
        options = fluid.extend(true, {}, defaultOptions, configFileOptions);
    }

    var overallResults = {
        valid:   0,
        invalid: 0,
        checked: 0
    };

    var checkArgs = fluid.get(argsOptions, "checks");
    fluid.log(fluid.logLevel.WARN);
    fluid.log(fluid.logLevel.WARN, "======================================================");

    if (checkArgs && checkArgs.length) {
        fluid.log(fluid.logLevel.WARN, " fluid-lint-all: Running the following checks:");
        fluid.each(checkArgs, function (singleArgument) {
            fluid.log(fluid.logLevel.WARN, " - " + singleArgument);
        });
    }
    else {
        fluid.log(fluid.logLevel.WARN, "fluid-lint-all: Running all checks.");
    }

    fluid.log(fluid.logLevel.WARN, "======================================================");
    fluid.log(fluid.logLevel.WARN);

    const requestedCheckKeys = checkArgs || supportedCheckKeys;
    fluid.each(requestedCheckKeys, function (checkKey) {
        var checkGetSegs = checkKey.split(".").join(".subchecks.");
        var checkDef = fluid.get(supportedChecks, checkGetSegs);
        var checkEnabledSegs = checkKey.split(".").concat(["enabled"]);
        if (checkDef.fnName && fluid.get(options, checkEnabledSegs)) {
            var singleCheckPromise = fluid.lintAll.runSingleCheck(checkDef.fnName, rootOptions, options, checkKey, overallResults);
            checkPromises.push(singleCheckPromise);
        }
        fluid.each(checkDef.subchecks, function (subcheckDef, subcheckSuffix) {
            const subcheckKey = [checkKey, subcheckSuffix].join(".");
            if (subcheckDef.fnName && fluid.get(options, [checkKey, subcheckSuffix, "enabled"])) {
                var singleSubcheckPromise =  fluid.lintAll.runSingleCheck(subcheckDef.fnName, rootOptions, options, subcheckKey, overallResults);
                checkPromises.push(singleSubcheckPromise);
            }
        });
    });

    var allChecksSequence = fluid.promise.sequence(checkPromises);

    allChecksSequence.then(function () {
        if (overallResults.checked) {
            // Output a summary of the results, including all observed errors.
            fluid.lintAll.logger.outputSummary(overallResults);

            if (overallResults.invalid > 0) {
                allChecksPromise.reject(new Error("One or more linting checks did not pass."));
            }
        }
        else {
            allChecksPromise.reject(new Error("ERROR: No files checked, please review your configuration and command line arguments."));
        }
    }, allChecksPromise.reject); // TODO: Consider making this more forgiving.

    return allChecksPromise;
};
