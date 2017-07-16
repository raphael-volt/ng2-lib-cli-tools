import { PackageJSON } from "../../src/core/package-manager"
import { LibraryManager } from "../../src/core/library-manager"
import * as child_process from "child_process";
import * as fs from "fs-extra"
import * as path from "path"

export const libGen = (dir: string): Promise<PackageJSON> => {
    return new Promise((resolve, reject) => {

        fs.pathExists(dir).then(exists => {
            if (exists)
                return reject(new Error("Directory exists"))
            let pkg: PackageJSON
            const LIB_NAME: string = path.basename(dir)
            fs.mkdirp(dir).then(() => {
                const name: string = "raphael-volt"
                pkg = {
                    name: LIB_NAME,
                    author: {
                        name: name,
                        email: "raphael@ketmie.com"
                    },
                    repository: {
                        type: "git",
                        url: `https://github.com/${name}/${LIB_NAME}.git`
                    },
                }

                let man: LibraryManager = new LibraryManager()
                const currentCwd: string = process.cwd()
                man.makeInstall(pkg, dir)
                process.chdir(dir)
                console.log("> npm install")
                child_process.exec("npm install", (err: Error, stdout: string, stderr: string) => {
                    process.chdir(currentCwd)
                    if (err)
                        return reject(err)
                    console.log(stdout)
                    resolve(pkg)
                })
            }).catch(reject)
        }).catch(reject)

    })
}