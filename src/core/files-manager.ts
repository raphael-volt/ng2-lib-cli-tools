import { LibraryDescriptor } from "./library-manager";

import * as program from 'commander'
import * as mkdirp from 'mkdirp'
import * as mustache from 'mustache'
import * as fs from 'fs'
import * as path from 'path'

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
        try {
            fs.writeFileSync(dst, fs.readFileSync(src, encoding), encoding)
        } catch (error) {
        console.log("copy")
        console.log("src", src)
        console.log("dst", dst)
        console.log(error)
            return false
        }
        return true
    }

    private saveTemplate(src: string, dst: string, data: any): boolean {
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
        return true
    }

    private checkDir(filename: string): boolean {
        try {
            if (!fs.existsSync(filename))
                fs.mkdirSync(filename)
        } catch (error) {
            return false
        }
        return true
    }

    createModule(descriptor: LibraryDescriptor) {
        let dir:string = "src"
        const success = this.checkDir(this.libraryJoin(dir))
        console.log("createModule", descriptor.moduleFilename, success)
        if (!success)
            return 1

        fs.writeFileSync(
            path.join(descriptor.path, "src", descriptor.moduleFilename + ".ts"),
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
            ".angular-cli.json",
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

        dir = "src"
        success = this.checkDir(this.libraryJoin(dir))
        if (!success)
            return 8

        return 0
    }
}