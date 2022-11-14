help:
	@echo "Commands:"
	@echo "  kit/build"
	@echo "  cms/dev"

BUNDLE_SOURCES=$(shell find kit/src/client -name "*.ts*")
MODULE_SOURCES=$(shell find kit/src/server kit/src/lib -name "*.ts*")

kit/build:
	rm -rf kit/dist
	esbuild $(MODULE_SOURCES) --format=esm --outdir=kit/dist
	esbuild $(BUNDLE_SOURCES) --bundle --format=esm --outdir=kit/dist/client
	tsc -p kit --declaration --emitDeclarationOnly --outDir kit/dist
	cargo build

cms/dev:
	cargo watch \
		-w "src" -w "kit/src" -w "Makefile" \
		-s "make kit/build && cd cms && ../target/debug/rangerine impl"
