import * as fs from "fs";
import * as path from "path";

export type ScanHandler = (
    path: string,
    dirName?: string,
    files?: string[],
    directories?: string[]
) => boolean

export class ScanDirUtils {

    static scanSync(
        dir: string,
        scanHandler: ScanHandler,
        recurse: boolean = true
    ): void {
        if (!recurse)
            ScanDirUtils._scanSync(dir, scanHandler)
        else
            ScanDirUtils._scanSyncRecurse(dir, scanHandler)
    }

    private static _scanSyncRecurse(dir: string, handler: ScanHandler) {
        let dirs: string[] = [dir]
        let next = () => {
            if (!dirs.length)
                return
            ScanDirUtils._scanSync(
                dirs.shift(),
                (p: string, dirName: string, files: string[], directories: string[]): boolean => {
                    for (const f of directories) {
                        dirs.push(path.join(p, f))
                    }
                    if (handler(p, dirName, files, directories)) {
                        next()
                    }
                    return true
                }
            )
        }
        next()
    }

    private static _scanSync(dir: string, handler: ScanHandler) {
        
        const fileNames: string[] = fs.readdirSync(dir)
        const files: string[] = []
        const directories: string[] = []
        const name: string = path.basename(dir)
        for (const f of fileNames) {
            if (!ScanDirUtils.scanable(f))
                continue
            const p = path.join(dir, f)
            ScanDirUtils._checkFile(
                fs.lstatSync(p), f,
                files, directories
            )
        }
        handler(dir, name, files, directories)
    }

    static scan(
        dir: string,
        scanHandler: ScanHandler,
        errorHandler: (error) => any,
        callback?: () => void,
        recurse: boolean = true
    ): void {
        if (!recurse)
            ScanDirUtils._scan(dir, scanHandler, errorHandler)
        else
            ScanDirUtils._scanRecurse(dir, scanHandler, callback, errorHandler)

    }

    private static _scanRecurse(dir: string, handler: ScanHandler, callback: () => void, errorHandler: (error) => any)
        : void {
        let dirs: string[] = [dir]
        let next = (): void => {
            if (!dirs.length) {
                if (callback !== undefined)
                    callback()
                return
            }
            let d: string = dirs.shift()
            ScanDirUtils._scan(
                d,
                (p: string, dirName: string, files: string[], directories: string[]): boolean => {
                    if (handler(p, dirName, files, directories)) {
                        for (const f of directories) {
                            dirs.push(path.join(d, f))
                        }
                        next()
                    }
                    else if (callback !== undefined)
                        callback()
                    return true
                },
                errorHandler
            )
        }
        next()
    }
    private static _scan(dir: string, handler: ScanHandler, errorHandler: (error) => any) {
        fs.readdir(dir, (error, files: string[]) => {
            if (error)
                return errorHandler(error)
            ScanDirUtils._lstat(dir, files, handler, errorHandler)
        })
    }

    static SCANABLE_RE: RegExp = /^.{1,2}$/
    static scanable(name: string) {
        return !ScanDirUtils.SCANABLE_RE.test(name)
    }

    private static _checkFile(stats: fs.Stats, fileName: string, files: string[], directories: string[]) {
        if (stats.isDirectory())
            directories.push(fileName)
        else
            files.push(fileName)
    }

    private static _lstat(dir: string, fileNames: string[], handler: ScanHandler, errorHandler: (error) => any)
        : void {
        fileNames = fileNames.slice()
        const files: string[] = []
        const directories: string[] = []
        const name: string = path.basename(dir)

        const next: () => void = () => {
            if (fileNames.length) {
                const f: string = fileNames.shift()
                const p: string = path.join(dir, f)
                fs.lstat(p, (error: any, stats: fs.Stats) => {
                    if (error)
                        return errorHandler(error)
                    if (stats.isDirectory())
                        directories.push(f)
                    else
                        files.push(f)
                    next()
                })
            }
            else {
                handler(dir, name, files, directories)
            }
        }
        next()
    }

}