"use strict";
var fluid = require("infusion");
var fs = require("fs");
var path = require("path");
var jsonlint = require("jsonlint");

fluid.require("%fluid-glob");

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

fluid.lintAll.jsonlint = function (options) {
    // Use fluid-glob to get the list of files.
    var filesToScan = fluid.glob.findFiles(options.rootPath, options.includes, options.excludes, options.minimatchOptions);

    // Accumulate list of valid and invalid files, including whatever details we can provide about the way in which they are invalid.
    var toReturn = {
        valid:   0,
        invalid: 0,
        checked: 0,
        errorsByPath: {}
    };

    fluid.each(filesToScan, function (pathToFile) {
        const relativePath = path.relative(options.rootPath, pathToFile);
        var toParse = fs.readFileSync(pathToFile, { encoding: "utf8"});
        try {
            jsonlint.parse(toParse);
            toReturn.valid++;
        }
        catch (e) {
            toReturn.invalid++;

            // This check can only return a single error, so we don't need to concat arrays.
            toReturn.errorsByPath[relativePath] = [{
                line: e.lineNumber,
                column: e.columnNumber,
                message: e.message
            }];
        }

        toReturn.checked++;
    });

    return toReturn;
};
