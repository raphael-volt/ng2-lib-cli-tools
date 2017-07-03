const program = require('commander');
const mkdirp = require('mkdirp');
const mustache = require('mustache')
const fs = require('fs');
const path = require('path');
const rxjs = require("rxjs")
const colors = require('colors');
let npmInstallFlag = false
let mainPackage = {}
colors.setTheme({
    silly: 'rainbow',
    input: 'grey',
    verbose: 'cyan',
    prompt: 'grey',
    info: 'green',
    data: 'grey',
    help: 'cyan',
    warn: 'yellow',
    debug: 'blue',
    error: 'red'
})
let pathJoin = (...args) => {
    return path.join.apply(null, args)
}

let libraryPathJoin = (...args) => {
    args.unshift(currentDir)
    return pathJoin.apply(null, args)
}
let createTemplate = (src, dst, data) => {
    let input = fs.readFileSync(src, encoding).toString()
    let output = mustache.render(input, data)
    fs.writeFileSync(dst, output)
}

let copy = (src, dst) => {
    let input = fs.readFileSync(src, encoding).toString()
    fs.writeFileSync(dst, input, encoding)
}

let capitalizeLibraryName = (string) => {
    let l = string.split("-")
    for (var i = 0; i < l.length; i++) {
        l[i] = capitalizeFirstLetter(l[i]);
    }
    return l.join("")
}

let capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

let pkgDiff = (src, m) => {
    let json = {}
    let saveJson = false
    if (fs.existsSync(src)) {
        let data = fs.readFileSync(src).toString()
        try {
            json = JSON.parse(data)
        } catch (error) {
            return 1
        }
    }
    if (json.name === undefined) {
        libraryName = path.basename(currentDir)
        json.name = libraryName
        saveJson = true
    } else {
        libraryName = json.name
    }

    if (!json.name) {
        return 2
    }

    let pkg = {
        "devDependencies": {
            "@angular/cli": "1.1.1",
            "@angular/compiler": "^4.0.0",
            "@angular/compiler-cli": "^4.0.0",
            "@angular/http": "^4.2.4",
            "@angular/platform-browser": "^4.0.0",
            "@angular/platform-browser-dynamic": "^4.0.0",
            "@angular/router": "^4.2.2",
            "@compodoc/compodoc": "^1.0.0-beta.7",
            "@types/jasmine": "2.5.38",
            "@types/node": "~6.0.60",
            "codelyzer": "^2.0.1",
            "core-js": "^2.4.1",
            "del": "^2.2.2",
            "gulp": "^3.9.1",
            "gulp-rename": "^1.2.2",
            "gulp-rollup": "^2.11.0",
            "jasmine-core": "~2.5.2",
            "jasmine-spec-reporter": "~3.2.0",
            "karma": "~1.4.1",
            "karma-chrome-launcher": "~2.0.0",
            "karma-cli": "~1.0.1",
            "karma-coverage-istanbul-reporter": "^0.2.3",
            "karma-jasmine": "~1.1.0",
            "karma-jasmine-html-reporter": "^0.2.2",
            "karma-typescript": "^3.0.4",
            "karma-typescript-angular2-transform": "^1.0.0",
            "node-sass": "^4.5.2",
            "node-sass-tilde-importer": "^1.0.0",
            "node-watch": "^0.5.2",
            "protractor": "~5.1.0",
            "rollup": "^0.41.6",
            "run-sequence": "^1.2.2",
            "rxjs": "^5.1.0",
            "ts-node": "~2.0.0",
            "tslint": "~4.5.0",
            "typescript": "~2.2.0",
            "webdriver-js-extender": "^1.0.0",
            "webpack": "^3.0.0",
            "webpack-dev-middleware": "^1.10.2",
            "webpack-dev-server": "^2.4.5",
            "webpack-merge": "^4.1.0",
            "webpack-sources": "^1.0.1",
            "zone.js": "^0.8.4"
        },
        "dependencies": {
            "@angular/common": "^4.0.0",
            "@angular/core": "^4.0.0"
        }
    }

    let p
    let changes = 0
    if (!json.dependencies) {
        json.dependencies = pkg.dependencies
        changes++
    }
    else {
        for (p in pkg.dependencies)
            if (json.dependencies[p] != pkg.dependencies[p]) {
                changes++
                json.dependencies[p] = pkg.dependencies[p]
            }
    }
    if (!json.devDependencies) {
        json.devDependencies = pkg.devDependencies
        changes++
    }
    else {
        for (p in pkg.devDependencies) {
            if (json.devDependencies[p] != pkg.devDependencies[p]) {
                changes++
                json.devDependencies[p] = pkg.devDependencies[p]
            }
        }
    }
    for (p in pkg.dependencies) {
        if (json.devDependencies[p]) {
            changes++
            delete (json.devDependencies[p])
            json.dependencies[p] = pkg.dependencies[p]
        }
    }
    for (p in json.dependencies) {
        if (json.devDependencies[p]) {
            changes++
            delete (json.dependencies[p])
        }
    }
    npmInstallFlag = changes > 0
    if (m !== false && json.name !== m) {
        libraryName = m
        json.name = m
        saveJson = true
    }
    mainPackage = json
    if (npmInstallFlag || saveJson) {
        sortJsonProperties(json, "dependencies")
        sortJsonProperties(json, "devDependencies")
        fs.writeFileSync(
            src,
            JSON.stringify(json, null, 4),
            encoding)
    }
    return 0
}

const AT_RE = /^@/
const AT_REPLACE = "a"
let sortProperties = (a, b) => {
    if (a == b)
        return 0
    a = a.replace(AT_RE, AT_REPLACE)
    b = b.replace(AT_RE, AT_REPLACE)
    let l = [a, b].sort()
    if (l.indexOf(a) == 0)
        return -1
    return 1
}

let sortJsonProperties = (json, property) => {
    let properties = []
    let p
    for (p in json[property])
        properties.push(p)
    properties.sort(sortProperties)
    let props = {}
    for (let i = 0; i < properties.length; i++) {
        p = properties[i]
        props[p] = json[property][p]
    }
    json[property] = props
}
const encoding = { encoding: "utf-8" }
const karma = "karma"
const templates = "templates"
const packageJSON = "package.json"
let libraryName = ""
let currentDir

let searchModule = (filename) => {
    const moduleRE = /@NgModule\s*\(\s*\{[^\}]*\}\s*\)\s*export\s+class\s+(\w+)/gm
    let moduleClass = undefined
    if (fs.existsSync(filename)) {
        let content = fs.readFileSync(filename)
        let match = moduleRE.exec(content)
        if (match) {
            moduleClass = match[1]
        }
    }
    return moduleClass
}

let checkJsonScript = (moduleName) => {
    let save = false
    let scripts = {
        "build": "gulp build",
        "build:watch": "gulp",
        "docs": "npm run docs:build",
        "docs:build": "compodoc -p tsconfig.json -n prestashop-api-core -d docs --hideGenerator",
        "docs:build": `compodoc -p tsconfig.json -n ${moduleName} -d docs --hideGenerator`,
        "docs:serve": "npm run docs:build -- -s",
        "docs:watch": "npm run docs:build -- -s -w",
        "lint": "tslint --type-check --project tsconfig.json src/**/*.ts",
        "test": "ng test"
    }
    if (!mainPackage.scripts) {
        mainPackage.scripts = {}
    }
    for (let p in scripts) {
        if (mainPackage.scripts[p] != scripts[p]) {
            mainPackage.scripts[p] = scripts[p]
            save = true
        }
    }
    if (save) {
        fs.writeFileSync(libraryPathJoin(packageJSON), JSON.stringify(mainPackage, null, 4))
    }
}

let checkTsconfig = () => {
    let data = {
        tsconfig: undefined
    }
    let srcdir = libraryPathJoin("src")
    let files = fs.readdirSync(srcdir)
    for (let f of files) {
        file = path.basename(f)
        if (! /.json$/.test(file) || file == packageJSON)
            continue
        if (file.indexOf("tsconfig") !== -1) {
            data.tsconfig = file
            break
        }
    }
    return data
}
let checkModule = () => {
    let data = {
        createModule: false,
        libraryName: libraryName,
        moduleClass: undefined,
        moduleFilename: undefined
    }
    let srcdir = libraryPathJoin("src")


    let files = [
        pathJoin(srcdir, libraryName + ".module.ts"),
        pathJoin(srcdir, libraryName + ".ts")
    ]
    for (file of files) {
        if (fs.existsSync(file)) {
            data.moduleClass = searchModule(file)
            if (data.moduleClass !== undefined) {
                data.moduleFilename = path.basename(file).slice(0, -3)
                return data
            }
        }
    }
    file = "index.ts"
    data.moduleClass = searchModule(pathJoin(srcdir, file))
    if (data.moduleClass !== undefined) {
        data.moduleFilename = ""
        return data
    }
    files = fs.readdirSync(srcdir)
    for (let f of files) {
        file = path.basename(f)
        if (! /.ts$/.test(file) || /.spec.ts$/.test(file) || file == "index.ts")
            continue
        data.moduleClass = searchModule(pathJoin(srcdir, file))
        if (data.moduleClass !== undefined) {
            data.moduleFilename = file.slice(0, -3)
            return data
        }
    }
    data.moduleClass = getModuleClass(data.libraryName)
    data.moduleFilename = data.libraryName + ".module"
    data.createModule = true
    return data
}

let firstCharToUpperCase = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1)
}

let getModuleClass = (str) => {
    str = str.replace("_", "-")
    let data = str.split("-")
    let i
    const n = data.length
    for (i = 0; i < n; i++) {
        data[i] = firstCharToUpperCase(data[i])
    }
    data.push("Module")
    return data.join("")
}

let init = (vscode, m) => {
    currentDir = process.cwd()
    console.log(currentDir)
    let dir = libraryPathJoin("src")
    const srcdir = dir
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir)
    }

    let filename = packageJSON
    let result = pkgDiff(libraryPathJoin(packageJSON), m)

    switch (result) {
        case 1:
            console.log(`Unable to parse the ${packageJSON} file.`.error)
            break;

        case 2:
            console.log(`Unable to find the library name from ${packageJSON} file.`.error)
            break;

        default:
            break;
    }
    if (result != 0) {
        process.exit(1)
        return
    }

    console.log("Installing " + "Karma".debug.bold + " for the library " + libraryName.info.bold + ".");
    let data = checkModule()
    if (data.createModule) {
        filename = pathJoin(dir, data.moduleFilename + ".ts")
        fs.writeFileSync(filename, `import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'

@NgModule({
    imports: [CommonModule]
})
export class ${data.moduleClass} { 

}
`)
    }

    var tplDir = path.dirname(__dirname)

    filename = libraryPathJoin(karma)
    if (!fs.existsSync(filename))
        fs.mkdirSync(libraryPathJoin(karma))

    filename = "main.ts"
    createTemplate(
        pathJoin(tplDir, templates, karma, filename),
        libraryPathJoin(karma, filename),
        data
    )
    filename = "polyfills.ts"
    copy(
        pathJoin(tplDir, templates, karma, filename),
        libraryPathJoin(karma, filename)
    )

    filename = "test.ts"
    copy(
        pathJoin(tplDir, templates, karma, filename),
        libraryPathJoin(karma, filename)
    )

    filename = "tsconfig.json"
    copy(
        pathJoin(tplDir, templates, karma, filename),
        libraryPathJoin(karma, filename)
    )
    filename = "tsconfig.spec.json"
    copy(
        pathJoin(tplDir, templates, karma, filename),
        libraryPathJoin(karma, filename)
    )
    filename = "karma.conf.js"
    copy(
        pathJoin(tplDir, templates, filename),
        libraryPathJoin(filename)
    )
    filename = ".angular-cli.json"
    createTemplate(
        pathJoin(tplDir, templates, filename),
        libraryPathJoin(filename),
        data
    )

    let conf = checkTsconfig()
    if (conf.tsconfig == undefined) {
        filename = "tsconfig.build.json"
        conf.tsconfig = filename
        createTemplate(
            pathJoin(tplDir, templates, "gulp", filename),
            pathJoin(srcdir, filename),
            data
        )
    }

    checkJsonScript(data.libraryName)

    filename = "gulpfile.js"
    conf.moduleId = data.libraryName
    createTemplate(
        pathJoin(tplDir, templates, filename),
        libraryPathJoin(filename),
        conf
    )
    filename = "gulp"
    dir = libraryPathJoin(filename)
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir)
    }
    filename = pathJoin(filename, "inline-resources.js")
    copy(
        pathJoin(tplDir, templates, filename),
        libraryPathJoin(filename)
    )
    if (vscode) {
        filename = "launch.json"
        dir = libraryPathJoin(".vscode")
        if (!fs.existsSync(dir))
            fs.mkdirSync(dir)
        copy(
            pathJoin(tplDir, templates, filename),
            pathJoin(dir, filename))
        console.log("You have to install Debugger for Chrome extension if not.".info)
    }


    filename = "tsconfig.json"
    let input = fs.readFileSync(pathJoin(tplDir, templates, filename), encoding)
    let json = JSON.parse(input.toString())
    json.compilerOptions.types = [
        "jasmine",
        "node"
    ]
    json.compilerOptions.sourceMap = true
    json.compilerOptions.declaration = false
    json.compilerOptions.moduleResolution = "node"
    json.compilerOptions.emitDecoratorMetadata = true
    json.compilerOptions.experimentalDecorators = true
    json.compilerOptions.target = "es5"
    json.compilerOptions.typeRoots = [
        "node_modules/@types"
    ]
    json.compilerOptions.lib = [
        "es2016",
        "dom"
    ]
    sortJsonProperties(json, "compilerOptions")

    input = JSON.stringify(json, null, 4)
    fs.writeFileSync(libraryPathJoin(filename), input, encoding)

    if (npmInstallFlag) {
        console.log(
            "Dependencies have changed, run ".warn + "rm -rf node_modules && npm install".debug.bold
        )
    }

    console.log(
        "The Karma testing environment has been installed, run ".info + "ng test".debug.bold + " to run your tests.".info
    )

    process.exit(0)
}

/**
 * Expose the root command.
exports = module.exports = new Commands()
 */


/**
 * Expose `Command`.
exports.Commands = Commands

function Commands() {

}

Commands.prototype.karma = function (oprions) {
    init(options.parent.vscode || false, options.parent.module || false)
}
 */
module.exports = {
    karma: (options) => {
        console.log("karma init()")

        init(options.parent.vscode || false, options.parent.module || false)
    }
}
