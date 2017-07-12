import * as chai from 'chai';
import * as sinon from 'sinon';
import * as mocha from 'mocha';

import { isObject, apply, equals } from "../src/utils/object-utils";
import { App } from "../src/app";

const expect = (target: any, message?: string): Chai.Assertion => {
    return chai.expect(target, message)
}

const expectBe = (target: any, message?: string): Chai.Assertion => {
    return expect(target, message).to.be
}

const expectNot = (target: any, message?: string): Chai.Assertion => {
    return expect(target, message).not.to.be
}


describe('object-utils', () => {

    it("should be object", () => {
        expectBe(isObject({})).true
        expectBe(isObject(new Date())).true
        let app: App = new App
        expectBe(isObject(app)).true

    })
    it("should be primive", () => {
        expectBe(isObject("foo")).false
        expectBe(isObject(1)).false
        expectBe(isObject(NaN)).false
        expectBe(isObject(true)).false
        expectBe(isObject(false)).false
        expectBe(isObject(undefined)).false
        expectBe(isObject(null)).false
    })

    it("should apply", () => {
        let src: any = {
            name: "src name",
            id: 5,
            context: {
                name: "src context",
                id: 12,
                children: ["a", "b", "c", "d", "e"]
            }
        }
        let target: any = {
            name: "target name",
            id: 6,
            context: {
                name: "src context",
                id: 13,
                children: ["a", "b", "c", "d", "e"]
            }
        }
        expectBe(apply(target, src)).true
        expectBe(target.id).equals(5)
        target = {
            name: "src name",
            id: 5,
            context: {
                name: "src context",
                id: 12,
                children: ["a", "b", "c", "d", "e"]
            }
        }
        expectBe(apply(target, src)).false
        target.context.children = ["a", "b"]
        expectBe(apply(target, src)).true
        expectBe(target.context.children.join("")).equals(["a", "b", "c", "d", "e"].join(""))
        target = {}
        expectBe(apply(target, src)).true
        expectBe(apply(target, src)).false

        target.ref = "target ref"
        expectBe(apply(target, src)).false
    })

    it("should apply apps", () => { 
        const src: string = `{
  "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
  "project": {
    "name": "package-name}}"
  },
  "apps": [
    {
      "root": "",
      "outDir": "./dist",
      "main": "./karma/main.ts",
      "polyfills": "./karma/polyfills.ts",
      "test": "./karma/test.ts",
      "testTsconfig": "./karma/tsconfig.spec.json"
    }
  ],
  "test": {
    "karma": {
      "config": "karma.conf.js"
    }
  },
  "defaults": {
    "styleExt": "css",
    "component": {}
  }
}
`
        const target: string = `{
  "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
  "project": {
    "name": "package-name}}"
  },
  "apps": [],
  "test": {
    "karma": {
      "config": "karma.conf.js"
    }
  },
  "defaults": {
    "styleExt": "css",
    "component": {}
  }
}
`
    const srcJ = JSON.parse(src)
    const targetJ = JSON.parse(target)

    expectBe(equals({}, {})).true
    expectBe(equals({}, {apps: []})).false
    expectBe(equals({apps: []}, {})).false
    
    expectBe(apply(targetJ, srcJ)).true
    expectBe(targetJ.apps.length).equals(1)


    })
    it("should apply with array objects", () => { 
        const src: string = `{
    "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
    "project": {
        "name": "cli-test"
    },
    "apps": [
        {
            "root": "",
            "outDir": "./dist",
            "main": "./karma/main.ts",
            "polyfills": "./karma/polyfills.ts",
            "test": "./karma/test.ts",
            "testTsconfig": "./karma/tsconfig.spec.json"
        }
    ],
    "test": {
        "karma": {
            "config": "karma.conf.js"
        }
    },
    "defaults": {
        "styleExt": "css",
        "component": {}
    }
}`

        let target = JSON.parse(src)
        let tpl = JSON.parse(src)
        expectBe(apply(target, tpl)).false
    })
})