DONE

| Severity | File and line | Defect | Evidence | Fix |
| --- | --- | --- | --- | --- |
| Blocking | parser.py:2 | `parse` strips spaces but keeps tabs around a value. | `value.strip(" ")` | Call `value.strip()`. |
