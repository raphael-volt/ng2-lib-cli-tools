import * as chai from 'chai';
import * as sinon from 'sinon';
import * as mocha from 'mocha';
import * as path from 'path';
const expect = chai.expect
import { ScanDirUtils, ScanHandler } from "../src/utils/scandir-utils";

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
        ScanDirUtils.scanSync(path.resolve(__dirname, "..", "src"),
            (dir: string, name: string, files: string[], dirs: string[]): boolean => {
                if (files.indexOf("app.ts") != -1) {
                    result = true
                    return false
                }
                return true
            })

        expect(result).to.be.true
    })
    it("should find sync recurse", () => {
        const dir: string = path.resolve(__dirname, "..", "src")
        let result: boolean = false
        ScanDirUtils.scanSync(dir,
            (dir: string, name: string, files: string[], dirs: string[]): boolean => {
                if (files.indexOf("scandir-utils.ts") != -1) {
                    result = true
                    return false
                }
                return true
            }, true)
        expect(result).to.be.true
        result = false
        ScanDirUtils.scanSync(dir,
            (dir: string, name: string, files: string[], dirs: string[]): boolean => {
                if (files.indexOf("app.ts") != -1) {
                    result = true
                    return false
                }
                return true
            }, true)

        expect(result).to.be.true
        result = false
        ScanDirUtils.scanSync(dir,
            (dir: string, name: string, files: string[], dirs: string[]): boolean => {
                if (files.indexOf("files-manager.ts") != -1) {
                    result = true
                    return false
                }
                return true
            }, true)
        expect(result).to.be.true

    })
    
    it("should find async app.ts", (done) => {
        const dir: string = path.resolve(__dirname, "..", "src")

        ScanDirUtils.scan(dir,
            (dir: string, name: string, files: string[], dirs: string[]): boolean => {
                if (files.indexOf("app.ts") != -1) {
                    return false
                }
                return true
            },
            error => {
                done(error)
            },
            () => {
                done()
            })
    })

    it("should find async recurse scandir-utils.ts", (done) => {
        const dir: string = path.resolve(__dirname, "..", "src")

        ScanDirUtils.scan(dir,
            (dir: string, name: string, files: string[], dirs: string[]): boolean => {
                if (files.indexOf("scandir-utils.ts") != -1) {
                    return false
                }
                return true
            },
            error => {
                done(error)
            },
            () => {
                done()
            },
            true)
    })
    it("should find async recurse files-manager.ts", (done) => {
        const dir: string = path.resolve(__dirname, "..", "src")

        ScanDirUtils.scan(dir,
            (dir: string, name: string, files: string[], dirs: string[]): boolean => {
                if (files.indexOf("files-manager.ts") != -1) {
                    return false
                }
                return true
            },
            error => {
                done(error)
            },
            () => {
                done()
            },
            true)
    })
})