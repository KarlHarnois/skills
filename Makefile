.PHONY: all install uninstall status reinstall

all: install

REPO_ROOT := $(dir $(abspath $(lastword $(MAKEFILE_LIST))))
SRC := $(REPO_ROOT)skills
DST := $(HOME)/.claude/skills
SKILLS := $(shell find "$(SRC)" -mindepth 1 -maxdepth 1 -type d -exec basename {} \;)

install:
	@mkdir -p "$(DST)"
	@for s in $(SKILLS); do \
		ln -sfn "$(SRC)/$$s" "$(DST)/$$s"; \
	done
	@$(MAKE) --no-print-directory status

uninstall:
	@for s in $(SKILLS); do \
		if [ -e "$(DST)/$$s" ] || [ -L "$(DST)/$$s" ]; then \
			rm -f "$(DST)/$$s"; \
			echo "removed $$s"; \
		fi; \
	done
	@for link in "$(DST)"/*; do \
		if [ -L "$$link" ] && readlink "$$link" | grep -q "^$(SRC)/"; then \
			echo "removed stale $$(basename $$link)"; \
			rm -f "$$link"; \
		fi; \
	done

status:
	@for s in $(SKILLS); do \
		ls -ld "$(DST)/$$s" 2>/dev/null || echo "$$s missing"; \
	done

reinstall: uninstall install
