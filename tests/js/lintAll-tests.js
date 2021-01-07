"use strict";
var fluid = require("infusion");
var jqUnit = require("node-jqunit");

require("../../src/js/lint-all");

fluid.registerNamespace("fluid.test.lintAll");

fluid.test.lintAll.checkSingleTally = function (tally) {
    fluid.each(["checked", "invalid", "valid"], function (key) {
        var singleTallyEntry = fluid.get(tally, key);

        jqUnit.assertTrue("Each tally entry should be a number.", typeof singleTallyEntry === "number");
        jqUnit.assertTrue("Each tally entry should not be negative.", singleTallyEntry >= 0);
    });

    jqUnit.assertTrue("The tally entries should match.", tally.checked === (tally.valid + tally.invalid));
};

fluid.test.lintAll.checkSingleResult = function (testDef) {
    jqUnit.asyncTest(testDef.message, function () {
        // There is always an overall integrity check for the promise mechanisms used.
        // If the run should fail, there should be one more check confirming the promise was rejected.
        // If the run succeeds, there should be 10 checks * 7 tests, and two additional summary checks.
        jqUnit.expect(testDef.shouldFail ? 2 : 74);

        var allChecksPromise = fluid.lintAll.runAllChecks(testDef.argsOptions);
        jqUnit.assertTrue("`runAllChecks` should return a promise.", fluid.isPromise(allChecksPromise));

        var promiseResolveTimeout = setTimeout( function () {
            jqUnit.start();
            jqUnit.fail("The check promise should have resolved within 5 seconds.");
        }, 5000);

        allChecksPromise.then(
            function (results) {
                clearTimeout(promiseResolveTimeout);
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
                    var checkTallyLevel = function (tallyLevel, tallyKey, isRoot) {
                        var nonTallyEntries = fluid.filterKeys(tallyLevel, ["checked", "valid", "invalid", "errorsByPath"], true);
                        // This is a rollup and lacks its own results summary.
                        if (fluid.keys(nonTallyEntries).length > 0) {
                            fluid.each(nonTallyEntries, checkTallyLevel);
                        }
                        // This is an individual report and has no subchecks.
                        else {
                            fluid.test.lintAll.checkSingleTally(tallyLevel);

                            // Skip the root entry and any rollup checks that lack their own totals.
                            if (!isRoot && tallyLevel.checked !== undefined) {
                                recountTally.checked += tallyLevel.checked;
                                recountTally.valid += tallyLevel.valid;
                                recountTally.invalid += tallyLevel.invalid;
                            }
                        }
                    };

                    checkTallyLevel(results, "root", true);
                    fluid.each(["checked", "valid", "invalid"], function (key) {
                        jqUnit.assertEquals("The totals for all checks should match the overall summary.", results[key], recountTally[key]);
                    });
                }
            },
            function (error) {
                clearTimeout(promiseResolveTimeout);
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
