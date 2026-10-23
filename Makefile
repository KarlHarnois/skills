.PHONY: all install uninstall status reinstall test test-node test-writing-instructions validate vale

all: install

REPO_ROOT := $(dir $(abspath $(lastword $(MAKEFILE_LIST))))
CLAUDE_HOME := $(HOME)/.claude
CLAUDE := CLAUDE_CONFIG_DIR="$(CLAUDE_HOME)" claude

MARKETPLACE := karl-skills
PLUGINS_SOURCE := $(REPO_ROOT)plugins
PLUGINS := $(shell find "$(PLUGINS_SOURCE)" -mindepth 1 -maxdepth 1 -type d -exec basename {} \;)

TESTS := $(shell find "$(PLUGINS_SOURCE)" -name '*.test.mjs')

NIX := nix --extra-experimental-features 'nix-command flakes' --option warn-dirty false
WRITING_INSTRUCTIONS_PLUGIN := $(PLUGINS_SOURCE)/writing-instructions
VALE_GC_ROOT := $(WRITING_INSTRUCTIONS_PLUGIN)/.vale-gcroot
WRITING_INSTRUCTIONS_LINT := $(WRITING_INSTRUCTIONS_PLUGIN)/skills/writing-instructions/scripts/lint.sh
WRITING_INSTRUCTIONS_FIXTURES := tests/writing-instructions

define expect_lint_exit
@$(2) >/dev/null 2>&1; status=$$?; \
[ $$status -eq $(1) ] || { echo "lint.sh exited $$status, expected $(1): $(3)"; exit 1; }
endef

install: vale
	@$(CLAUDE) plugin marketplace add "$(REPO_ROOT)"
	@for plugin in $(PLUGINS); do \
		$(CLAUDE) plugin install "$$plugin@$(MARKETPLACE)" || exit 1; \
	done

uninstall:
	@$(CLAUDE) plugin marketplace remove $(MARKETPLACE)
	@rm -f "$(VALE_GC_ROOT)"

status:
	@$(CLAUDE) plugin list

reinstall: uninstall install

validate:
	claude plugin validate --strict "$(REPO_ROOT)"
	@for plugin in $(PLUGINS); do \
		claude plugin validate --strict "$(PLUGINS_SOURCE)/$$plugin" || exit 1; \
	done

vale:
	@command -v nix >/dev/null || { echo "nix not found, see README"; exit 1; }
	@$(NIX) build --quiet --out-link "$(VALE_GC_ROOT)" "$(WRITING_INSTRUCTIONS_PLUGIN)#vale"

test: test-node test-writing-instructions

test-node:
	node --test $(TESTS)

test-writing-instructions: vale
	@cd "$(REPO_ROOT)" && failed=0; \
	for fixture in $(WRITING_INSTRUCTIONS_FIXTURES)/*.md $(WRITING_INSTRUCTIONS_FIXTURES)/*.markdown; do \
		$(WRITING_INSTRUCTIONS_LINT) "$$fixture" | diff -u "$${fixture%.*}.expected" - || failed=1; \
	done; \
	exit $$failed
	$(call expect_lint_exit,2,$(WRITING_INSTRUCTIONS_LINT) $(REPO_ROOT)$(WRITING_INSTRUCTIONS_FIXTURES)/invalid/FrontMatter.md,invalid front matter)
	$(call expect_lint_exit,4,$(WRITING_INSTRUCTIONS_LINT) $(REPO_ROOT)$(WRITING_INSTRUCTIONS_FIXTURES)/Missing.md,missing file)
	$(call expect_lint_exit,3,env PATH=/nonexistent /bin/sh $(WRITING_INSTRUCTIONS_LINT) $(REPO_ROOT)$(WRITING_INSTRUCTIONS_FIXTURES)/Narrative.md,nix not on PATH)
	$(call expect_lint_exit,5,env PATH="$(REPO_ROOT)$(WRITING_INSTRUCTIONS_FIXTURES)/bin:$$PATH" $(WRITING_INSTRUCTIONS_LINT) $(REPO_ROOT)$(WRITING_INSTRUCTIONS_FIXTURES)/Narrative.md,nix build fails)
	@echo "writing-instructions lint fixtures pass"
