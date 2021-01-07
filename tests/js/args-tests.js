"use strict";
var fluid = require("infusion");
var jqUnit = require("node-jqunit");

require("../../src/js/args");

fluid.registerNamespace("fluid.test.lintAll.args");

fluid.test.lintAll.args.generateProcessArgs = function (trailingArgs) {
    return ["node", "path/to/file.js"].concat(trailingArgs);
};

fluid.test.lintAll.args.parseArgs = function (trailingArgs) {
    var processArgs = fluid.test.lintAll.args.generateProcessArgs(trailingArgs);
    return fluid.lintAll.parseArgs(processArgs);
};


jqUnit.module("Unit tests for argument parsing.");

var testDefs = {
    noArgs: {
        message: "We should be able to handle no arguments at all.",
        args: [],
        expected: { showHelp: false, showMergedConfig: false }
    },
    invalidArgs: {
        message: "We should be able to handle invalid arguments.",
        args: ["--stuff=nonsense", "--configFile=foo"],
        errorKeys: ["stuff"],
        expected: { configFile: "foo", showHelp: false, showMergedConfig: false }
    },
    missingValues: {
        message: "We should be able to handle missing argument values.",
        args: ["--configFile", "--checks=foo"],
        errorKeys: ["configFile"],
        expected: { checks: ["foo"], showHelp: false, showMergedConfig: false  }
    },
    checksArrayNoQuotes: {
        message: "We should be able to handle a comma-delimited array of checks.",
        args: ["--checks=foo,bar,baz"],
        expected: { checks: ["foo", "bar", "baz"], showHelp: false, showMergedConfig: false  }

    },
    checksQuotedArray: {
        message: "We should be able to handle a quoted array of checks, including spaces.",
        args: ["--checks=\"rice chex,corn chex, wheat chex ,pretzels,peanuts\""],
        expected: { checks: ["rice chex", "corn chex", "wheat chex", "pretzels", "peanuts"], showHelp: false, showMergedConfig: false  }
    },
    checksSingleValue: {
        message: "We should be able to handle missing argument values.",
        args: ["--checks=blank"],
        expected: { checks: ["blank"], showHelp: false, showMergedConfig: false  }
    }
};

fluid.each(testDefs, function (testDef) {
    jqUnit.test(testDef.message, function () {
        var output = fluid.test.lintAll.args.parseArgs(testDef.args);

        if (testDef.errorKeys) {
            jqUnit.assertLeftHand("The output should contain all expected non-error fields.", testDef.expected, output);

            fluid.each(testDef.errorKeys, function (errorKey) {
                var expectedError = fluid.get(output, errorKey);
                jqUnit.assertTrue("The output should contain expected errors.", expectedError instanceof Error);
            });
        }
        else {
            jqUnit.assertDeepEq("The output should be as expected.", testDef.expected, output);
        }
    });
});
