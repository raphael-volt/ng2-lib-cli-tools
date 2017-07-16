import * as chai from 'chai';
import * as sinon from 'sinon';
import * as mocha from 'mocha';
import * as path from "path";
import * as fs from "fs-extra";
import { BlueprintManager } from "../src/core/blueprint-manager";
import { libGen } from "./helpers/lib-gen"
import { PackageJSON, PACKAGE_JSON } from "../src/core/package-manager"

const expect = (target: any, message?: string): Chai.Assertion => {
    return chai.expect(target, message)
}

const expectBe = (target: any, message?: string): Chai.Assertion => {
    return expect(target, message).to.be
}

const expectNot = (target: any, message?: string): Chai.Assertion => {
    return expect(target, message).not.to.be
}

const LIB_NAME: string = "lib-blueprint"
const TEST_LIB_PATH: string = path.resolve(__dirname, "..", "tests", LIB_NAME)
const SRC: string = "src"
const SUB_MODULE_NAME: string = "sub-feat"
const SUB_MODULE_PATH: string = path.join(TEST_LIB_PATH, SRC, SUB_MODULE_NAME)
const SUB_MODULE_COMPONENT_NAME: string = SUB_MODULE_NAME + "-view"
const SUB_MODULE_SERVICE_NAME: string = SUB_MODULE_NAME + "-provider"

let pkg: PackageJSON = undefined
const bm: BlueprintManager = new BlueprintManager()

describe('Blueprints', () => {

    before(function (done) {
        this.timeout(60000)
        fs.pathExists(TEST_LIB_PATH).then(exists => {
            if (exists) {
                fs.readJSON(path.join(TEST_LIB_PATH, PACKAGE_JSON)).then(value => {
                    pkg = value
                    let back: string = path.join(TEST_LIB_PATH, pkg.config.nglib.module + ".back")
                    fs.pathExists(back).then(exists => {
                        if (!exists)
                            fs.copy(
                                path.join(TEST_LIB_PATH, pkg.config.nglib.module),
                                back)
                                .then(() => {
                                    done()
                                }).catch(done)
                        else
                            done()
                    })
                }).catch(done)
                return
            }
            libGen(TEST_LIB_PATH).then(value => {
                pkg = value
                done()
            }).catch(done)
        }).catch(done)

    })

    after(done => {
        let back: string = path.join(TEST_LIB_PATH, pkg.config.nglib.module + ".back")
        let cleanTests = () => {
            const dir: string = path.join(TEST_LIB_PATH, "test")
            fs.readdir(dir).then(files => {
                for (let f of files) {
                    if (/^.{1,2}$/.test(f))
                        continue
                    fs.unlinkSync(path.join(dir, f))
                }
                fs.pathExists(SUB_MODULE_PATH).then(exists => {
                    if (exists)
                        fs.remove(SUB_MODULE_PATH).then(() => done()).catch(done)
                    else
                        done()
                }).catch(done)
            })
        }
        fs.pathExists(back).then(exists => {
            if (exists) {
                fs.move(
                    path.join(TEST_LIB_PATH, pkg.config.nglib.module + ".back"),
                    path.join(TEST_LIB_PATH, pkg.config.nglib.module),
                    { overwrite: true }
                ).then(cleanTests).catch(done)
            }
            else
                cleanTests()
        }).catch(done)
    })


    it("should be a valid PackageJSON", () => {
        expectNot(pkg).undefined
        expectBe(pkg.name).equals(LIB_NAME)
        expectNot(pkg.config).undefined
        expectNot(pkg.config.nglib).undefined
        expectNot(pkg.config.nglib.module).undefined
        expect(pkg.config.nglib.module).equals(`src/${pkg.name}.module.ts`)
    })

    it("should copy main module", done => {
        const back: string = path.join(TEST_LIB_PATH, pkg.config.nglib.module + ".back")
        fs.pathExists(back).then(exitsts => {
            if (exitsts)
                fs.copy(
                    back,
                    path.join(TEST_LIB_PATH, pkg.config.nglib.module)).then(() => {
                        done()
                    }).catch(done)
            else
                done()
        })
    })

    it("should create sub-module directory", done => {
        let p = path.join(SUB_MODULE_PATH, SUB_MODULE_COMPONENT_NAME)
        if (fs.existsSync(p))
            fs.removeSync(p)
        done()
    })

    it("should not be a nglib package", done => {
        bm.searchMainPackage(__dirname).then(pkg => {
            done("SHOULD NOT RESOLVE")
        }).catch(error => {
            done()
        })
    })

    it("should generate sub module", done => {
        process.chdir(TEST_LIB_PATH)
        bm.generate(
            pkg,
            TEST_LIB_PATH,
            "m",
            path.relative(TEST_LIB_PATH, SUB_MODULE_PATH))
            .then(success => {
                expectBe(fs.existsSync(SUB_MODULE_PATH)).true
                expectBe(fs.existsSync(path.join(SUB_MODULE_PATH, SUB_MODULE_NAME + ".module.ts"))).true
                done()
            })
            .catch(done)
    })

    it("should generate sub component", done => {
        bm.generate(
            pkg,
            TEST_LIB_PATH,
            "c",
            path.join(SRC, SUB_MODULE_NAME, SUB_MODULE_COMPONENT_NAME))
            .then(success => {
                expectBe(fs.existsSync(path.join(SUB_MODULE_PATH, SUB_MODULE_COMPONENT_NAME, SUB_MODULE_COMPONENT_NAME + ".component.ts"))).true
                expectBe(fs.existsSync(path.join(TEST_LIB_PATH, "test", SUB_MODULE_COMPONENT_NAME + ".component.spec.ts"))).true
                expectBe(fs.existsSync(path.join(SUB_MODULE_PATH, SUB_MODULE_COMPONENT_NAME, SUB_MODULE_COMPONENT_NAME + ".component.html"))).true
                expectBe(fs.existsSync(path.join(SUB_MODULE_PATH, SUB_MODULE_COMPONENT_NAME, SUB_MODULE_COMPONENT_NAME + ".component.css"))).true
                done()
            })
            .catch(done)
    })

    it("should generate sub pipe", done => {
        bm.generate(
            pkg,
            TEST_LIB_PATH,
            "p",
            path.join(SRC, SUB_MODULE_NAME, SUB_MODULE_NAME))
            .then(success => {
                expectBe(fs.existsSync(path.join(SUB_MODULE_PATH, SUB_MODULE_NAME + ".pipe.ts"))).true
                expectBe(fs.existsSync(path.join(TEST_LIB_PATH, "test", SUB_MODULE_NAME + ".pipe.spec.ts"))).true
                done()
            })
            .catch(done)
    })

    it("should generate sub directive", done => {
        bm.generate(
            pkg,
            TEST_LIB_PATH,
            "d",
            path.join(SRC, SUB_MODULE_NAME, SUB_MODULE_NAME))
            .then(success => {
                expectBe(fs.existsSync(path.join(SUB_MODULE_PATH, SUB_MODULE_NAME + ".directive.ts"))).true
                expectBe(fs.existsSync(path.join(TEST_LIB_PATH, "test", SUB_MODULE_NAME + ".directive.spec.ts"))).true
                done()
            })
            .catch(done)
    })

    it("should generate sub service", done => {
        bm.generate(
            pkg,
            TEST_LIB_PATH,
            "s",
            path.join(SRC, SUB_MODULE_NAME, SUB_MODULE_NAME))
            .then(success => {
                expectBe(fs.existsSync(path.join(SUB_MODULE_PATH, SUB_MODULE_NAME + ".service.ts"))).true
                expectBe(fs.existsSync(path.join(TEST_LIB_PATH, "test", SUB_MODULE_NAME + ".service.spec.ts"))).true
                done()
            })
            .catch(done)
    })

    it("should find modules", done => {
        bm.searchNearestModule(SUB_MODULE_PATH, TEST_LIB_PATH).then(result => {
            expectBe(path.basename(result).replace(".module.ts", "")).equals(SUB_MODULE_NAME)
            bm.searchNearestModule(path.dirname(path.dirname(result)), TEST_LIB_PATH).then(result => {
                expectBe(path.basename(result).replace(".module.ts", "")).equals(LIB_NAME)
                bm.searchNearestModule(path.dirname(path.dirname(result)), TEST_LIB_PATH).then(result => {
                    expectBe(result).null
                    done()
                }).catch(done)
            }).catch(done)
        }).catch(done)
    })

    it("should find main package then main module from any library sub directories", done => {
        const currentCwd: string = process.cwd()
        const pathList: string[] = [
            path.join(SUB_MODULE_PATH, SUB_MODULE_COMPONENT_NAME),
            SUB_MODULE_PATH,
            path.join(TEST_LIB_PATH, SRC),
            path.join(TEST_LIB_PATH),
            path.join(TEST_LIB_PATH, "test")
        ]
        let next = () => {
            if (!pathList.length) {
                process.chdir(currentCwd)
                return done()
            }
            const p: string = pathList.shift()
            process.chdir(p)
            bm.searchMainPackage().then((result: PackageJSON) => {
                expectBe(result.config.nglib.module).equals(pkg.config.nglib.module)
                next()
            }).catch(done)
        }
        next()
    })
})