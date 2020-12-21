"use strict";
var fluid = require("infusion");
var jqUnit = require("node-jqunit");

require("../../src/js/lint-all");

fluid.registerNamespace("fluid.test.lintAll");

// TODO: There is never output from one of the tests, and there's no summary.  Discuss with Antranig.

fluid.test.lintAll.checkSingleTally = function (tally) {
    fluid.each(["checked", "invalid", "valid"], function (key) {
        var singleTallyEntry = fluid.get(tally, key);
        jqUnit.assertTrue("Each tally entry should be a number.", typeof singleTallyEntry === "number");
        jqUnit.assertTrue("Each tally entry should be positive.", singleTallyEntry > 0);
    });

    jqUnit.assertTrue("The tally entries should match.", tally.checked === (tally.valid + tally.invalid));
};

fluid.test.lintAll.checkSingleResult = function (testDef) {
    fluid.log(fluid.logLevel.FAIL, testDef.message);
    jqUnit.asyncTest(testDef.message, function () {
        jqUnit.expect(testDef.shouldFail ? 1 : 70); // If the run succeeds, there are 10 checks * 7 tests

        var allChecksPromise = fluid.lintAll.runAllChecks(testDef.argsOptions);
        allChecksPromise.then(
            function (results) {
                jqUnit.start();
                if (testDef.shouldFail) {
                    jqUnit.fail("Checks were expected to fail, but did not.");
                }
                else {
                    var recountTally = {
                        checked: 0,
                        valid:   0,
                        invalid: 0
                    };
                    var checkTallyLevel = function (tallyLevel, isRoot) {
                        fluid.test.lintAll.checkSingleTally(tallyLevel);

                        // Skip the root entry and any rollup checks that lack their own totals.
                        if (!isRoot && tallyLevel.checked !== undefined) {
                            recountTally.checked += tallyLevel.checked;
                            recountTally.valid += tallyLevel.valid;
                            recountTally.invalid += tallyLevel.invalid;
                        }
                        var nonTallyEntries = fluid.filterKeys(tallyLevel, ["checked", "valid", "invalid"]);
                        fluid.each(nonTallyEntries, checkTallyLevel);
                    };

                    checkTallyLevel(results);
                    fluid.each(["checked", "valid", "invalid"], function (key) {
                        jqUnit.assertEquals("The totals for all checks should match the overall summary.", results[key], recountTally[key]);
                    });
                }
            },
            function (error) {
                jqUnit.start();
                if (testDef.shouldFail) {
                    jqUnit.assert("Checks failed as expected.");
                }
                else {
                    jqUnit.fail("Checks failed, but were not expected to:" + error.message);
                }
            }
        );
    });
};

fluid.test.lintAll.runTests = function () {
    var testDefs = {
        allDisabled: {
            message: "If all checks are disabled, there should be an error.",
            argsOptions: {
                checks: []
            },
            shouldFail: true
        },
        noArgs: {
            message: "If we run with no custom arguments, the checks should pass.",
            argsOptions: {},
            expected: { checked: 0, valid: 0, invalid: 0 }
        }
    };

    fluid.each(testDefs, fluid.test.lintAll.checkSingleResult);
};

fluid.test.lintAll.runTests();
