import * as fs from "fs"
const encoding = { encoding: "utf-8" }

export class ModuleFileSearch {

    static parseFile(filename: string): string {
        return ModuleFileSearch.parseContent(
            fs.readFileSync(filename, encoding)
        )
    }
    
    static parseContent(content: string): string {
        let moduleClass = undefined
        const moduleRE = /@NgModule\s*\(\s*\{[^\}]*\}\s*\)\s*export\s+class\s+(\w+)/gm
        const match = moduleRE.exec(content)
        if (match) {
            moduleClass = match[1]
        }
        return moduleClass
    }

    static readonly MODULE_RE: RegExp = /.module.ts$/
    static sortFiles = (a: string, b: string) => {
        if (a == b)
            return 0
        if (a == "index.ts")
            return -1
        if (b == "index.ts")
            return 1
        const module_re: RegExp = ModuleFileSearch.MODULE_RE
        const a_m: boolean = module_re.test(a)
        const b_m: boolean = module_re.test(b)
        if (a_m && b_m) {
            return [a, b].sort()[0] == a ? -1 : 1
        }
        if (a_m)
            return -1
        if (b_m)
            return 1
        return [a, b].sort()[0] == a ? -1 : 1
    }
}