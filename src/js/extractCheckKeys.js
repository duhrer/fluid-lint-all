"use strict";
var fluid = require("infusion");
fluid.registerNamespace("fluid.lintAll");

fluid.lintAll.extractCheckKeys = function (supportedChecks) {
    var supportedCheckKeys = [];
    var addCheckKeys = function (checkPrefix, checkSuffix, checkDef) {
        var checkKey = checkPrefix === "" ? checkSuffix : [checkPrefix, checkSuffix].join(".");
        if (checkDef.subchecks) {
            fluid.each(checkDef.subchecks, function (subCheckDef, subCheckKey) {
                addCheckKeys(checkKey, subCheckKey, subCheckDef);
            });
        }
        else {
            supportedCheckKeys.push(checkKey);
        }
    };
    fluid.each(supportedChecks, function (checkDef, checkKey) {
        addCheckKeys("", checkKey, checkDef);
    });
    return supportedCheckKeys;
};
