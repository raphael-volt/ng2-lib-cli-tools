import { LibraryDescriptor } from "./library-manager";

import { apply } from "../utils/object-utils";
import * as program from 'commander'
import * as mkdirp from 'mkdirp'
import * as mustache from 'mustache'
import * as fs from 'fs-extra'
import * as path from 'path'
import { clr } from "../utils/colors-util";
const encoding = { encoding: "utf-8" }
const karma = "karma"
const templates = "templates"

export class FilesManager {

    private libraryPath: string
    private templatesPath: string

    private libraryJoin(...names: string[]) {
        return FilesManager.join(this.libraryPath, names)
    }

    private templatesJoin(...names: string[]) {
        return FilesManager.join(this.templatesPath, names)
    }

    private static join(dir: string, names: string[]) {
        return path.join.apply(null, [dir].concat(names))
    }

    private copy(src: string, dst: string): boolean {
        let action: string = fs.existsSync(dst) ? "update":"create"
        try {
            fs.writeFileSync(dst, fs.readFileSync(src, encoding), encoding)
        } catch (error) {
            console.log(error)
            console.log("src", src, "dst", dst)
            return false
        }
        this.logFSaction(dst, action)
        return true
    }

    private logCreatedFile(dst: string) {
        this.logFSaction(dst, "create")
    }

    private logFSaction(file: string, action) {
        console.log("\t" + clr.bold(clr.info(action)) + " " + clr.input(path.relative(this.libraryPath, file)) ) // + " > " + file
    }

    private updateJson(src: string, dst: string, data?: any): boolean {
        let dstExists: boolean = fs.existsSync(dst)
        let sJson: any
        try {
            if (data) {
                sJson = JSON.parse(mustache.render(fs.readFileSync(src).toString(), data))
            }
            else
                sJson = JSON.parse(fs.readFileSync(src).toString())

            let dJson: any = dstExists ? JSON.parse(fs.readFileSync(dst).toString()): {}

            if (apply(dJson, sJson)) {
                this.logFSaction(dst, dstExists ? "update JSON":"create JSON")
                fs.writeFileSync(dst, JSON.stringify(dJson, null, 4))
            }
        } catch (error) {
            
            console.log(clr.error(error))
            return false
        }
        return true
    }

    private saveTemplate(src: string, dst: string, data: any): boolean {
        let action: string = fs.existsSync(dst) ? "update":"create"
        try {
            fs.writeFileSync(
                dst,
                mustache.render(
                    fs.readFileSync(src, encoding).toString(),
                    data),
                encoding
            )
        } catch (error) {
            console.log(error)
            return false
        }
        this.logFSaction(dst, action)
        return true
    }

    private checkDir(filename: string): boolean {
        try {
            if (!fs.existsSync(filename)) {
                fs.mkdirSync(filename)
                this.logFSaction(filename, "create dir")
            }
        } catch (error) {
            return false
        }
        return true
    }

    createLauncher(templatesPath: string) {
        this.libraryPath = process.cwd()
        this.templatesPath = templatesPath
        let filename: string = "launch.json"
        let dir: string = this.libraryJoin(".vscode")
        this.checkDir(dir)
        this.copy(
            this.templatesJoin(filename),
            path.join(dir, filename)
        )
    }

    createModule(descriptor: LibraryDescriptor) {
        let src: string = this.libraryJoin(descriptor.moduleFilename + ".ts")
        this.logCreatedFile(src)
        fs.writeFileSync(
            src,
            mustache.render(
                `import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'

@NgModule({
    imports: [CommonModule]
})
export class {{moduleClass}} { 

}
`, descriptor), encoding)
    }

    update(templatesPath: string, descriptor: LibraryDescriptor): undefined | string {
        this.libraryPath = descriptor.path
        this.templatesPath = templatesPath

        let filename: string
        let dir: string = karma
        let success = this.checkDir(this.libraryJoin(dir))
        if (!success)
            return "Check directory fail:" + dir
        filename = "main.ts"
        success = this.saveTemplate(
            this.templatesJoin(dir, filename),
            this.libraryJoin(dir, filename),
            descriptor
        )
        for (filename of [
            "polyfills.ts",
            "test.ts",
            "tsconfig.json",
            "tsconfig.spec.json"
        ]) {
            success = this.copy(
                this.templatesJoin(dir, filename),
                this.libraryJoin(dir, filename)
            )
            if (!success)
                return "File write fail:" + filename
        }

        filename = "gulpfile.js"
        success = this.saveTemplate(
            this.templatesJoin(filename),
            this.libraryJoin(filename),
            descriptor
        )
        if (!success)
            return "File write fail:" + filename

        dir = "gulp"
        success = this.checkDir(this.libraryJoin(dir))
        if (!success)
            return "Check directory fail:" + dir

        filename = "inline-resources.js"
        success = this.copy(
            this.templatesJoin(dir, filename),
            this.libraryJoin(dir, filename)
        )
        if (!success)
            return "File write fail:" + filename
        filename = "tsconfig.build.json"
        success = this.saveTemplate(
            this.templatesJoin(dir, filename),
            this.libraryJoin(dir, filename),
            descriptor
        )
        if (!success)
            return "File write fail:" + filename

        filename = "tsconfig.json"
        success = this.updateJson(
            this.templatesJoin(filename),
            this.libraryJoin(filename)
        )
        if (!success)
            return "File write fail:" + filename
        
        filename = "karma.conf.js"
        success = this.copy(
            this.templatesJoin(filename),
            this.libraryJoin(filename)
        )
        if (!success)
            return "File write fail:" + filename

        filename = ".angular-cli.json"
        success = this.updateJson(
            this.templatesJoin(filename),
            this.libraryJoin(filename),
            descriptor
        )
        if (!success)
            return "File write fail:" + filename

        dir = this.libraryJoin("test")
        success = this.checkDir(dir)
        if (!success)
            return "Check directory fail:" + dir

        filename = "module.spec.ts"
        success = this.saveTemplate(
            this.templatesJoin(filename),
            path.join(dir, descriptor.packageJSON.name + ".module.spec.ts"),
            descriptor
        )
        if (!success)
            return "File write fail:" + filename

        return undefined
    }
    run(templatesPath: string, descriptor: LibraryDescriptor): number {
        this.libraryPath = descriptor.path
        this.templatesPath = templatesPath

        let filename: string
        let dir: string = karma
        let success = this.checkDir(this.libraryJoin(dir))
        if (!success)
            return 1
        filename = "main.ts"
        success = this.saveTemplate(
            this.templatesJoin(dir, filename),
            this.libraryJoin(dir, filename),
            descriptor
        )
        if (!success)
            return 2
        for (filename of [
            "polyfills.ts",
            "test.ts",
            "tsconfig.json",
            "tsconfig.spec.json"
        ]) {
            success = this.copy(
                this.templatesJoin(dir, filename),
                this.libraryJoin(dir, filename)
            )
            if (!success)
                return 3
        }

        filename = "gulpfile.js"
        success = this.saveTemplate(
            this.templatesJoin(filename),
            this.libraryJoin(filename),
            descriptor
        )
        if (!success)
            return 4

        dir = "gulp"
        success = this.checkDir(this.libraryJoin(dir))
        if (!success)
            return 5

        filename = "inline-resources.js"
        success = this.copy(
            this.templatesJoin(dir, filename),
            this.libraryJoin(dir, filename)
        )
        filename = "tsconfig.build.json"
        success = this.saveTemplate(
            this.templatesJoin(dir, filename),
            this.libraryJoin(dir, filename),
            descriptor
        )

        if (!success)
            return 6
        for (filename of [
            "tsconfig.json",
            "karma.conf.js"
        ]) {
            success = this.copy(
                this.templatesJoin(filename),
                this.libraryJoin(filename)
            )
            if (!success)
                return 7
        }

        filename = ".angular-cli.json"
        success = this.saveTemplate(
            this.templatesJoin(filename),
            this.libraryJoin(filename),
            descriptor
        )
        dir = this.libraryJoin("test")
        this.checkDir(dir)

        filename = "module.spec.ts"
        success = this.saveTemplate(
            this.templatesJoin(filename),
            path.join(dir, descriptor.packageJSON.name + ".spec.ts"),
            descriptor
        )

        dir = "src"
        success = this.checkDir(this.libraryJoin(dir))
        if (!success)
            return 8

        return 0
    }
}