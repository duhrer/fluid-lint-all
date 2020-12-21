"use strict";

var fluid = require("infusion");

var path = require("path");
require("json5/lib/register");

fluid.require("%fluid-glob");

fluid.registerNamespace("fluid.lintAll");

fluid.lintAll.json5lint = function (options) {
    // Use fluid-glob to get the list of files.
    var filesToScan = fluid.glob.findFiles(options.rootPath, options.includes, options.excludes, options.minimatchOptions);

    // Accumulate list of valid and invalid files, including whatever details we can provide about the way in which they are invalid.
    var toReturn = {
        valid:   0,
        invalid: 0,
        checked: 0,
        errorsByPath: {}
    };

    // TODO: Consider using parse instead if it provides better feedback on where failures are.
    filesToScan.forEach( function (pathToFile) {
        try {
            require(pathToFile);
            toReturn.valid++;
        }
        catch (e) {
            const relativePath = path.relative(options.rootPath, pathToFile);
            toReturn.invalid++;

            const cleanedMessage = e.message.replace(/^.+JSON5: /, "");

            // This check can only return a single error, so we don't need to concat arrays.
            toReturn.errorsByPath[relativePath] = [{
                line: e.lineNumber,
                column: e.columnNumber,
                message: cleanedMessage
            }];
        }
        finally {
            toReturn.checked++;
        }
    });

    return toReturn;
};
