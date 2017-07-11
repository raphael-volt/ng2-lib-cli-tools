import {PackageJSON, PackageManager} from "./package-manager";
import {FilesManager} from "./files-manager";
import {TsLibStringUtils} from "ts-lib-string-utils";
import {tsfs, FileStats} from 'tsfs';
import {ModuleFileSearch} from "../utils/module-file-search";
import * as path from "path"
import * as fs from "fs"

export interface LibraryDescriptor {
    path?: string,
    packageJSON?: PackageJSON
    moduleFilename?: string
    moduleClass?: string
}

export class LibraryManager {

    private rootDirectory: string
    private packageManager: PackageManager = new PackageManager()
    private descriptor: LibraryDescriptor
    private filesManager: FilesManager = new FilesManager()

    checkCurrentDirectory(): boolean { 
        const cwd: string = process.cwd()
        this.rootDirectory = cwd
        const tplDir: string = path.resolve(__dirname, "..", "..", "templates")
        const pkg: PackageManager = this.packageManager
        pkg.config(path.join(tplDir, "tpl.package.json"))
        return pkg.load(cwd)
    }

    createVsCodeLauncher() {
        this.filesManager.createLauncher(path.resolve(__dirname, "..", "..", "templates"))
    }

    private _checkCurrentDirectory() {
        const cwd: string = process.cwd()
        this.rootDirectory = cwd
        const tplDir: string = path.resolve(__dirname, "..", "..", "templates")
        const pkg: PackageManager = this.packageManager
        pkg.config(path.join(tplDir, "tpl.package.json"))
        let pkgExists: boolean = pkg.load(cwd)

        const json: PackageJSON = pkg.json
        let createModule: boolean = false
        const moduleName: string = TsLibStringUtils.kebab(path.basename(cwd))
        const moduleFileName: string = moduleName + ".module.ts"

        this.descriptor = {
            path: this.rootDirectory,
            packageJSON: pkg.json
        }

        if (!pkgExists || json.name == undefined) {
            createModule = true
        }
        else {
            let fileNames: string[] = [moduleFileName]
            if (json.name && json.name != moduleName) {
                fileNames.push(json.name + ".module.ts")
            }

            if (!this.checkModule(path.join(cwd, "src"), fileNames)) {
                createModule = true
            }
        }
        if (createModule) {
            json.name = moduleName
            this.descriptor.moduleClass = TsLibStringUtils.pascal(moduleName) + "Module"
            this.descriptor.moduleFilename = moduleFileName.slice(0, -3)
        }
        
        let code: number = this.filesManager.run(
            tplDir,
            this.descriptor
        )
        if (createModule) {
            this.filesManager.createModule(this.descriptor)
        }

        let changes: [boolean, boolean] = [
            pkg.validateDependencies(),
            pkg.validateScripts()]
        if (changes[0] || changes[1] || [createModule])
            pkg.save(cwd)
    }

    makeInstall(pkgSrc: PackageJSON, cwd: string) {
        this.rootDirectory = cwd
        const tplDir: string = path.resolve(__dirname, "..", "..", "templates")
        const pkg: PackageManager = this.packageManager
        pkg.config(path.join(tplDir, "tpl.package.json"), pkgSrc)
        
        this.descriptor = {
            path: this.rootDirectory,
            packageJSON: pkg.json
        }
        this.descriptor.moduleClass = TsLibStringUtils.pascal(pkgSrc.name) + "Module"
        this.descriptor.moduleFilename = pkgSrc.name + ".module"

        this.filesManager.run(
            tplDir,
            this.descriptor
        )
        this.filesManager.createModule(this.descriptor)
        pkg.validateDependencies()
        pkg.validateScripts()
        pkg.validateMain()
        pkg.validateTypings()
        pkg.validateVersion()
        pkg.save(cwd)
    }

    private checkModule(dir: string, moduleFileName: string[]): boolean {
        let moduleFound: boolean = false
        const ts_re: RegExp = /.ts$/
        const module_re: RegExp = /.module.ts$/

        let tsFiles: string[] = []
        let files: FileStats[] = tsfs.readDir(dir)
        let filename: string
        for (let stat of files) {
            if (stat.isDir)
                continue
            filename = stat.basename
            if (ts_re.test(filename))
                tsFiles.push(filename)
        }
        let j: any
        let mfn: string
        let i: number
        for (j in moduleFileName) {
            mfn = moduleFileName[j]
            i = tsFiles.indexOf(mfn)
            if (i != -1) {
                tsFiles.splice(i, 1)
                tsFiles.splice(j, 0, mfn)
            }
        }
        let moduleClass: string
        for (filename of tsFiles) {
            moduleClass = ModuleFileSearch.parseFile(path.join(dir, filename))
            if (moduleClass) {
                this.descriptor.moduleClass = moduleClass
                this.descriptor.moduleFilename = filename.slice(0, -3)
                moduleFound = true
                break
            }
        }
        return moduleFound
    }
}