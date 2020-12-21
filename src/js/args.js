"use strict";
var fluid = require("infusion");

fluid.registerNamespace("fluid.lintAll");

fluid.lintAll.cleanArg = function (argString) {
    var cleanedArgString = argString.replace(/^['"](.+)['"]$/, "$1");
    return cleanedArgString;
};

fluid.lintAll.parseArgs = function (processArgs) {
    var argsMinusNodeArgs = processArgs.slice(2);
    var argsOptions = {};
    fluid.each(argsMinusNodeArgs, function (singleArgument) {
        if (singleArgument === "--") { return; }

        var argumentSegs = singleArgument.split("=");
        if (argumentSegs.length) {
            var argumentKey = argumentSegs[0].replace(/^--?/, "");
            var argumentValue = new Error("Missing argument value.");
            if (argumentSegs.length > 1) {
                var remainingArgumentMaterial = argumentSegs.slice(1).join("=");
                argumentValue = fluid.lintAll.cleanArg(remainingArgumentMaterial);
            }

            if (argumentKey === "checks") {
                argsOptions.checks = typeof argumentValue === "string" ? argumentValue.split(/[ ,]+/) : argumentValue;
            }
            else if (argumentKey === "configFile") {
                argsOptions.configFile = argumentValue;
            }
            else {
                // Strip the value but flag the argument as having been passed.  Note that an empty invalid argument
                // will only trigger this error.
                argsOptions[argumentKey] = new Error("Invalid argument '" + argumentKey + "'.");
            }
        }
    });

    return argsOptions;
};
