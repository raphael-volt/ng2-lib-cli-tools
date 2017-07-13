# Angular2 library command line tool 

## Install

```bash
npm install -g ng2-lib-cli-tools
```

##  
```txt
  
  Usage: nglib [options] [command]


  Options:

    -m, --module <module>  Path to main module with new and install
    -s, --skipnpm          Skip npm commands ( install, build, test ) with new and install
    

  Commands:

    vscode               Add vscode chrome launcher
    new [directory]      Create an angular2 library with karma testing environment
    install [directory]  Update or install karma testing environment in an exixting library

```

Karma's setup is automatized, and the library is testable as a standalone application. All files will be served to webpack, so you can add breakpoints and inspect the context using the Chrome DevTools or the vscode debugger.

@angular/cli in version `1.1.1` is used to launch Karma.

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
## Project structure

```txt
my-lib
├── .vscode
│   └── launch.json
├── dist
├── gulp
│   ├── inline-resources.js
│   └── tsconfig.build.json
├── karma
│   ├── main.ts
│   ├── polyfills.ts
│   ├── test.ts
│   ├── tsconfig.json
│   └── tsconfig.spec.json
├── src
│   └── my-lib.module.ts
├── test
│   └── my-lib.spec.ts
├── .angular-cli.json
├── gulpfile.js
├── karma.conf.js
├── package-lock.json
├── package.json
└── tsconfig.json
```

### src/

The library source files.

No [index.ts]() file is required, they will be generated during the build.

### test/

The test cases directory, not `*.spec.ts` files will be ignored.

