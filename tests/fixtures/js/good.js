"use strict";
var fluid = require("infusion");
var foo = "bar";

/**
 * A function to test JSDocs support with, including complex indentation.
 *
 * @param {String} myString - A string.
 * @return {Object} - A payload that contains:
 *  - `isError`: set to `true` if there's an error.
 *  - `message`: a mesage about the results of the call.
 */
var myFunc = function (myString) {
    fluid.log(myString);
    return { isError: false, message: "yay" };
};
myFunc(foo);

// Functions to test some modern ecmascript syntax

let asyncMessage = async () => {
    return new Promise(resolve => {
        setTimeout(resolve, 100, "testing");
    });
};

const asyncFunc2 = async () => {
    let msg = await asyncMessage();
    fluid.log(msg);
};
asyncFunc2();
