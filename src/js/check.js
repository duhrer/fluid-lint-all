"use strict";
var fluid = require("infusion");

fluid.defaults("fluid.lintAll.check", {
    gradeNames: ["fluid.component"],
    members: {
        results: {
            key: "{that}.options.key",
            valid:   0,
            invalid: 0,
            checked: 0,
            errorsByPath: {}
        }
    },
    invokers: {
        runChecks: {
            funcName: "fluid.notImplemented",
            args: ["{that}", "{arguments}.0"] // checksToRun
        }
    }
});

/**
 *
 * @typedef {Object} SingleError
 * @param {number} line - The line at which the error was found.
 * @param {number} column - The column at which the error was found.
 * @param {String} message - A description of the error.
 *
 */

/**
 *
 * @typedef CheckResults
 * @param {string} key - The unique identifier of the check being run.
 * @param {number} checked - The number of files checked.
 * @param {number} valid - The number of files that passed the linting checks.
 * @param {number} invalid - The number of files that failed the linting checks.
 * @param {Object <String, Array<SingleError>>} errorsByPath - Arrays of individual linting failures, keyed by the
 * relative path to the file in which they occurred.
 *
 */
