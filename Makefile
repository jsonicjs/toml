.PHONY: all build build-ts build-go test test-ts test-go clean clean-ts clean-go reset

all: build test

build: build-ts build-go

build-ts:
	npm run build

build-go:
	cd go && go build ./...

test: test-ts test-go

test-ts:
	npm test

test-go:
	cd go && go test ./...

clean: clean-ts clean-go

clean-ts:
	rm -rf dist dist-test

clean-go:
	cd go && go clean -cache

reset:
	npm run reset
