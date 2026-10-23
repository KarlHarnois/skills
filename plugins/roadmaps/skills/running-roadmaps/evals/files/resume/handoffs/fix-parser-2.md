# Fix list 1 for pull request 12: Trim spaces around parsed values

**The manager session `manager` reviewed pull request 12.** The departure that keeps `parse` pure is accepted. Every rule of your build task still binds you.

## Defects

1. `parser.py`: `parse` strips spaces but keeps tabs, because it calls `value.strip(" ")` and the goal names all whitespace.

## Steps

1. In `parser.py`, replace `value.strip(" ")` with `value.strip()`.
2. Run `sh check.sh`. It MUST pass.
3. Amend the commit `Trim spaces around parsed values`.
4. Run `git push --force-with-lease`.
5. Send the report, per the Done section of your build task.
