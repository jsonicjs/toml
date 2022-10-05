"use strict";
/* Copyright (c) 2021-2022 Richard Rodger and other contributors, MIT License */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = __importDefault(require("util"));
const jsonic_next_1 = require("@jsonic/jsonic-next");
const csv_1 = require("../csv");
const Spectrum = require('csv-spectrum');
const Fixtures = require('./csv-fixtures');
describe('csv', () => {
    test('empty-records', async () => {
        // ignored by default
        const jo = jsonic_next_1.Jsonic.make().use(csv_1.Csv);
        expect(jo('\n')).toEqual([]);
        expect(jo('a\n1\n\n2\n3\n\n\n4\n'))
            .toEqual([{ a: '1' }, { a: '2' }, { a: '3' }, { a: '4' }]);
        const ja = jsonic_next_1.Jsonic.make().use(csv_1.Csv, { object: false });
        expect(ja('\n')).toEqual([]);
        expect(ja('a\n1\n\n2\n3\n\n\n4\n'))
            .toEqual([['1'], ['2'], ['3'], ['4']]);
        // start and end also ignored
        expect(jo('\r\na,b\r\nA,B\r\n')).toEqual([{ a: 'A', b: 'B' }]);
        expect(jo('\r\n\r\na,b\r\nA,B\r\n\r\n')).toEqual([{ a: 'A', b: 'B' }]);
        expect(ja('\r\na,b\r\nA,B\r\n')).toEqual([['A', 'B']]);
        expect(ja('\r\n\r\na,b\r\nA,B\r\n\r\n')).toEqual([['A', 'B']]);
        // with option, empty creates record
        const jon = jsonic_next_1.Jsonic.make().use(csv_1.Csv, { record: { empty: true } });
        expect(jon('\n')).toEqual([]);
        expect(jon('a\n1\n\n2\n3\n\n\n4\n'))
            .toEqual([
            { a: '1' }, { a: '' }, { a: '2' }, { a: '3' },
            { a: '' }, { a: '' }, { a: '4' }
        ]);
        // with comments
        const joc = jsonic_next_1.Jsonic.make().use(csv_1.Csv, { comment: true });
        // console.log(joc('a#X\n1\n#Y\n2\n3\n\n#Z\n4\n#Q'))
        expect(joc('a#X\n1\n#Y\n2\n3\n\n#Z\n4\n#Q'))
            .toEqual([{ a: '1' }, { a: '2' }, { a: '3' }, { a: '4' }]);
        const jocn = jsonic_next_1.Jsonic.make().use(csv_1.Csv, { comment: true, record: { empty: true } });
        expect(jocn('a#X\n1\n#Y\n2\n3\n\n#Z\n4\n#Q'))
            .toEqual([
            { a: '1' },
            { a: '' },
            { a: '2' },
            { a: '3' },
            { a: '' },
            { a: '' },
            { a: '4' }
        ]);
    });
    test('header', async () => {
        const jo = jsonic_next_1.Jsonic.make().use(csv_1.Csv);
        expect(jo('\n')).toEqual([]);
        expect(jo('\na,b\nA,B')).toEqual([{ a: 'A', b: 'B' }]);
        const ja = jsonic_next_1.Jsonic.make().use(csv_1.Csv, { object: false });
        expect(ja('\n')).toEqual([]);
        expect(ja('\na,b\nA,B')).toEqual([['A', 'B']]);
        const jon = jsonic_next_1.Jsonic.make().use(csv_1.Csv, { header: false });
        expect(jon('\n')).toEqual([]);
        expect(jon('\na,b\nA,B')).toEqual([
            {
                "field~0": "a",
                "field~1": "b",
            },
            {
                "field~0": "A",
                "field~1": "B",
            },
        ]);
        const jan = jsonic_next_1.Jsonic.make().use(csv_1.Csv, { header: false, object: false });
        expect(jan('\n')).toEqual([]);
        expect(jan('\na,b\nA,B')).toEqual([
            [
                "a",
                "b",
            ],
            [
                "A",
                "B",
            ],
        ]);
        const jonf = jsonic_next_1.Jsonic.make().use(csv_1.Csv, {
            header: false,
            field: { names: ['a', 'b'] },
        });
        expect(jonf('\n')).toEqual([]);
        expect(jonf('\na,b\nA,B')).toEqual([
            {
                "a": "a",
                "b": "b",
            },
            {
                "a": "A",
                "b": "B",
            },
        ]);
    });
    test('comma', async () => {
        const jo = jsonic_next_1.Jsonic.make().use(csv_1.Csv);
        expect(jo('\na')).toEqual([]);
        expect(jo('a\n1,')).toEqual([{ a: '1', 'field~1': '' }]);
        expect(jo('a\n,1')).toEqual([{ a: '', 'field~1': '1' }]);
        expect(jo('a,b\n1,2,')).toEqual([{ a: '1', b: '2', 'field~2': '' }]);
        expect(jo('a,b\n,1,2')).toEqual([{ a: '', b: '1', 'field~2': '2' }]);
        expect(jo('a\n1,\n')).toEqual([{ a: '1', 'field~1': '' }]);
        expect(jo('a\n,1\n')).toEqual([{ a: '', 'field~1': '1' }]);
        expect(jo('a,b\n1,2,\n')).toEqual([{ a: '1', b: '2', 'field~2': '' }]);
        expect(jo('a,b\n,1,2\n')).toEqual([{ a: '', b: '1', 'field~2': '2' }]);
        expect(jo('\na\n')).toEqual([]);
        const ja = jsonic_next_1.Jsonic.make().use(csv_1.Csv, { object: false });
        expect(ja('a\n1,')).toEqual([['1', '']]);
        expect(ja('a\n,1')).toEqual([['', '1']]);
        expect(ja('a,b\n1,2,')).toEqual([['1', '2', '']]);
        expect(ja('a,b\n,1,2')).toEqual([['', '1', '2']]);
        expect(ja('\n1')).toEqual([]);
    });
    test('separators', async () => {
        const jd = jsonic_next_1.Jsonic.make().use(csv_1.Csv, {
            field: {
                separation: '|'
            }
        });
        expect(jd('a|b|c\nA|B|C\nAA|BB|CC')).toEqual([
            { a: 'A', b: 'B', c: 'C' },
            { a: 'AA', b: 'BB', c: 'CC' },
        ]);
        const jD = jsonic_next_1.Jsonic.make().use(csv_1.Csv, {
            field: {
                separation: '~~'
            }
        });
        expect(jD('a~~b~~c\nA~~B~~C\nAA~~BB~~CC')).toEqual([
            { a: 'A', b: 'B', c: 'C' },
            { a: 'AA', b: 'BB', c: 'CC' },
        ]);
        const jn = jsonic_next_1.Jsonic.make().use(csv_1.Csv, {
            record: {
                separators: '%'
            }
        });
        expect(jn('a,b,c%A,B,C%AA,BB,CC')).toEqual([
            { a: 'A', b: 'B', c: 'C' },
            { a: 'AA', b: 'BB', c: 'CC' },
        ]);
    });
    test('double-quote', async () => {
        const j = jsonic_next_1.Jsonic.make().use(csv_1.Csv);
        expect(j('a\n"b"')).toEqual([{ a: 'b' }]);
        expect(j('a\n"""b"')).toEqual([{ a: '"b' }]);
        expect(j('a\n"b"""')).toEqual([{ a: 'b"' }]);
        expect(j('a\n"""b"""')).toEqual([{ a: '"b"' }]);
        expect(j('a\n"b""c"')).toEqual([{ a: 'b"c' }]);
        expect(j('a\n"b""c""d"')).toEqual([{ a: 'b"c"d' }]);
        expect(j('a\n"b""c""d""e"')).toEqual([{ a: 'b"c"d"e' }]);
        expect(j('a\n"""b"')).toEqual([{ a: '"b' }]);
        expect(j('a\n"b"""')).toEqual([{ a: 'b"' }]);
        expect(j('a\n"""b"""')).toEqual([{ a: '"b"' }]);
        expect(j('a\n"""""b"')).toEqual([{ a: '""b' }]);
        expect(j('a\n"b"""""')).toEqual([{ a: 'b""' }]);
        expect(j('a\n"""""b"""""')).toEqual([{ a: '""b""' }]);
    });
    test('trim', async () => {
        const j = jsonic_next_1.Jsonic.make().use(csv_1.Csv);
        expect(j('a\n b')).toEqual([{ a: ' b' }]);
        expect(j('a\nb ')).toEqual([{ a: 'b ' }]);
        expect(j('a\n b ')).toEqual([{ a: ' b ' }]);
        expect(j('a\n  b   ')).toEqual([{ a: '  b   ' }]);
        expect(j('a\n \tb \t ')).toEqual([{ a: ' \tb \t ' }]);
        expect(j('a\n b c')).toEqual([{ a: ' b c' }]);
        expect(j('a\nb c ')).toEqual([{ a: 'b c ' }]);
        expect(j('a\n b c ')).toEqual([{ a: ' b c ' }]);
        expect(j('a\n  b c   ')).toEqual([{ a: '  b c   ' }]);
        expect(j('a\n \tb c \t ')).toEqual([{ a: ' \tb c \t ' }]);
        const jt = jsonic_next_1.Jsonic.make().use(csv_1.Csv, { trim: true });
        expect(jt('a\n b')).toEqual([{ a: 'b' }]);
        expect(jt('a\nb ')).toEqual([{ a: 'b' }]);
        expect(jt('a\n b ')).toEqual([{ a: 'b' }]);
        expect(jt('a\n  b   ')).toEqual([{ a: 'b' }]);
        expect(jt('a\n \tb \t ')).toEqual([{ a: 'b' }]);
        expect(jt('a\n b c')).toEqual([{ a: 'b c' }]);
        expect(jt('a\nb c ')).toEqual([{ a: 'b c' }]);
        expect(jt('a\n b c ')).toEqual([{ a: 'b c' }]);
        expect(jt('a\n  b c   ')).toEqual([{ a: 'b c' }]);
        expect(jt('a\n \tb c \t ')).toEqual([{ a: 'b c' }]);
    });
    test('comment', async () => {
        const j = jsonic_next_1.Jsonic.make().use(csv_1.Csv);
        expect(j('a\n# b')).toEqual([{ a: '# b' }]);
        expect(j('a\n b #c')).toEqual([{ a: ' b #c' }]);
        const jc = jsonic_next_1.Jsonic.make().use(csv_1.Csv, { comment: true });
        expect(jc('a\n# b')).toEqual([]);
        expect(jc('a\n b #c')).toEqual([{ a: ' b ' }]);
        const jt = jsonic_next_1.Jsonic.make().use(csv_1.Csv, { strict: false });
        expect(jt('a\n# b')).toEqual([]);
        expect(jt('a\n b ')).toEqual([{ a: 'b' }]);
    });
    test('number', async () => {
        const j = jsonic_next_1.Jsonic.make().use(csv_1.Csv);
        expect(j('a\n1')).toEqual([{ a: '1' }]);
        expect(j('a\n1e2')).toEqual([{ a: '1e2' }]);
        const jn = jsonic_next_1.Jsonic.make().use(csv_1.Csv, { number: true });
        expect(jn('a\n1')).toEqual([{ a: 1 }]);
        expect(jn('a\n1e2')).toEqual([{ a: 100 }]);
        const jt = jsonic_next_1.Jsonic.make().use(csv_1.Csv, { strict: false });
        expect(jt('a\n1')).toEqual([{ a: 1 }]);
        expect(jt('a\n1e2')).toEqual([{ a: 100 }]);
    });
    test('value', async () => {
        const j = jsonic_next_1.Jsonic.make().use(csv_1.Csv);
        expect(j('a\ntrue')).toEqual([{ a: 'true' }]);
        expect(j('a\nfalse')).toEqual([{ a: 'false' }]);
        expect(j('a\nnull')).toEqual([{ a: 'null' }]);
        const jv = jsonic_next_1.Jsonic.make().use(csv_1.Csv, { value: true });
        expect(jv('a\ntrue')).toEqual([{ a: true }]);
        expect(jv('a\nfalse')).toEqual([{ a: false }]);
        expect(jv('a\nnull')).toEqual([{ a: null }]);
    });
    test('stream', (fin) => {
        let tmp = {};
        let data;
        const j = jsonic_next_1.Jsonic.make().use(csv_1.Csv, {
            stream: (what, record) => {
                if ('start' === what) {
                    data = [];
                    tmp.start = Date.now();
                }
                else if ('record' === what) {
                    data.push(record);
                }
                else if ('end' === what) {
                    tmp.end = Date.now();
                    expect(data).toEqual([
                        { a: '1', b: '2' },
                        { a: '3', b: '4' },
                        { a: '5', b: '6' },
                    ]);
                    expect(tmp.start <= tmp.end).toBeTruthy();
                    fin();
                }
            }
        });
        j('a,b\n1,2\n3,4\n5,6');
    });
    test('unstrict', async () => {
        const j = jsonic_next_1.Jsonic.make().use(csv_1.Csv, { strict: false });
        let d0 = j(`a,b,c
true,[1,2],{x:{y:"q\\"w"}}
 x , 'y\\'y', "z\\"z"
`);
        expect(d0).toEqual([
            {
                a: true,
                b: [
                    1,
                    2,
                ],
                c: {
                    x: {
                        y: 'q"w',
                    },
                },
            },
            {
                a: 'x',
                b: 'y\'y',
                c: 'z"z'
            }
        ]);
        expect(() => j('a\n{x:1}y')).toThrow('unexpected');
    });
    test('spectrum', async () => {
        const j = jsonic_next_1.Jsonic.make().use(csv_1.Csv);
        const tests = await util_1.default.promisify(Spectrum)();
        for (let i = 0; i < tests.length; i++) {
            let test = tests[i];
            let name = test.name;
            let json = JSON.parse(test.json.toString());
            let csv = test.csv.toString();
            let res = j(csv);
            let testname = name + ' ' + (i + 1) + '/' + tests.length;
            expect({ [testname]: res }).toEqual({ [testname]: json });
        }
    });
    test('fixtures', async () => {
        const csv = jsonic_next_1.Jsonic.make().use(csv_1.Csv);
        Object.entries(Fixtures).map((fixture) => {
            let name = fixture[0];
            let spec = fixture[1];
            try {
                let parser = csv;
                if (spec.opt) {
                    let j = spec.make ? spec.make(jsonic_next_1.Jsonic) : jsonic_next_1.Jsonic.make();
                    parser = j.use(csv_1.Csv, spec.opt);
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
});
//# sourceMappingURL=csv.test.js.map