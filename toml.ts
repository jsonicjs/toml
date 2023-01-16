/* Copyright (c) 2021-2022 Richard Rodger, MIT License */

// NOTE: Good example of use case for `r` control in open rule, where
// close state only gets called on last rule.

// Import Jsonic types used by plugins.
import {
  Jsonic,
  Rule,
  RuleSpec,
  Plugin,
  Context,
  Config,
  Options,
  Lex,
  EMPTY,
} from '@jsonic/jsonic-next'

// See defaults below for commentary.
type TomlOptions = {}

// Plugin implementation.
const Toml: Plugin = (jsonic: Jsonic, options: TomlOptions) => {
  // Jsonic option overrides.
  let jsonicOptions: any = {
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
          make: makeTomlStringMatcher,
        },
      },
    },
    fixed: {
      token: {
        '#CL': '=',
        '#DOT': '.',
      },
    },
    match: {
      token: {
        '#ID': /^[a-zA-Z0-9_-]+/,
      },
      value: {
        // TODO: match date string instead
        isodate: {
          match:
            /^\d\d\d\d-\d\d-\d\d([Tt ]\d\d:\d\d(:\d\d(\.\d+)?)?([Zz]|[-+]\d\d:\d\d)?)?/,
          val: (res: any) => {
            // console.log(res)
            let date: any = new Date(res[0])
            date.__toml__ = {
              kind:
                (null == res[4] ? 'local' : 'offset') +
                '-date' +
                (null == res[1] ? '' : '-time'),
              src: res[0],
            }
            return date
          },
        },
        localtime: {
          match: /^\d\d:\d\d(:\d\d(\.\d+)?)?/,
          val: (res: any) => {
            let date: any = new Date(
              60 * 60 * 1000 + new Date('1970-01-01 ' + res[0]).getTime()
            )
            date.__toml__ = {
              kind: 'local-time',
              src: res[0],
            }
            return date
          },
        },
      },
    },
    value: {
      def: {
        nan: { val: NaN },
        '+nan': { val: NaN },
        '-nan': { val: NaN },
        inf: { val: Infinity },
        '+inf': { val: Infinity },
        '-inf': { val: -Infinity },
      },
    },
    tokenSet: {
      KEY: ['#ST', '#ID', null, null],
      VAL: [, , , ,],
    },
    comment: {
      def: {
        slash: null,
        multi: null,
      },
    },
  }

  jsonic.options(jsonicOptions)

  const { ZZ, ST, NR, OS, CS, CL, DOT, ID, CA, OB } = jsonic.token

  const KEY = [ST, NR, ID]

  jsonic.rule('toml', (rs: RuleSpec) => {
    rs.bo((r) => {
      r.node = {}
    }).open([
      { s: [KEY, CL], p: 'table', b: 2 },
      { s: [OS, KEY], p: 'table', b: 2 },
      { s: [OS, OS], p: 'table', b: 2 },
      { s: [KEY, DOT], p: 'table', b: 2 },
      { s: [ZZ] },
    ])
  })

  jsonic.rule('table', (rs: RuleSpec) => {
    rs.bo((r) => {
      r.node = r.parent.node
    })
      .open([
        { s: [KEY, CL], p: 'map', b: 2 },

        { s: [OS, KEY], r: 'table', b: 1 },

        { s: [OS, OS], r: 'table', n: { table_array: 1 } },

        {
          s: [KEY, DOT],
          c: (r) => 1 === r.d && 'table' !== r.prev.name,
          p: 'dive',
          b: 2,
          u: { top_dive: true },
        },

        {
          s: [KEY, DOT],
          r: 'table',
          c: { n: { table_dive: 0 } },
          n: { table_dive: 1 },
          a: (r) => {
            let key = r.o0.val
            if (r.n.table_array && Array.isArray(r.parent.node[key])) {
              let arr = r.parent.node[key]
              let last = arr[arr.length - 1]
              r.node = last ? last : (arr.push({}), arr[arr.length - 1])
            } else {
              r.node = r.parent.node[key] = r.parent.node[key] || {}
            }
          },
          g: 'dive,start',
        },

        {
          s: [KEY, DOT],
          r: 'table',
          n: { table_dive: 1 },
          a: (r) => {
            let key = r.o0.val
            // console.log('KEY', key, r.n.table_array)
            // console.log('PREV', r.prev.node)
            if (Array.isArray(r.prev.node)) {
              let arr = r.prev.node
              // console.log('ARR', arr)
              let last = arr[arr.length - 1]
              last = last ? last : (arr.push({}), arr[arr.length - 1])
              // console.log('LAST', last)
              r.node = last[key] = last[key] || {}
            } else {
              r.node = r.prev.node[key] = r.prev.node[key] || {}
            }
          },
          g: 'dive',
        },

        {
          s: [KEY, CS],
          c: { n: { table_dive: 0 } },
          p: (r) => !r.n.table_array && 'map',
          r: (r) => r.n.table_array && 'table',
          a: (r) => {
            let key = r.o0.val
            r.parent.node[key] = r.node =
              r.parent.node[key] || (r.n.table_array ? [] : {})
          },
        },

        {
          s: [KEY, CS],
          p: (r) => !r.n.table_array && 'map',
          r: (r) => r.n.table_array && 'table',
          a: (r) => {
            let key = r.o0.val
            // console.log('DIVE END', key, r.prev.node)

            if (Array.isArray(r.prev.node)) {
              let arr = r.prev.node
              // console.log('ARR', arr)
              let last = arr[arr.length - 1]
              last = last ? last : (arr.push({}), arr[arr.length - 1])
              // console.log('LAST', last)
              r.node = last[key] = last[key] || {}
            } else {
              r.node = r.prev.node[key] =
                r.prev.node[key] || (r.n.table_array ? [] : {})
            }
          },
          g: 'dive,end',
        },

        {
          s: [CS],
          p: 'map',
          c: { n: { table_array: 1 } },
          a: (r) => {
            // r.node = r.prev.node
            r.prev.node.push((r.node = {}))
          },
        },
      ])

      .bc((r) => {
        if (!r.use.top_dive) {
          Object.assign(r.node, r.child.node)
        }
      })

      .close([
        { s: [OS, OS], r: 'table', b: 2 },
        { s: [OS, KEY], r: 'table', b: 1 },
        { s: [ZZ] },
      ])

      .ac((_rule, _ctx, next) => {
        next.n.table_dive = 0
        next.n.table_array = 0
      })
  })

  jsonic.rule('map', (rs: RuleSpec) => {
    rs.open([
      { s: [OS], b: 1 },
      { s: [OB, KEY], b: 1, p: 'pair' },
      {
        s: [KEY, DOT],
        p: 'dive',
        b: 2,
      },
      { s: [ZZ] },
    ]).close([{ s: [OS], b: 1 }, { s: [ZZ] }])
  })

  jsonic.rule('pair', (rs: RuleSpec) => {
    rs.open([
      {
        s: [KEY, CL],
        p: 'val',
        u: { pair: true },
        a: (r: Rule) => (r.use.key = r.o0.val),
      },
      {
        s: [KEY, DOT],
        p: 'dive',
        b: 2,
      },
    ]).close([
      { s: [KEY], b: 1, r: 'pair' },
      { s: [OS], b: 1 },
    ])
  })

  jsonic.rule('val', (rs: RuleSpec) => {
    rs.close([
      { s: [KEY], b: 1 },
      { s: [OS], b: 1 },
    ])
  })

  jsonic.rule('elem', (rs: RuleSpec) => {
    rs.close([
      // Ignore trailing comma.
      { s: [CA, CS], b: 1, g: 'comma' },
    ])
  })

  jsonic.rule('dive', (rs) => {
    rs.open([
      {
        s: [KEY, DOT],
        p: 'dive',
        n: { dive_key: 1 },
        a: (r) => {
          r.parent.node[r.o0.val] = r.node = r.parent.node[r.o0.val] || {}
        },
      },
      {
        s: [KEY, CL],
        p: 'val',
        n: { dive_key: 1 },
        u: { dive_end: true },
      },
    ])
      .bc((r) => {
        if (r.use.dive_end) {
          r.node[r.o0.val] = r.child.node
        }
      })
      .close([
        {
          s: [KEY, DOT],
          b: 2,
          r: 'dive',
          c: { n: { dive_key: 1 } },
          n: { dive_key: 0 },
        },
        {},
      ])
  })
}

// Adapted from https://github.com/huan231/toml-nodejs/blob/master/src/tokenizer.ts
// Copyright (c) 2022 Jan Szybowski, MIT License
function makeTomlStringMatcher() {
  return function stringMatcher(lex: Lex) {
    let { pnt, src } = lex
    let { sI, rI, cI } = pnt
    let srclen = src.length

    let isMultiline = false
    let begin = sI

    let delimiter = src[sI]
    let singleQuote = "'" === delimiter
    let doubleQuote = '"' === delimiter

    if (!singleQuote && !doubleQuote) {
      return
    }

    if (delimiter === src[sI + 1]) {
      if (delimiter !== src[sI + 2]) {
        pnt.sI = sI + 2
        pnt.cI = cI + 2
        return lex.token('#ST', EMPTY, EMPTY, pnt)
      }

      sI += 2
      cI += 2
      isMultiline = true
    }

    // A newline immediately following the opening delimiter will be trimmed.
    // https://toml.io/en/v1.0.0#string
    if (isMultiline) {
      if ('\n' === src[sI + 1]) {
        ++sI
        cI = 0
      }
    }

    let value = ''

    for (; sI < srclen - 1; ) {
      ++sI
      ++cI

      const char = src[sI]
      // console.log('CHAR:' + char)

      switch (char) {
        case '\n':
          if (!isMultiline) {
            return lex.bad('unprintable', sI, sI + 1)
          }

          value += char
          cI = 0
          ++rI
          continue

        case delimiter:
          if (isMultiline) {
            // console.log('M0<' + src.substring(sI, sI + 3) + '>', 'V<' + value + '>')

            if (delimiter !== src[sI + 1]) {
              value += delimiter
              //++cI
              //++sI

              // console.log('M1<' + src.substring(sI, sI + 3) + '>', 'V<' + value + '>')
              continue
            }

            if (delimiter !== src[sI + 2]) {
              value += delimiter
              value += delimiter
              cI += 1
              sI += 1
              // console.log('M2<' + src.substring(sI, sI + 3) + '>', 'V<' + value + '>')
              continue
            }

            cI += 2
            sI += 2

            if (delimiter === src[sI + 1]) {
              value += delimiter
              sI++
              // console.log('M3<' + src.substring(sI, sI + 3) + '>', 'V<' + value + '>')
            }

            if (delimiter === src[sI + 1]) {
              value += delimiter
              sI++
              // console.log('M4<' + src.substring(sI, sI + 3) + '>', 'V<' + value + '>')
            }
          }

          ++cI
          ++sI

          break

        case undefined:
          return lex.bad('unterminated_string', begin, sI)

        default:
          if (sI >= srclen) {
            return lex.bad('unterminated_string', begin, sI)
          }

          if (
            !isUnicodeCharacter(char) ||
            isControlCharacterOtherThanTab(char)
          ) {
            return lex.bad('unprintable', sI, sI + 1)
          }

          switch (delimiter) {
            case "'":
              // console.log('APPEND:' + char)
              value += char

              continue

            case '"':
              if (char === '\\') {
                const char = src[(++cI, ++sI)]
                // console.log('ESCAPE:' + char)

                if (isEscaped(char)) {
                  value += ESCAPES[char]

                  continue
                } else if (char === 'x') {
                  sI++
                  let cc = parseInt(src.substring(sI, sI + 2), 16)

                  if (isNaN(cc)) {
                    sI = sI - 2
                    cI -= 2
                    pnt.sI = sI
                    pnt.cI = cI
                    return lex.bad('invalid_ascii', sI, sI + 4)
                  }

                  let us = String.fromCharCode(cc)
                  // console.log('CC', cc, us)

                  value += us
                  sI += 1 // Loop increments sI.
                  cI += 2

                  continue
                }
                // Any Unicode character may be escaped
                // with the \uXXXX or \UXXXXXXXX forms.
                // The escape codes must be valid Unicode scalar values.
                // https://toml.io/en/v1.0.0#string
                else if (char === 'u' || char === 'U') {
                  let beginUnicode = sI
                  const size = char === 'u' ? 4 : 8

                  let codePoint = ''

                  for (let i = 0; i < size; i++) {
                    const char = src[(++cI, ++sI)]

                    if (sI >= srclen || !isHexadecimal(char)) {
                      return lex.bad('invalid_unicode', beginUnicode, sI)
                    }

                    codePoint += char
                  }

                  const result = String.fromCodePoint(parseInt(codePoint, 16))

                  if (!isUnicodeCharacter(result)) {
                    return lex.bad('invalid_unicode', beginUnicode, sI)
                  }

                  value += result

                  continue
                }

                // For writing long strings without introducing
                // extraneous whitespace, use a "line ending
                // backslash".  When the last non-whitespace character
                // on a line is an unescaped \, it will be trimmed
                // along with all whitespace (including newlines) up
                // to the next non-whitespace character or closing
                // delimiter.
                // https://toml.io/en/v1.0.0#string
                if (
                  isMultiline &&
                  (isWhitespace(char) || char === '\n' || char === '\r')
                ) {
                  // while (this.iterator.take(' ', '\t', '\n')) {
                  while (
                    (' ' === src[sI + 1] && ++cI) ||
                    ('\t' === src[sI + 1] && ++cI) ||
                    ('\n' === src[sI + 1] && ((cI = 0), ++rI)) ||
                    ('\r' === src[sI + 1] &&
                      '\n' === src[sI + 2] &&
                      ((cI = 0), ++sI, ++rI))
                  ) {
                    sI++
                  }

                  continue
                }

                // return lex.bad('unexpected', sI, sI + 1)
                value += '\u001b'
                continue
              }

              value += char
              continue
          }
      }

      break
    }

    pnt.sI = sI
    pnt.cI = cI
    pnt.rI = rI

    let st = lex.token('#ST', value, src.substring(begin, sI), pnt)

    // console.log(st, '<' + value + '>')

    return st
  }
}

const ESCAPES = {
  b: '\b',
  t: '\t',
  n: '\n',
  f: '\f',
  r: '\r',
  '"': '"',
  '\\': '\\',
}

const isEscaped = (char: string): char is keyof typeof ESCAPES => {
  return char in ESCAPES
}

const isUnicodeCharacter = (char: string) => {
  return char <= '\u{10ffff}'
}

const isControlCharacter = (char: string) => {
  return ('\u{0}' <= char && char < '\u{20}') || char === '\u{7f}'
}

const isControlCharacterOtherThanTab = (char: string) => {
  return isControlCharacter(char) && char !== '\t'
}

export const isHexadecimal = (char: string) => {
  return (
    ('A' <= char && char <= 'Z') ||
    ('a' <= char && char <= 'z') ||
    ('0' <= char && char <= '9')
  )
}

const isWhitespace = (char: string) => {
  return char === ' ' || char === '\t'
}

// Default option values.
Toml.defaults = {} as TomlOptions

export { Toml }

export type { TomlOptions }
