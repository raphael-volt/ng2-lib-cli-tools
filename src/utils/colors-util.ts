import * as colors from 'colors'
colors.setTheme({
    silly: 'rainbow',
    input: 'grey',
    verbose: 'cyan',
    prompt: 'grey',
    info: 'green',
    data: 'grey',
    help: 'cyan',
    warn: 'yellow',
    debug: 'blue',
    error: 'red'
})

enum ThemeColors {
    none,
    silly,
    input,
    verbose,
    prompt,
    info,
    data,
    help,
    warn,
    debug,
    error
}

const _clr = {
    input: (str: string) => {
        return clrStr(str, ThemeColors.input)
    },
    verbose: (str: string) => {
        return clrStr(str, ThemeColors.verbose)
    },
    prompt: (str: string) => {
        return clrStr(str, ThemeColors.prompt)
    },
    info: (str: string) => {
        return clrStr(str, ThemeColors.info)
    },
    help: (str: string) => {
        return clrStr(str, ThemeColors.help)
    },
    warn: (str: string) => {
        return clrStr(str, ThemeColors.warn)
    },
    debug: (str: string) => {
        return clrStr(str, ThemeColors.debug)
    },
    error: (str: string) => {
        return clrStr(str, ThemeColors.error)
    },
    bold: (str: string) => {
        return colors.bold(str)
    },
    italic: (str: string) => {
        return colors.italic(str)
    }
}

function clrStr(message: string, color: ThemeColors): string {
    if (color != ThemeColors.none) {
        const prop: string = ThemeColors[color]
        const fn: (message: string) => string = colors[prop]
        return fn(message)
    }
    return message
}

export const clr = _clr