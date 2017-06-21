# Command line tool to add Karma testing environment to an Angular2 library

This tool has been created to works with a library generated by the [generator-angular2-library](https://github.com/jvandemo/generator-angular2-library).

Karma's setup is automatized, and the library is testable as a standalone application. All files will be served to webpack, so you can add breakpoints and inspect the context using the Chrome DevTools or the vscode debugger.

@angular/cli in version `1.1.1` is used to launch Karma.

## Install

```bash
npm install -g ng2-lib-cli-tools
```

## Usage

`cd` into an angular2 library, then start karma setup :
```bash
ng2t karma
```
If you use `vscode`, you can create the launch configuration :
```bash
ng2t karma -v
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


## Bootstrap method

The main module must to be referenced in the ./karma/main.ts file.

The tool searches for a module in the `src/index.ts` or in the `src/library-name.module.ts` (if any). If no module is found, you have to edit the `karma/main.ts` to provide it :
```typescript
import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { MyModule } from '../src/my-module.module';

platformBrowserDynamic().bootstrapModule(MyModule);
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

## Code style

The [generator-angular2-library](https://github.com/jvandemo/generator-angular2-library) create the main module inside the root `index.ts`. I prefer to create a `my-library.module.ts` and export it from the root `index.ts`. The main module must exports all submodules.
For example, with a structure like this : 
```txt
-- src
    index.ts
    my-library.module.ts
    --module-A
        index.ts
        module-A.module.ts
        module-A.component.ts
        module-A.service.ts
        ...
``` 
my-library.module.ts :
```typescript
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModuleA } from "./module-A/module-A.module";

@NgModule({
  imports: [
    ModuleA
  ],
  exports: [
    ModuleA
  ]
})
export class MyLibrary { }
```
index.ts :
```typescript
export * from './my-library.module'
```
module-A/index.ts
```typescript
export * from './module-A.module'
export * from './module-A.component'
export * from './module-A.service'
```
