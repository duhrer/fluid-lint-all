"use strict";
var fluid = require("infusion");
var fs = require("fs");
var path = require("path");
var process = require("process");
require("json5/lib/register");

require("../../index");

require("./eslint");
require("./json5lint");
require("./jsonEslint");
require("./jsonlint");
require("./lintspaces");
require("./logger");
require("./markdownlint");
require("./mdjsonlint");
require("./stylelint");

fluid.registerNamespace("fluid.lintAll");

/**
 *
 * Instantiate a `fluid.lintAll.checkRunner` with the common configuration file options, and trigger a check run.
 *
 * @param {ParsedArgs} argsOptions - The parsed set of arguments, typically derived from `process.argv`.
 * @return {Promise<Array<CheckResults>>} - A `fluid.promise.sequence` that will be resolved with a (potentially) nested
 * array of `CheckResult` objects.
 *
 */
fluid.lintAll.runAllChecks = function (argsOptions) {
    var configFileOptions = {};

    var configFileArgsPath = fluid.get(argsOptions, "configFile") || ".fluidlintallrc.json";
    var resolvedArgsPath = fluid.module.resolvePath(configFileArgsPath);
    var configFilePath = path.resolve(process.cwd(), resolvedArgsPath);
    if (fs.existsSync(configFilePath)) {
        configFileOptions = require(configFilePath);
    }

    var checkRunner = fluid.lintAll.checkRunner({ config: configFileOptions });
    return checkRunner.runAllChecks(argsOptions);
};

fluid.defaults("fluid.lintAll.checkRunner", {
    gradeNames: ["fluid.component"],
    distributeOptions: {
        rootPath: {
            "source": "{that}.options.config.rootPath",
            "target": "{that fluid.lintAll.check}.options.rootPath"
        },
        minimatchOptions: {
            "source": "{that}.options.config.minimatchOptions",
            "target": "{that fluid.lintAll.check}.options.minimatchOptions"
        },
        useGitIgnore: {
            "source": "{that}.options.config.useGitIgnore",
            "target": "{that fluid.lintAll.check}.options.useGitIgnore"
        }
    },
    invokers: {
        runAllChecks: {
            funcName: "fluid.lintAll.checkRunner.runAllChecks",
            args: ["{that}", "{arguments}.0"]
        }
    },
    config: {
        rootPath: process.cwd(),
        useGitIgnore: true,
        "sources": {
            "css": ["./*.css", "./src/**/*.css", "tests/**/*.css"],
            "js": ["./src/**/*.js", "./tests/**/*.js", "./*.js"],
            "json": ["./src/**/*.json", "./tests/**/*.json", "./*.json"],
            "json5": ["./src/**/*.json5", "./tests/**/*.json5", "./*.json5"],
            "md": ["./src/**/*.md", "./tests/**/*.md", "./*.md"],
            "scss": ["./*.scss", "./src/**/*.scss", "tests/**/*.scss"]
        },
        "minimatchOptions": {
            "dot": true,
            "matchBase": true
        },
        "eslint": {
            "enabled": true,
            "js": {
                "enabled": true,
                "includes": "{that}.options.config.sources.js",
                "excludes": [],
                "options": {
                    "ignore": false,
                    "resolvePluginsRelativeTo": "@expand:fluid.module.resolvePath(%fluid-lint-all)",
                    "overrideConfig": {}
                }
            },
            "json": {
                "enabled": true,
                "includes": {
                    "expander": {
                        func: "fluid.flatten",
                        args: [["{that}.options.config.sources.json", "{that}.options.config.sources.json5"]]
                    }
                },
                "excludes": [],
                options: {
                    "resolvePluginsRelativeTo": "@expand:fluid.module.resolvePath(%fluid-lint-all)",
                    "overrideConfig": {
                        "rules": {
                            /*
                                Our approach doesn't work well with leading comments in json5 files, which appear to be incorrectly
                                indented.  As we check for indentation using lintspaces, we can safely disable that check here.
                            */
                            "indent": "off",
                            /*
                                Allow ES5 multi-line strings.
                            */
                            "no-multi-str": "off",
                            "trailing-comma": "off"
                        }
                    }
                }
            },
            "md": {
                "enabled": true,
                "includes": "{that}.options.config.sources.md",
                "excludes": [],
                "options": {
                    "resolvePluginsRelativeTo": "@expand:fluid.module.resolvePath(%fluid-lint-all)",
                    "overrideConfig": {
                        "env": {
                            "browser": true
                        },
                        "rules": {
                            "no-undef": "off",
                            "strict": "off",
                            "no-unused-vars": "off",
                            "no-console": "off"
                        },
                        "plugins": [
                            "markdown"
                        ]
                    }
                }
            }
        },
        "json5lint": {
            "enabled": true,
            "includes": "{that}.options.config.sources.json5",
            "excludes": []
        },
        "jsonlint": {
            "enabled": true,
            "includes": "{that}.options.config.sources.json",
            "excludes": []
        },
        "lintspaces": {
            "enabled": true,
            "jsonindentation": {
                "enabled": true,
                "includes": {
                    "expander": {
                        func: "fluid.flatten",
                        args: [["{that}.options.config.sources.json", "{that}.options.config.sources.json5"]]
                    }
                },

                "excludes": [],
                "options": {
                    indentation: "spaces",
                    spaces: 4
                }
            },
            "newlines": {
                "enabled": true,
                "includes": ["./src/**/*", "./tests/**/*", "./*"],
                "excludes": [
                    "./package-lock.json",
                    "*.aiff",
                    "*.eot",
                    "*.gif",
                    "*.ico",
                    "*.jpg",
                    "*.jpeg",
                    "*.mp3",
                    "*.mp4",
                    "*.otf",
                    "*.pdf",
                    "*.png",
                    "*.ppt",
                    "*.pptx",
                    "*.svg",
                    "*.wav",
                    "*.webm",
                    "*.webp",
                    "*.woff",
                    "*.woff2"
                ],
                options: {
                    newline: true
                }
            }
        },
        "markdownlint": {
            "enabled": true,
            "includes": "{that}.options.config.sources.md",
            "excludes": [],
            options: { config: "@expand:fluid.require(%markdownlint-config-fluid/.markdownlintrc.json)" }
        },
        "mdjsonlint": {
            "enabled": true,
            "includes": "{that}.options.config.sources.md",
            "excludes": []
        },
        "stylelint": {
            "enabled": true,
            "includes": {
                "expander": {
                    "func": "fluid.flatten",
                    "args": [["{that}.options.config.sources.css", "{that}.options.config.sources.scss"]]
                }
            },
            "excludes": [],
            options: {
                configFile: "@expand:fluid.module.resolvePath(%fluid-lint-all/.stylelintrc.json)"
            }
        }
    },
    components: {
        "eslint": {
            type: "fluid.lintAll.eslint",
            options: {
                config: "{fluid.lintAll.checkRunner}.options.config.eslint"
            }
        },
        "json5lint": {
            type: "fluid.lintAll.json5lint",
            options: {
                config: "{fluid.lintAll.checkRunner}.options.config.json5lint"
            }
        },
        "jsonlint": {
            type: "fluid.lintAll.jsonlint",
            options: {
                config: "{fluid.lintAll.checkRunner}.options.config.jsonlint"
            }
        },
        "lintspaces": {
            type: "fluid.lintAll.lintspaces",
            options: {
                config: "{fluid.lintAll.checkRunner}.options.config.lintspaces"
            }
        },
        "markdownlint": {
            type: "fluid.lintAll.markdownlint",
            options: {
                config: "{fluid.lintAll.checkRunner}.options.config.markdownlint"
            }
        },
        "mdjsonlint": {
            type: "fluid.lintAll.mdjsonlint",
            options: {
                config: "{fluid.lintAll.checkRunner}.options.config.mdjsonlint"
            }
        },
        "stylelint": {
            type: "fluid.lintAll.stylelint",
            options: {
                config: "{fluid.lintAll.checkRunner}.options.config.stylelint"
            }
        }
    }
});

/**
 *
 * Look for any direct sub-components that are `fluid.lintAll.checks`, and run each of them.
 *
 * @param {Object} that - The `fluid.lintAll.checkRunner` component.
 * @param {ParsedArgs} argsOptions - Parsed command line arguments.
 * @return {Promise<Array<CheckResults>>} - A promise that will be resolved with a (potentially nested) array of
 * `CheckResults` objects.
 *
 */
fluid.lintAll.checkRunner.runAllChecks = function (that, argsOptions) {
    var allChecksPromise = fluid.promise();

    var checkPromises = [];

    var overallResults = {
        valid:   0,
        invalid: 0,
        checked: 0
    };

    var checkArgs = fluid.get(argsOptions, "checks");
    fluid.log(fluid.logLevel.WARN);
    fluid.log(fluid.logLevel.WARN, "======================================================");

    if (checkArgs && checkArgs.length) {
        fluid.log(fluid.logLevel.WARN, " fluid-lint-all: Running the following checks:");
        fluid.each(checkArgs, function (singleArgument) {
            fluid.log(fluid.logLevel.WARN, " - " + singleArgument);
        });
    }
    else {
        fluid.log(fluid.logLevel.WARN, "fluid-lint-all: Running all checks.");
    }

    fluid.log(fluid.logLevel.WARN, "======================================================");
    fluid.log(fluid.logLevel.WARN);

    if (argsOptions.showMergedConfig) {
        var currentLogObjectRenderChars = fluid.logObjectRenderChars;
        fluid.logObjectRenderChars = 100000;
        fluid.log(fluid.logLevel.WARN, "Merged Configuration:");
        fluid.log(fluid.logLevel.WARN, JSON.stringify(that.options.config, null, 2));
        fluid.logObjectRenderChars = currentLogObjectRenderChars;
    }

    fluid.visitComponentChildren(that, function (childComponent) {
        if (fluid.componentHasGrade(childComponent, "fluid.lintAll.check")) {
            var checkPromise = childComponent.runChecks(checkArgs);
            checkPromises.push(checkPromise);
        }
    }, { flat: true });

    var allChecksSequence = fluid.promise.sequence(checkPromises);

    allChecksSequence.then(function (checkResultsArray) {
        fluid.each(fluid.flatten(checkResultsArray), function (checkResults) {
            if (checkResults.checked) {
                fluid.set(overallResults, checkResults.key, fluid.filterKeys(checkResults, ["key"], true));

                overallResults.valid   += checkResults.valid;
                overallResults.invalid += checkResults.invalid;
                overallResults.checked += checkResults.checked;
            }
        });

        if (overallResults.checked) {
            // Output a summary of the results, including all observed errors.
            fluid.lintAll.logger.outputSummary(overallResults, argsOptions);

            if (overallResults.invalid > 0) {
                allChecksPromise.reject(new Error("One or more linting checks did not pass."));
            }
            else {
                allChecksPromise.resolve(overallResults);
            }
        }
        else {
            allChecksPromise.reject(new Error("ERROR: No files checked, please review your configuration and command line arguments."));
        }
    }, allChecksPromise.reject); // TODO: Consider making this more forgiving.
    return allChecksPromise;
};
