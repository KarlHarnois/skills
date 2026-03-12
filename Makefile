.PHONY: all install uninstall status reinstall

all: install

REPO_ROOT := $(dir $(abspath $(lastword $(MAKEFILE_LIST))))
SOURCE := $(REPO_ROOT)skills
DESTINATION := $(HOME)/.claude/skills
SKILLS := $(shell find "$(SOURCE)" -mindepth 1 -maxdepth 1 -type d -exec basename {} \;)

install:
	@mkdir -p "$(DESTINATION)"
	@for skill in $(SKILLS); do \
		ln -sfn "$(SOURCE)/$$skill" "$(DESTINATION)/$$skill"; \
	done
	@$(MAKE) --no-print-directory status

uninstall:
	@for skill in $(SKILLS); do \
		if [ -e "$(DESTINATION)/$$skill" ] || [ -L "$(DESTINATION)/$$skill" ]; then \
			rm -f "$(DESTINATION)/$$skill"; \
			echo "removed $$skill"; \
		fi; \
	done
	@for link in "$(DESTINATION)"/*; do \
		if [ -L "$$link" ] && readlink "$$link" | grep -q "^$(SOURCE)/"; then \
			echo "removed stale $$(basename $$link)"; \
			rm -f "$$link"; \
		fi; \
	done

status:
	@for skill in $(SKILLS); do \
		ls -ld "$(DESTINATION)/$$skill" 2>/dev/null || echo "$$skill missing"; \
	done

reinstall: uninstall install
