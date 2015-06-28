# LESS Compile-on-save

Compile LESS stylesheets on save.

- Uses LESS v2.x
- Can generate source maps
- Can exclude LESS files based on a regular expression. For example, to
    avoid compiling files with a filename beginning with an underscore,
    use `^_`.

## Installation

    apm install lessc-on-save

## Changelog

- **v0.3.0**:
    + Added *Enable auto-compilation* setting to globally disable the
        triggering of automatic compilation on save.
    + Added the `less-on-save:toggle` palette command to toggle the above
        setting.
    + Added the `less-on-save:compile` palette command to compile any file on
        demand, regardless of extension.
- **v0.2.0**
    + Removed the default value for the file exclusion pattern.
    + Added a setting to toggle the "file excluded" message.
- **v0.1.0**
    + Initial version of the package.
