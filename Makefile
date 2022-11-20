default:
	@echo Commands:
	@echo
	@echo "  sql/start"
	@echo "  sql/connect"

sql/start:
	surreal start --user root --pass root file://db,

sql/connect:
	surreal sql --conn http://localhost:8000 --user root --pass root --ns test --db test --pretty
