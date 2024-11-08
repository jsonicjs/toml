"use strict";
/* Copyright (c) 2022-2024 Richard Rodger and other contributors, MIT License */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const jsonic_1 = require("jsonic");
// import { Debug } from 'jsonic/debug'
const toml_1 = require("../toml");
// NOTE: install toml-test repo to run
// npm run install-toml-test
const Fixtures = require('./toml-fixtures');
describe('toml', () => {
    test('happy', async () => {
        const toml = makeToml();
        expect(toml(`a=1`, { xlog: -1 })).toEqual({ a: 1 });
    });
    test('fixtures', async () => {
        const toml = jsonic_1.Jsonic.make().use(toml_1.Toml);
        Object.entries(Fixtures).map((fixture) => {
            let name = fixture[0];
            let spec = fixture[1];
            try {
                let parser = toml;
                if (spec.opt) {
                    let j = spec.make ? spec.make(jsonic_1.Jsonic) : jsonic_1.Jsonic.make();
                    parser = j.use(toml_1.Toml, spec.opt);
                }
                let raw = null != spec.rawref ? Fixtures[spec.rawref].raw : spec.raw;
                let out = parser(raw);
                expect(out).toEqual(spec.out);
            }
            catch (e) {
                if (spec.err) {
                    expect(spec.err).toEqual(e.code);
                }
                else {
                    console.error('FIXTURE: ' + name);
                    throw e;
                }
            }
        });
    });
    test('toml-valid', async () => {
        const toml = jsonic_1.Jsonic.make().use(toml_1.Toml);
        let root = __dirname + '/toml-test/tests/valid';
        let found = find(root, []);
        let fails = [];
        let counts = { pass: 0, fail: 0 };
        for (let test of found) {
            try {
                // console.log('TEST', test.name)
                test.out = toml(test.toml);
                test.norm = norm(test.out, test.name);
                expect(test.norm).toEqual(test.json);
                // console.log('PASS', test.name)
                counts.pass++;
            }
            catch (e) {
                console.log('FAIL', test.name);
                // console.dir(test, { depth: null })
                counts.fail++;
                fails.push(test.name);
                // throw e
            }
        }
        console.log('COUNTS', counts);
        console.log('FAILS', fails);
        // Handle test case oddities
        function norm(val, name) {
            // console.log(name)
            let jstr = JSON.stringify(val, function (k, v) {
                if ('infinity_plus' === k) {
                    v = '__toml__,float,+inf';
                }
                else if (Infinity === v) {
                    v = '__toml__,float,inf';
                }
                else if (-Infinity === v) {
                    v = '__toml__,float,-inf';
                }
                else if (Number.isNaN(v)) {
                    v = '__toml__,float,nan';
                }
                else if (this) {
                    if (this[k]) {
                        if (this[k].__toml__) {
                            v = '__toml__,' + this[k].__toml__.kind + ',' + this[k].__toml__.src;
                        }
                    }
                }
                return v;
            });
            let jout = JSON.parse(jstr, (_k, v) => {
                let vt = typeof v;
                if ('number' === vt) {
                    if (name.endsWith('float/zero')) {
                        return { type: 'float', value: '' + v };
                    }
                    else if (name.endsWith('long') &&
                        v > 9e10) {
                        return { type: 'integer', value: '9223372036854775807' };
                    }
                    else if (name.endsWith('long') &&
                        v < -9e10) {
                        return { type: 'integer', value: '-9223372036854775808' };
                    }
                    else if (name.endsWith('underscore') &&
                        300000000000000 === v) {
                        return { type: 'float', value: '3.0e14' };
                    }
                    else if (('' + v).match(/^-?[0-9]+$/)) {
                        return {
                            type: name.endsWith('exponent') ? 'float' : 'integer',
                            value: '' + v + (name.endsWith('exponent') ? '.0' : '')
                        };
                    }
                    else {
                        return { type: 'float', value: '' + v };
                    }
                }
                else if ('string' === vt) {
                    if (v.startsWith('__toml__')) {
                        let m = v.match(/__toml__,([^,]+),(.*)/);
                        return {
                            type: ({
                                'offset-date-time': 'datetime',
                                'local-date-time': 'datetime-local',
                                'local-date': 'date-local',
                                'local-time': 'time-local',
                            }[m[1]]) || m[1],
                            value: m[2]
                                .replace(/t/g, 'T')
                                .replace(/ /g, 'T')
                                .replace(/z/g, 'Z')
                                .replace(/\.6Z/, '.6000Z')
                                .replace(/\.6\+/, '.6000+')
                                .replace(/^(\d\d:\d\d)$/, '$1:00')
                                .replace(/T(\d\d:\d\d)([-Z])/, 'T$1:00$2')
                                .replace(/T(\d\d:\d\d)$/, 'T$1:00')
                        };
                    }
                    return { type: 'string', value: '' + v };
                }
                else if ('boolean' === vt) {
                    return { type: 'bool', value: '' + v };
                }
                else if (null != v && 'object' == vt) {
                    if (v.ten) {
                        // 1e3 is not a float dude!
                        if ('integer' === v.ten.type && '1000' === v.ten.value) {
                            v.ten.type = 'float';
                            v.ten.value = '1000.0';
                        }
                    }
                    return v;
                }
                return v;
            });
            // console.log(jstr)
            return jout;
        }
    });
});
function makeToml() {
    return jsonic_1.Jsonic.make()
        // .use(Debug)
        .use(toml_1.Toml);
}
function find(parent, found) {
    for (let file of fs_1.default.readdirSync(parent)) {
        let filepath = path_1.default.join(parent, file);
        let desc = fs_1.default.lstatSync(filepath);
        if (desc.isDirectory()) {
            find(filepath, found);
        }
        else if (desc.isFile()) {
            let m = file.match(/^(.+)\.toml$/);
            if (m && m[1]) {
                found.push({
                    name: path_1.default.join(parent, m[1]),
                    json: JSON.parse(fs_1.default.readFileSync(path_1.default.join(parent, m[1] + '.json')).toString()),
                    toml: fs_1.default.readFileSync(path_1.default.join(parent, m[1] + '.toml')).toString()
                });
            }
        }
    }
    return found;
}
//# sourceMappingURL=toml.test.js.map