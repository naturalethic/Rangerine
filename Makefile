help:
	@echo "Commands:"
	@echo "  sample/dev"

sample/dev:
	cargo watch \
		-w "src" -w "web/src" \
		-s "make sample/dev/build && cd sample && ../target/debug/rangerine impl"

BUNDLE_SOURCES=$(shell find web/src/bundle -name "*.ts*")
SPLIT_SOURCES=$(shell find web/src/split -name "*.ts*")
NODE_SOURCES=$(shell find web/src/node -name "*.ts*")

sample/dev/build:
	rm -rf web/dist
	esbuild --bundle $(BUNDLE_SOURCES) --format=esm --outdir=web/dist/bundle
	esbuild --bundle $(NODE_SOURCES) --platform=node --outdir=web/dist/node
	esbuild $(SPLIT_SOURCES) --outdir=web/dist/split
	cargo build
