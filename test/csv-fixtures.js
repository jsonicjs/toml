// NOTE: tests marked `papa-` are Copyright (c) 2015 Matthew Holt, MIT License
// See https://github.com/mholt/PapaParse

const RECORD_SEP = String.fromCharCode(30)
const UNIT_SEP = String.fromCharCode(31)

module.exports = {
  happy: {
    raw: `a,b,c
1,B,true
2,BB,false
`,
    out: [
      { a: '1', b: 'B', c: 'true' },
      { a: '2', b: 'BB', c: 'false' },
    ],
  },

  quote: {
    raw: `a,b,c
"1","B","true"
"2","B""B","false"
`,
    out: [
      { a: '1', b: 'B', c: 'true' },
      { a: '2', b: 'B"B', c: 'false' },
    ],
  },

  notrim: {
    raw: `a,b,c
1 , 2 , 3
 11 ,  22   , 33 
4\t,\t5\t,\t6
\t44\t,\t\t55\t\t\t,\t66\t
`,
    out: [
      {
        a: '1 ',
        b: ' 2 ',
        c: ' 3',
      },
      {
        a: ' 11 ',
        b: '  22   ',
        c: ' 33 ',
      },
      {
        a: '4\t',
        b: '\t5\t',
        c: '\t6',
      },
      {
        a: '\t44\t',
        b: '\t\t55\t\t\t',
        c: '\t66\t',
      },
    ],
  },

  trim: {
    opt: { trim: true },
    rawref: 'notrim',
    out: [
      {
        a: '1',
        b: '2',
        c: '3',
      },
      {
        a: '11',
        b: '22',
        c: '33',
      },
      {
        a: '4',
        b: '5',
        c: '6',
      },
      {
        a: '44',
        b: '55',
        c: '66',
      },
    ],
  },

  'papa-One row': {
    opt: { header: false, object: false },
    raw: 'A,b,c',
    out: [['A', 'b', 'c']],
  },
  'papa-Two rows': {
    opt: { header: false, object: false },
    raw: 'A,b,c\nd,E,f',
    out: [
      ['A', 'b', 'c'],
      ['d', 'E', 'f'],
    ],
  },
  'papa-Three rows': {
    opt: { header: false, object: false },
    raw: 'A,b,c\nd,E,f\nG,h,i',
    out: [
      ['A', 'b', 'c'],
      ['d', 'E', 'f'],
      ['G', 'h', 'i'],
    ],
  },
  'papa-Whitespace at edges of unquoted field': {
    opt: { header: false, object: false },
    raw: 'a,	b ,c',
    notes: 'Extra whitespace should graciously be preserved',
    out: [['a', '	b ', 'c']],
  },
  'papa-Quoted field': {
    opt: { header: false, object: false },
    raw: 'A,"B",C',
    out: [['A', 'B', 'C']],
  },
  'papa-Quoted field with extra whitespace on edges': {
    opt: { header: false, object: false },
    raw: 'A," B  ",C',
    out: [['A', ' B  ', 'C']],
  },
  'papa-Quoted field with delimiter': {
    opt: { header: false, object: false },
    raw: 'A,"B,B",C',
    out: [['A', 'B,B', 'C']],
  },
  'papa-Quoted field with line break': {
    opt: { header: false, object: false },
    raw: 'A,"B\nB",C',
    out: [['A', 'B\nB', 'C']],
  },
  'papa-Quoted fields with line breaks': {
    opt: { header: false, object: false },
    raw: 'A,"B\nB","C\nC\nC"',
    out: [['A', 'B\nB', 'C\nC\nC']],
  },
  'papa-Quoted fields at end of row with delimiter and line break': {
    opt: { header: false, object: false },
    raw: 'a,b,"c,c\nc"\nd,e,f',
    out: [
      ['a', 'b', 'c,c\nc'],
      ['d', 'e', 'f'],
    ],
  },
  'papa-Quoted field with escaped quotes': {
    opt: { header: false, object: false },
    raw: 'A,"B""B""B",C',
    out: [['A', 'B"B"B', 'C']],
  },
  'papa-Quoted field with escaped quotes at boundaries': {
    opt: { header: false, object: false },
    raw: 'A,"""B""",C',
    out: [['A', '"B"', 'C']],
  },
  'papa-Unquoted field with quotes at end of field': {
    opt: { header: false, object: false },
    raw: 'A,B",C',
    out: [['A', 'B"', 'C']],
  },
  'papa-Quoted field with quotes around delimiter': {
    opt: { header: false, object: false },
    raw: 'A,""",""",C',
    out: [['A', '","', 'C']],
  },
  'papa-Quoted field with quotes on right side of delimiter': {
    opt: { header: false, object: false },
    raw: 'A,",""",C',
    out: [['A', ',"', 'C']],
  },
  'papa-Quoted field with quotes on left side of delimiter': {
    opt: { header: false, object: false },
    raw: 'A,""",",C',
    out: [['A', '",', 'C']],
  },

  'papa-Quoted field with 5 quotes in a row and a delimiter in there: too': {
    opt: { header: false, object: false },
    raw: '"1","cnonce="""",nc=""""","2"',
    out: [['1', 'cnonce="",nc=""', '2']],
  },
  'papa-Quoted field with whitespace around quotes': {
    opt: { header: false, object: false },
    raw: 'A, "B" ,C',
    out: [['A', ' "B" ', 'C']],
  },
  'papa-Misplaced quotes in data: not as opening quotes': {
    opt: { header: false, object: false },
    raw: 'A,B "B",C',
    out: [['A', 'B "B"', 'C']],
  },
  'papa-Quoted field has no closing quote': {
    opt: { header: false, object: false },
    raw: 'a,"b,c\nd,e,f',
    err: 'unterminated_string',
  },
  'papa-Quoted field has invalid trailing quote after delimiter with a valid closer':
    {
      opt: { header: false, object: false },
      raw: '"a,"b,c"\nd,e,f',
      err: 'unexpected',
    },
  'papa-Quoted field has invalid trailing quote after delimiter': {
    opt: { header: false, object: false },
    raw: 'a,"b,"c\nd,e,f',
    err: 'unexpected',
  },
  'papa-Quoted field has invalid trailing quote before delimiter': {
    opt: { header: false, object: false },
    raw: 'a,"b"c,d\ne,f,g',
    err: 'unexpected',
  },

  'papa-Quoted field has invalid trailing quote after new line': {
    opt: { header: false, object: false },
    raw: 'a,"b,c\nd"e,f,g',
    err: 'unexpected',
  },

  'papa-Quoted field has valid trailing quote via delimiter': {
    opt: { header: false, object: false },
    raw: 'a,"b",c\nd,e,f',
    notes: 'Trailing quote is valid due to trailing delimiter',
    out: [
      ['a', 'b', 'c'],
      ['d', 'e', 'f'],
    ],
  },
  'papa-Quoted field has valid trailing quote via \\n': {
    opt: { header: false, object: false },
    raw: 'a,b,"c"\nd,e,f',
    notes: 'Trailing quote is valid due to trailing new line delimiter',
    out: [
      ['a', 'b', 'c'],
      ['d', 'e', 'f'],
    ],
  },
  'papa-Quoted field has valid trailing quote via EOF': {
    opt: { header: false, object: false },
    raw: 'a,b,c\nd,e,"f"',
    notes: 'Trailing quote is valid due to EOF',
    out: [
      ['a', 'b', 'c'],
      ['d', 'e', 'f'],
    ],
  },
  'papa-Quoted field contains delimiters and \\n with valid trailing quote': {
    opt: { header: false, object: false },
    raw: 'a,"b,c\nd,e,f"',
    notes: 'Trailing quote is valid due to trailing delimiter',
    out: [['a', 'b,c\nd,e,f']],
  },
  'papa-Line starts with quoted field': {
    opt: { header: false, object: false },
    raw: 'a,b,c\n"d",e,f',
    out: [
      ['a', 'b', 'c'],
      ['d', 'e', 'f'],
    ],
  },
  'papa-Line starts with unquoted empty field': {
    opt: { header: false, object: false },
    raw: ',b,c\n"d",e,f',
    out: [
      ['', 'b', 'c'],
      ['d', 'e', 'f'],
    ],
  },
  'papa-Line ends with quoted field': {
    opt: { header: false, object: false },
    raw: 'a,b,c\nd,e,f\n"g","h","i"\n"j","k","l"',
    out: [
      ['a', 'b', 'c'],
      ['d', 'e', 'f'],
      ['g', 'h', 'i'],
      ['j', 'k', 'l'],
    ],
  },
  'papa-Line ends with quoted field: first field of next line is empty, \\n': {
    opt: { header: false, object: false },
    raw: 'a,b,c\n,e,f\n,"h","i"\n,"k","l"',
    out: [
      ['a', 'b', 'c'],
      ['', 'e', 'f'],
      ['', 'h', 'i'],
      ['', 'k', 'l'],
    ],
  },
  'papa-Quoted field at end of row (but not at EOF) has quotes': {
    opt: { header: false, object: false },
    raw: 'a,b,"c""c"""\nd,e,f',
    out: [
      ['a', 'b', 'c"c"'],
      ['d', 'e', 'f'],
    ],
  },
  'papa-Empty quoted field at EOF is empty': {
    opt: { header: false, object: false },
    raw: 'a,b,""\na,b,""',
    out: [
      ['a', 'b', ''],
      ['a', 'b', ''],
    ],
  },
  'papa-Multiple consecutive empty fields': {
    opt: { header: false, object: false },
    raw: 'a,b,,,c,d\n,,e,,,f',
    out: [
      ['a', 'b', '', '', 'c', 'd'],
      ['', '', 'e', '', '', 'f'],
    ],
  },
  'papa-Empty input string': {
    opt: { header: false, object: false },
    raw: '',
    out: [],
  },
  'papa-Input is just the delimiter (2 empty fields)': {
    opt: { header: false, object: false },
    raw: ',',
    out: [['', '']],
  },
  'papa-Input is just empty fields': {
    opt: { header: false, object: false },
    raw: ',,\n,,,',
    out: [
      ['', '', ''],
      ['', '', '', ''],
    ],
  },
  'papa-Input is just a string (a single field)': {
    opt: { header: false, object: false },
    raw: 'Abc def',
    out: [['Abc def']],
  },
  'papa-Commented line at beginning': {
    opt: { header: false, object: false, comment: true },
    raw: '# Comment!\na,b,c',
    out: [['a', 'b', 'c']],
  },
  'papa-Commented line in middle': {
    opt: { header: false, object: false, comment: true },
    raw: 'a,b,c\n# Comment\nd,e,f',
    out: [
      ['a', 'b', 'c'],
      ['d', 'e', 'f'],
    ],
  },
  'papa-Commented line at end': {
    opt: { header: false, object: false, comment: true },
    raw: 'a,true,false\n# Comment',
    out: [['a', 'true', 'false']],
  },
  'papa-Two comment lines consecutively': {
    opt: { header: false, object: false, comment: true },
    raw: 'a,b,c\n#comment1\n#comment2\nd,e,f',
    out: [
      ['a', 'b', 'c'],
      ['d', 'e', 'f'],
    ],
  },
  'papa-Two comment lines consecutively at end of file': {
    opt: { header: false, object: false, comment: true },
    raw: 'a,b,c\n#comment1\n#comment2',
    out: [['a', 'b', 'c']],
  },
  'papa-Three comment lines consecutively at beginning of file': {
    opt: { header: false, object: false, comment: true },
    raw: '#comment1\n#comment2\n#comment3\na,b,c',
    out: [['a', 'b', 'c']],
  },
  'papa-Entire file is comment lines': {
    opt: { header: false, object: false, comment: true },
    raw: '#comment1\n#comment2\n#comment3',
    out: [],
  },
  'papa-Comment with non-default character': {
    make: (Jsonic) =>
      Jsonic.make({
        comment: {
          marker: [{ start: '!' }],
        },
      }),
    opt: { header: false, object: false, comment: true },
    raw: 'a,b,c\n!Comment goes here\nd,e,f',
    out: [
      ['a', 'b', 'c'],
      ['d', 'e', 'f'],
    ],
  },
  'papa-Bad comments value specified': {
    opt: { header: false, object: false },
    raw: 'a,b,c\n5comment\nd,e,f',
    out: [['a', 'b', 'c'], ['5comment'], ['d', 'e', 'f']],
  },
  'papa-Multi-character comment string': {
    make: (Jsonic) =>
      Jsonic.make({
        comment: {
          marker: [{ start: '=N(' }],
        },
      }),
    opt: { header: false, object: false, comment: true },
    raw: 'a,b,c\n=N(Comment)\nd,e,f',
    out: [
      ['a', 'b', 'c'],
      ['d', 'e', 'f'],
    ],
  },
  'papa-Input with only a commented line': {
    opt: { header: false, object: false, comment: true },
    raw: '#commented line',
    out: [],
  },
  // REVIEW: disagree, output should be []
  // "papa-Input with only a commented line and blank line after": {
  //   opt: { header: false, object: false, comment: true },
  //   raw: '#commented line\n',
  //   out: [['']],
  // },
  'papa-jsonic-Input with only a commented line and blank line after': {
    opt: { header: false, object: false, comment: true },
    raw: '#commented line\n',
    out: [],
  },
  'papa-Input with only a commented line: without comments enabled': {
    opt: { header: false, object: false },
    raw: '#commented line',
    out: [['#commented line']],
  },
  'papa-Input without comments with line starting with whitespace': {
    opt: { header: false, object: false },
    raw: 'a\n b\nc',
    out: [['a'], [' b'], ['c']],
  },
  'papa-Multiple rows: one column (no delimiter found)': {
    opt: { header: false, object: false },
    raw: 'a\nb\nc\nd\ne',
    out: [['a'], ['b'], ['c'], ['d'], ['e']],
  },
  // REVIEW: disagree, empty lines (without header) should be []
  // "papa-One column input with empty fields": {
  //   opt: { header: false, object: false },
  //   raw: 'a\nb\n\n\nc\nd\ne\n',
  //   out: [['a'], ['b'], [''], [''], ['c'], ['d'], ['e'], ['']],
  // },
  'papa-jsonic-One column input with empty fields': {
    opt: { header: false, object: false, record: { empty: true } },
    raw: 'a\nb\n\n\nc\nd\ne\n',
    out: [['a'], ['b'], [], [], ['c'], ['d'], ['e']],
  },
  'papa-Two rows: just \\r': {
    opt: { header: false, object: false },
    raw: 'A,b,c\rd,E,f',
    out: [
      ['A', 'b', 'c'],
      ['d', 'E', 'f'],
    ],
  },

  'papa-Two rows: \\r\\n': {
    opt: { header: false, object: false },
    raw: 'A,b,c\r\nd,E,f',
    out: [
      ['A', 'b', 'c'],
      ['d', 'E', 'f'],
    ],
  },
  'papa-Quoted field with \\r\\n': {
    opt: { header: false, object: false },
    raw: 'A,"B\r\nB",C',
    out: [['A', 'B\r\nB', 'C']],
  },
  'papa-Quoted field with \\r': {
    opt: { header: false, object: false },
    raw: 'A,"B\rB",C',
    out: [['A', 'B\rB', 'C']],
  },
  'papa-Quoted field with \\n': {
    opt: { header: false, object: false },
    raw: 'A,"B\nB",C',
    out: [['A', 'B\nB', 'C']],
  },

  'papa-Quoted fields with spaces between closing quote and next delimiter': {
    opt: { header: false, object: false, trim: true },
    raw: 'A,"B" ,C,D\r\nE,F,"G"  ,H',
    out: [
      ['A', 'B', 'C', 'D'],
      ['E', 'F', 'G', 'H'],
    ],
  },
  'papa-Quoted fields with spaces between closing quote and next new line': {
    opt: { header: false, object: false, trim: true },
    raw: 'A,B,C,"D" \r\nE,F,G,"H"  \r\nQ,W,E,R',
    out: [
      ['A', 'B', 'C', 'D'],
      ['E', 'F', 'G', 'H'],
      ['Q', 'W', 'E', 'R'],
    ],
  },
  'papa-Quoted fields with spaces after closing quote': {
    opt: { header: false, object: false, trim: true },
    raw: 'A,"B" ,C,"D" \r\nE,F,"G"  ,"H"  \r\nQ,W,"E" ,R',
    out: [
      ['A', 'B', 'C', 'D'],
      ['E', 'F', 'G', 'H'],
      ['Q', 'W', 'E', 'R'],
    ],
  },
  'papa-Misplaced quotes in data twice: not as opening quotes': {
    opt: { header: false, object: false },
    raw: 'A,B",C\nD,E",F',
    out: [
      ['A', 'B"', 'C'],
      ['D', 'E"', 'F'],
    ],
  },
  // REVIEW: not supported
  // "papa-Mixed slash n and slash r should choose first as precident": {
  //   opt: { header: false, object: false },
  //   raw: 'a,b,c\nd,e,f\rg,h,i\n',
  //   out: [['a', 'b', 'c'], ['d', 'e', 'f\rg', 'h', 'i'], ['']],
  // },
  'papa-Header row with one row of data': {
    opt: { header: true },
    raw: 'A,B,C\r\na,b,c',
    out: [{ A: 'a', B: 'b', C: 'c' }],
  },
  'papa-Header row only': {
    // opt: { header: false, object: false },
    raw: 'A,B,C',
    out: [],
  },
  'papa-Row with too few fields': {
    opt: { field: { exact: true } },
    raw: 'A,B,C\r\na,b',
    err: 'csv_missing_field',
  },
  'papa-Row with too many fields': {
    opt: { field: { exact: true } },
    raw: 'A,B,C\r\na,b,c,d,e\r\nf,g,h',
    err: 'csv_extra_field',
  },
  'papa-Row with enough fields but blank field in the begining': {
    opt: { header: false, object: false },
    raw: 'A,B,C\r\n,b1,c1\r\na2,b2,c2',
    out: [
      ['A', 'B', 'C'],
      ['', 'b1', 'c1'],
      ['a2', 'b2', 'c2'],
    ],
  },
  'papa-Row with enough fields but blank field in the begining using headers': {
    raw: 'A,B,C\r\n,b1,c1\r\n,b2,c2',
    out: [
      { A: '', B: 'b1', C: 'c1' },
      { A: '', B: 'b2', C: 'c2' },
    ],
  },
  'papa-Row with enough fields but blank field at end': {
    raw: 'A,B,C\r\na,b,',
    out: [{ A: 'a', B: 'b', C: '' }],
  },
  'papa-Tab delimiter': {
    opt: { header: false, object: false, field: { separation: '\t' } },
    raw: 'a\tb\tc\r\nd\te\tf',
    out: [
      ['a', 'b', 'c'],
      ['d', 'e', 'f'],
    ],
  },
  'papa-Pipe delimiter': {
    opt: { header: false, object: false, field: { separation: '|' } },
    raw: 'a|b|c\r\nd|e|f',
    out: [
      ['a', 'b', 'c'],
      ['d', 'e', 'f'],
    ],
  },
  'papa-ASCII 30 delimiter': {
    opt: { header: false, object: false, field: { separation: RECORD_SEP } },
    raw:
      'a' +
      RECORD_SEP +
      'b' +
      RECORD_SEP +
      'c\r\nd' +
      RECORD_SEP +
      'e' +
      RECORD_SEP +
      'f',
    out: [
      ['a', 'b', 'c'],
      ['d', 'e', 'f'],
    ],
  },
  'papa-ASCII 31 delimiter': {
    opt: { header: false, object: false, field: { separation: UNIT_SEP } },
    raw:
      'a' +
      UNIT_SEP +
      'b' +
      UNIT_SEP +
      'c\r\nd' +
      UNIT_SEP +
      'e' +
      UNIT_SEP +
      'f',
    out: [
      ['a', 'b', 'c'],
      ['d', 'e', 'f'],
    ],
  },

  // REVIEW: not supported
  // "papa-Bad delimiter (\\n)": {
  //   opt: { header: false, object: false },
  //   raw: 'a,b,c',
  //   config: { delimiter: "\n" },
  //   notes: "Should silently default to comma",
  //   out: [['a', 'b', 'c']],
  // },

  'papa-Multi-character delimiter': {
    opt: { header: false, object: false, field: { separation: ', ' } },
    raw: 'a, b, c',
    out: [['a', 'b', 'c']],
  },
  'papa-Multi-character delimiter (length 2) with quoted field': {
    opt: { header: false, object: false, field: { separation: ', ' } },
    raw: 'a, b, "c, e", d',
    out: [['a', 'b', 'c, e', 'd']],
  },

  // REVIEW: range limits not supported
  // "papa-Dynamic typing converts numeric literals and maintains precision": {
  //   opt: { header: false, object: false, number: true },
  //   raw: '1,2.2,1e3\r\n-4,-4.5,-4e-5\r\n-,5a,5-2\r\n16142028098527942586,9007199254740991,-9007199254740992',
  //   out: [[1, 2.2, 1000], [-4, -4.5, -0.00004], ["-", "5a", "5-2"], ["16142028098527942586", 9007199254740991, "-9007199254740992"]],
  // },

  'papa-Dynamic typing converts boolean literals': {
    make: (jsonic) =>
      jsonic.make({
        value: {
          map: {
            TRUE: { val: true },
            FALSE: { val: false },
          },
        },
      }),
    opt: { header: false, object: false, value: true },
    raw: 'true,false,T,F,TRUE,FALSE,True,False',
    out: [[true, false, 'T', 'F', true, false, 'True', 'False']],
  },
  "papa-Dynamic typing doesn't convert other types": {
    make: (jsonic) =>
      jsonic.make({
        value: {
          map: {
            null: null,
          },
        },
      }),
    opt: { header: false, object: false, value: true },
    raw: 'A,B,C\r\nundefined,null,[\r\nvar,float,if',
    out: [
      ['A', 'B', 'C'],
      ['undefined', 'null', '['],
      ['var', 'float', 'if'],
    ],
  },

  'papa-jsonic-Blank line at beginning': {
    opt: { header: false, object: false, record: { empty: true } },
    raw: '\r\na,b,c\r\nd,e,f',
    out: [[], ['a', 'b', 'c'], ['d', 'e', 'f']],
  },
  'papa-jsonic-Blank line in middle': {
    opt: { header: false, object: false, record: { empty: true } },
    raw: 'a,b,c\r\n\r\nd,e,f',
    out: [['a', 'b', 'c'], [], ['d', 'e', 'f']],
  },
  // REVIEW: disagree: last newline is not another line
  'papa-jsonic-Blank lines at end': {
    opt: { header: false, object: false, record: { empty: true } },
    raw: 'a,b,c\nd,e,f\n\n',
    // out: [['a', 'b', 'c'], ['d', 'e', 'f'], [], []],
    out: [['a', 'b', 'c'], ['d', 'e', 'f'], []],
  },
  'papa-jsonic-Blank line in middle with whitespace': {
    opt: { header: false, object: false, record: { empty: true } },
    raw: 'a,b,c\r\n \r\nd,e,f',
    out: [['a', 'b', 'c'], [' '], ['d', 'e', 'f']],
  },

  'papa-First field of a line is empty': {
    opt: { header: false, object: false },
    raw: 'a,b,c\r\n,e,f',
    out: [
      ['a', 'b', 'c'],
      ['', 'e', 'f'],
    ],
  },
  'papa-Last field of a line is empty': {
    opt: { header: false, object: false },
    raw: 'a,b,\r\nd,e,f',
    out: [
      ['a', 'b', ''],
      ['d', 'e', 'f'],
    ],
  },
  'papa-Other fields are empty': {
    opt: { header: false, object: false },
    raw: 'a,,c\r\n,,',
    out: [
      ['a', '', 'c'],
      ['', '', ''],
    ],
  },

  'papa-Empty input string 2': {
    opt: { header: false, object: false },
    raw: '',
    out: [],
  },
  'papa-Input is just the delimiter (2 empty fields) 2': {
    opt: { header: false, object: false },
    raw: ',',
    out: [['', '']],
  },
  'papa-Input is just a string (a single field) 2': {
    opt: { header: false, object: false },
    raw: 'Abc def',
    out: [['Abc def']],
  },

  // REVIEW: disagree, last newline is now another record
  'papa-Empty lines': {
    opt: { header: false, object: false, record: { empty: true } },
    raw: '\na,b,c\n\nd,e,f\n\n',
    out: [[], ['a', 'b', 'c'], [], ['d', 'e', 'f'], []],
  },
  'papa-Skip empty lines': {
    opt: { header: false, object: false },
    raw: 'a,b,c\n\nd,e,f',
    out: [
      ['a', 'b', 'c'],
      ['d', 'e', 'f'],
    ],
  },
  'papa-Skip empty lines: with newline at end of input': {
    opt: { header: false, object: false },
    raw: 'a,b,c\r\n\r\nd,e,f\r\n',
    out: [
      ['a', 'b', 'c'],
      ['d', 'e', 'f'],
    ],
  },
  'papa-Skip empty lines: with empty input': {
    opt: { header: false, object: false },
    raw: '',
    out: [],
  },
  'papa-Skip empty lines: with first line only whitespace': {
    opt: { header: false, object: false },
    raw: ' \na,b,c',
    out: [[' '], ['a', 'b', 'c']],
  },
  'papa-Single quote as quote character': {
    opt: { header: false, object: false, string: { quote: "'" } },
    raw: "a,b,'c,d'",
    out: [['a', 'b', 'c,d']],
  },

  'papa-Custom escape character in the middle': {
    opt: { header: false, object: false, string: { csv: false } },
    raw: 'a,b,"c\\"d\\"f"',
    out: [['a', 'b', 'c"d"f']],
  },

  'papa-Custom escape character at the end': {
    opt: { header: false, object: false, string: { csv: false } },
    raw: 'a,b,"c\\"d\\""',
    out: [['a', 'b', 'c"d"']],
  },

  // REVIEW: disagree, non-control escape returns literal char
  // "papa-Custom escape character not used for escaping": {
  //   notes: "Must parse correctly if the backslash sign (\\) is configured as a custom escape character and appears as regular character in the text",
  //   opt: { header: false, object: false },
  //   raw: 'a,b,"c\\d"',
  //       	config: { escapeChar: '\\' },
  //   out: [['a', 'b', 'c\\d']],
  // },

  'papa-Header row with preceding comment': {
    opt: { comment: true },
    raw: '#Comment\na,b\nc,d\n',
    out: [{ a: 'c', b: 'd' }],
  },

  'papa-Carriage return in header inside quotes: with line feed endings': {
    opt: { header: false, object: false },
    raw: '"a\r\na","b"\n"c","d"\n"e","f"\n"g","h"\n"i","j"',
    out: [
      ['a\r\na', 'b'],
      ['c', 'd'],
      ['e', 'f'],
      ['g', 'h'],
      ['i', 'j'],
    ],
  },

  'papa-Using \\r\\n endings uses \\r\\n linebreak': {
    opt: { header: false, object: false },
    raw: 'a,b\r\nc,d\r\ne,f\r\ng,h\r\ni,j',
    config: {},
    out: [
      ['a', 'b'],
      ['c', 'd'],
      ['e', 'f'],
      ['g', 'h'],
      ['i', 'j'],
    ],
  },
  'papa-Using \\n endings uses \\n linebreak': {
    opt: { header: false, object: false },
    raw: 'a,b\nc,d\ne,f\ng,h\ni,j',
    out: [
      ['a', 'b'],
      ['c', 'd'],
      ['e', 'f'],
      ['g', 'h'],
      ['i', 'j'],
    ],
  },
  'papa-Using \\r\\n endings with \\r\\n in header field uses \\r\\n linebreak':
    {
      opt: { header: false, object: false },
      raw: '"a\r\na",b\r\nc,d\r\ne,f\r\ng,h\r\ni,j',
      out: [
        ['a\r\na', 'b'],
        ['c', 'd'],
        ['e', 'f'],
        ['g', 'h'],
        ['i', 'j'],
      ],
    },
  'papa-Using \\r\\n endings with \\n in header field uses \\r\\n linebreak': {
    opt: { header: false, object: false },
    raw: '"a\na",b\r\nc,d\r\ne,f\r\ng,h\r\ni,j',
    out: [
      ['a\na', 'b'],
      ['c', 'd'],
      ['e', 'f'],
      ['g', 'h'],
      ['i', 'j'],
    ],
  },
  'papa-Using \\r\\n endings with \\n in header field with skip empty lines uses \\r\\n linebreak':
    {
      opt: { header: false, object: false },
      raw: '"a\na",b\r\nc,d\r\ne,f\r\ng,h\r\ni,j\r\n',
      out: [
        ['a\na', 'b'],
        ['c', 'd'],
        ['e', 'f'],
        ['g', 'h'],
        ['i', 'j'],
      ],
    },
  'papa-Using \\n endings with \\r\\n in header field uses \\n linebreak': {
    opt: { header: false, object: false },
    raw: '"a\r\na",b\nc,d\ne,f\ng,h\ni,j',
    out: [
      ['a\r\na', 'b'],
      ['c', 'd'],
      ['e', 'f'],
      ['g', 'h'],
      ['i', 'j'],
    ],
  },
  'papa-Using reserved regex character . as quote character': {
    opt: { header: false, object: false, string: { quote: '.' } },
    raw: '.a\na.,b\r\nc,d\r\ne,f\r\ng,h\r\ni,j',
    config: { quoteChar: '.' },
    out: [
      ['a\na', 'b'],
      ['c', 'd'],
      ['e', 'f'],
      ['g', 'h'],
      ['i', 'j'],
    ],
  },
  'papa-Using reserved regex character | as quote character': {
    opt: { header: false, object: false, string: { quote: '|' } },
    raw: '|a\na|,b\r\nc,d\r\ne,f\r\ng,h\r\ni,j',
    out: [
      ['a\na', 'b'],
      ['c', 'd'],
      ['e', 'f'],
      ['g', 'h'],
      ['i', 'j'],
    ],
  },

  // REVIEW: not supported
  // "papa-Parsing with skipEmptyLines set to 'greedy'": {
  //   opt: { header: false, object: false },
  //   raw: 'a,b\n\n,\nc,d\n , \n""," "\n	,	\n,,,,\n',
  //   out: [['a', 'b'], ['c', 'd']],
  // },
  // "papa-Parsing with skipEmptyLines set to 'greedy' with quotes and delimiters as content": {
  //   opt: { header: false, object: false },
  //   raw: 'a,b\n\n,\nc,d\n" , ",","\n""" """,""""""\n\n\n',
  //   out: [['a', 'b'], ['c', 'd'], [' , ', ','], ['" "', '""']],
  // },

  'papa-Quoted fields with spaces between closing quote and next delimiter and contains delimiter':
    {
      opt: { header: false, object: false, trim: true },
      raw: 'A,",B" ,C,D\nE,F,G,H',
      out: [
        ['A', ',B', 'C', 'D'],
        ['E', 'F', 'G', 'H'],
      ],
    },
  'papa-Quoted fields with spaces between closing quote and newline and contains newline':
    {
      opt: { header: false, object: false, trim: true },
      raw: 'a,b,"c\n" \nd,e,f',
      out: [
        ['a', 'b', 'c\n'],
        ['d', 'e', 'f'],
      ],
    },
}
