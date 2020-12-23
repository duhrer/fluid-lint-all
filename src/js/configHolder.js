"use strict";
var fluid = require("infusion");
var process = require("process");

// TODO: Revisit once we can use a package-relative path.
// https://github.com/fluid-project/markdownlint-config-fluid/pull/2
var baseMarkdownlintConfig = require("markdownlint-config-fluid");

fluid.defaults("fluid.lintAll.configHolder", {
    gradeNames: ["fluid.component"],
    config: {
        rootPath: process.cwd(),
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
            "minimatchOptions": "{that}.options.config.minimatchOptions",
            "rootPath": "{that}.options.config.rootPath",
            "enabled": true,
            "js": {
                "minimatchOptions": "{that}.options.config.minimatchOptions",
                "rootPath": "{that}.options.config.rootPath",
                "enabled": true,
                "includes": "{that}.options.config.sources.js",
                "excludes": [],
                "options": {
                    "resolvePluginsRelativeTo": "@expand:fluid.module.resolvePath(%fluid-lint-all)",
                    "overrideConfig": {}
                }
            },
            "md": {
                "minimatchOptions": "{that}.options.config.minimatchOptions",
                "rootPath": "{that}.options.config.rootPath",
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
        "json-eslint": {
            "minimatchOptions": "{that}.options.config.minimatchOptions",
            "rootPath": "{that}.options.config.rootPath",
            "enabled": true,
            "includes": "@expand:fluid.flatten({that}.options.config.sources.json, {that}.options.config.sources.json5)",
            "excludes": ["./package-lock.json"],
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
        "json5lint": {
            "minimatchOptions": "{that}.options.config.minimatchOptions",
            "rootPath": "{that}.options.config.rootPath",
            "enabled": true,
            "includes": "{that}.options.config.sources.json5",
            "excludes": []
        },
        "jsonlint": {
            "minimatchOptions": "{that}.options.config.minimatchOptions",
            "rootPath": "{that}.options.config.rootPath",
            "enabled": true,
            "includes": "{that}.options.config.sources.json",
            "excludes": ["./package-lock.json"]
        },
        "lintspaces": {
            "enabled": true,
            "jsonindentation": {
                "minimatchOptions": "{that}.options.config.minimatchOptions",
                "rootPath": "{that}.options.config.rootPath",
                "enabled": true,
                "includes": "@expand:fluid.flatten({that}.options.config.sources.json, {that}.options.config.sources.json5)",
                "excludes": ["./package-lock.json"],
                "options": {
                    indentation: "spaces",
                    spaces: 4
                }
            },
            "newlines": {
                "minimatchOptions": "{that}.options.config.minimatchOptions",
                "rootPath": "{that}.options.config.rootPath",
                "enabled": true,
                "includes": ["./src/**/*", "./tests/**/*", "./*"],
                "excludes": ["./package-lock.json"],
                options: {
                    newline: true
                }
            }
        },
        "markdownlint": {
            "minimatchOptions": "{that}.options.config.minimatchOptions",
            "rootPath": "{that}.options.config.rootPath",
            "enabled": true,
            "includes": "{that}.options.config.sources.md",
            "excludes": [],
            options: { config: baseMarkdownlintConfig }
        },
        "mdjsonlint": {
            "minimatchOptions": "{that}.options.config.minimatchOptions",
            "rootPath": "{that}.options.config.rootPath",
            "enabled": true,
            "includes": "{that}.options.config.sources.md",
            "excludes": []
        },
        "stylelint": {
            "minimatchOptions": "{that}.options.config.minimatchOptions",
            "rootPath": "{that}.options.config.rootPath",
            "enabled": true,
            "includes": "@expand:fluid.flatten({that}.options.config.sources.css, {that}.options.config.sources.scss)",
            "excludes": [],
            options: {
                configFile: "%fluid-lint-all/.stylelintrc.json"
            }
        }
    }
});
