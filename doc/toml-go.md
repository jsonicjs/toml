# toml (Go) - Reference

A Go port of [@jsonic/toml](https://github.com/jsonicjs/toml), a
[Jsonic](https://github.com/jsonicjs/jsonic) syntax plugin that
parses TOML format into Go maps.

## Features

- Key-value pairs
- Integers (decimal, `0x`, `0o`, `0b`, `_` separators)
- Floats, including exponent notation and `nan` / `inf` (`+/-` prefixes)
- Booleans and `null`
- Basic and literal strings, including triple-quoted multi-line forms
- Arrays, inline tables, tables, nested tables, array-of-tables
- Dotted keys and quoted keys
- Line comments with `#`
- Datetimes and times, returned as `*TomlTime` values carrying the
  original source string and a kind tag (`offset-date-time`,
  `local-date-time`, `local-date`, `local-time`)

## API

```go
func Parse(src string, opts ...TomlOptions) (any, error)
func MakeJsonic(opts ...TomlOptions) *jsonic.Jsonic
```

`Parse` returns the parsed value (a `map[string]any` for TOML input).
`MakeJsonic` returns a configured `*jsonic.Jsonic` that can be reused
across calls.

## Grammar source

`go/toml.go` embeds `toml-grammar.jsonic` verbatim between
`// --- BEGIN EMBEDDED toml-grammar.jsonic ---` and
`// --- END EMBEDDED toml-grammar.jsonic ---` markers. The root
`embed-grammar.js` script writes the same grammar into both
`src/toml.ts` and `go/toml.go`, so the two ports share one source of
truth.

At load time the Go port:

- parses the embedded grammar text,
- installs it via `jsonic.Grammar()` with a matching ref map,
- registers a custom string matcher that handles TOML's basic, literal,
  and triple-quoted multi-line string forms,
- adds `true` / `false` / `null` / `nan` / `inf` value defs (including
  `+/-` prefixes), which `SetOptions(Value.Def)` otherwise replaces
  wholesale,
- registers value matchers for ISO dates and local times, which return
  `*TomlTime`.

It also patches two Go-jsonic quirks that don't exist on the TS side:
`options.fixed.token` entries are applied explicitly (Go's
`MapToOptions` doesn't), the default `#` line comment is re-added
(`comment.def` with null-only entries would otherwise wipe the
defaults), and never-matching dummy alts with `#ID` at slot 0 are
injected into `table:close` and `pair:close` so the lexer's
`matchMatch` considers `#ID` an expected token at slot 1 as well.
