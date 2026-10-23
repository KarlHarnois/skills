# A

1. Define the trait in a new file under `ports/`, named after the role.
   - If any of its methods can fail, define an error type beside the trait.

# B

7. If the merge fails, undo it with `git merge --abort`. A merge that gets killed before Git has recorded it fails this way too.
   - If the merge commit had already landed, keep the commit and report it as landed. A slow `post-merge` hook that gets killed leaves such a commit.

# C

1. Write the error type in a new file under `ports/`, named after the trait it serves, and export it from there.
   - Name the error type after the trait.

# D

- Define the trait under `ports/`, with one method per action, one error type, one fake, and one test.
  - Name the fake after the trait.

# E

- Run `make` before each commit.
  - This keeps the build green.
