.PHONY: install uninstall status reinstall

REPO_ROOT := $(dir $(abspath $(lastword $(MAKEFILE_LIST))))
SRC := $(REPO_ROOT)skills
DST := $(HOME)/.claude/skills
SKILLS := $(shell find "$(SRC)" -mindepth 1 -maxdepth 1 -type d -exec basename {} \;)

install:
	@mkdir -p "$(DST)"
	@for s in $(SKILLS); do \
		ln -sfn "$(SRC)/$$s" "$(DST)/$$s"; \
	done

uninstall:
	@for s in $(SKILLS); do \
		rm -f "$(DST)/$$s"; \
	done

status:
	@for s in $(SKILLS); do \
		ls -ld "$(DST)/$$s" 2>/dev/null || echo "$$s missing"; \
	done

reinstall: uninstall install
