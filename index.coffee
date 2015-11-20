fs = require('fs')
less = require('less')
path = require('path')

# compiles a LESS stylesheet
compileFile = (lessFilePath) ->
  # read LESS source code
  readFile lessFilePath, (content) ->
    createSourceMap = atom.config.get('lessc-on-save.createSourceMap')
    minifyCss = atom.config.get('lessc-on-save.minifyCss')

    lessOptions =
      filename: lessFilePath
      compress: minifyCss

    if createSourceMap
      lessOptions.sourceMap = {}

    # call the LESS API
    less.render(content, lessOptions).then ((output) ->
      # CSS file name
      currentFolder = path.dirname(lessFilePath)
      baseName = path.basename(lessFilePath, '.less')

      prefix = atom.config.get('lessc-on-save.cssPrefix')

      cssFilePath = path.resolve(currentFolder + '/' + prefix + baseName + '.css')
      cssWriteError = undefined

      # save the CSS file
      cssWriteError = fs.writeFile(cssFilePath, output.css, (err) ->
        showSuccessNotification lessFilePath
      )

      return cssWriteError if cssWriteError

      # save the source map file
      if createSourceMap
        sourceMapFilePath = cssFilePath + '.map'
        return fs.writeFile sourceMapFilePath, output.map
    ), (error) ->
      showErrorNotification error

lesscOnSave = ->
  autoCompilationEnabled = atom.config.get('lessc-on-save.enabled')

  # return immediately if automatic compilation is disabled
  return unless autoCompilationEnabled

  currentEditor = atom.workspace.getActiveTextEditor()

  if currentEditor
    currentFilePath = currentEditor.getPath()

    # check the file extension
    if currentFilePath.substr(-4).toLowerCase() == 'less'
      basename = path.basename(currentFilePath)
      excludePattern = atom.config.get('lessc-on-save.excludePattern')

      # check if there is an exclusion pattern
      if excludePattern
        regularExpression = new RegExp(excludePattern)

        # check the filename against the exclude pattern
        if basename.match(regularExpression)
          showExcludeNotification currentFilePath

          # skip compilation if the file name matches
          return

      compileFile currentFilePath

# reads a file and processes its contents
readFile = (filePath, callback) ->
  fs.readFile filePath, 'utf-8', (err, data) ->
    throw err if err
    callback data

# shows a LESS compilation error notification (depending on setting)
showErrorNotification = (error) ->
  showErrorMessage = atom.config.get('lessc-on-save.showErrorMessage')

  if showErrorMessage
    message = "#{error.type} error in line #{error.line},
      column #{error.column}\n\n"

    for i of error.extract
      if (error.extract[i])
        message += "    #{error.extract[i]}  \n"

    message += "in file #{error.filename}\n\n#{error.message}"
    atom.notifications.addError message

# shows a file exclusion notification (depending on setting)
showExcludeNotification = (filename) ->
  showExcludedMessage = atom.config.get('lessc-on-save.showExcludedMessage')

  if showExcludedMessage
    atom.notifications.addInfo(filename + ' is excluded')

# shows a compilation success notification (depending on setting)
showSuccessNotification = (filename) ->
  showSuccessMessage = atom.config.get('lessc-on-save.showSuccessMessage')

  if showSuccessMessage
    atom.notifications.addSuccess 'Compilation successful'

# toggles the automatic compilation setting
togglePackage = ->
  isPackageEnabled = atom.config.get('lessc-on-save.enabled')
  atom.config.set 'lessc-on-save.enabled', !isPackageEnabled
  return

module.exports =
  config:
    enabled:
      title: 'Enable auto-compilation'
      description: 'Toggle automatic LESS compilation on save globally'
      type: 'boolean'
      default: true
      order: 1
    minifyCss:
      title: 'Minify CSS'
      description: 'Produce minified CSS after compilation'
      type: 'boolean'
      default: true
      order: 2
    createSourceMap:
      title: 'Create a Source Map'
      description: 'Generate a LESS to CSS source mapping file (*.map)'
      type: 'boolean'
      default: false
      order: 3
    excludePattern:
      title: 'Exclude Pattern'
      description: 'Regular expression to exclude files from compilation'
      type: 'string'
      default: ''
      order: 4
    showSuccessMessage:
      title: 'Show Success Message'
      description: 'Show a successful compilation toast'
      type: 'boolean'
      default: true
      order: 5
    showErrorMessage:
      title: 'Show Error Message'
      description: 'Show a message displaying a LESS compilation error on
        failure'
      type: 'boolean'
      default: true
      order: 6
    showExcludedMessage:
      title: 'Show Excluded Message'
      description: 'Show a notification when saving a LESS file that matches
        the Exclude Pattern'
      type: 'boolean'
      default: false
      order: 7
    cssPrefix:
      title: 'CSS file prefix'
      description: 'Rename the resulting CSS file using a prefix'
      type: 'string'
      default: ''
      order: 8

  activate: ->
    # register the Toggle command
    atom.commands.add 'atom-workspace', 'lessc-on-save:toggle': ->
      togglePackage()

    # register the Compile command
    atom.commands.add 'atom-workspace', 'lessc-on-save:compile': ->
      currentEditor = atom.workspace.getActiveTextEditor()

      if currentEditor
        currentFilePath = currentEditor.getPath()
        compileFile currentFilePath

    # register the on-save trigger
    atom.workspace.observeTextEditors (editor) ->
      editor.onDidSave lesscOnSave
