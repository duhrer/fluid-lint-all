// A rollup has sub-checks but does not run any checks directly.
"use strict";
var fluid = require("infusion");

require("./check");

fluid.defaults("fluid.lintAll.rollup", {
    gradeNames: ["fluid.lintAll.check"],
    members: {
        subChecks: []
    },
    invokers: {
        runChecks: {
            funcName: "fluid.lintAll.rollup.runChecks",
            args: ["{that}", "{arguments}.0"] // checksToRun
        }
    }
});

fluid.lintAll.rollup.runChecks = function (that, checksToRun) {
    var childResults = [];
    fluid.visitComponentChildren(that, function (childComponent) {
        if (fluid.componentHasGrade(childComponent, "fluid.lintAll.check")) {
            if (!checksToRun || checksToRun.includes(childComponent.options.key) || checksToRun.includes(that.options.key)) {
                var childResult = childComponent.runChecks(checksToRun);
                childResults.push(childResult);
            }
        }
    }, { flat: true });
    return fluid.promise.sequence(childResults);
};
