# Angular2 library command line tool 

Making a testable library as a stand-alone application.
Live debugging of typescript ( webpack ).

## Install

```bash
npm install -g ng2-lib-cli-tools
```

## Usage
```txt

  Usage: nglib [options] [command]


  Options:

    -V, --version          output the version number
    -m, --module <module>  Path to main module with new and install
    -s, --skipnpm          Skip npm commands ( install, build, test ) with new and install
    -h, --help             output usage information


  Commands:

    vscode                       Add vscode chrome launcher
    new [directory]              Create an angular2 library with karma testing environment
    install [directory]          Update or install karma testing environment in an exixting library
    i [directory]
    generate <blueprint> [name]  Create blueprints ([cl]ass, [c]omponent, [d]irective, [e]num, [g]uard, [i]nterface, [m]odule, [p]ipe, [s]ervice)
    g <blueprint> [name]

```

## npm scripts

Build the library :
```bash
npm run build
# Build every time a file is modified
npm run build:watch
```

Run tests :
```bash
npm test
```

## Consuming the library in development

`my-lib` is an Angular2 library

`my-app` is an Angular2 application who use the library 

* Add the library to npm libs
    
    `cd` to the library directory, then type :
    ```bash
    npm link
    ```
* Add the link to the library

    Set up a path mapping in the application [/src/tsconfig.app.json]() file :

    ```json
    {
        "compilerOptions": {
            "paths": {
                "@angular/*": [
                    "../node_modules/@angular/*"
                ]
            }
        }
    }
    ```

    `cd` to the application directory, then type :

    ```bash
    npm link my-lib
    ```
Serve or test the application.
`cd` to the library directory, then run the `build:watch` command :
```bash
npm run build:watch
```
Make change in a file in the library `/src` directory will be detected and restart the served application.

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

## vscode

If your project is inside a sub directory of the workspace, you have to copy the generated configuration to the root of the workspace, and define the webroot in the `launch.json` file :
```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Launch Chrome",
            "webRoot": "${workspaceRoot}/dir-to-library",
        },
        {
            "name": "Attach to Chrome",
            "webRoot": "${workspaceRoot}/dir-to-library"
        }
    ]
}
``` 
