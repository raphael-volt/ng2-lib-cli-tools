
const primitives: string[] = [
    "number",
    "string",
    "symbol"
]
const uOn: any[] = [
    null,
    undefined
]

const objects: string[] = [
    "object"
]


const isA = (types: any[], target: any): boolean => {
    return types.indexOf(target) != -1
}
export const isObject = (src: any) => {
    if (isA(uOn, src))
        return false
    return isA(objects, typeof src)
}

export const isArray = (value: any) => {
    if (isA(uOn, value))
        return false
    return (value instanceof Array === true)
}

export const apply = (target: object, src: object): boolean => {
    return _apply(target, src)
}

const _applyArray = (target: object, src: object, prop: string, changed?: { changed: boolean }) => {


}

export const equals = (a: any, b: any) => {
    let _equals: boolean = true
    let equalsRecurse = (a: any, b: any) => {
        if (isObject(a)) {
            if (b == undefined || !isObject(b)) {
                _equals = false
                return
            }
            let p: any
            let bProps: string[] = []
            let j: number

            for (p in b) {
                bProps.push(p)
            }
            for (p in a) {
                j = bProps.indexOf(p)
                if (j != -1)
                    bProps.splice(j, 1)
                if (isObject(a[p])) {
                    if (isObject(b[p])) {
                        equalsRecurse(a[p], b[p])
                        if (!_equals)
                            return
                        continue
                    }
                    else {
                        _equals = false
                        return
                    }
                }
                else {
                    if (isArray(a[p])) {
                        if (isArray(b[p]) && a[p].length == b[p].length) {
                            for (let i = 0; i < a[p].length; i++) {
                                if (!equals(a[p][i], b[p][i])) {
                                    _equals = false
                                    return
                                }
                            }
                        }
                        else {
                            _equals = false
                            return
                        }
                    }
                    else {
                        equalsRecurse(a[p], b[p])
                        if (!_equals)
                            return
                    }
                }
                if (!_equals)
                    return
            }
            if (bProps.length) {
                _equals = false
                return
            }

        }
        else if (a != b) {
            _equals = false
            return
        }
    }

    equalsRecurse(a, b)

    return _equals

}

const _apply = (target: object, src: object, changed?: { changed: boolean }): boolean => {
    if (!changed)
        changed = { changed: false }
    for (let p in src) {
        if (target[p] == undefined) {
            target[p] = undefined
        }
        if (isArray(src[p])) {
            _applyArray(target, src, p, changed)
            if (target[p] == undefined) {
                target[p] = []
            }
            let tl: any[] = target[p]
            tl = tl.slice()
            let sl: any[] = src[p]
            sl = sl.slice()
            let j
            let i: number
            let primArr: boolean = true
            for (j in sl) {
                if (isObject(sl[j])) {
                    primArr = false
                    break
                }
            }
            if (primArr) {
                for (j in sl) {
                    i = tl.indexOf(sl[j])
                    if (i == -1) {
                        tl.push(sl[j])
                        if (!changed.changed)
                            changed.changed = true
                    }
                }
                target[p] = tl
            }
            else {

                for (j in sl) {
                    if (sl[j] && !tl[j])
                        tl[j] = {}
                    if (!equals(sl[j], tl[j])) {
                        apply(tl[j], sl[j])
                        target[p].splice(j, 0, tl[j])
                        if (!changed.changed)
                            changed.changed = true
                    }
                }
            }
            continue
        }
        if (isObject(src[p])) {
            if (target[p] == undefined) {
                target[p] = {}
            }
            _apply(target[p], src[p], changed)
            continue
        }
        setPrimitive(target, src, p, changed)
    }
    return changed.changed
}

const setPrimitive = (target: any, src: any, prop: any, changed: { changed: boolean }) => {
    if (target[prop] == src[prop])
        return
    target[prop] = src[prop]
    if (!changed.changed)
        changed.changed = true
}