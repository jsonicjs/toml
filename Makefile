.PHONY: all build build-ts test test-ts clean clean-ts reset

all: build test

build: build-ts

build-ts:
	npm run build

test: test-ts

test-ts:
	npm test

clean: clean-ts

clean-ts:
	rm -rf dist dist-test

reset:
	npm run reset
