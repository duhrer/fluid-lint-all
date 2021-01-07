"use strict";
var fluid = require("infusion");

var minimist = require("minimist");

fluid.registerNamespace("fluid.lintAll");

fluid.lintAll.cleanArg = function (argString) {
    var cleanedArgString = argString.replace(/^['"](.+)['"]$/, "$1");
    return cleanedArgString;
};

fluid.lintAll.parseArgs = function (processArgs) {
    var minimistOptions = minimist(processArgs.slice(2), {
        boolean: ["showMergedConfig", "showHelp"],
        string: ["checks", "configFile"],
        aliases: {
            "h": "showHelp",
            "help": "showHelp"
        }
    });

    // Minimist only handles parsing and not validation, so we lightly validate the input here.
    var supportedArgKeys = ["checks", "configFile", "showMergedConfig", "showHelp"];
    var argsOptions = fluid.filterKeys(minimistOptions, supportedArgKeys);
    if (argsOptions.checks) {
        argsOptions.checks = argsOptions.checks.trim().replace(/^"(.+)"$/, "$1").split(/ *, */);
    }

    if (minimistOptions.configFile === "") {
        argsOptions.configFile = new Error("Missing filename.");
    }

    var badArgs = fluid.filterKeys(minimistOptions, supportedArgKeys, true);
    fluid.each(badArgs, function (badArgumentValue, badArgumentKey) {
        if (badArgumentKey !== "_") {
            argsOptions[badArgumentKey] = new Error("Invalid argument '" + badArgumentKey + "'.");
        }
    });

    return argsOptions;
};
