"use strict";
/* Copyright (c) 2021-2022 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Toml = exports.isHexadecimal = void 0;
// NOTE: Good example of use case for `r` control in open rule, where
// close state only gets called on last rule.
// Import Jsonic types used by plugins.
const jsonic_next_1 = require("@jsonic/jsonic-next");
// Plugin implementation.
const Toml = (jsonic, options) => {
    // Jsonic option overrides.
    let jsonicOptions = {
        rule: {
            start: 'toml',
            exclude: 'jsonic',
        },
        lex: {
            emptyResult: {},
            match: {
                string: {
                    // CUSTOM STRING MATCHER https://github.com/huan231/toml-nodejs }
                    // NOTE: order not needed as deep merge.
                    make: makeTomlStringMatcher
                }
            },
        },
        fixed: {
            token: {
                '#CL': '=',
                '#DOT': '.',
            }
        },
        match: {
            token: {
                '#ID': /^[a-zA-Z0-9_-]+/,
            },
            value: {
                // TODO: match date string instead
                isodate: {
                    match: /^\d\d\d\d-\d\d-\d\d([Tt ]\d\d:\d\d:\d\d(\.\d+)?([Zz]|-\d\d:\d\d)?)?/,
                    val: (res) => {
                        return new Date(res[0]);
                    }
                },
                localtime: {
                    match: /^\d\d:\d\d:\d\d(\.\d+)/
                }
            }
        },
        tokenSet: {
            KEY: ['#ST', '#ID', null, null],
            VAL: [, , , ,]
        },
        comment: {
            def: {
                slash: null,
                multi: null
            }
        },
    };
    jsonic.options(jsonicOptions);
    const { ZZ, ST, NR, OS, CS, CL, DOT, ID, CA, OB } = jsonic.token;
    const KEY = [ST, NR, ID];
    jsonic.rule('toml', (rs) => {
        rs
            .bo(r => {
            r.node = {};
        })
            .open([
            { s: [KEY, CL], p: 'table', b: 2 },
            { s: [OS, KEY], p: 'table', b: 2 },
            { s: [OS, OS], p: 'table', b: 2 },
        ]);
    });
    jsonic.rule('table', (rs) => {
        rs
            .bo(r => {
            r.node = r.parent.node;
        })
            .open([
            { s: [KEY, CL], p: 'map', b: 2 },
            { s: [OS, KEY], r: 'table', b: 1 },
            { s: [OS, OS], r: 'table', n: { table_array: 1 } },
            {
                s: [KEY, DOT],
                r: 'table',
                c: { n: { table_dive: 0 } },
                n: { table_dive: 1 },
                a: (r) => {
                    let key = r.o0.val;
                    if (r.n.table_array && Array.isArray(r.parent.node[key])) {
                        let arr = r.parent.node[key];
                        let last = arr[arr.length - 1];
                        r.node = last ? last : (arr.push({}), arr[arr.length - 1]);
                    }
                    else {
                        r.node =
                            (r.parent.node[key] = r.parent.node[key] || {});
                    }
                },
                g: 'dive,start'
            },
            {
                s: [KEY, DOT],
                r: 'table',
                n: { table_dive: 1 },
                a: (r) => {
                    let key = r.o0.val;
                    // console.log('KEY', key, r.n.table_array)
                    // console.log('PREV', r.prev.node)
                    if (Array.isArray(r.prev.node)) {
                        let arr = r.prev.node;
                        // console.log('ARR', arr)
                        let last = arr[arr.length - 1];
                        last = last ? last : (arr.push({}), arr[arr.length - 1]);
                        // console.log('LAST', last)
                        r.node = (last[key] = last[key] || {});
                    }
                    else {
                        r.node = (r.prev.node[key] = r.prev.node[key] || {});
                    }
                },
                g: 'dive'
            },
            {
                s: [KEY, CS],
                c: { n: { table_dive: 0 } },
                p: (r) => !r.n.table_array && 'map',
                r: (r) => r.n.table_array && 'table',
                a: (r) => {
                    let key = r.o0.val;
                    r.parent.node[key] =
                        (r.node = r.parent.node[key] || (r.n.table_array ? [] : {}));
                }
            },
            {
                s: [KEY, CS],
                p: (r) => !r.n.table_array && 'map',
                r: (r) => r.n.table_array && 'table',
                a: (r) => {
                    let key = r.o0.val;
                    // console.log('DIVE END', key, r.prev.node)
                    if (Array.isArray(r.prev.node)) {
                        let arr = r.prev.node;
                        // console.log('ARR', arr)
                        let last = arr[arr.length - 1];
                        last = last ? last : (arr.push({}), arr[arr.length - 1]);
                        // console.log('LAST', last)
                        r.node = (last[key] = last[key] || {});
                    }
                    else {
                        r.node =
                            (r.prev.node[key] = r.prev.node[key] || (r.n.table_array ? [] : {}));
                    }
                },
                g: 'dive,end'
            },
            {
                s: [CS],
                p: 'map',
                c: { n: { table_array: 1 } },
                a: (r) => {
                    // r.node = r.prev.node
                    r.prev.node.push(r.node = {});
                }
            },
        ])
            .bc(r => {
            Object.assign(r.node, r.child.node);
        })
            .close([
            { s: [OS, OS], r: 'table', b: 2 },
            { s: [OS, KEY], r: 'table', b: 1 },
            { s: [ZZ] },
        ])
            .ac((_rule, _ctx, next) => {
            next.n.table_dive = 0;
            next.n.table_array = 0;
        });
    });
    jsonic.rule('map', (rs) => {
        rs
            .open([
            { s: [OS], b: 1 },
            { s: [OB, ID], b: 1, p: 'pair' }
        ])
            .close([
            { s: [OS], b: 1 },
            { s: [ZZ] }
        ]);
    });
    jsonic.rule('pair', (rs) => {
        rs
            .open([
            {
                s: [KEY, CL],
                p: 'val',
                u: { pair: true },
                a: (r) => r.use.key = r.o0.val
            },
        ])
            .close([
            // { s: [ID], b: 1, r: 'pair' },
            { s: [KEY], b: 1, r: 'pair' },
            { s: [OS], b: 1 }
        ]);
    });
    jsonic.rule('val', (rs) => {
        rs
            .close([
            // { s: [ID], b: 1 },
            { s: [KEY], b: 1 },
            { s: [OS], b: 1 }
        ]);
    });
    jsonic.rule('elem', (rs) => {
        rs
            .close([
            // Ignore trailing comma.
            { s: [CA, CS], b: 1, g: 'comma' },
        ]);
    });
};
exports.Toml = Toml;
// Adapted from https://github.com/huan231/toml-nodejs/blob/master/src/tokenizer.ts
// Copyright (c) 2022 Jan Szybowski, MIT License
function makeTomlStringMatcher() {
    return function stringMatcher(lex) {
        let { pnt, src } = lex;
        let { sI, rI, cI } = pnt;
        let srclen = src.length;
        let isMultiline = false;
        let begin = sI;
        let delimiter = src[sI];
        let singleQuote = '\'' === delimiter;
        let doubleQuote = '"' === delimiter;
        if (!singleQuote && !doubleQuote) {
            return;
        }
        if (delimiter === src[sI + 1]) {
            if (delimiter !== src[sI + 2]) {
                pnt.sI = sI + 2;
                pnt.cI = cI + 2;
                return lex.token('#ST', jsonic_next_1.EMPTY, jsonic_next_1.EMPTY, pnt);
            }
            sI += 2;
            cI += 2;
            isMultiline = true;
        }
        // A newline immediately following the opening delimiter will be trimmed.
        // https://toml.io/en/v1.0.0#string
        if (isMultiline) {
            if ('\n' === src[sI + 1]) {
                ++sI;
                cI = 0;
            }
        }
        let value = '';
        for (; sI < srclen - 1;) {
            ++sI;
            ++cI;
            const char = src[sI];
            // console.log('CHAR:' + char)
            switch (char) {
                case '\n':
                    if (!isMultiline) {
                        return lex.bad('unprintable', sI, sI + 1);
                    }
                    value += char;
                    cI = 0;
                    ++rI;
                    continue;
                case delimiter:
                    if (isMultiline) {
                        // console.log('M0<' + src.substring(sI, sI + 3) + '>', 'V<' + value + '>')
                        if (delimiter !== src[sI + 1]) {
                            value += delimiter;
                            //++cI
                            //++sI
                            // console.log('M1<' + src.substring(sI, sI + 3) + '>', 'V<' + value + '>')
                            continue;
                        }
                        if (delimiter !== src[sI + 2]) {
                            value += delimiter;
                            value += delimiter;
                            cI += 1;
                            sI += 1;
                            // console.log('M2<' + src.substring(sI, sI + 3) + '>', 'V<' + value + '>')
                            continue;
                        }
                        cI += 2;
                        sI += 2;
                        if (delimiter === src[sI + 1]) {
                            value += delimiter;
                            sI++;
                            // console.log('M3<' + src.substring(sI, sI + 3) + '>', 'V<' + value + '>')
                        }
                        if (delimiter === src[sI + 1]) {
                            value += delimiter;
                            sI++;
                            // console.log('M4<' + src.substring(sI, sI + 3) + '>', 'V<' + value + '>')
                        }
                    }
                    ++cI;
                    ++sI;
                    break;
                case undefined:
                    return lex.bad('unterminated_string', begin, sI);
                default:
                    if (sI >= srclen) {
                        return lex.bad('unterminated_string', begin, sI);
                    }
                    if (!isUnicodeCharacter(char) || isControlCharacterOtherThanTab(char)) {
                        return lex.bad('unprintable', sI, sI + 1);
                    }
                    switch (delimiter) {
                        case "'":
                            // console.log('APPEND:' + char)
                            value += char;
                            continue;
                        case '"':
                            if (char === '\\') {
                                const char = src[++cI, ++sI];
                                // console.log('ESCAPE:' + char)
                                if (isEscaped(char)) {
                                    value += ESCAPES[char];
                                    continue;
                                }
                                // Any Unicode character may be escaped
                                // with the \uXXXX or \UXXXXXXXX forms.
                                // The escape codes must be valid Unicode scalar values.
                                // https://toml.io/en/v1.0.0#string
                                if (char === 'u' || char === 'U') {
                                    let beginUnicode = sI;
                                    const size = char === 'u' ? 4 : 8;
                                    let codePoint = '';
                                    for (let i = 0; i < size; i++) {
                                        const char = src[++cI, ++sI];
                                        if (sI >= srclen || !(0, exports.isHexadecimal)(char)) {
                                            return lex.bad('invalid_unicode', beginUnicode, sI);
                                        }
                                        codePoint += char;
                                    }
                                    const result = String.fromCodePoint(parseInt(codePoint, 16));
                                    if (!isUnicodeCharacter(result)) {
                                        return lex.bad('invalid_unicode', beginUnicode, sI);
                                    }
                                    value += result;
                                    continue;
                                }
                                // For writing long strings without introducing
                                // extraneous whitespace, use a "line ending
                                // backslash".  When the last non-whitespace character
                                // on a line is an unescaped \, it will be trimmed
                                // along with all whitespace (including newlines) up
                                // to the next non-whitespace character or closing
                                // delimiter.
                                // https://toml.io/en/v1.0.0#string
                                if (isMultiline && (isWhitespace(char) ||
                                    char === '\n' ||
                                    char === '\r')) {
                                    // while (this.iterator.take(' ', '\t', '\n')) {
                                    while ((' ' === src[sI + 1] && ++cI) ||
                                        ('\t' === src[sI + 1] && ++cI) ||
                                        ('\n' === src[sI + 1] && (cI = 0, ++rI)) ||
                                        ('\r' === src[sI + 1] && '\n' === src[sI + 2]
                                            && (cI = 0, ++sI, ++rI))) {
                                        sI++;
                                    }
                                    continue;
                                }
                                // return lex.bad('unexpected', sI, sI + 1)
                                value += '\u001b';
                                continue;
                            }
                            value += char;
                            continue;
                    }
            }
            break;
        }
        pnt.sI = sI;
        pnt.cI = cI;
        pnt.rI = rI;
        let st = lex.token('#ST', value, src.substring(begin, sI), pnt);
        // console.log(st, '<' + value + '>')
        return st;
    };
}
const ESCAPES = {
    'b': '\b',
    't': '\t',
    'n': '\n',
    'f': '\f',
    'r': '\r',
    '"': '"',
    '\\': '\\',
};
const isEscaped = (char) => {
    return char in ESCAPES;
};
const isUnicodeCharacter = (char) => {
    return char <= '\u{10ffff}';
};
const isControlCharacter = (char) => {
    return ('\u{0}' <= char && char < '\u{20}') || char === '\u{7f}';
};
const isControlCharacterOtherThanTab = (char) => {
    return isControlCharacter(char) && char !== '\t';
};
const isHexadecimal = (char) => {
    return ('A' <= char && char <= 'Z') ||
        ('a' <= char && char <= 'z') ||
        ('0' <= char && char <= '9');
};
exports.isHexadecimal = isHexadecimal;
const isWhitespace = (char) => {
    return char === ' ' || char === '\t';
};
// Default option values.
Toml.defaults = {};
//# sourceMappingURL=toml.js.map