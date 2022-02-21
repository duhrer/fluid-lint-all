"use strict";
var fluid = require("infusion");
var fs   = require("fs");
var path = require("path");
var yaml = require("js-yaml");

fluid.registerNamespace("fluid.lintAll");

require("./check");

fluid.defaults("fluid.lintAll.yaml", {
    gradeNames: ["fluid.lintAll.check"],
    key: "yaml",
    invokers: {
        checkImpl: {
            funcName: "fluid.lintAll.yaml.runChecks"
        }
    }
});


/**
 *
 * Run the `yaml` checks, i.e. check that all YAML files are parseable.
 *
 * @param {Object} that - The `fluid.lintAll.yaml` component.
 * @param {Array<String>} filesToScan - An array of files to check.
 * @return {Promise <CheckResults>} - A promise that will resolve with the results of the check.
 *
 */
fluid.lintAll.yaml.runChecks = function (that, filesToScan) {
    filesToScan.forEach( function (pathToFile) {
        try {
            yaml.load(fs.readFileSync(pathToFile, "utf8"));
            that.results.valid++;
        }
        /*
            js-yaml returns errors like:

            {
              "name": "YAMLException",
              "reason": "bad indentation of a mapping entry",
              "mark": {
                "name": null,
                "buffer": "foo: bar\n nope: nope\n",
                "position": 14,
                "line": 1,
                "column": 5,
                "snippet": " 1 | foo: bar\n 2 |  nope: nope\n----------^"
              },
              "message": "bad indentation of a mapping entry (2:6)\n\n 1 | foo: bar\n 2 |  nope: nope\n----------^"
            }

         */
        catch (error) {
            const relativePath = path.relative(that.options.rootPath, pathToFile);
            that.results.invalid++;

            that.results.errorsByPath[relativePath] = [{
                line: error.mark.line,
                column: error.mark.column,
                message: error.reason
            }];
        }

    });
    return that.results;
};
