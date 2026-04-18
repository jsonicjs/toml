# @jsonic/toml (TypeScript)

This plugin allows the [Jsonic](https://jsonic.senecajs.org) JSON parser to
support [TOML](https://toml.io) syntax.

## Install

```sh
npm install @jsonic/toml jsonic
```

## Usage

```js
const { Jsonic } = require('jsonic')
const { Toml } = require('@jsonic/toml')

const toml = Jsonic.make().use(Toml, {})

const result = toml(`
title = "TOML Example"

[owner]
name = "Tom Preston-Werner"
`)
```

## Development

- `npm run build` – compile `src/` and `test/`.
- `npm test` – run the node test runner against compiled tests.
- `npm run install-toml-test` – clone the BurntSushi `toml-test` suite into `test/toml-test`.
- `npm run reset` – clean, install, fetch the test suite, build, and test.
