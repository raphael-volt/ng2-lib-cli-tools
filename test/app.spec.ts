import * as chai from 'chai';
import * as sinon from 'sinon';
import * as mocha from 'mocha';
import * as intercept from 'intercept-stdout';
import * as path from "path";
import { App } from "../src/app";

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

    it('should check package.json', () => { 
        app = new App()
        process.argv.length = 2
        process.argv[2] = "package"
        app.initialize(false)
        chai.expect(app.exitCode).to.be.equals(0)
    })

})