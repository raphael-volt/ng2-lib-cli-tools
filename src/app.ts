import * as commander from 'commander'
import { existsSync, mkdirSync } from 'fs'
import * as path from 'path'
import * as child_process from 'child_process'
import { clr } from "./utils/colors-util";
import { PackageManager, PackageJSON } from "./core/package-manager";
import { LibraryManager, LibraryDescriptor } from "./core/library-manager";
import { CliInterface } from "./core/cli-interface";
import { BusyMessage } from "./utils/busy-message";
export class App {

    private libraryManager: LibraryManager
    private commander: commander.CommanderStatic
    private busyMessage: BusyMessage = new BusyMessage()
    private cwd: string
    private exitProcess: boolean

    private _exitCode: number = 0
    get exitCode(): number {
        return this._exitCode
    }

    constructor() {
        this.commander = commander
        this.libraryManager = new LibraryManager()
    }

    public initialize(exitProcess: boolean = true) {
        this.cwd = process.cwd()
        this.exitProcess = exitProcess
        
        commander.command('vscode')
            .description("Add vscode chrome launcher")
            .action(this.vscode)

        commander.command('new [directory]')
            .description("Create an angular2 library")
            .action(this.createLibrary)

        commander.parse(process.argv)
    }

    private vscode = () => {
        if(this.libraryManager.checkCurrentDirectory()) {
            this.libraryManager.createVsCodeLauncher()
            process.exit(0)
        }
        process.exit(1)
    }

    private createLibrary = (...args) => {
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
                    parentExists = existsSync(path.dirname(f))
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
            if (createDir)
                mkdirSync(f)
            this.libraryManager.makeInstall(pkg, f)
            this.busyMessage.start(clr.bold(clr.debug("> npm install")))
            process.chdir(f)
            child_process.exec("npm install", (err: Error, stdout: string, stderr: string) => {
                if (err) {
                    this.busyMessage.close(clr.bold(clr.error(`[${err.name}]`)))
                    console.log(clr.error(err.message))
                    console.log(clr.prompt(err.stack))
                    return process.exit(1)
                }
                this.busyMessage.close(clr.bold(clr.info(`✓`)))
                console.log(clr.input(stdout))
                this.busyMessage.start(clr.bold(clr.debug("> npm run build")))
                child_process.exec("npm run build", (err: Error, stdout: string, stderr: string) => {
                    if (err) {
                        this.busyMessage.close(clr.bold(clr.error(`[${err.name}]`)))
                        console.log(clr.error(err.message))
                        console.log(clr.prompt(err.stack))
                        return process.exit(1)
                    }
                    this.busyMessage.close(clr.bold(clr.info(`✓`)))
                    console.log(clr.input(stdout))
                    this.busyMessage.start(clr.bold(clr.debug("> npm run test")))
                    child_process.exec("ng test --single-run=true", (err: Error, stdout: string, stderr: string) => {
                        if (err) {
                            this.busyMessage.close(clr.bold(clr.error(`[${err.name}]`)))
                            console.log(clr.error(err.message))
                            console.log(clr.prompt(err.stack))
                            return process.exit(1)
                        }
                        this.busyMessage.close(clr.bold(clr.info(`✓`)))
                        console.log(clr.input(stdout))
                        const str: string = `Library pkg.name created`
                        cli.printRect(str, str => `Library ${clr.debug(pkg.name)} created`)
                        return process.exit(0)
                    })
                })
            })
        })

    }
}