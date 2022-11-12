help:
	@echo "Commands:"
	@echo "  sample/dev"

sample/dev:
	cargo watch \
		-w "src" -w "web" \
		-s "cargo build && cd sample && ../target/debug/rangerine impl"
