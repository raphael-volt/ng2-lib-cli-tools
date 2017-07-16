import * as chai from 'chai'
import * as sinon from 'sinon'
import * as mocha from 'mocha'

import * as path from "path"
import * as fs from "fs-extra"

import { PackageJSON, PACKAGE_JSON } from "../src/core/package-manager"

import { libGen } from "./helpers/lib-gen";

const LIB_NAME: string = "test-lib"
const OUTPUT_DIR: string = path.join(path.dirname(__dirname), "tests", LIB_NAME)


const expect = (target: any, message?: string): Chai.Assertion => {
    return chai.expect(target, message)
}

const expectBe = (target: any, message?: string): Chai.Assertion => {
    return expect(target, message).to.be
}

const expectNot = (target: any, message?: string): Chai.Assertion => {
    return expect(target, message).not.to.be
}

let pkg: PackageJSON = undefined

describe('App', () => {

    before(function (done) {
        this.timeout(60000)
        fs.pathExists(OUTPUT_DIR).then(exists => {
            expectBe(exists).false
            libGen(OUTPUT_DIR)
                .then(value => {
                    pkg = value
                    done()
                }).catch(done)
        }).catch(done)
    })

    after((done) => {

        fs.remove(OUTPUT_DIR).then(() => {
            done()
        }).catch(done)

    })

    it('should lib exits', () => {
        expectBe(fs.existsSync(OUTPUT_DIR)).true
        expectNot(pkg).undefined
        expectNot(pkg).null
        const name: string = "src/" + LIB_NAME + ".module.ts"
        expectBe(pkg.config.nglib.module).equals(name)
        expectBe(fs.existsSync(path.join(OUTPUT_DIR, name))).true
    })

})