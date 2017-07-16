import { PACKAGE_JSON, PackageJSON } from "./package-manager";

import { resolveModulePath } from "@angular/cli/utilities/resolve-module-file";
import { TsLibStringUtils } from "ts-lib-string-utils";
// import { Blueprint } from "@angular/cli/ember-cli/lib/models/blueprint";
const Blueprint = require('../../node_modules/@angular/cli/ember-cli/lib/models/blueprint')

import * as path from "path"
import * as fs from "fs-extra"

const ANGULAR_CLI_PATH: string = path.resolve(__dirname, "..", "..", "node_modules", "@angular", "cli")


export class BlueprintManager {

    private loadBlueprints() {
        const blueprintList = fs.readdirSync(path.join(ANGULAR_CLI_PATH, 'blueprints'));
        const blueprints = blueprintList
            .filter(bp => bp.indexOf('-test') === -1)
            .filter(bp => bp !== 'ng')
            .map(bp => Blueprint.load(path.join(ANGULAR_CLI_PATH, 'blueprints', bp)));
        return blueprints;
    }

    private blueprints: any[]

    getBlueprint(name: string) {
        const blueprint = this.blueprints.find((bp) => bp.name === name
            || (bp.aliases && bp.aliases.includes(name)))
        return blueprint

    }

    constructor() {
        this.blueprints = this.loadBlueprints()
    }

    searchMainPackage(dir?: string): Promise<PackageJSON> {
        if (dir == undefined)
            dir = process.cwd()
        return new Promise((resolve, reject) => {
            let next = () => {
                let p: string = path.join(dir, PACKAGE_JSON)
                fs.pathExists(p).then(exists => {
                    if (exists) {
                        fs.readJSON(p).then((pkg: PackageJSON) => {
                            if (pkg.config && pkg.config.nglib && pkg.config.nglib.module) {
                                return resolve(pkg)
                            } else {
                                reject(new Error("Not a nglib " + PACKAGE_JSON))
                            }
                        }).catch(reject)
                    } else {
                        dir = path.dirname(dir)
                        next()
                    }
                }).catch(reject)
            }
            next()
        })
    }

    /**
     * 
     * @param pkg 
     * @param root absolute project path
     * @param blueprintType a valid blueprint type or alias
     * @param blueprintPath: relative to root 
     */
    generate(pkg: PackageJSON, root: string, blueprintType: string, blueprintPath: string): Promise<boolean> {

        return new Promise((resolve, reject) => {
            const bp = this.getBlueprint(blueprintType)
            if (!bp) {
                return reject(new Error("No blueprint found"))
            }
            this.initBlueprint(bp, pkg, root, blueprintPath).then(options => {
                try {
                    bp.install(options).then((success: boolean) => {
                        const l: string[] = bp.files()
                        blueprintPath = options.entity.path 
                        for (const i in l) {
                            if (/.spec.ts/.test(l[i])) {
                                const cdir: string = path.dirname(blueprintPath)
                                const tdir: string = path.join(root, "test")
                                let src: string = l[i].replace(/__name__/, options.dasherizedModuleName)
                                let dst: string = src.replace(/__path__/, tdir)
                                src = src.replace(/__path__/, cdir)
                                if (!fs.existsSync(src)) {
                                    console.log("\tnot exists", src)
                                    break
                                }
                                const fid: string = options.dasherizedModuleName + "." + bp.name
                                const rel: string = path.join(
                                    path.relative(tdir, cdir) , 
                                    fid
                                )
                                fs.moveSync(src, dst, { overwrite: true })
                                src = fs.readFileSync(dst).toString()
                                let re: RegExp = new RegExp(`.${path.sep}${fid}`, "m")
                                src = src.replace(re, rel)
                                fs.writeFileSync(dst, src)
                            }
                        }
                        resolve(success)
                    }).catch(error => {
                        return reject(error)
                    })
                } catch (error) {
                    return reject(error)
                }
            }).catch(reject)
        })
    }

    /**
     * @param bp 
     * @param pkg 
     * @param root 
     * @param blueprintPath relative to root 
     */
    private initBlueprint(bp: any, pkg: PackageJSON, root: string, blueprintPath: string): Promise<any> {
        // console.log("\tinitBlueprint", blueprintPath)
        return new Promise((resolve, reject) => {
            const id: string = TsLibStringUtils.kebab(path.basename(blueprintPath))
            const basename: string = id + "." + bp.name + ".ts"
            let dirName: string
            let moduleSearchDir: string
            if (bp.name == "module" || bp.name == "component") {
                dirName = path.join(root, blueprintPath)
                blueprintPath = path.join(dirName, basename)
                moduleSearchDir = path.dirname(dirName)
            }
            else {
                dirName = path.dirname(path.join(root, blueprintPath))
                moduleSearchDir = dirName
                blueprintPath = path.join(dirName, basename)
            }
            //console.log("\tmoduleSearchDir", moduleSearchDir)
            //console.log("\tdirName", dirName)
            //console.log("\tblueprintPath", blueprintPath)
            if (!fs.existsSync(dirName)) {
                fs.mkdirpSync(dirName)
            }

            this.searchNearestModule(moduleSearchDir, root).then(rootModulePath => {
                //console.log("\trootModulePath", rootModulePath)
                if (!rootModulePath)
                    return reject(new Error("Parent module not found"))
                let project: any = {
                    projectName: pkg.name,
                    root: root,
                    isEmberCLIAddon: () => { return true },
                    name: () => {
                        return pkg.name
                    },
                    config: () => {
                        return {
                            podModulePrefix: ""
                        }
                    }
                }

                let options: any = {
                    originBlueprintName: bp.name,
                    blueprintName: basename,
                    target: root,
                    ui: {
                        writeLine: (value) => {
                            console.log(value)
                        },
                        prompt: (value) => {
                            return new Promise((resolve, reject) => {
                                resolve({ answer: "overwrite" })
                            })
                        }
                    },
                    entity: {
                        name: id,
                        options: undefined,
                        path: blueprintPath
                    },
                    dasherizedModuleName: id,
                    module: rootModulePath,
                    verbose: false,
                    inRepoAddon: false,
                    dryRun: false,
                    project: project,
                    fileMapTokens: undefined,
                    pod: false,
                    hasPathToken: false
                }
                var generatePath = path.relative(root, dirName)
                bp._fileMapTokens = function (options) {
                    this.dynamicPath.dir = generatePath
                    this.generatePath = this.dynamicPath.dir
                    //console.log("\tfileMapTokens generatePath", this.generatePath)
                    return {
                        __name__: function (options) {
                            return id
                        },
                        __path__: function (options) {
                            return generatePath
                        },
                        __root__: function (options) {
                            return "";
                        },
                        __test__: function (options) {
                            return id + '-test';
                        },
                        __styleext__: () => {
                            return "css";
                        }
                    }
                }
                return resolve(options)
            }).catch(reject)
        })
    }

    searchNearestModule(dir: string, root: string): Promise<string> {
        return new Promise((resolve, reject) => {
            let parent = () => {
                fs.readdir(dir).then((files: string[]) => {
                    for (const f of files) {
                        if (/.module.ts$/.test(f))
                            return resolve(path.join(dir, f))
                    }
                    if (path.relative(root, dir) == "")
                        return resolve(null)
                    dir = path.dirname(dir)
                    parent()
                })
            }
            parent()
        })
    }
}