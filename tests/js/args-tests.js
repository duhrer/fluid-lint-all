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
    noFlags: {
        message: "We should be able to handle no flags at all.",
        args: [],
        expected: {}
    },
    singleDash: {
        message: "We should be able to handle flags with a single dash.",
        args: ["-configFile=foo", "-checks=bar"],
        expected: { configFile: "foo", checks: ["bar"] }
    },
    doubleDash: {
        message: "We should be able to handle flags with a double dash.",
        args: ["--configFile=foo", "--checks=bar"],
        expected: { configFile: "foo", checks: ["bar"] }
    },
    invalidArgs: {
        message: "We should be able to handle invalid arguments.",
        args: ["--stuff=nonsense", "--configFile=foo"],
        errorKeys: ["stuff"],
        expected: { configFile: "foo" }
    },
    missingValues: {
        message: "We should be able to handle missing argument values.",
        args: ["--configFile", "--checks=foo"],
        errorKeys: ["configFile"],
        expected: { checks: ["foo"] }
    },
    singleQuotes: {
        message: "We should be able to handle single-quoted argument values.",
        args: ["--configFile='foo'", "--checks='bar'"],
        expected: { configFile: "foo", checks: ["bar"] }
    },
    doubleQuotes: {
        message: "We should be able to handle double-quoted argument values.",
        args: ["--configFile=\"foo\"", "--checks=\"bar\""],
        expected: { configFile: "foo", checks: ["bar"] }
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
