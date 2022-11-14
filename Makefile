help:
	@echo "Commands:"
	@echo "  kit/build"
	@echo "  sample/dev"

BUNDLE_SOURCES=$(shell find kit/src/client -name "*.ts*")
MODULE_SOURCES=$(shell find kit/src/server kit/src/lib -name "*.ts*")

kit/build:
	rm -rf kit/dist
	esbuild $(MODULE_SOURCES) --format=esm --outdir=kit/dist
	esbuild $(BUNDLE_SOURCES) --bundle --format=esm --outdir=kit/dist/client
	tsc -p kit --declaration --emitDeclarationOnly --outDir kit/dist
	cargo build

sample/dev:
	cargo watch \
		-w "src" -w "kit/src" -w "Makefile" \
		-s "make kit/build && cd sample && ../target/debug/rangerine impl"
