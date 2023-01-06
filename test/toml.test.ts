/* Copyright (c) 2022 Richard Rodger and other contributors, MIT License */

import Fs from 'fs'
import Path from 'path'

import { Jsonic, Debug } from '@jsonic/jsonic-next'
import { Toml } from '../toml'


const Fixtures = require('./toml-fixtures')


describe('toml', () => {

  test('happy', async () => {
    const toml = makeToml()
    expect(toml(`a=1`, { xlog: -1 })).toEqual({ a: 1 })
  })


  test('fixtures', async () => {
    const toml = Jsonic.make().use(Toml)
    Object.entries(Fixtures).map((fixture) => {
      let name: string = fixture[0]
      let spec: any = fixture[1]

      try {
        let parser = toml
        if (spec.opt) {
          let j = spec.make ? spec.make(Jsonic) : Jsonic.make()
          parser = j.use(Toml, spec.opt)
        }
        let raw = null != spec.rawref ? Fixtures[spec.rawref].raw : spec.raw
        let out = parser(raw)
        expect(out).toEqual(spec.out)
      }
      catch (e: any) {
        if (spec.err) {
          expect(spec.err).toEqual(e.code)
        }
        else {
          console.error('FIXTURE: ' + name)
          throw e
        }
      }
    })
  })


  test('toml-valid', async () => {
    const toml = Jsonic.make().use(Toml)

    let root = __dirname + '/toml-test/tests/valid'

    let found = find(root, [])

    let fails: any[] = []
    let counts = { pass: 0, fail: 0 }
    for (let test of found) {
      try {
        // console.log('TEST', test.name)
        test.out = toml(test.toml)
        test.norm = norm(test.out)
        expect(test.norm).toEqual(test.json)
        console.log('PASS', test.name)
        counts.pass++
      }
      catch (e: any) {
        console.log('FAIL', test.name)
        // console.dir(test, { depth: null })
        counts.fail++
        fails.push(test.name)
        // throw e
      }
    }

    console.log('COUNTS', counts)

    console.log('FAILS', fails)

    function norm(val: any) {
      return JSON.parse(
        JSON.stringify(val, function(this: any, _k: string, v: any) {
          return v
        }),
        (_k: string, v: any) => {
          let vt = typeof v
          if ('number' === vt) {
            if (('' + v).match(/^-?[0-9]+$/)) {
              return { type: 'integer', value: '' + v }
            }
            else {
              return { type: 'float', value: '' + v }
            }
          }
          else if ('string' === vt) {
            // NOTE: munge the string to get a date
            if (/^\d\d\d\d-\d\d-\d\dT[^0]/.exec(v)) {
              return {
                type: v.match(/Z$/) ? 'datetime' : 'datetime-local',
                value: v.replace(/\.000Z$/, 'Z')
              }
            }
            else if (/^\d\d\d\d-/.exec(v)) {
              return { type: 'date-local', value: v.substring(0, 10) }
            }
            else if (/^\d\d:/.exec(v)) {
              return { type: 'time-local', value: v }
            }
            return { type: 'string', value: '' + v }
          }
          else if ('boolean' === vt) {
            return { type: 'bool', value: '' + v }
          }

          return v
        })
    }
  })
})


function makeToml() {
  return Jsonic.make()
    // .use(Debug)
    .use(Toml)
}

function find(parent: string, found: any[]) {
  for (let file of Fs.readdirSync(parent)) {
    let filepath = Path.join(parent, file)
    let desc = Fs.lstatSync(filepath)
    if (desc.isDirectory()) {
      find(filepath, found)
    }
    else if (desc.isFile()) {
      let m: any = file.match(/^(.+)\.toml$/)
      if (m && m[1]) {
        found.push({
          name: Path.join(parent, m[1]),
          json: JSON.parse(
            Fs.readFileSync(Path.join(parent, m[1] + '.json')).toString()),
          toml: Fs.readFileSync(Path.join(parent, m[1] + '.toml')).toString()
        })
      }
    }
  }

  return found
}
