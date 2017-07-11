# Command line tool to generate Angular2 library

Karma's setup is automatized, and the library is testable as a standalone application. All files will be served to webpack, so you can add breakpoints and inspect the context using the Chrome DevTools or the vscode debugger.

@angular/cli in version `1.1.1` is used to launch Karma.

## Install

```bash
npm install -g ng2-lib-cli-tools
```

## Usage
```bash
# Create a library
nglib new [directory]
# Add vscode debugger launcher
nglib vscode
```
## Run tests

You must `cd` at the root directory of the library, then type :
```bash
ng test
```
Click on the debug button, then in the new tab, open the Chrome DevTools, go to the sources tab.
```txt
top
    -- webpack
        --
            -- library-path/src
                *.ts|html|css|scss
```   

## vscode

If your project is inside a sub directory of the workspace, you have to copy the generated configuration to root of the workspace, and define the webroot in the `launch.json` file :
```json
{
    "version": "0.2.0",
    "configurations": [{
        "name": "Launch Chrome",
        ...
        "webRoot": "${workspaceRoot}/dir-to-library",
        ...
    },
    {
        "name": "Attach to Chrome",
        ...
        "webRoot": "${workspaceRoot}/dir-to-library"
    }]
}
``` 

## src/

No [index.ts]() file is required, they will be generated during the build.

## test/

Test cases directory, not `*.spec.ts` files will be ignored.
