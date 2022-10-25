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


  const token = {
    '#CL': '=',
    '#DOT': '.',

    // TODO
    // FIX: these break normal [[a]] arrays, have to use OS,CS
    // OR: a context dependent lex matcher?
    // '#TOA': '[[',
    // '#TCA': ']]',

    // TODO
    // '#TKEY': /[A-Za-z0-9_-]+/
  }

  // Jsonic option overrides.
  let jsonicOptions: any = {
    rule: {
      start: 'toml'
    },
    lex: {
      emptyResult: {}
    },
    fixed: {
      token,
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


  // let KEY = jsonic.token('#KEY')


  // jsonic.lex(() => (lex, rule) => {
  //   if (lex.src.substring(lex.pnt.sI).startsWith('[[')) {
  //     console.log(
  //       '============',
  //       rule.name, rule.d,
  //       lex.src.substring(lex.pnt.sI, lex.pnt.sI + 9))
  //     // console.log(lex, rule)
  //   }
  //   return undefined
  // })



  // const { TX, ST, OS, CS, DOT, TOA, TCA } = jsonic.token
  const { TX, ST, OS, CS, CL, DOT } = jsonic.token


  jsonic.rule('toml', (rs: RuleSpec) => {
    rs
      .bo(r => {
        r.node = {}
      })
      .open([
        { s: [TX, CL], p: 'table', b: 2 },
        { s: [OS, TX], p: 'table', b: 2 },
      ])
  })


  jsonic.rule('table', (rs: RuleSpec) => {
    rs
      .bo(r => {
        r.node = r.parent.node
        // r.use.table_map = r.prev.use.table_map
        // r.node = 'toml' === r.parent.name ? r.parent.node : r.prev.node
      })
      .open([
        { s: [TX, CL], p: 'map', b: 2 },

        { s: [OS, TX], r: 'table' },

        {
          s: [TX, DOT],
          r: 'table',
          c: { n: { table_dive: 0 } },
          n: { table_dive: 1 },
          a: (r) => {
            let key = r.o0.val
            r.node = (r.parent.node[key] = r.parent.node[key] || {})
          },
          g: 'dive,start'
        },

        {
          s: [TX, DOT],
          r: 'table',
          n: { table_dive: 1 },
          a: (r) => {
            let key = r.o0.val
            r.node = (r.prev.node[key] = r.prev.node[key] || {})
          },
          g: 'dive'
        },

        {
          s: [TX, CS],
          c: { n: { table_dive: 0 } },
          p: 'map',
          a: (r) => {
            let key = r.o0.val
            r.parent.node[key] = (r.node = r.parent.node[key] || {})
          }
        },

        {
          s: [TX, CS],
          p: 'map',
          a: (r) => {
            let key = r.o0.val
            r.node = (r.prev.node[key] = r.prev.node[key] || {})
          },
          g: 'dive,end'
        },

      ])

      .bc(r => {
        Object.assign(r.node, r.child.node)
      })

      .close([
        { s: [OS], r: 'table', n: { table_dive: 0 } },
        { n: { table_dive: 0 } },
      ])
  })


  jsonic.rule('map', (rs: RuleSpec) => {
    rs
      .close([
        { s: [OS], b: 1 }
      ])
  })


  jsonic.rule('pair', (rs: RuleSpec) => {
    rs
      .close([
        { s: [OS], b: 1 }
      ])
  })


  // jsonic.rule('val', (rs: RuleSpec): RuleSpec => {
  //   rs.open([
  //     {
  //       s: [OS, TX],
  //       b: 1,
  //       c: (r) => 0 === r.d,
  //       p: 'map'
  //     },
  //     {
  //       s: [TX, DOT],
  //       b: 2,
  //       p: 'map'
  //     },
  //     {
  //       s: [TOA, TX],
  //       b: 1,
  //       c: (r) => 0 === r.d,
  //       n: { tomlarr: 1 },
  //       p: 'map'
  //     },
  //   ], { append: false })
  //   return rs
  // })


  // jsonic.rule('map', (rs: RuleSpec): RuleSpec => {
  //   rs
  //     .open([
  //       {
  //         s: [OS, [TX, ST]],
  //         b: 2,
  //       },
  //       {
  //         s: [[TX, ST], CS],
  //         b: 2,
  //         c: (r) => 1 <= r.n.im,
  //         p: 'pair'
  //       },
  //       {
  //         s: [[TX, ST], DOT],
  //         b: 2,
  //         c: (r) => 1 <= r.n.im,
  //         p: 'pair'
  //       },
  //       {
  //         s: [[TX, ST], TCA],
  //         b: 2,
  //         c: (r) => 1 <= r.n.im && 1 === r.n.tomlarr,
  //         p: 'pair',
  //       },
  //     ], { append: false })
  //     .close([
  //       {
  //         s: [OS, [TX, ST]],
  //         b: 2,
  //       },
  //       {
  //         s: [TOA, [TX, ST]],
  //         b: 2,
  //       },
  //     ], { append: false })
  //     .ac((r) => {
  //       if (r.n.tomlarr) {
  //         delete r.n.tomlarr
  //         delete r.parent.n.tomlarr
  //       }
  //     })
  //   return rs
  // })


  // jsonic.rule('pair', (rs: RuleSpec): RuleSpec => {
  //   rs
  //     // .bo((r) => {
  //     //   if (r.prev.use.tomlarr) {
  //     //     r.use.tomlarr = r.prev.use.tomlarr
  //     //   }
  //     // })

  //     .open([
  //       {
  //         s: [[TX, ST], CS],
  //         c: (r) => 1 <= r.n.im,
  //         u: { pair: true },
  //         a: (r) => {
  //           r.use.key = r.o0.val
  //         },
  //         p: 'map'
  //       },
  //       {
  //         s: [[TX, ST], TCA],
  //         c: (r) => 1 <= r.n.im,
  //         u: { pair: true },
  //         a: (r) => {
  //           r.use.key = r.o0.val
  //         },
  //         p: 'list'
  //       },
  //       {
  //         s: [[TX, ST], DOT],
  //         c: (r) => 1 <= r.n.im,
  //         u: { pair: true },
  //         a: (r) => {
  //           r.use.key = r.o0.val
  //         },
  //         p: 'map'
  //       }

  //     ], { append: false })

  //     .bc((r) => {
  //       // delete r.use.tomlarr
  //     })

  //     .close([
  //       {
  //         s: [OS, [TX, ST]],
  //         c: (r) => 1 == r.n.tomlarr && 1 < r.n.im
  //       },
  //       {
  //         s: [OS, [TX, ST]],
  //         b: 1,
  //         c: (r) => 1 == r.n.im,
  //         r: 'pair',
  //         g: 'start'
  //       },
  //       {
  //         s: [TOA, [TX, ST]],
  //         b: 1,
  //         c: (r) => 1 == r.n.im,
  //         r: 'pair',
  //         g: 'start'
  //       },
  //       {
  //         s: [[OS, TOA]],
  //         b: 1,
  //         c: (r) => 1 < r.n.im,
  //         g: 'dive'
  //       },
  //     ], { append: false })
  //   return rs
  // })


  // jsonic.rule('list', (rs: RuleSpec) => {
  //   return rs
  //     .open([
  //       {
  //         c: (r) => 1 === r.n.tomlarr,
  //         n: { pk: -1 },
  //         a: (r) => {
  //           let key = r.parent.use.key
  //           r.node = r.parent.node[key] || []
  //         },
  //         p: 'elem',
  //         g: 'tomlarr'
  //       },
  //     ], { append: false })
  // })


  // jsonic.rule('elem', (rs: RuleSpec): RuleSpec => {
  //   rs
  //     .open([
  //       {
  //         c: (r) => 1 === r.n.tomlarr,
  //         u: { elem: true },
  //         p: 'map'
  //       },
  //     ], { append: false })
  //     .close([
  //       {
  //         s: [[OS, TOA]]
  //       },
  //     ], { append: false })
  //   return rs
  // })

}

// Default option values.
Toml.defaults = {
} as TomlOptions

export { Toml }

export type { TomlOptions }
