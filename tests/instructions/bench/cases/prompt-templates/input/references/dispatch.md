# Dispatch

**Each worker receives one filled template as its whole prompt.** Replace every `{placeholder}` before you send it.

## Summary template

```markdown
# Summary: {customer}

Summarize the open invoice disputes for {customer}. You read the dispute queue and never change it.

- For each dispute, you must cite the invoice number and the disputed amount.
- Group the disputes by reason, and put the largest amount first.
- If the queue holds no dispute for {customer}, say so and stop.

End with one line per dispute that proposes a refund decision: refund, partial refund, or reject.
```

## Review template

```markdown
# Review: {customer}

Review the refund decisions below against the refund policy in `docs/refunds.md`. You always quote the policy line that backs each verdict.

{decisions}

For each decision, answer agree or disagree, and give the reason in one sentence. Never approve a refund yourself.
```

## Sending

Send each filled template with this command:

```sh
bin/dispatch --worker {worker} --prompt-file {path}
```

If the command fails, rerun it once. If it fails again, stop and tell the user.
