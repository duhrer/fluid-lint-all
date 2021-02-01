"use strict";
var fluid = require("infusion");
var jqUnit = require("node-jqunit");
var child_process = require("child_process");

require("json5/lib/register");

require("../../index");

jqUnit.module("Tests for the fluid-lint-all launcher.");

fluid.registerNamespace("fluid.tests.lintAll.launcher");

fluid.tests.lintAll.launcher.runSingleCheck = function (checkKey, testDef) {
    var cwd = fluid.module.resolvePath("%fluid-lint-all");
    var commandSegs = ["node", "src/js/launcher.js"];
    if (testDef.configFile) {
        commandSegs.push("--configFile=" + testDef.configFile);
    }
    if (checkKey !== "all") {
        commandSegs.push("--checks=" + checkKey);
    }
    if (testDef.extraArgs) {
        commandSegs = commandSegs.concat(testDef.extraArgs);
    }
    var command = commandSegs.join(" ");

    jqUnit.stop();
    child_process.exec(command, { cwd: cwd }, function (error, stdout) {
        jqUnit.start();
        if (error) {
            if (testDef.shouldBeInvalid) {
                jqUnit.assert("Check'" + checkKey + "' correctly reported invalid content.");
            }
            else {
                jqUnit.fail("Check '" + checkKey + "' should not have reported invalid content.");
            }
        }
        else {
            if (testDef.shouldBeInvalid) {
                jqUnit.fail("Check '" + checkKey + "' did not report invalid content, but should have.");
            }
            else {
                jqUnit.assert("Check '" + checkKey + "' correctly reported valid content.");
            }
        }

        if (testDef.expectedMessage) {
            jqUnit.assertTrue("The output should contain the expected message.", stdout.match(testDef.expectedMessage));
        }
    });
};

fluid.tests.lintAll.launcher.runTests = function (testDefs) {
    var supportedChecks = require("../../src/json/supportedChecks.json5");

    var checkKeys = [];
    fluid.each(supportedChecks, function (checkDef, checkKey) {
        checkKeys.push(checkKey);
        fluid.each(checkDef.subchecks, function (subcheckDef, subcheckSuffix) {
            var subcheckKey = [checkKey, subcheckSuffix].join(".");
            checkKeys.push(subcheckKey);
        });
    });

    fluid.each(testDefs, function (testDef) {
        jqUnit.test(testDef.message, function () {
            // One check per task plus an extra check for all tasks.
            var expectedAssertions = testDef.expectedMessage ? (checkKeys.length * 2) + 1 : checkKeys.length + 1;
            if (testDef.expectedMessage) {
                expectedAssertions++;
            }
            jqUnit.expect(expectedAssertions);

            fluid.each(checkKeys, function (checkKey) {
                fluid.tests.lintAll.launcher.runSingleCheck(checkKey, testDef);
            });

            fluid.tests.lintAll.launcher.runSingleCheck("all", testDef);
        });
    });
};

fluid.defaults("fluid.tests.lintAll.launcher.runner", {
    gradeNames: ["fluid.component"],
    testDefs: {
        excludes: {
            message: "We should be able to exclude content from linting checks."
        },
        bad: {
            message: "Invalid content should be reported as invalid.",
            configFile: ".noop.json", // This will remove our project-wide excludes and result in errors.
            shouldBeInvalid: true,
            expectedMessage: "FAIL - One or more linting checks have errors."
        },
        disabled: {
            message: "We should be able to disable all checks using a configuration file.",
            configFile: ".fluidlintallrc-disabled.json",
            shouldBeInvalid: true,
            expectedMessage: "ERROR: No files checked, please review your configuration and command line arguments."
        },
        help: {
            message: "We should be able to print usage instructions.",
            configFile: ".fluidlintallrc",
            extraArgs: ["--help"],
            expectedMessage: "USAGE: This command supports the following options:"
        },
        badArg: {
            message: "We should be able to report a bad command-line argument.",
            configFile: ".fluidlintallrc",
            shouldBeInvalid: true,
            extraArgs: ["--badArg"],
            expectedMessage: "ERROR: Invalid argument 'badArg'."
        }
    },
    listeners: {
        "onCreate.runTests": {
            funcName: "fluid.tests.lintAll.launcher.runTests",
            args:     ["{that}.options.testDefs"]
        }
    }
});

fluid.tests.lintAll.launcher.runner();
