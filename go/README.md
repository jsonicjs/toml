# toml (Go)

Version: 0.1.0

A Go port of [@jsonic/toml](https://github.com/jsonicjs/toml), a
[Jsonic](https://github.com/jsonicjs/jsonic) syntax plugin that
parses TOML-format files into Go maps.

## Status

This is a skeleton port that currently supports a subset of TOML:

- Basic key-value pairs: `a = 1`, `a = "x"`, `a = true`
- Integers (decimal, hex `0x`, oct `0o`, bin `0b`, underscore separators)
- Floats (including exponent notation)
- Booleans
- Single- and double-quoted strings (no triple-quoted yet)
- Arrays: `[1, 2, 3]`
- Inline tables: `{x = 1, y = 2}`
- Tables: `[section]`, nested via `[a.b.c]`
- Array of tables: `[[products]]`
- Dotted keys: `a.b.c = 1`
- Line comments: `# comment`

Not yet implemented:

- Triple-quoted strings (`"""` / `'''`)
- Datetimes and times
- `nan` / `inf` literals

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
`)
    if err != nil {
        panic(err)
    }
    fmt.Println(result)
}
```

## License

MIT. Copyright (c) Richard Rodger and other contributors.
