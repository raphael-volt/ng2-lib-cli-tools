import * as fs from 'fs'
import * as path from 'path'
import * as mustache from 'mustache'
export const PACKAGE_JSON: string = "package.json"

const AT_RE = /^@/
const AT_REPLACE = "a"
const sortProperties = (a: string, b: string) => {
    if (a == b)
        return 0
    a = a.replace(AT_RE, AT_REPLACE)
    b = b.replace(AT_RE, AT_REPLACE)
    return a.localeCompare(b)
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

    private _jsonTpl: string
    config(filename: string) {
        this._jsonTpl = fs.readFileSync(filename, "utf-8").toString()
    }
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

    private _jsonSrc: PackageJSON
    private get jsonSrc(): PackageJSON {
        if(! this._jsonSrc)
            this._jsonSrc = JSON.parse(
            mustache.render(this._jsonTpl, this._json)
        )
        return this._jsonSrc
    }
    /**
     * Check json scripts, return true if changed
     */
    validateScripts(): boolean {
        
        let jsonSrc: PackageJSON = this.jsonSrc
        if (this._json.scripts == undefined)
            this._json.scripts = {}
        
        let changes: number = 0
        let scripts: { [name: string]: string } = this._json.scripts
        let p: string

        for (p in jsonSrc.scripts) {
            if (scripts[p] == undefined || scripts[p] != jsonSrc.scripts[p]) {
                scripts[p] = jsonSrc.scripts[p]
                changes++
            }
        }
        return changes > 0
    }

    /**
     * Check json dependencies, return true if changed
     */
    validateDependencies(): boolean {
        const jsonSrc: PackageJSON = this.jsonSrc
        const json: PackageJSON = this._json
        const pkg: PackageJSON = {
            devDependencies: jsonSrc.devDependencies,
            dependencies: jsonSrc.dependencies
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