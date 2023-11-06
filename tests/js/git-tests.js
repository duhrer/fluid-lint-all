"use strict";

var fluid = require("infusion");
const jqUnit = require("node-jqunit");

var child_process = require("child_process");
var fs = require("fs"); // Technically redundant as `fs-extra` takes over the built-in `fs`, but kept for clarity.
var fse = require("fs-extra");
var os = require("os");
var path = require("path");

// Required to pick up our path for fluid.module.resolvePath.
require("../../index.js");

// Require to pick up the static function we will be testing.
require("../../src/js/lint-all.js");

var tmpDirName = "fluid-lint-all-git-tests-" + Math.round((Math.random() * 1000000));
var tmpDirPath = path.resolve(os.tmpdir(), tmpDirName);

fluid.registerNamespace("fluid.tests.lintAll.git");

fluid.tests.lintAll.git.runCommandInTmpDir = function (command) {
    try {
        var output = child_process.execSync(command, {
            cwd: tmpDirPath,
            encoding: "utf-8"
        });
        return output;
    }
    catch (error) {
        fluid.fail(error.stderr | error);
    }
};

// Tests for the git integration that powers the `changedOnly` option.
jqUnit.module("Git integration tests for `changedOnly` option.", {
    // Note, our aged QUnit fork uses:
    // -`setup` instead of `beforeEach`
    // -`teardown` instead of `afterEach`
    setup: function () {
        fse.ensureDirSync(tmpDirPath);

        var gitFixturePath = fluid.module.resolvePath("%fluid-lint-all/tests/fixtures/git");
        fse.copySync(gitFixturePath, tmpDirPath);

        fluid.tests.lintAll.git.runCommandInTmpDir("git init");

        fluid.tests.lintAll.git.runCommandInTmpDir("git config user.name \"Test Runner\"");
        fluid.tests.lintAll.git.runCommandInTmpDir("git config user.email johndoe@example.com");

        fluid.tests.lintAll.git.runCommandInTmpDir("git add * .*.json");
        fluid.tests.lintAll.git.runCommandInTmpDir("git commit -m 'Added initial content to git.'");

        fluid.log("Created git test fixture at '" + tmpDirPath + "'");
    },
    teardown: function () {
        fse.removeSync(tmpDirPath);
    }
});

jqUnit.test("A non-git directory should not report changes.", function () {
    var changedFiles = fluid.lintAll.getChangedFiles(os.tmpdir());
    jqUnit.assertEquals("There should be no changed files.", 0, changedFiles.length);
});

jqUnit.test("An up-to-date repo should not report changes.", function () {
    var changedFiles = fluid.lintAll.getChangedFiles(tmpDirPath);
    jqUnit.assertEquals("There should be no changed files.", 0, changedFiles.length);
});

jqUnit.test("Added files should be flagged as changed.", function () {
    var newFilePath = path.resolve(tmpDirPath, "src/js/new.js");
    fs.writeFileSync(newFilePath, "\"use strict\;\n\n", { encoding: "utf8" });

    var filesChangedAfterAdd = fluid.lintAll.getChangedFiles(tmpDirPath);
    jqUnit.assertEquals("Added files should be flagged as changed.", 1, filesChangedAfterAdd.length);
});

jqUnit.test("Moved files should be flagged as changed", function () {
    fluid.tests.lintAll.git.runCommandInTmpDir("git mv src/js/nested/toMove.js src/js/moved.js");

    var filesChangedAfterMove = fluid.lintAll.getChangedFiles(tmpDirPath);
    jqUnit.assertEquals("A moved file should have been flagged as changed.", 1, filesChangedAfterMove.length);
});

jqUnit.test("Moved and modified files should be flagged as changed.", function () {
    var fileToModifyPath = path.resolve(tmpDirPath, "src/js/moved.js");
    fs.appendFileSync(fileToModifyPath, "//More content\n\n", { encoding: "utf8"});

    var filesChangedAfterModify = fluid.lintAll.getChangedFiles(tmpDirPath);
    jqUnit.assertEquals("A moved and modified file should have been flagged as changed.", 1, filesChangedAfterModify.length);
});

jqUnit.test("Modified files should be flagged as changed.", function () {
    var fileToModifyPath = path.resolve(tmpDirPath, "src/js/toModify.js");
    fs.appendFileSync(fileToModifyPath, "//More content\n\n", { encoding: "utf8"});

    jqUnit.stop();
    setTimeout(function () {
        jqUnit.start();

        var filesChangedAfterModify = fluid.lintAll.getChangedFiles(tmpDirPath);

        jqUnit.assertEquals("A modified file should have been flagged as changed.", 1, filesChangedAfterModify.length);
    }, 500);
});
