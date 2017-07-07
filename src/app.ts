import * as commander from 'commander'
import { PackageManager, PackageJSON } from "./core/package-manager";
import { LibraryManager, LibraryDescriptor } from "./core/library-manager";

export class App {

    private libraryManager: LibraryManager
    private commander: commander.CommanderStatic
    
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
        commander
            .version('0.0.1')
            .option('-v, --vscode', 'Add Chrome launcher configuration')
            .option('-m, --module <moduleName>', 'Module to bootstrap')
            .command('karma')
            .description('Add karma environment to an angular2 library.')
            .action(this.installKarma)

        commander.command('package')
            .description("Check package dependencies") 
            .action(this.checkPackage)

        commander.parse(process.argv)
    }

    private checkPackage = () => {
        let pkg: PackageManager = new PackageManager()
        pkg.load(this.cwd)
        const changes: [boolean, boolean] = 
        [pkg.validateDependencies(), pkg.validateScripts()]
        if(changes[0] || changes[1])
            pkg.save(this.cwd)
        this.exit(0)
    }

    private installKarma = (options) => {
        const libMan: LibraryManager = this.libraryManager

        libMan.checkCurrentDirectory()

        this.exit(0)
    }

    private exit(code: number) {
        this._exitCode = code
        if(this.exitProcess)
            process.exit(code)
    }
}