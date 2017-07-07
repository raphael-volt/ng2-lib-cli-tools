
import { Observer, Observable } from "rxjs"
import { PackageJSON, PackageManager } from "./package-manager";
import { FilesManager } from "./files-manager";
import { StringUtils } from "../utils/string-utils";
import { ScanDirUtils } from "../utils/scandir-utils";
import { ModuleFileSearch } from "../utils/module-file-search";
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

    checkCurrentDirectory() {
        const cwd: string = process.cwd()
        this.rootDirectory = cwd
        
        const pkg: PackageManager = this.packageManager
        let pkgExists: boolean = pkg.load(cwd)
        
        const json: PackageJSON = pkg.json
        let createModule: boolean = false
        const moduleName: string = StringUtils.camelCaseLower(path.basename(cwd))
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
            if(json.name && json.name != moduleName) {
                fileNames.push(json.name + ".module.ts")
            }
            
            if(!this.checkModule(path.join(cwd, "src"), fileNames)) {
                createModule = true
            }
        }
        if(createModule) {
            json.name = moduleName
            this.descriptor.moduleClass = StringUtils.camelCase(moduleName) + "Module"
            this.descriptor.moduleFilename = moduleFileName.slice(0, -3)
        }
        
        let code: number = this.filesManager.run(
            path.resolve(__dirname, "..", "..", "templates"),
            this.descriptor
        )
        console.log("this.filesManager.run", code)
        if(createModule) {
            this.filesManager.createModule(this.descriptor)
        }

        let changes: [boolean, boolean] = [
            pkg.validateDependencies(),
            pkg.validateScripts()]
        if(changes[0] || changes[1] || [ createModule])
            pkg.save(cwd)
    }

    private checkModule(dir: string, moduleFileName: string[]): boolean {
        let moduleFound: boolean = false
        const ts_re: RegExp = /.ts$/
        const module_re: RegExp = /.module.ts$/

        ScanDirUtils.scanSync(dir,
            (dir: string, name: string, files: string[], dirs: string[]): boolean => {
                let tsFiles: string[] = []
                let f: string
                for (f of files)
                    if (ts_re.test(f))
                        tsFiles.push(f)
                tsFiles.sort(ModuleFileSearch.sortFiles)
                let j: any
                let mfn: string
                let i: number
                for(j in moduleFileName) {
                    mfn = moduleFileName[j]
                    i = tsFiles.indexOf(mfn)
                    if(i != -1) {
                        tsFiles.splice(i, 1)
                        tsFiles.splice(j, 0, mfn)
                    }
                }
                let moduleClass: string
                for(f of tsFiles) {
                    moduleClass = ModuleFileSearch.parseFile(path.join(dir, f))
                    if(moduleClass) {
                        this.descriptor.moduleClass = moduleClass
                        this.descriptor.moduleFilename = f.slice(0, -3)
                        moduleFound = true
                        break
                    }
                }
                return false
            }, false)
        return moduleFound
    }
}