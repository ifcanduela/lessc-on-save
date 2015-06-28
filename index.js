var less = require("less"),
    fs = require("fs"),
    path = require("path");

var compileFile = function (lessFilePath) {
    readFile(lessFilePath, function(content) {
        var createSourceMap = atom.config.get("lessc-on-save.createSourceMap"),
            minifyCss = atom.config.get("lessc-on-save.minifyCss"),
            lessOptions = {
                filename: lessFilePath,
                compress: minifyCss
            };

        if (!content) {
            throw err;
        }

        if (createSourceMap) {
            lessOptions.sourceMap = {};
        }

        less.render(content, lessOptions).then(
            function (output) {
                var cssFilePath = lessFilePath.substr(0, lessFilePath.lastIndexOf(".")) + ".css",
                    cssWriteError;

                cssWriteError = fs.writeFile(cssFilePath, output.css, function(err) {
                    var showSuccessMessage = atom.config.get("lessc-on-save.showSuccessMessage");

                    if (showSuccessMessage) {
                        atom.notifications.addSuccess("Compilation successful");
                    }
                });

                if (cssWriteError) {
                    return cssWriteError;
                }

                if (createSourceMap) {
                    var sourceMapFilePath = cssFilePath + ".map";
                    return fs.writeFile(sourceMapFilePath, output.map, function (err) {});
                }
            },
            function (error) {
                var showErrorMessage = atom.config.get("lessc-on-save.showErrorMessage");

                if (showErrorMessage) {
                    showErrorNotification(error);
                }
            }
        );
    });
};

var lesscOnSave = function() {
    var autoCompilationEnabled = atom.config.get('lessc-on-save.enabled');

    if (!autoCompilationEnabled) {
        return;
    }

    var currentEditor = atom.workspace.getActiveTextEditor();

      if (currentEditor) {
        var currentFilePath = currentEditor.getPath();

        if (currentFilePath.substr(-4).toLowerCase() === "less") {
            var excludePattern = atom.config.get('lessc-on-save.excludePattern'),
                showExcludedMessage = atom.config.get('lessc-on-save.showExcludedMessage');

            if (!excludePattern || !path.basename(currentFilePath).match(new RegExp(excludePattern))) {
                compileFile(currentFilePath);
            } else {
                if (showExcludedMessage) {
                    atom.notifications.addInfo(currentFilePath + ' is excluded');
                }
            }
        }
    }
};

var readFile = function (filePath, callback) {
    return fs.readFile(filePath, 'utf-8', function(err, data) {
        if (err) throw err;
        return callback(data);
    });
};

var showErrorNotification = function (error) {
    var message = error.type + ' error in line ' + error.line + ', column ' + error.column + ':\n\n';

    for (var i in error.extract) {
        message += '    ' + error.extract[i] + ' \n';
    }

    message += 'in file ' + error.filename + '\n\n' + error.message;

    atom.notifications.addError(message);
};

var togglePackage = function () {
    var isPackageEnabled = atom.config.get('lessc-on-save.enabled');
    atom.config.set('lessc-on-save.enabled', !isPackageEnabled);
};

module.exports = {
    config: {
        enabled: {
            title: "Enable auto-compilation",
            description: "Toggle automatic LESS compilation on save globally",
            type: 'boolean',
            default: true,
            order: 1
        },
        minifyCss: {
            title: "Minify CSS",
            description: "Produce minified CSS after compilation",
            type: 'boolean',
            default: true,
            order: 2
        },
        createSourceMap: {
            title: "Create a Source Map",
            description: "Generate a LESS to CSS source mapping file (*.map)",
            type: 'boolean',
            default: false,
            order: 3
        },
        excludePattern: {
            title: "Exclude Pattern",
            description: "Regular expression to exclude files from compilation",
            type: 'string',
            default: '',
            order: 4
        },
        showSuccessMessage: {
            title: "Show Success Message",
            description: "Show a successful compilation toast",
            type: 'boolean',
            default: true,
            order: 5
        },
        showErrorMessage: {
            title: "Show Error Message",
            description: "Show a message displaying a LESS compilation error on failure",
            type: 'boolean',
            default: true,
            order: 6
        },
        showExcludedMessage: {
            title: "Show Excluded Message",
            description: "Show a notification when saving a LESS file that matches the Exclude Pattern",
            type: 'boolean',
            default: false,
            order: 7
        }
    },

    activate: function () {
        atom.commands.add("atom-workspace", {
            "lessc-on-save:toggle": function () {
                togglePackage();
            }
        });

        atom.commands.add("atom-workspace", {
            "lessc-on-save:compile": function () {
                var currentEditor = atom.workspace.getActiveTextEditor();

                if (currentEditor) {
                    var currentFilePath = currentEditor.getPath();
                    compileFile(currentFilePath);
                }
            }
        });

        atom.workspace.observeTextEditors(function (editor) {
            editor.onDidSave(lesscOnSave);
        });
    },
};
