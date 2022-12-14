"use strict";
/* Copyright (c) 2022 Richard Rodger and other contributors, MIT License */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const jsonic_next_1 = require("@jsonic/jsonic-next");
const toml_1 = require("../toml");
const Fixtures = require('./toml-fixtures');
describe('toml', () => {
    test('happy', async () => {
        const toml = makeToml();
        expect(toml(`a=1`, { xlog: -1 })).toEqual({ a: 1 });
    });
    test('fixtures', async () => {
        const toml = jsonic_next_1.Jsonic.make().use(toml_1.Toml);
        Object.entries(Fixtures).map((fixture) => {
            let name = fixture[0];
            let spec = fixture[1];
            try {
                let parser = toml;
                if (spec.opt) {
                    let j = spec.make ? spec.make(jsonic_next_1.Jsonic) : jsonic_next_1.Jsonic.make();
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
        const toml = jsonic_next_1.Jsonic.make().use(toml_1.Toml);
        let root = __dirname + '/toml-test/tests/valid';
        let found = find(root, []);
        let fails = [];
        let counts = { pass: 0, fail: 0 };
        for (let test of found) {
            try {
                // console.log('TEST', test.name)
                test.out = toml(test.toml);
                test.norm = norm(test.out);
                expect(test.norm).toEqual(test.json);
                console.log('PASS', test.name);
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
        function norm(val) {
            return JSON.parse(JSON.stringify(val, function (_k, v) {
                return v;
            }), (_k, v) => {
                let vt = typeof v;
                if ('number' === vt) {
                    if (('' + v).match(/^-?[0-9]+$/)) {
                        return { type: 'integer', value: '' + v };
                    }
                    else {
                        return { type: 'float', value: '' + v };
                    }
                }
                else if ('string' === vt) {
                    // NOTE: munge the string to get a date
                    if (/^\d\d\d\d-\d\d-\d\dT[^0]/.exec(v)) {
                        return {
                            type: v.match(/Z$/) ? 'datetime' : 'datetime-local',
                            value: v.replace(/\.000Z$/, 'Z')
                        };
                    }
                    else if (/^\d\d\d\d-/.exec(v)) {
                        return { type: 'date-local', value: v.substring(0, 10) };
                    }
                    else if (/^\d\d:/.exec(v)) {
                        return { type: 'time-local', value: v };
                    }
                    return { type: 'string', value: '' + v };
                }
                else if ('boolean' === vt) {
                    return { type: 'bool', value: '' + v };
                }
                return v;
            });
        }
    });
});
function makeToml() {
    return jsonic_next_1.Jsonic.make()
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