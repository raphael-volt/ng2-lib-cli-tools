import * as chai from 'chai';
import * as sinon from 'sinon';
import * as mocha from 'mocha';
import * as intercept from 'intercept-stdout';
import * as path from "path";
import { App } from "../src/app";

describe('App', () => {
    let app: App
    /*
    it('should set process.argv', () => {
        process.argv.length = 2
        process.argv[2] = "-u"
        process.argv[3] = "message"
        chai.expect(process.argv.length).to.be.equals(4)
    })
    */
    
    
    
    it('should create app', () => {
        app = new App()
        chai.expect(app).not.to.be.undefined
        chai.expect(app).not.to.be.null
    })
    it('should initialize app', () => {
        process.chdir(path.join(path.dirname(__dirname), "tests", "test-lib"))
        console.log(process.cwd())
        process.argv.length = 2
        process.argv[2] = "karma"
        /*
        */
        app.initialize()
    })
})