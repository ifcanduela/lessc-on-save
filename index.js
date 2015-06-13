var less = require("less"),
    fs = require("fs"),
    path = require("path");

function readFile(filePath, callback) {
    return fs.readFile(filePath, 'utf-8', function(err, data) {
        if (err) throw err;
        return callback(data);
    });
}

function showErrorNotification(error) {
    var message = error.type + ' error in line ' + error.line + ', column ' + error.column + ':\n\n';

    for (var i in error.extract) {
        message += '    ' + error.extract[i] + ' \n';
    }

    message += 'in file ' + error.filename + '\n\n' + error.message;

    atom.notifications.addError(message);
}

function compileFile(lessFilePath) {
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
}

//
// Main entry point
//
var lesscOnSave = function() {
    var currentEditor = atom.workspace.getActiveTextEditor();

      if (currentEditor) {
        var currentFilePath = currentEditor.getPath();

        if (currentFilePath.substr(-4).toLowerCase() === "less") {
            var excludePattern = atom.config.get('lessc-on-save.excludePattern');

            if (!excludePattern || !path.basename(currentFilePath).match(new RegExp(excludePattern))) {
                compileFile(currentFilePath);
            } else {
                atom.notifications.addInfo(currentFilePath + ' is excluded');

            }
        }
    }
};

module.exports = {
    config: {
        minifyCss: {
            title: "Minify CSS",
            description: "Produce minified CSS after compilation",
            type: 'boolean',
            default: true
        },
        createSourceMap: {
            title: "Create a Source Map",
            description: "Generate a LESS to CSS source mapping file (*.map)",
            type: 'boolean',
            default: false,
        },
        showSuccessMessage: {
            title: "Show Success Message",
            description: "Show a successful compilation toast",
            type: 'boolean',
            default: true
        },
        showErrorMessage: {
            title: "Show Error Message",
            description: "Show a message displaying a LESS compilation error on failure",
            type: 'boolean',
            default: true
        },
        excludePattern: {
            title: "Exclude Pattern",
            description: "Regular expression to exclude files from compilation",
            type: 'string',
            default: '^_'
        }
    },

    activate: (function(_this) {
        return function(state) {
            return atom.workspace.observeTextEditors(function(editor) {
                return editor.onDidSave((function(_this) {
                    return function() {
                        return lesscOnSave();
                    };
                }) (this));
            });
        };
    }) (this)
};
