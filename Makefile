.PHONY: all install uninstall status reinstall test test-node test-instructions validate vale bench

all: install

REPO_ROOT := $(dir $(abspath $(lastword $(MAKEFILE_LIST))))
CLAUDE_HOME := $(HOME)/.claude
CLAUDE := CLAUDE_CONFIG_DIR="$(CLAUDE_HOME)" claude

MARKETPLACE := karl-skills
PLUGINS_SOURCE := $(REPO_ROOT)plugins
PLUGINS := $(shell find "$(PLUGINS_SOURCE)" -mindepth 1 -maxdepth 1 -type d -exec basename {} \;)

TESTS := $(shell find "$(PLUGINS_SOURCE)" "$(REPO_ROOT)tests" -name '*.test.mjs')

NIX := nix --extra-experimental-features 'nix-command flakes' --option warn-dirty false
INSTRUCTIONS_PLUGIN := $(PLUGINS_SOURCE)/instructions
VALE_GC_ROOT := $(INSTRUCTIONS_PLUGIN)/.vale-gcroot
INSTRUCTIONS_LINT := $(INSTRUCTIONS_PLUGIN)/shared/lint.sh
INSTRUCTIONS_SKILL_LINT = $(INSTRUCTIONS_PLUGIN)/skills/writing-$(1)-instructions/scripts/lint.sh
MODEL_INSTRUCTIONS_LINT := $(call INSTRUCTIONS_SKILL_LINT,model)
INSTRUCTION_KINDS := model human
INSTRUCTIONS_FIXTURES := tests/instructions
MODEL_FIXTURES := $(INSTRUCTIONS_FIXTURES)/model

BENCH_BASE ?= master
BENCH_HEAD ?= HEAD
BENCH_RUNS ?= 3

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

bench: vale
	node "$(REPO_ROOT)tests/instructions/bench/bench.mjs" --base "$(BENCH_BASE)" --head "$(BENCH_HEAD)" --runs "$(BENCH_RUNS)"

vale:
	@command -v nix >/dev/null || { echo "nix not found, see README"; exit 1; }
	@$(NIX) build --quiet --out-link "$(VALE_GC_ROOT)" "$(INSTRUCTIONS_PLUGIN)#vale"

test: test-node test-instructions

test-node:
	node --test $(TESTS)

test-instructions: vale
	@cd "$(REPO_ROOT)" && failed=0; \
	for kind in $(INSTRUCTION_KINDS); do \
		for fixture in $(INSTRUCTIONS_FIXTURES)/$$kind/*.md $(INSTRUCTIONS_FIXTURES)/$$kind/*.markdown; do \
			[ -e "$$fixture" ] || continue; \
			$(call INSTRUCTIONS_SKILL_LINT,$$kind) "$$fixture" | diff -u "$${fixture%.*}.expected" - || failed=1; \
		done; \
	done; \
	exit $$failed
	$(call expect_lint_exit,2,$(MODEL_INSTRUCTIONS_LINT) $(REPO_ROOT)$(MODEL_FIXTURES)/invalid/FrontMatter.md,invalid front matter)
	$(call expect_lint_exit,4,$(MODEL_INSTRUCTIONS_LINT) $(REPO_ROOT)$(MODEL_FIXTURES)/Missing.md,missing file)
	$(call expect_lint_exit,4,$(INSTRUCTIONS_LINT) unknown $(REPO_ROOT)$(MODEL_FIXTURES)/Narrative.md,unknown kind)
	$(call expect_lint_exit,3,env PATH=/nonexistent /bin/sh $(MODEL_INSTRUCTIONS_LINT) $(REPO_ROOT)$(MODEL_FIXTURES)/Narrative.md,nix not on PATH)
	$(call expect_lint_exit,5,env PATH="$(REPO_ROOT)$(MODEL_FIXTURES)/bin:$$PATH" $(MODEL_INSTRUCTIONS_LINT) $(REPO_ROOT)$(MODEL_FIXTURES)/Narrative.md,nix build fails)
	@echo "instructions lint fixtures pass"
