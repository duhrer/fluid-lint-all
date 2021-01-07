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
