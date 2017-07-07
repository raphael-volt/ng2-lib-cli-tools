import * as fs from 'fs'
import * as path from 'path'

export const PACKAGE_JSON: string = "package.json"

const DEV_DEPENDENCIES: { [name: string]: string } = {
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
}

const DEPENDECIES: { [name: string]: string } = {
    "@angular/common": "^4.0.0",
    "@angular/core": "^4.0.0"
}

const __MODULE_NAME__: string = "__MODULE_NAME__"
const MODULE_NAME_RE: RegExp = new RegExp(__MODULE_NAME__)
const SCRIPTS: { [name: string]: string } = {
    "build": "gulp build",
    "build:watch": "gulp",
    "docs": "npm run docs:build",
    "docs:build": `compodoc -p tsconfig.json -n ${__MODULE_NAME__} -d docs --hideGenerator`,
    "docs:serve": "npm run docs:build -- -s",
    "docs:watch": "npm run docs:build -- -s -w",
    "lint": "tslint --type-check --project tsconfig.json src/**/*.ts",
    "test": "ng test"
}
// path.resolve(__dirname, '..', '..');
const AT_RE = /^@/
const AT_REPLACE = "a"
const sortProperties = (a: string, b: string) => {
    if (a == b)
        return 0
    a = a.replace(AT_RE, AT_REPLACE)
    b = b.replace(AT_RE, AT_REPLACE)
    return [a, b].sort().indexOf(a) == 0 ? -1 : 1
}

const sortJsonProperties = (json: { [name: string]: any }, property: string) => {
    let properties: string[] = []
    let p: string
    for (p in json[property])
        properties.push(p)
    properties.sort(sortProperties)
    let props = {}
    for (let i in properties)
        props[properties[i]] = json[property][properties[i]]
    json[property] = props
}

export class PackageManager {

    private _json: PackageJSON
    load(dir: string): boolean {
        dir = path.join(dir, PACKAGE_JSON)
        if (fs.existsSync(dir)) {
            this._json = JSON.parse(fs.readFileSync(dir).toString())
            return true
        }
        this._json = {}
        return false
    }

    get json(): PackageJSON {
        return this._json
    }

    /**
     * Check json scripts, return true if changed
     */
    validateScripts(): boolean {
        if (this._json.scripts == undefined)
            this._json.scripts = {}
        let changes: number = 0
        let scripts: { [name: string]: string } = this._json.scripts
        let p: string

        for (p in SCRIPTS) {
            if (scripts[p] == undefined || scripts[p] != SCRIPTS[p]) {
                scripts[p] = SCRIPTS[p]
                if (p == "docs:build")
                    scripts[p] = SCRIPTS[p].replace(MODULE_NAME_RE, this._json.name)
                else
                    scripts[p] = SCRIPTS[p]
                changes++
            }
        }
        return changes > 0
    }

    /**
     * Check json dependencies, return true if changed
     */
    validateDependencies(): boolean {
        const json: PackageJSON = this._json
        const pkg: PackageJSON = {
            devDependencies: DEV_DEPENDENCIES,
            dependencies: DEPENDECIES
        }
        let changes: number = 0
        let p: string
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
        return changes > 0
    }

    save(dir: string) {
        sortJsonProperties(this._json, "scripts")
        sortJsonProperties(this._json, "dependencies")
        sortJsonProperties(this._json, "devDependencies")
        fs.writeFileSync(path.join(dir, PACKAGE_JSON), JSON.stringify(this._json, undefined, 4))
    }
}

export interface PackageJSON {
    [name: string]: any
    name?: string
    version?: string
    description?: string
    repository?: {
        type?: string
        url?: string
    }
    scripts?: {
        [name: string]: string
    }
    author?: {
        name?: string
        email?: string
    }
    main?: string
    typings?: string
    files?: string[]
    devDependencies?: {
        [name: string]: string
    }
    dependencies?: {
        [name: string]: string
    }
}