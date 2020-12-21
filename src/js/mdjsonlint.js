/*
 *
 * Copyright (c) 2017 Raising the Floor International.
 *
 * Licensed under the BSD-3-Clause license.
 *
 */
// Inspired by the approach used here: https://github.com/matsu-chara/experimental-markdown-json-lint
/* eslint-env node */
"use strict";
var fluid = require("infusion");
var fs = require("fs");
var path = require("path");

var mdParser = require("@textlint/markdown-to-ast");
var JSON5    = require("json5");

fluid.registerNamespace("fluid.lintAll");

fluid.lintAll.mdjsonlint = function (options) {
    // Accumulate list of valid and invalid files, including whatever details we can provide about the way in which they are invalid.
    var toReturn = {
        valid:   0,
        invalid: 0,
        checked: 0,
        errorsByPath: {}
    };

    // Use fluid-glob to get the list of files.
    var filesToScan = fluid.glob.findFiles(options.rootPath, options.includes, options.excludes, options.minimatchOptions);

    fluid.each(filesToScan, function (pathToFile) {
        var markdownString = fs.readFileSync(pathToFile, { encoding: "utf8"});
        var fileErrors = [];
        var ast = mdParser.parse(markdownString);
        var jsonBlocks = fluid.lintAll.findJsonBlocks(ast);

        fluid.each(jsonBlocks, function (jsonBlock) {
            if (jsonBlock.lang === "json") {
                try {
                    JSON.parse(jsonBlock.value);
                }
                catch (jsonException) {
                    var position = fluid.lintAll.extractPosition(jsonException.message, jsonBlock.value);
                    // We only get `position` data in string output for JSON exceptions, so just report the error at the start of the block.
                    fileErrors.push({
                        line:    jsonBlock.position.start.line + position.line,
                        column:  position.column,
                        message: jsonException.message
                    });
                }
            }
            // JSON5 is the only other option.
            else {
                try {
                    JSON5.parse(jsonBlock.value);
                }
                catch (json5Exception) {
                    // the `json5` parser returns more precise data about the line number within a failing block, so for these our numbers are exact.
                    fileErrors.push({
                        line:    jsonBlock.position.start.line + json5Exception.lineNumber,
                        column:  json5Exception.columnNumber,
                        message: json5Exception.message
                    });
                }
            }
        });

        toReturn.checked++;
        if (fileErrors.length) {
            toReturn.invalid++;
            var relativePath = path.relative(options.rootPath, pathToFile);
            toReturn.errorsByPath[relativePath] = fileErrors;
        }
        else {
            toReturn.valid++;
        }
    });

    return toReturn;
};


fluid.lintAll.findJsonBlocks = function (node) {
    var jsonBlocks = [];

    if (node.type === "CodeBlock" && ["json", "json5"].indexOf(node.lang) !== -1) {
        jsonBlocks.push(node);
    }

    fluid.each(node.children, function (childNode) {
        jsonBlocks = jsonBlocks.concat(fluid.lintAll.findJsonBlocks(childNode));
    });

    return jsonBlocks;
};

fluid.lintAll.extractPosition = function (errorString, originalMaterial) {
    var positionDef = { column: 0, line: 0, position: 0 };

    var matches = errorString.match(/at position ([0-9]+)/);
    if (matches) {
        var position = parseInt(matches[1]);
        positionDef.position = position;

        // Split the substring up to the "position" into lines.
        var lines = originalMaterial.substring(0, position).split(/[\r\n]+/);
        positionDef.line = lines.length;

        // The length of the last line is the column position of the error.
        positionDef.column = lines[lines.length - 1].length + 1;
    }

    return positionDef;
};
