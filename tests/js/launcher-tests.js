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

    var allCheckKeys = [];
    fluid.each(supportedChecks, function (checkDef, checkKey) {
        allCheckKeys.push(checkKey);
        fluid.each(checkDef.subchecks, function (subcheckDef, subcheckSuffix) {
            var subcheckKey = [checkKey, subcheckSuffix].join(".");
            allCheckKeys.push(subcheckKey);
        });
    });

    fluid.each(testDefs, function (testDef) {
        jqUnit.test(testDef.message, function () {
            var checksToRun = testDef.checks || allCheckKeys;

            // One check per task plus an extra check for all tasks.
            var expectedAssertions = testDef.expectedMessage ? (checksToRun.length * 2) + 1 : checksToRun.length + 1;
            if (testDef.expectedMessage) {
                expectedAssertions++;
            }
            jqUnit.expect(expectedAssertions);

            fluid.each(checksToRun, function (checkKey) {
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
            configFile: ".fluidlintallrc-no-excludes.json", // This will remove our project-wide excludes and result in errors.
            shouldBeInvalid: true,
            expectedMessage: "FAIL - One or more linting checks have errors."
        },
        customOptions: {
            message: "We should be able to configure linting checks using custom options.",
            configFile: ".fluidlintallrc-custom-options.json"
        },
        disabled: {
            message: "We should be able to disable all checks using a configuration file.",
            configFile: ".fluidlintallrc-disabled.json",
            shouldBeInvalid: true,
            expectedMessage: "ERROR: No files checked, please review your configuration and command line arguments."
        },
        help: {
            message: "We should be able to print usage instructions.",
            configFile: ".fluidlintallrc.json",
            extraArgs: ["--help"],
            expectedMessage: "USAGE: This command supports the following options:"
        },
        badArg: {
            message: "We should be able to report a bad command-line argument.",
            configFile: ".fluidlintallrc.json",
            shouldBeInvalid: true,
            extraArgs: ["--badArg"],
            expectedMessage: "ERROR: Invalid argument 'badArg'."
        },
        mergedConfig: {
            message: "We should be able to use the non-API 'showMergedConfig' option.",
            configFile: ".fluidlintallrc.json",
            extraArgs: ["--showMergedConfig"],
            expectedMessage: ["Merged Configuration:"]
        },
        showCheckedFiles: {
            message: "We should be able to use the 'showCheckedFiles' option.",
            configFile: ".fluidlintallrc.json",
            extraArgs: ["--showCheckedFiles"],
            expectedMessage: ["Files checked by "]
        },
        noFiles: {
            message: "We should report an error if no files are checked.",
            configFile: ".fluidlintallrc-nofiles.json",
            shouldBeInvalid: true,
            expectedMessage: ["ERROR: No files checked, please review your configuration and command line arguments."]
        },
        useGitIgnore: {
            message: "We should be able to exclude files included in a .gitignore file.",
            configFile: ".fluidlintallrc-gitignore.json"
        },
        disableGitIgnore: {
            message: "We should be able to disable excluding files included in a .gitignore file.",
            configFile: ".fluidlintallrc-gitignore-disabled.json",
            shouldBeInvalid: true,
            expectedMessage: "FAIL - One or more linting checks have errors."
        },
        badStylelintOption: {
            message: "Bad stylelint options should be reported correctly.",
            configFile: ".fluidlintallrc-invalid-stylelint-option.json",
            shouldBeInvalid: true,
            checks: ["stylelint"],
            expectedMessage: "Unexpected option value \"bad value\" for rule \"string-no-newline\""
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
