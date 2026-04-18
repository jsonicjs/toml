# toml (Go)

Version: 0.1.0

A Go port of [@jsonic/toml](https://github.com/jsonicjs/toml), a
[Jsonic](https://github.com/jsonicjs/jsonic) syntax plugin that
parses TOML format into Go maps.

## Features

- Key-value pairs: `a = 1`, `a = "x"`, `a = true`
- Integers (decimal, `0x`, `0o`, `0b`, `_` separators)
- Floats, including exponent notation and `nan` / `inf` (`+/-` prefixes supported)
- Booleans
- Basic and literal strings, including triple-quoted multi-line forms and standard escape sequences (`\n`, `\t`, `\u00E9`, `\U0001F600`, `\xHH`, line-ending backslash)
- Arrays: `[1, 2, 3]`, trailing commas, nested arrays
- Inline tables: `{x = 1, y = 2}`
- Tables and nested tables: `[section]`, `[a.b.c]`
- Array of tables: `[[products]]`
- Dotted keys: `a.b.c = 1`
- Quoted keys
- Line comments with `#`
- Datetimes and times returned as `*TomlTime` values (kind tag + original source)

## Install

```bash
go get github.com/jsonicjs/toml/go@latest
```

## Quick Example

```go
package main

import (
    "fmt"
    toml "github.com/jsonicjs/toml/go"
)

func main() {
    result, err := toml.Parse(`
title = "TOML Example"

[owner]
name = "Tom"
dob  = 1979-05-27T07:32:00Z

[[products]]
name = "Hammer"

[[products]]
name = "Nail"
`)
    if err != nil {
        panic(err)
    }
    fmt.Println(result)
}
```

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
truth.

## License

MIT. Copyright (c) Richard Rodger and other contributors.
