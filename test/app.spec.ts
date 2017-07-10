import * as chai from 'chai';
import * as sinon from 'sinon';
import * as mocha from 'mocha';
import * as path from "path";
import * as fs from "fs";

import { App } from "../src/app";
const OUTPUT_DIR: string = path.join(path.dirname(__dirname), "tests", "test-lib")

if(! fs.existsSync(OUTPUT_DIR)) 
    fs.mkdirSync(OUTPUT_DIR)

describe('App', () => {

    let app: App
    it('should create app', () => {
        app = new App()
        chai.expect(app).not.to.be.undefined

        chai.expect(app).not.to.be.null
    })

    it('should initialize app', () => {
        process.chdir(path.join(path.dirname(__dirname), "tests", "test-lib"))
        process.argv.length = 2
        process.argv[2] = "karma"
        process.argv[3] = "-v"
        app.initialize(false)
        chai.expect(app.exitCode).to.be.equals(0)
    })

})