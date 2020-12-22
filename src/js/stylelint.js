"use strict";
var fluid = require("infusion");
var path = require("path");
var stylelint = require("stylelint");

fluid.require("fluid-glob");

fluid.registerNamespace("fluid.lintAll");

fluid.lintAll.stylelint = function (options) {
    var wrappedPromise = fluid.promise();

    // Accumulate list of valid and invalid files, including whatever details we can provide about the way in which they are invalid.
    var toReturn = {
        valid:   0,
        invalid: 0,
        checked: 0,
        errorsByPath: {}
    };

    // Use fluid-glob to get the list of files.
    var filesToScan = fluid.glob.findFiles(options.rootPath, options.includes, options.excludes, options.minimatchOptions);

    if (filesToScan.length) {
        var stylelintOptions = fluid.copy(options.options);
        stylelintOptions.files = filesToScan;
        if (stylelintOptions.configFile) {
            stylelintOptions.configFile = fluid.module.resolvePath(stylelintOptions.configFile);
        }

        try {
            var stylelintPromise = stylelint.lint(stylelintOptions);
            stylelintPromise["catch"](wrappedPromise.reject);
            stylelintPromise.then(function (results) {
                if (results.errored) {
                    fluid.each(results.results, function (fileResults) {
                        if (fileResults.errored) {
                            var relativePath = path.relative(options.rootPath, fileResults.source);
                            toReturn.errorsByPath[relativePath] = [];
                            toReturn.invalid++;
                            fluid.each(fileResults.warnings, function (singleWarning) {
                                if (singleWarning.severity === "error") {
                                    toReturn.errorsByPath[relativePath].push({
                                        line: singleWarning.line,
                                        column: singleWarning.column,
                                        message: singleWarning.text
                                    });
                                }
                            });
                        }
                    });
                }
                toReturn.checked = filesToScan.length;
                toReturn.valid = toReturn.checked - toReturn.invalid;
                wrappedPromise.resolve(toReturn);
            });
        }
        catch (e) {
            fluid.log(fluid.logLevel.WARN, e);
            wrappedPromise.reject(e);
        }
    }
    else {
        wrappedPromise.resolve(toReturn);
    }

    return wrappedPromise;
};
