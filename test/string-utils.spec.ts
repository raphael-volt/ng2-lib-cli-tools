import * as chai from 'chai';
import * as sinon from 'sinon';
import * as mocha from 'mocha';
import { StringUtils } from "../src/utils/string-utils";

const expect = (target: any, message?: string): Chai.Assertion => {
    return chai.expect(target, message)
}
const replaceUpper = (input: string): string => {

    return input.replace(/[A-Z]+/g, (match: any) => {
        return "-" + match
    })
}

describe('StringUtils', () => {

    it("should latinize", () => {
        expect("ExAmPlE aeiouycdenrstzu")
        .to.be.equals(StringUtils.latinize("ỆᶍǍᶆṔƚÉ áéíóúýčďěňřšťžů"))
        
        expect("My53 Module45Test 54 fooBarFoo")
        .to.be.equals(StringUtils.latinize("My53 Module45Test 54 fooBarFoo"))
        
        expect("My53'Module_45-Test()54 foo_Bar_Foo")
        .to.be.equals(StringUtils.latinize("My53'Module_45-Tést()54 fôö_Bàr_Foo"))
        
        expect("My53'Module_4.5.1Test()54 foo_Bar_Foo")
        .to.be.equals(StringUtils.latinize("My53'Module_4.5.1Tést()54 fôö_Bàr_Foo"))
    })

    it("should replace with '-", () => {
        expect(
            StringUtils.camelCaseLower(
                "My53 Module45Test 54 fooBarFoo"
            )
        ).to.be.equals("my-53-module-45-test-54-foo-bar-foo")
        expect(
            StringUtils.camelCaseLower(
                "My53'Module_45-Test()54 foo_Bar_Foo"
            )
        ).to.be.equals("my-53-module-45-test-54-foo-bar-foo")
        
        expect(
            StringUtils.camelCaseLower(
                "My53'Module_4.5.1Test()54 foo_Bar_Foo"
            )
        ).to.be.equals("my-53-module-4-5-1-test-54-foo-bar-foo")
    })

    it("should get module in camel-case", () => {
        expect("MyLib").to.be.equals(StringUtils.camelCase("my-lib"))
        expect("MyLib2").to.be.equals(StringUtils.camelCase("my-lib-2"))
        expect("My45Lib2").to.be.equals(StringUtils.camelCase("my-4-5-lib-2"))
        expect("My45Lib2").to.be.equals(StringUtils.camelCase("my-4-5lib-2"))
        expect("My45Lib2").to.be.equals(StringUtils.camelCase("my-45lib-2"))
        expect("My45Lib2").to.be.equals(StringUtils.camelCase("my45lib2"))
        expect("My45Lib2").to.be.equals(StringUtils.camelCase("my-4.5_lib2"))
    })
})
