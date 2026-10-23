---
name: exporting-invoices
description: Export a closed month of invoices from the billing database to the accounting archive. Use this skill when the user asks to export, close, or archive a month of invoices.
---

# Exporting invoices

**Run the export once per month, after the billing team closes the month.** The export reads the `invoices` table and writes one CSV per currency to the archive bucket.

## Rules

- You never push to the archive branch by hand. The export job pushes it.
- Always run the dry run before an export, and read its summary.
- Never edit the ledger by hand.
- The export must finish before you tag the release.

## Facts about the data

- The vendor API always returns amounts in cents. Divide by 100 before you compare totals.
- Invoices never carry more than one currency.
- A refund in the feed must have been approved upstream, so you do not approve it again.

## Steps

1. Run `bin/export --dry-run --month {month}`.
2. Compare the dry run totals with the billing dashboard.
3. If the totals differ, stop and tell the user the two totals.
4. Run `bin/export --month {month}`.
5. Tag the release as `invoices-{month}`.
