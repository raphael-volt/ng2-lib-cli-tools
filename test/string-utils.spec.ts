import * as chai from 'chai';
import * as sinon from 'sinon';
import * as mocha from 'mocha';
import { TsLibStringUtils } from 'ts-lib-string-utils';

const tlsu = TsLibStringUtils
const expect = (target: any, message?: string): Chai.Assertion => {
    return chai.expect(target, message)
}

const replaceUpper = (input: string): string => {

    return input.replace(/[A-Z]+/g, (match: any) => {
        return "-" + match
    })
}

describe('StringUtils', () => {

    it("should return [yes|no]", () => {
        const yesno: string[] = ["yes", "no", "y", "n"]

        const isYes = (value: string): boolean => {
            return yesno.indexOf(value) % 2 == 0
        }
        expect(isYes("yes")).to.be.true
        expect(isYes("no")).to.be.false
        expect(isYes("y")).to.be.true
        expect(isYes("n")).to.be.false
        expect(isYes("foo")).to.be.false
        expect(isYes("")).to.be.false

    })
    it("should latinize", () => {
        expect("ExAmPlE aeiouycdenrstzu")
            .to.be.equals(tlsu.latinize("ỆᶍǍᶆṔƚÉ áéíóúýčďěňřšťžů"))

        expect("My53 Module45Test 54 fooBarFoo")
            .to.be.equals(tlsu.latinize("My53 Module45Test 54 fooBarFoo"))

        expect("My53'Module_45-Test()54 foo_Bar_Foo")
            .to.be.equals(tlsu.latinize("My53'Module_45-Tést()54 fôö_Bàr_Foo"))

        expect("My53'Module_4.5.1Test()54 foo_Bar_Foo")
            .to.be.equals(tlsu.latinize("My53'Module_4.5.1Tést()54 fôö_Bàr_Foo"))
    })

    it("should transform to kebab-case", () => {
        expect(
            tlsu.kebab(
                "My53 Module45Test 54 fooBarFoo"
            )
        ).to.be.equals("my-53-module-45-test-54-foo-bar-foo")
        expect(
            tlsu.kebab(
                "My53'Module_45-Test()54 foo_Bar_Foo"
            )
        ).to.be.equals("my-53-module-45-test-54-foo-bar-foo")

        expect(
            tlsu.kebab(
                "My53'Module_4.5.1Test()54 foo_Bar_Foo"
            )
        ).to.be.equals("my-53-module-4-5-1-test-54-foo-bar-foo")
    })

    it("should get module in PascalCase", () => {
        expect("MyLib").to.be.equals(tlsu.pascal("my-lib"))
        expect("MyLib2").to.be.equals(tlsu.pascal("my-lib-2"))
        expect("My45Lib2").to.be.equals(tlsu.pascal("my-4-5-lib-2"))
        expect("My45Lib2").to.be.equals(tlsu.pascal("my-4-5lib-2"))
        expect("My45Lib2").to.be.equals(tlsu.pascal("my-45lib-2"))
        expect("My45Lib2").to.be.equals(tlsu.pascal("my45lib2"))
        expect("My45Lib2").to.be.equals(tlsu.pascal("my-4.5_lib2"))
    })
})
