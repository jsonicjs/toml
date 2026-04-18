# toml (Go) - Reference

A Go port of [@jsonic/toml](https://github.com/jsonicjs/toml), a
[Jsonic](https://github.com/jsonicjs/jsonic) syntax plugin that
parses TOML-format files into Go maps.

## Status

Skeleton port. The folder layout and grammar-embedding pipeline match
the TypeScript version, and a working subset of TOML parses correctly.
Porting of the remaining pieces is tracked in `go/toml_tsv_test.go` via
the `tsvUnsupported` slice.

### Supported

- Key-value pairs with `=`
- Integers (decimal, `0x`, `0o`, `0b`, `_` separators)
- Floats (including exponent notation)
- Booleans
- Single- and double-quoted strings (no triple-quoted)
- Arrays: `[1, 2, 3]`
- Inline tables: `{x = 1, y = 2}`
- Dotted keys: `a.b.c = 1`
- Quoted keys
- Line comments with `#`
- A single `[section]` table

### TODO

- Multi-section sequencing (`[a]` followed by `[b]`)
- Array-of-tables (`[[x]]`)
- Triple-quoted strings (`"""…"""`, `'''…'''`)
- Datetimes and times
- `nan` / `inf` literals
- Full TOML error-code surface

## API

```go
func Parse(src string, opts ...TomlOptions) (any, error)
func MakeJsonic(opts ...TomlOptions) *jsonic.Jsonic
```

`Parse` returns `map[string]any` for TOML input. `MakeJsonic` gives a
`*jsonic.Jsonic` instance with the TOML grammar applied, for when you
want to reuse a configured parser.

## Grammar source

`go/toml.go` embeds `toml-grammar.jsonic` verbatim between
`// --- BEGIN EMBEDDED toml-grammar.jsonic ---` and
`// --- END EMBEDDED toml-grammar.jsonic ---` markers. The root
`embed-grammar.js` script writes the same grammar into both
`src/toml.ts` and `go/toml.go`, so the two ports share one source of
truth. Grammar-feature refs that aren't yet implemented on the Go side
(the custom string matcher, the date/time value regexes, the
NaN/Infinity keyword defs) are pruned from the loaded grammar map
before it's handed to `jsonic.Grammar()`.
