import * as chai from 'chai';
import * as sinon from 'sinon';
import * as mocha from 'mocha';
import * as path from 'path';
import * as fs from 'fs';
import { tsfs, FileStats } from 'tsfs';

const expect = chai.expect

describe('ScanDirUtils', () => {


    it("should be scannable", () => {
        const RE: RegExp = /^.{1,2}$/
        expect(RE.test(".")).to.be.true
        expect(RE.test("..")).to.be.true
        expect(RE.test(".tmp")).to.be.false
        expect(RE.test("tmp")).to.be.false
        expect(RE.test("tmp.js")).to.be.false
        expect(RE.test("tmp.js.x")).to.be.false
    })

    it("should find sync app.ts", () => {
        let result: boolean = false
        result = false
        let files: FileStats[] = tsfs.readDir(path.resolve(__dirname, "..", "src"))
        for (let stats of files)
            if (stats.basename == "app.ts")
                result = true
        expect(result).to.be.true
    })

    it("should find sync recurse with", () => {
        const dir: string = path.resolve(__dirname, "..", "src")
        let result: boolean = false
        result = tsfs.findRecurse(dir, (stats: FileStats) => {
            if (stats.basename == "package-manager.ts")
                return true
            return false
        })
        expect(result).to.be.true
        result = tsfs.findRecurse(dir, (stats: FileStats) => {
            if (stats.basename == "app.ts")
                return true
            return false
        })
        expect(result).to.be.true
        result = tsfs.findRecurse(dir, (stats: FileStats) => {
            if (stats.basename == "files-manager.ts")
                return true
            return false
        })
        expect(result).to.be.true

    })

    it("should find async app.ts", (done) => {
        const dir: string = path.resolve(__dirname, "..", "src")
        let complete: boolean = false
        let sub = tsfs.findAsync(dir).subscribe(
            (fileStat: FileStats) => {
                if (fileStat.basename == "app.ts") {
                    sub.unsubscribe()
                    setTimeout(() => {
                        console.log("complete", complete)
                        if(complete)
                            console.log("COMPLETE CALLED !!!")
                        done()
                    }, 200)
                }
            },
            done,
            () => {
                complete = true
            }
        )

    })
    it("should find with findRecurseAsync app.ts", (done) => { 
        let complete: boolean = false
        const dir: string = path.resolve(__dirname, "..", "src")
        let sub = tsfs.findRecurseAsync(dir).subscribe(
            (fileStat: FileStats) => {
                if (fileStat.basename == "app.ts") {
                    sub.unsubscribe()
                    setTimeout(() => {
                        console.log("complete", complete)
                        if(complete)
                            console.log("COMPLETE CALLED ( RECURSE ) !!!")
                        done()
                    }, 200)
                }
            },
            done,
            () => {
                complete = true
            }
        )
    })
})