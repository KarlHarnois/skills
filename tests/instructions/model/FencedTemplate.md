# Dispatch

Fill this template, and send it as the worker's prompt:

```markdown
# Summary: <customer>

You read the dispute queue and never change it.
```

1. Fill the review template:

   ```md
   Review each decision. You must quote the policy line.
   ```

2. Send the filled template.

````markdown
# Build: <title>

Run this command:

```sh
bin/build  # never skip the gate
```

The build should pass.
````

```sh
# never run this twice
bin/dispatch --worker summary
```

```text
The worker never decides.
```

```
The worker must report.
```
