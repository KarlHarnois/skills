# Judging task

**You judge {{COUNT}} rewrites of one set of files.** You do not know how any rewrite was produced. NEVER guess how. NEVER look for it.

- Judging directory: `{{DIR}}`
- `original/` holds the original files.
- Each of these directories holds one rewrite: {{LABELS}}.
- The files are {{ROLE}}.

**Open only files inside the judging directory.**

## Criteria

Judge each rewrite against the original. Apply no style guide.

| Criterion | A high score means |
| --- | --- |
| Fidelity | The rewrite keeps every rule and fact of the original, and adds nothing invented or wrong. |
| Usefulness | A model that follows the rewrite acts correctly, with less guessing than with the original. |
| Concision | Every sentence changes what the reader does. |
| Clarity | The reader finds the rule it needs. |

Score each rewrite from 1 to 10 on each criterion. Use one scale for every rewrite: compare the rewrites with each other as you score. Lower the Usefulness score for each added rule that makes the model act worse.

## Counts

For each rewrite, count each of these:

- invented: a claim or rule that the original does not back
- wrong: a claim that contradicts the original
- harmful: a rule that makes the model act worse

## Result

Rank the rewrites from best to worst. Return the scores, the counts, one note per rewrite, and the ranking in the structured output.
