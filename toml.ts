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
type TomlOptions = {
}

// Plugin implementation.
const Toml: Plugin = (jsonic: Jsonic, options: TomlOptions) => {

  const { deep } = jsonic.util

  // let TKEY = jsonic.token('#TKEY')


  // TODO: jsonic needs a tokenSet for KEY, which this plugin can alter
  // keyMatcher should only match with parent rule pair

  // jsonic.lex(function makeTomlKeyMatcher(cfg: Config, opts: Options) {
  //   return function tomlkeyMatcher(lex: Lex, rule: Rule) {
  //     let { pnt, src } = lex
  //     let tkn: Token | undefined = undefined

  //     let m = src.substring(pnt.sI).match(/^([a-zA-Z0-9_-]+)/)

  //     if (m) {
  //       let key = m[1]
  //       console.log('LEX KEY', key, rule.name, rule.parent.name)

  // 	tkn = lex.token(tin, undefined, msrc, pnt)

  //       pnt.sI += mlen
  //       pnt.cI += mlen
  //     }

  //   return tkn
  //   }
  // })


  //   const token = {
  //     '#CL': '=',
  //     '#DOT': '.',

  //     '#ID': /^[a-zA-Z0-9_-]*$/,


  //     // TODO
  //     // FIX: these break normal [[a]] arrays, have to use OS,CS
  //     // OR: a context dependent lex matcher?
  //     // '#TOA': '[[',
  //     // '#TCA': ']]',

  //     // TODO
  //     // '#KEY': /[A-Za-z0-9_-]+/
  //   }
  //

  // Jsonic option overrides.
  let jsonicOptions: any = {
    rule: {
      start: 'toml',
      exclude: 'jsonic',
    },
    lex: {
      emptyResult: {}
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

    // TODO
    // value: {
    //   localdate: {
    //     match: /\d\d\d\d-\d\d-\d\d/
    //   }
    // }
  }

  jsonic.options(jsonicOptions)

  console.log(jsonic.debug.describe())
  // console.log(jsonic.internal().config)



  const { ZZ, ST, NR, OS, CS, CL, DOT, ID } = jsonic.token

  const KEY = [ST, NR, ID]

  jsonic.rule('toml', (rs: RuleSpec) => {
    rs
      .bo(r => {
        r.node = {}
      })
      .open([
        { s: [KEY, CL], p: 'table', b: 2 },
        { s: [OS, KEY], p: 'table', b: 2 },
        { s: [OS, OS], p: 'table', b: 2 },
      ])
  })


  jsonic.rule('table', (rs: RuleSpec) => {
    rs
      .bo(r => {
        r.node = r.parent.node
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
            let key = r.o0.val
            if (r.n.table_array && Array.isArray(r.parent.node[key])) {
              let arr = r.parent.node[key]
              let last = arr[arr.length - 1]
              r.node = last ? last : (arr.push({}), arr[arr.length - 1])
            }
            else {
              r.node =
                (r.parent.node[key] = r.parent.node[key] || {})
            }
          },
          g: 'dive,start'
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
              r.node = (last[key] = last[key] || {})
            }
            else {
              r.node = (r.prev.node[key] = r.prev.node[key] || {})
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
            let key = r.o0.val
            r.parent.node[key] =
              (r.node = r.parent.node[key] || (r.n.table_array ? [] : {}))
          }
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
              r.node = (last[key] = last[key] || {})
            }
            else {
              r.node =
                (r.prev.node[key] = r.prev.node[key] || (r.n.table_array ? [] : {}))
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
            r.prev.node.push(r.node = {})
          }
        },
      ])

      .bc(r => {
        Object.assign(r.node, r.child.node)
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
    rs
      .open([
        { s: [OS], b: 1 }
      ])
      .close([
        { s: [OS], b: 1 },
        { s: [ZZ] }
      ])
  })

  jsonic.rule('pair', (rs: RuleSpec) => {
    rs
      .close([
        { s: [ID], b: 1, r: 'pair' },
        { s: [OS], b: 1 }
      ])
  })

  jsonic.rule('val', (rs: RuleSpec) => {
    rs
      .close([
        { s: [ID], b: 1 },
        { s: [OS], b: 1 }
      ])
  })


}

// Default option values.
Toml.defaults = {
} as TomlOptions

export { Toml }

export type { TomlOptions }
