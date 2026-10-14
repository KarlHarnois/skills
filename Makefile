.PHONY: all install uninstall status reinstall test vale

all: install

REPO_ROOT := $(dir $(abspath $(lastword $(MAKEFILE_LIST))))
CLAUDE_HOME := $(HOME)/.claude

SKILLS_SOURCE := $(REPO_ROOT)skills
SKILLS_DESTINATION := $(CLAUDE_HOME)/skills
SKILLS := $(shell find "$(SKILLS_SOURCE)" -mindepth 1 -maxdepth 1 -type d -exec basename {} \;)

AGENTS_SOURCE := $(REPO_ROOT)agents
AGENTS_DESTINATION := $(CLAUDE_HOME)/agents
AGENTS := $(shell find "$(AGENTS_SOURCE)" -mindepth 1 -maxdepth 1 -name '*.md' -exec basename {} \;)

NIX := nix --extra-experimental-features 'nix-command flakes' --option warn-dirty false
CLEAN_PROSE_LINT := $(SKILLS_SOURCE)/clean-prose/scripts/lint.sh
CLEAN_PROSE_FIXTURES := tests/clean-prose

define link_all
@mkdir -p "$(2)"
@for name in $(3); do \
	ln -sfn "$(1)/$$name" "$(2)/$$name"; \
done
endef

define unlink_all
@for name in $(3); do \
	if [ -e "$(2)/$$name" ] || [ -L "$(2)/$$name" ]; then \
		rm -f "$(2)/$$name"; \
		echo "removed $(4) $$name"; \
	fi; \
done
@for link in "$(2)"/*; do \
	if [ -L "$$link" ] && readlink "$$link" | grep -q "^$(1)/"; then \
		echo "removed stale $(4) $$(basename $$link)"; \
		rm -f "$$link"; \
	fi; \
done
endef

define expect_lint_exit
@$(2) >/dev/null 2>&1; status=$$?; \
[ $$status -eq $(1) ] || { echo "lint.sh exited $$status, expected $(1): $(3)"; exit 1; }
endef

define status_all
@for name in $(2); do \
	ls -ld "$(1)/$$name" 2>/dev/null || echo "$(3) $$name missing"; \
done
endef

install: vale
	$(call link_all,$(SKILLS_SOURCE),$(SKILLS_DESTINATION),$(SKILLS))
	$(call link_all,$(AGENTS_SOURCE),$(AGENTS_DESTINATION),$(AGENTS))
	@$(MAKE) --no-print-directory status

uninstall:
	$(call unlink_all,$(SKILLS_SOURCE),$(SKILLS_DESTINATION),$(SKILLS),skill)
	$(call unlink_all,$(AGENTS_SOURCE),$(AGENTS_DESTINATION),$(AGENTS),agent)

status:
	$(call status_all,$(SKILLS_DESTINATION),$(SKILLS),skill)
	$(call status_all,$(AGENTS_DESTINATION),$(AGENTS),agent)

reinstall: uninstall install

vale:
	@command -v nix >/dev/null || { echo "nix not found, see README"; exit 1; }
	@$(NIX) build --no-link --quiet "$(abspath $(REPO_ROOT))#vale"

test: vale
	@cd "$(REPO_ROOT)" && failed=0; \
	for fixture in $(CLEAN_PROSE_FIXTURES)/*.md $(CLEAN_PROSE_FIXTURES)/*.markdown; do \
		$(CLEAN_PROSE_LINT) "$$fixture" | diff -u "$${fixture%.*}.expected" - || failed=1; \
	done; \
	exit $$failed
	$(call expect_lint_exit,4,$(CLEAN_PROSE_LINT) $(REPO_ROOT)$(CLEAN_PROSE_FIXTURES)/Missing.md,missing file)
	$(call expect_lint_exit,3,env PATH=/nonexistent /bin/sh $(CLEAN_PROSE_LINT) $(REPO_ROOT)$(CLEAN_PROSE_FIXTURES)/Narrative.md,nix not on PATH)
	@echo "clean-prose lint fixtures pass"
