import * as commander from 'commander'
import { existsSync, mkdirSync } from 'fs'
import * as path from 'path'
import * as child_process from 'child_process'
import * as del from 'del'
import { Observable, Observer } from "rxjs";
import { clr } from "./utils/colors-util";
import { PackageManager, PackageJSON } from "./core/package-manager";
import { LibraryManager, LibraryDescriptor } from "./core/library-manager";
import { BlueprintManager } from "./core/blueprint-manager";

import { CliInterface } from "./core/cli-interface";
import { BusyMessage } from "./utils/busy-message";

export class App {

    private libraryManager: LibraryManager
    private commander: commander.CommanderStatic
    private busyMessage: BusyMessage = new BusyMessage()
    private cwd: string
    private explicitModule: string
    private skipNpm: boolean = false
    constructor() {
        this.commander = commander
        this.libraryManager = new LibraryManager()
    }

    public initialize() {

        this.cwd = process.cwd()
        let v: string = this.libraryManager.getAppVersion()
        if (v == undefined)
            v = "0.0.0"
        commander
            .version(v)
            .option(
            "-m, --module <module>", "Path to main module with new and install",
            (explicitModule: string, ...args) => this.explicitModule = explicitModule,
            ""
            )
            .option(
            "-s, --skipnpm", "Skip npm commands ( install, build, test ) with new and install",
            (skipNpm: string, ...args) => {
                this.skipNpm = true
            },
            ""
            )

        commander.command('vscode')
            .description("Add vscode chrome launcher")
            .action(this.vscode)

        commander.command('new [directory]')
            .description("Create an angular2 library with karma testing environment")
            .action(this.createLibrary)

        commander.command('install [directory]')
            .description("Update or install karma testing environment in an exixting library")
            .action(this.install)

        commander.command('i [directory]')
            .description("Update or install karma testing environment in an exixting library")
            .action(this.install)

        commander.command('generate')
            .arguments('<blueprint> [name]')
            .description("Create blueprints ([cl]ass, [c]omponent, [d]irective, [e]num, [g]uard, [i]nterface, [m]odule, [p]ipe, [s]ervice)")
            .action(this.generateBlueprint)
        commander.command('g')
            .arguments('<blueprint> [name]')
            .action(this.generateBlueprint)

        commander.parse(process.argv)
    }

    // private generateBlueprint = (...args) => {
    private generateBlueprint = (blueprint: string, name: string) => {
        let errorHandler = (error: Error) => {
            console.log(clr.error(`[${error.name}] ${error.message}`))
            if(error.stack)
                console.log(clr.prompt(error.stack))
            process.exit(1)
        }
        const blueprintManager: BlueprintManager = new BlueprintManager()
        const cwd: string = process.cwd()
        blueprintManager.searchMainPackage(cwd).then((pkg: PackageJSON) => {
            let bp = blueprintManager.getBlueprint(blueprint)
            if(! bp) 
                return errorHandler(new Error("Invalid blueprint:" + blueprint))
            blueprintManager.generate(pkg, cwd, bp.name, name).then(success => {
                process.exit(success ? 0:1)
            }).catch(errorHandler)
        }).catch(errorHandler)
    }

    private explicitPath: string
    private parseArgs(args: any[]): undefined | string {
        if (!args || !args.length)
            return undefined
        let cmd: any = args.pop()
        if (args.length) {
            let p: string = args[0]
            if(! p)
                p = ""
            if (path.isAbsolute(p))
                this.explicitPath = p
            else {
                this.explicitPath = path.resolve(this.cwd, p)
            }
        }
        console.log("this.explicitPath", this.explicitPath)
        return this.explicitPath
    }

    private removeNodeModules() {
        return del(['node_modules/**'])
    }

    private runNpm(): Observable<boolean> {
        return Observable.create((observer: Observer<boolean>) => {
            this.busyMessage.start(clr.bold(clr.debug("> npm install")))
            child_process.exec("npm install", (err: Error, stdout: string, stderr: string) => {
                if (err) {
                    this.busyMessage.close(clr.bold(clr.error(`[${err.name}]`)))
                    console.log(clr.error(err.message))
                    console.log(clr.prompt(err.stack))
                    return observer.error(err)
                }
                this.busyMessage.close(clr.bold(clr.info(`✓`)))
                console.log(clr.input(stdout))
                this.busyMessage.start(clr.bold(clr.debug("> npm run build")))
                child_process.exec("npm run build", (err: Error, stdout: string, stderr: string) => {
                    if (err) {
                        this.busyMessage.close(clr.bold(clr.error(`[${err.name}]`)))
                        console.log(clr.error(err.message))
                        console.log(clr.prompt(err.stack))
                        return observer.error(err)
                    }
                    this.busyMessage.close(clr.bold(clr.info(`✓`)))
                    console.log(clr.input(stdout))
                    this.busyMessage.start(clr.bold(clr.debug("> npm run test")))
                    child_process.exec("ng test --single-run=true", (err: Error, stdout: string, stderr: string) => {
                        if (err) {
                            this.busyMessage.close(clr.bold(clr.error(`[${err.name}]`)))
                            console.log(clr.error(err.message))
                            console.log(clr.prompt(err.stack))
                            return observer.error(err)
                        }
                        this.busyMessage.close(clr.bold(clr.info(`✓`)))
                        console.log(clr.input(stdout))
                        observer.next(true)
                        observer.complete()
                    })
                })
            })
        })
    }

    private install = (...args) => {
        this.parseArgs(args)
        let libDir: string = this.cwd
        if (this.explicitPath != undefined) {
            if (existsSync(this.explicitPath)) {
                process.chdir(this.explicitPath)
                libDir = this.explicitPath
            }
            else {
                console.log(clr.error("[Error] " + "Directory does not exists"))
                process.exit(1)
            }
        }
        let pkg: PackageJSON = this.libraryManager.getPackageJSON(libDir)
        if (!pkg) {
            console.log(clr.error("[Error] " + "package.json not found"))
            process.exit(1)
        }
        console.log(clr.bold(clr.debug("> Update files")))
        let result = this.libraryManager.makeUpdate(pkg, libDir, this.explicitModule)
        if (result != undefined) {
            console.log(clr.error("[Error] " + result))
            process.exit(1)
        }
        if (!this.skipNpm) {
            process.chdir(libDir)
            console.log()
            this.busyMessage.start(clr.bold(clr.debug("> Deleting " + clr.bold("node_modules/"))))
            this.removeNodeModules().then(files => {
                this.busyMessage.close(clr.bold(clr.info(`✓`)))
                console.log()
                this.runNpm().subscribe(success => {
                    process.exit(0)
                },
                    error => process.exit(1))
            })
        }
        else
            process.exit(0)
    }

    vscode = () => {
        if (this.libraryManager.checkCurrentDirectory()) {
            this.libraryManager.createVsCodeLauncher()
            process.exit(0)
        }
        process.exit(1)
    }

    createLibrary = (...args) => {
        let inputs: string[] = args.slice(0, args.length - 1)
        let createDir: boolean = false
        let parentExists: boolean = false
        let f: string
        if (inputs.length) {
            f = inputs[0]
            if (f !== undefined) {
                let f: string = inputs[0].trim()
                if (path.isAbsolute(f)) {
                    f = path.resolve(this.cwd, f)
                }
                parentExists = existsSync(path.dirname(f))
                createDir = !existsSync(f)
            }
            else {
                f = this.cwd
                parentExists = true
                createDir = !existsSync(f)
            }
        }
        let cli: CliInterface = new CliInterface()
        cli.create(f).subscribe(pkg => {
            let printAndExit = () => {
                const str: string = `Library ${pkg.name} created`
                cli.printRect(str, str => `Library ${clr.debug(pkg.name)} created`)
                return process.exit(0)
            }
            if (createDir)
                mkdirSync(f)
            this.libraryManager.makeInstall(pkg, f)
            if (this.skipNpm) {
                return printAndExit()
            }
            process.chdir(f)
            let sub = this.runNpm().subscribe(
                success => {
                    printAndExit()
                },
                error => {
                    sub.unsubscribe()
                    process.exit(1)
                },
                () => {
                    sub.unsubscribe()
                    process.exit(0)
                }
            )
        })
    }
}