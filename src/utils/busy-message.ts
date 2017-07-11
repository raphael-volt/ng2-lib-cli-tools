import * as readline from "readline";
import * as os from "os";

export interface WStream {
    write:(text) => void
}
export class BusyMessage {

    public chars: string[] = ["", ".", "..", "..."]

    private timer: any | undefined
    private index: number = 0
    private length: number = 0
    private message: string

    socket:any
    private getSocket(): WStream {
        return this.socket || process.stdout
    }

    start(message, timeout: number = 300) {
        
        this.index = 0
        this.length = this.chars.length
        this.message = message
        this.output()
        if(this.timer == undefined)
            this.timer = setInterval(this.update, timeout)
    }

    close(message: string = "") {
        this.clear()
        this.write(this.message + " " + message)
        this.stop()
    }

    stop() {
        if (this.timer !== undefined) {
            clearInterval(this.timer)
            this.timer = undefined
            this.index = 0
            this.write(os.EOL)
        }
    }

    private clear() {
        const stdout: any = this.getSocket()
        readline.cursorTo(stdout, 0, undefined)
        readline.clearLine(stdout, 1)
    }

    private update = () => {
        this.index = (this.index + 1) % this.length
        this.output()
    }

    private output(): void {
        this.clear()
        this.write(`${this.message} ${this.chars[this.index]}`)
    }

    private write(message: string) {
        this.getSocket().write(message)
    }
}