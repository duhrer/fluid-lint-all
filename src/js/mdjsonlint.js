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

require("./check");

fluid.defaults("fluid.lintAll.mdjsonlint", {
    gradeNames: ["fluid.lintAll.check"],
    key: "mdjsonlint",
    invokers: {
        runChecks: {
            funcName: "fluid.lintAll.mdjsonlint.runChecks"
        }
    }
});

fluid.lintAll.mdjsonlint.runChecks = function (that, checksToRun) {
    if (that.options.config.enabled && !checksToRun || checksToRun.includes(that.options.key)) {
        // Use fluid-glob to get the list of files.
        var filesToScan = fluid.glob.findFiles(that.options.rootPath, that.options.config.includes, that.options.config.excludes, that.options.minimatchOptions);

        fluid.each(filesToScan, function (pathToFile) {
            var markdownString = fs.readFileSync(pathToFile, {encoding: "utf8"});
            var fileErrors = [];
            var ast = mdParser.parse(markdownString);
            var jsonBlocks = fluid.lintAll.findJsonBlocks(ast);

            fluid.each(jsonBlocks, function (jsonBlock) {
                if (jsonBlock.lang === "json") {
                    try {
                        JSON.parse(jsonBlock.value);
                    } catch (jsonException) {
                        var position = fluid.lintAll.extractPosition(jsonException.message, jsonBlock.value);
                        // We only get `position` data in string output for JSON exceptions, so just report the error at the start of the block.
                        fileErrors.push({
                            line: jsonBlock.position.start.line + position.line,
                            column: position.column,
                            message: jsonException.message
                        });
                    }
                }
                // JSON5 is the only other option.
                else {
                    try {
                        JSON5.parse(jsonBlock.value);
                    } catch (json5Exception) {
                        // the `json5` parser returns more precise data about the line number within a failing block, so for these our numbers are exact.
                        fileErrors.push({
                            line: jsonBlock.position.start.line + json5Exception.lineNumber,
                            column: json5Exception.columnNumber,
                            message: json5Exception.message
                        });
                    }
                }
            });

            that.results.checked++;
            if (fileErrors.length) {
                that.results.invalid++;
                var relativePath = path.relative(that.options.rootPath, pathToFile);
                that.results.errorsByPath[relativePath] = fileErrors;
            } else {
                that.results.valid++;
            }
        });
    }

    return that.results;
};


fluid.lintAll.findJsonBlocks = function (node) {
    var jsonBlocks = [];

    if (node.type === "CodeBlock" && ["json", "json5"].includes(node.lang)) {
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
