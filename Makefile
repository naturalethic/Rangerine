help:
	@echo "Commands:"
	@echo "  kit/build"
	@echo "  sample/dev"

LIB_SOURCES=$(shell find kit/lib -name '*.ts')
BUNDLE_SOURCES=$(shell find kit/src/bundle -name "*.ts*")
SPLIT_SOURCES=$(shell find kit/src/split -name "*.ts*")
NODE_SOURCES=$(shell find kit/src/node -name "*.ts*")

kit/build:
	rm -rf kit/dist
	esbuild $(LIB_SOURCES) --format=esm --outdir=kit/dist/lib
	esbuild $(BUNDLE_SOURCES) --bundle --format=esm --outdir=kit/dist/bundle
	esbuild $(NODE_SOURCES) --bundle --platform=node --outdir=kit/dist/node --external:esbuild
	esbuild $(SPLIT_SOURCES) --outdir=kit/dist/split
	tsc -p kit --declaration --emitDeclarationOnly --outDir kit/dist
	cargo build

sample/dev:
	cargo watch \
		-w "src" -w "kit/src" \
		-s "make kit/build && cd sample && ../target/debug/rangerine impl"
