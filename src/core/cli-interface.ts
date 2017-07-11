import * as rl from 'readline'
import * as path from 'path'
import * as os from 'os'
import * as child_process from 'child_process'

import { clr } from "../utils/colors-util";
import { TsLibStringUtils as tsStr } from "ts-lib-string-utils";
import { Observable, Observer, Subscription } from "rxjs";
import { PackageJSON } from "./package-manager";

interface AskField {
    prompt: string,
    validator: (value: string) => { error: string } | true,
    setProperty?: (value: string) => void,
    state?: number,
    expect?: (value: string) => string,
    write?: string
}

const yesno: string[] = ["yes", "no", "y", "n"]
const yesnoOptions: string = `[${yesno.join("|")}]`

const validateYesNo = (value: string): true | false | { error: string } => {
    const i: number = yesno.indexOf(value)
    if (i != -1)
        return yesno.indexOf(value) % 2 == 0
    return { error: `${clr.error("invalid")} : ${yesnoOptions}` }
}

export class CliInterface {

    private _rootDir: string
    private _pkg: PackageJSON
    private _observer: Observer<PackageJSON>
    private _sub: Subscription

    private _rl: rl.ReadLine

    create(filename?: string): Observable<PackageJSON> {

        return Observable.create((observer: Observer<PackageJSON>) => {
            if (!filename)
                filename = process.cwd()

            this.initInterface(filename, observer)

            this._nextField(
                this._askField(
                    "Library name : ",
                    this.validateName,
                    value => {
                        this._pkg.name = value
                    },
                    this.defaultExpect,
                    tsStr.kebab(path.basename(filename))
                ),
                this.checkGitUser
            )

        })
    }

    private complete = () => {
        this._rl.close()
        this._rl = undefined
        this.unsubscribe()
        const pkg: PackageJSON = this._pkg
        const observer: Observer<PackageJSON> = this._observer
        this._pkg = undefined
        this._observer = undefined
        observer.next(pkg)
        observer.complete()
    }
    private checkGitUser = success => {
        let gitUser: boolean | { error: string }
        let gitUserExists = this.getGitConfig()
        this._nextField(
            this._askField(
                `git user ? ${yesnoOptions} `,
                value => {
                    gitUser = validateYesNo(value)
                    if (gitUser === true || gitUser === false) {
                        return true
                    }
                    return gitUser
                },
                value => { },
                undefined,
                gitUserExists ? "y" : undefined
            ),
            success => {
                if (this._pkg.author !== undefined) {
                    const git: string = 'git'
                    let callbacks: any[] = [
                        () => {
                            let task: AskField = this._askField(
                                "name : ",
                                this.validateRequired,
                                value => this._pkg.author.name = value,
                                this.defaultExpect,
                                this._pkg.author.name
                            )
                            this._nextField(task, nextCallback)
                        },
                        () => {
                            let task: AskField = this._askField(
                                "email : ",
                                this.validateRequired,
                                value => this._pkg.author.email = value,
                                this.defaultExpect,
                                this._pkg.author.email
                            )
                            this._nextField(task, nextCallback)
                        },
                        () => {
                            let task: AskField = this._askField(
                                "repository type : ",
                                this.validateRequired,
                                value => this._pkg.repository.type = value,
                                this.defaultExpect,
                                git
                            )
                            this._nextField(task, nextCallback)
                        },
                        () => {
                            let url: string = ""
                            if (this._pkg.repository.type == git) {
                                url = `https://github.com/${this._pkg.author.name}/${this._pkg.name}.git`
                            }
                            let task: AskField = this._askField(
                                "repository url : ",
                                this.validateRequired,
                                value => this._pkg.repository.url = value,
                                this.defaultExpect,
                                url
                            )
                            this._nextField(task, nextCallback)
                        }
                    ]

                    let nextCallback = success => {
                        callbacks.shift()
                        if (callbacks.length)
                            callbacks[0]()
                        else {
                            this.complete()
                        }
                    }

                    callbacks[0]()
                }
                else {
                    this.complete()
                }
            }
        )
    }

    private defaultExpect = (value: string): string => {
        return value
    }


    private print(value: string) {
        this._rl.write(value + os.EOL)
    }

    private _askField(
        prompt: string,
        validator: (value: string) => { error: string } | true,
        setProperty?: (value: string) => void,
        expect?: (value: string) => string,
        write?: string
    ): AskField {
        return {
            prompt: prompt,
            validator: validator,
            setProperty: setProperty,
            state: 0,
            expect: expect,
            write: write
        }
    }

    private _nextField(field: AskField, success: (success: boolean) => void) {
        let question = (callback: (success: boolean) => void) => {
            this._rl.question(
                clr.prompt(clr.bold(field.prompt)), (answer: string) => {
                    let result = field.validator(answer)
                    if (result === true) {
                        field.setProperty(answer)
                        callback(true)
                    }
                    else {
                        this.print(clr.error(result.error))
                        question(callback)
                        if (field.expect !== undefined)
                            this._rl.write(field.expect(answer))
                    }
                })
        }
        question(success)

        if (field.write !== undefined)
            this._rl.write(field.write)
    }

    printRect(content: string, colrFn?: (string) => string, padding: number = 2) {
        let inputs: string[] = []
        const eol: string = os.EOL
        const r = {
            tL: `┏`,
            tR: `┓`,
            bL: `┗`,
            bR: `┛`,
            h: `━`,
            v: `┃`
        }
        const n: number = content.length
        const n2: number = n + padding * 2
        let i: number
        let l: string[] = []

        l.push(r.tL)
        for (i = 1; i <= n2; i++) {
            l.push(r.h)
        }
        l.push(r.tR)
        inputs.push(clr.input(l.join("")))
        l = [clr.input(r.v)]
        for (i = 0; i < padding; i++)
            l.push(" ")

        if (!colrFn)
            l.push(content)
        else
            l.push(colrFn(content))
        for (i = 0; i < padding; i++)
            l.push(" ")
        l.push(clr.input(r.v))
        inputs.push(clr.input(l.join("")))

        l = [r.bL]
        for (i = 1; i <= n2; i++) {
            l.push(r.h)
        }
        l.push(r.bR)
        inputs.push(clr.input(l.join("")))

        console.log(inputs.join(eol))
    }
    private initInterface(filename: string, observer: Observer<PackageJSON>) {
        this._observer = observer
        this._pkg = {}
        this._rootDir = filename
        this._rl = rl.createInterface(
            process.stdin,
            process.stdout
        )
        this.printRect("Starting angular2 library generator", clr.verbose)
    }

    private unsubscribe() {
        if (this._sub) {
            this._sub.unsubscribe()
            this._sub = undefined
        }
    }

    private error(error?: any) {
        this.unsubscribe()
        this._observer.error(error)
        this._pkg = undefined
        this._observer = undefined
    }

    private getGitConfig(): boolean {
        let result: boolean = false
        this._pkg.author = {
            name: "",
            email: ""
        }
        this._pkg.repository = {
            url: "",
            type: ""
        }
        this.exec(
            this.getGitConfigCommande("name"),
            (err: Error, name: string, stderr: any) => {
                if (!err) {
                    this.exec(
                        this.getGitConfigCommande("email"),
                        (err: Error, email: string, stderr: any) => {
                            if (!err) {
                                this._pkg.author.name = name.trim()
                                this._pkg.author.email = email.trim()
                                result = true
                            }
                        }
                    )
                }
            }
        )
        return result
    }

    private getGitConfigCommande(field: string): string {
        return `git config --get user.${field}`
    }

    private validateName = (name: string): { error: string } | true => {
        if (!name || name.length < 2)
            return { error: "Min 3 characters" }
        return name == tsStr.kebab(name) ? true : { error: "Must be in kebab-case" }
    }

    private exec(command: string, callback: (err: Error, stdout: string, stderr: string) => void): void {
        let error: Error = undefined
        let result: string
        try {
            result = child_process.execSync(command).toString()
        } catch (e) {
            error = e
        }
        callback(error, result, error ? error.message : undefined)
    }

    private validateRequired = (value: string): { error: string } | true => {
        if (!value || value.length == 0)
            return { error: "Required" }
        return true
    }

}
