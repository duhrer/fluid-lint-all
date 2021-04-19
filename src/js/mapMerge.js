"use strict";
var fluid = require("infusion");
fluid.registerNamespace("fluid.lintAll");

/**
 *
 * A function to merge two arrays such that:
 *
 * - All entries in `toMergeArray` that do not already exist are added.
 * - All entries in `toMergeArray` that already exist in `baseArray` are overwritten.
 * - All entries in `baseArray` that are not referenced in `toMergeArray` are preserved.
 *
 * The strategy used here is to construct a map based on observed patterns (`true`) and negated patterns (`false`).
 * This allows adding material to the defaults, and also provides a means of "negating" default material if needed.
 *
 * @param {Array} baseArray - An array of underlying values.
 * @param {Array} toMergeArray - An array of values to "overlay" on `baseArray`.
 * @return {Array} - The contents of both arrays, merged.
 *
 */
fluid.lintAll.mapMerge = function (baseArray, toMergeArray) {
    var mergedObject = {};
    fluid.each([baseArray, toMergeArray], function (arrayToMerge) {
        fluid.each(arrayToMerge, function (singleValue) {
            // Convert the glob pattern to a single-entry object ("leaf").
            var singleEntry = fluid.lintAll.globToMapEntry(singleValue);

            // Merge the "leaf" with the existing results ("tree").
            fluid.extend(mergedObject, singleEntry);
        });
    });

    var mergedArray = fluid.lintAll.mergedMapToGlobs(mergedObject);
    return mergedArray;
};

/**
 *
 * Convert a merged map of `true` / `false` values into an array of positive and negated "glob" patterns.
 *
 * @param {Object} mergedMap - The map to convert.
 * @return {Array<String>} - An array of "glob" patterns.
 *
 */
fluid.lintAll.mergedMapToGlobs = function (mergedMap) {
    var globs = [];
    fluid.each(mergedMap, function (value, key) {
        var singleValue = value ? key : "!" + key;
        globs.push(singleValue);
    });
    return globs;
};

/**
 *
 * Convert a glob pattern to a single-entry object that can be merged with other converted glob patterns.
 *
 * @param {String} glob - A single "glob" pattern.
 * @return {Object} - A single-entry object whose key is the glob pattern, and whose value indicates whether the
 * value is positive or negated.
 *
 */
fluid.lintAll.globToMapEntry = function (glob) {
    var isPositive = glob.charAt(0) !==  "!";
    var entryValue = isPositive ? glob : glob.substring(1);
    var toReturn = {};
    toReturn[entryValue] = isPositive;
    return toReturn;
};
