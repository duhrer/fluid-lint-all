"use strict";
var fluid = require("infusion");
fluid.registerNamespace("fluid.lintAll");

fluid.lintAll.mapMerge = function (baseArray, toMergeArray) {
    var mergedObject = {};
    fluid.each([baseArray, toMergeArray], function (arrayToMerge) {
        fluid.each(arrayToMerge, function (singleValue) {
            var singleEntry = fluid.lintAll.globToMapEntry(singleValue);
            fluid.extend(mergedObject, singleEntry);
        });
    });

    var mergedArray = fluid.lintAll.mergedMapToGlobs(mergedObject);
    return mergedArray;
};

fluid.lintAll.mergedMapToGlobs = function (mergedMap) {
    var globs = [];
    fluid.each(mergedMap, function (value, key) {
        var singleValue = value ? key : "!" + key;
        globs.push(singleValue);
    });
    return globs;
};

fluid.lintAll.globToMapEntry = function (glob) {
    var isPositive = glob.indexOf("!") !== 0;
    var entryValue = isPositive ? glob : glob.substring(1);
    var toReturn = {};
    toReturn[entryValue] = isPositive;
    return toReturn;
};
