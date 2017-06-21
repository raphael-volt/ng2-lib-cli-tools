const program = require('commander');
const mkdirp = require('mkdirp');
const mustache = require('mustache')
const fs = require('fs');
const path = require('path');
const rxjs = require("rxjs")
const colors = require('colors');
let npmInstallFlag = false
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

let pathJoinLocal = (...args) => {
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

let pkgDiff = (src) => {

    let data = fs.readFileSync(src).toString()
    let json = {}
    try {
        json = JSON.parse(data)
    } catch (error) {
        return 1
    }

    let pkg = {
        "devDependencies": {
            "@angular/cli": "1.1.1",
            "@angular/compiler": "^4.0.0",
            "@angular/compiler-cli": "^4.0.0",
            "@angular/platform-browser": "^4.0.0",
            "@angular/platform-browser-dynamic": "^4.0.0",
            "@angular/router": "^4.2.2",
            "@compodoc/compodoc": "^1.0.0-beta.7",
            "@types/jasmine": "2.5.38",
            "@types/node": "~6.0.60",
            "codelyzer": "^2.0.1",
            "core-js": "^2.4.1",
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
            "rxjs": "^5.1.0",
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
    if (!json.name) {
        return 2
    }

    libraryName = json.name

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
    if (changes > 0) {
        npmInstallFlag = true
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

let init = (vscode) => {
    currentDir = process.cwd()
    let filename = pathJoinLocal(packageJSON)
    if (!fs.existsSync(filename)) {
        console.log(colors.error("'" + packageJSON + "' not found! You must be inside an angular2 library project!"))
        process.exit(1)
        return
    }

    if (!fs.existsSync(pathJoinLocal("src"))) {
        console.log(colors.error("src directory not found! You must be inside an angular2 library project!"))
        process.exit(1)
        return
    }

    let result = pkgDiff(filename)

    switch (result) {
        case 1:
            console.log(`Unable to parse the ${filename} file.`.error)
            break;

        case 2:
            console.log(`Unable to find the library name from ${filename} file.`.error)
            break;

        default:
            break;
    }
    if (result != 0) {
        process.exit(1)
        return
    }
    console.log("Installing " + "Karma".debug.bold + " for the library " + libraryName.info.bold + ".");

    filename = pathJoinLocal("src", "index.ts")

    let data = {
        moduleClass: undefined,
        moduleFilename: "index"
    }

    const moduleRE = /@NgModule\s*\(\s*\{[^\}]*\}\s*\)\s*export\s+class\s+(\w+)/gm
    if (fs.existsSync(filename)) {
        let content = fs.readFileSync(filename)
        let match = moduleRE.exec(content)

        if (match) {
            data.moduleClass = match[1]
        }
        else {
            data.moduleFilename = libraryName + ".module"
            filename = pathJoinLocal("src", data.moduleFilename + ".ts")
            if (fs.existsSync(filename)) {
                content = fs.readFileSync(filename)
                match = moduleRE.exec(content)
                if (match) {
                    data.moduleClass = match[1]
                }
            }
        }
    }
    if (data.moduleClass == undefined) {
        data.moduleFilename = ""
        data.moduleClass = ""
        console.log("Unable to find the module to bootstrap, you have to add your main module in the ./karma/main.ts file.".warn)
    }
    else {
        console.log("Use module " + (data.moduleClass).debug.bold + " to bootstrap.")
    }
    filename = pathJoinLocal(karma)
    if (!fs.existsSync(filename))
        fs.mkdirSync(pathJoinLocal(karma))

    filename = "main.ts"
    createTemplate(
        pathJoin(__dirname, templates, karma, filename),
        pathJoinLocal(karma, filename),
        data
    )
    filename = "polyfills.ts"
    copy(
        pathJoin(__dirname, templates, karma, filename),
        pathJoinLocal(karma, filename)
    )

    filename = "test.ts"
    copy(
        pathJoin(__dirname, templates, karma, filename),
        pathJoinLocal(karma, filename)
    )

    filename = "tsconfig.json"
    copy(
        pathJoin(__dirname, templates, karma, filename),
        pathJoinLocal(karma, filename)
    )
    filename = "tsconfig.spec.json"
    copy(
        pathJoin(__dirname, templates, karma, filename),
        pathJoinLocal(karma, filename)
    )
    filename = "karma.conf.js"
    copy(
        pathJoin(__dirname, templates, filename),
        pathJoinLocal(filename)
    )
    filename = ".angular-cli.json"
    data.libraryName = libraryName
    createTemplate(
        pathJoin(__dirname, templates, filename),
        pathJoinLocal(filename),
        data
    )

    if(vscode) {
        filename = "launch.json"
        let dir = pathJoinLocal(".vscode")
        if(!fs.existsSync(dir))
            fs.mkdirSync(dir)
        copy(
            pathJoin(__dirname, templates, filename),
            pathJoin(dir, filename))
        console.log("You have to install Debugger for Chrome extension if not.".info)
    }


    filename = "tsconfig.json"
    let input = fs.readFileSync(pathJoin(__dirname, templates, filename), encoding)
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
    fs.writeFileSync(pathJoinLocal(filename), input, encoding)

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

module.exports = {
    karma: (options) => {
        init(options.parent.vscode || false)
    }
}