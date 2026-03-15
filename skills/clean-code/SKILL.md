---
name: clean-code
description: Enforces Robert Martin's Clean Code principles on all code produced during a conversation. Use this skill whenever your response will include code in any programming language. This covers writing new code, modifying existing code, fixing bugs, adding features, refactoring, prototyping, and any other task where code appears in the output. If code is being produced, this skill applies. Even for small changes like adding a method or fixing a one-liner, consult this skill to ensure the surrounding code context follows clean code principles.
---

# Clean Code

This skill shapes how you write code. Every piece of code you produce should follow these principles. They are not suggestions. They are the standard.

The goal: code that reads like well-written prose. A reader should be able to understand what the code does, why it exists, and how it fits into the larger system without needing comments, documentation, or the original author's explanation.

## Names

Names are the most important tool for communicating intent. A good name eliminates the need for a comment.

**Reveal intent.** A name should tell you why something exists, what it does, and how it is used. If a name requires a comment to explain it, the name is wrong.

```python
# Bad
d = 5  # elapsed time in days

# Good
elapsed_time_in_days = 5
```

**Avoid disinformation.** Do not use names that hint at a meaning different from the actual one. Do not use `account_list` if the variable is not actually a `List`. Do not use names that vary in small ways (`XYZControllerForHandlingOfStrings` vs `XYZControllerForStorageOfStrings`).

**Make meaningful distinctions.** Never use number series naming (`a1`, `a2`, `a3`). Never use noise words (`ProductInfo` vs `ProductData`, `theMessage` vs `message`). If names must be different, they should mean different things.

**Use pronounceable names.** If you cannot pronounce it, you cannot discuss it without sounding like a fool. No `genymdhms` when you mean `generation_timestamp`.

**Use searchable names.** Single-letter names and numeric constants are hard to find in a body of text. The length of a name should correspond to the size of its scope. A single-letter variable is acceptable only as a local variable in a very short method.

**No magic numbers or strings.** Replace literal values with named constants when the meaning cannot be derived from the value itself. `SECONDS_PER_DAY = 86400` over a bare `86400`. Exception: universally obvious values like `0`, `1`, `""`, `true`.

**No encodings.** No Hungarian notation. No member prefixes (`m_`) or interface prefixes (`IShapeFactory`). Exception: follow established language conventions (e.g., `_private` in Python, `I` prefixes in C#/.NET). Modern tools make other encodings unnecessary.

**Class names are nouns.** `Customer`, `WikiPage`, `Account`, `AddressParser`. Never a verb. Avoid vague names like `Manager`, `Processor`, `Data`, `Info`.

**Action methods are verbs.** `save`, `delete_page`, `post_payment`. Getters, setters, and predicates follow the target language's naming conventions (e.g., `get_name`/`is_active` in Java, `name`/`active?` in Ruby).

**One word per concept.** Pick one word for one abstract concept and stick with it. Do not use `fetch`, `retrieve`, and `get` in the same codebase for the same kind of operation. Do not use `controller`, `manager`, and `driver` interchangeably.

**Use domain names.** Use solution domain names (computer science terms like `visitor`, `queue`, `factory`) when there is no natural problem domain name. Use problem domain names when the code relates to the business domain. The reader will know what to ask about.

## Comments

The proper use of comments is to compensate for our failure to express ourselves in code. Comments are always a failure. When you feel the urge to write a comment, think about whether there is a way to express yourself in code instead.

**Comments do not make up for bad code.** Rather than writing a comment to explain messy code, clean the code. A well-chosen name, a small function with a clear purpose, these do the work that comments try and fail to do.

**Explain yourself in code.** Instead of:

```python
# Check if the employee is eligible for full benefits
if (employee.flags & HOURLY_FLAG) and (employee.age > 65):
```

Write:

```python
if employee.is_eligible_for_full_benefits():
```

**Docstrings are comments.** The same rules apply. Do not add module, class, or function docstrings that restate what the name already communicates. Override conventions that demand a docstring on every module, class, or function. A function named `calculate_monthly_revenue` does not need a docstring saying "Calculate the monthly revenue."

**Acceptable comments (the short list):**

- **Legal comments.** Copyright and license headers required by corporate standards.
- **Explanation of intent.** When the code implements a non-obvious decision, a brief comment explaining *why* (not *what*) can be valuable. Example: a comparison function that puts a specific type first for a business reason.
- **Clarification of obscure arguments.** When working with a standard library or third-party API whose arguments are not self-explanatory and cannot be wrapped.
- **Warning of consequences.** `// This test takes 30 minutes to run` or `// Not thread-safe, must hold lock`.
- **TODO comments.** Acceptable only when they reference a specific ticket or issue. Never open-ended.

**Unacceptable comments (everything else):**

- Redundant comments that restate the code (`// sets the name` above `set_name()`).
- Mandated Javadoc/docstring on every function. A function named `calculate_monthly_revenue` does not need a docstring saying "Calculates the monthly revenue."
- Journal comments tracking changes over time. That is what version control is for.
- Noise comments that add nothing (`// default constructor`, `// the day of the month`).
- Position markers and banners (`// ---- Actions ----`). If you need section markers, the file is too large. Split it.
- Closing brace comments (`} // end while`). If your function is so long you need these, the function is too long.
- Commented-out code. Delete it. Version control remembers.
- Attribution comments (`// Added by Karl`). That is what `git blame` is for.

When in doubt, delete the comment and see if the code speaks for itself. It usually does.

## Functions

Functions are the first line of organization in any program.

**Small.** Functions should be small. Strict rule: aim for 4-6 lines. A function over 20 lines is doing too much. The blocks within `if`, `else`, and `while` statements should be one line long, probably a function call. This keeps the enclosing function small and adds documentary value because the called function has a descriptive name.

**Do one thing.** A function should do one thing, do it well, and do it only. If a function does steps that are one level of abstraction below the stated name, it is doing one thing. If you can extract another function from it with a name that is not merely a restatement of its implementation, it is doing more than one thing.

**One level of abstraction per function.** Statements within a function should all be at the same level of abstraction. Do not mix high-level concepts (`get_html()`) with low-level details (`append("\n")`) in the same function.

**Reading order (the newspaper metaphor).** Code should read top-down like a newspaper article. Every function should be followed by those at the next level of abstraction, so the program reads as a set of "To" paragraphs. Callers come before callees.

**Function arguments.** The ideal number of arguments is zero. One is good. Two is acceptable. Three should be avoided. More than three requires very special justification. Arguments are hard to understand and harder to test. Flag arguments (boolean parameters) are ugly, they proclaim the function does more than one thing. Split into two functions instead.

**No side effects.** A function that claims to do one thing but also changes something else is lying. A `check_password` function that initializes a session has a side effect. Side effects create temporal couplings and order dependencies.

**Use explanatory variables.** Introduce named locals to break complex expressions into labeled steps. A reader should not have to mentally evaluate a multi-part expression to understand what it computes.

**Encapsulate boundary conditions.** Boundary logic is error-prone. Compute boundary values once in a named variable (`nextIndex = index + 1`) rather than scattering the arithmetic.

**Command-query separation.** A function should either do something (change state) or answer something (return information), not both. `set_attribute` returning `true`/`false` for success is confusing. Separate the command from the query.

**Use the language's error mechanism consistently.** Exceptions (Python, Java), `Result` types (Rust), or multiple returns (Go): pick the idiomatic mechanism and use it consistently. Do not fall back to status codes or sentinel values that callers can silently ignore. Extract error-handling blocks into their own functions. Error handling is one thing.

**DRY.** Duplication is the root of all evil in software. If you see the same structure repeated, extract it. Every piece of knowledge should have a single, unambiguous representation.

## Formatting

Code formatting is about communication, and communication is the professional developer's first order of business.

**Vertical size.** Files should typically be 200 lines, with an upper limit around 500. Smaller files are easier to understand.

**Vertical openness.** Each group of lines represents a thought. Separate thoughts with blank lines. Package declarations, imports, and each function should be separated by blank lines.

**Vertical density.** Lines of code that are tightly related should appear vertically close to each other.

**Vertical distance.** Concepts that are closely related should be kept vertically close to each other. Variables should be declared as close to their usage as possible. Instance variables should be declared at the top of the class. Dependent functions should be vertically close, with the caller above the callee.

**Horizontal size.** Lines should not require horizontal scrolling. Aim to stay within 120 characters.

## Conditionals

**Encapsulate conditionals.** `if shouldDelete(timer)` over `if timer.hasExpired && !timer.isRecurrent`. Extract complex boolean expressions into well-named functions or variables.

**Prefer positive conditionals.** `if isValid` over `if !isInvalid`. Positive conditions are easier to read. When both branches exist, put the positive case first.

**Replace type-checking conditionals with polymorphism.** If a conditional (switch/case, if/else chain) selects behavior based on type or category, replace it with polymorphism, pattern matching, or dispatch tables. One such conditional in a factory is fine; the same conditional scattered across the codebase is not.

## Objects, Data Structures, and Classes

**Data/object anti-symmetry.** Objects hide data behind abstractions and expose functions that operate on that data. Data structures expose data and have no meaningful functions. These are opposites. Procedural code (using data structures) makes it easy to add new functions. OO code makes it easy to add new classes. Choose based on what is more likely to change.

**Law of Demeter.** A method should only call methods on: its own object, objects passed as parameters, objects it creates, and its direct component objects. No chaining through strangers: `context.get_options().get_scratch_dir().get_absolute_path()` is a violation. If you find yourself reaching through a chain of objects, something is wrong with the design.

**Tell, don't ask.** Instead of asking an object for data and then acting on it, tell the object what to do. Move behavior to the object that has the data.

**Prefer value objects to primitives.** When a primitive carries domain meaning (file paths, email addresses, monetary amounts), wrap it in a dedicated type. This centralizes validation, prevents mixing unrelated values of the same primitive type, and makes function signatures self-documenting.

**Classes should be small.** Measure by responsibilities, not lines of code. A class should have one responsibility, one reason to change (Single Responsibility Principle). If you cannot describe a class in about 25 words without using "and", "or", "if", or "but", it has too many responsibilities.

**Cohesion.** Classes should have a small number of instance variables. Each method should manipulate one or more of those variables. A class where each variable is used by each method is maximally cohesive. When cohesion is low, split the class.

**Organize for change.** Classes should be open for extension but closed for modification. Isolate from change by depending on abstractions, not concretions. Use interfaces and abstract classes to make your system flexible.

## Error Handling

**Separate the happy path from error handling.** Do not interleave success logic and failure logic. In exception-based languages (Python, Ruby, Java), use try-catch/rescue blocks and extract bodies into their own functions. In Rust, use the `?` operator and `Result` chains. Whatever the mechanism, a reader should be able to follow the happy path without stepping over error-handling code.

**Make errors impossible to ignore.** Exceptions and Rust's `Result` force the caller to acknowledge the error. The anti-pattern is a return code or status flag the caller can silently discard.

**Fail fast.** Detect and signal errors as early as possible. Validate inputs at the boundary, assert preconditions at the top of functions. The closer the error is raised to its cause, the easier it is to diagnose.

**Never use exceptions for control flow.** Exceptions signal exceptional, unexpected failures. Using them for normal branching (e.g., catching an exception to check if a key exists) is slower, harder to follow, and obscures real errors.

**Provide context with errors.** Include the operation that failed and the type of failure. A caller should be able to determine the source and location of an error from the message alone.

**Wrap third-party error types.** Define errors by the caller's needs, not the library's taxonomy. This decouples your domain from external APIs and gives you a single place to change if the dependency changes.

**Make absence explicit.** Do not use null or nil as a signal that a value is missing. Use the language's type system: `Optional` in Java, `Option` in Rust, `None` with type hints in Python, empty collections instead of null. If the type signature does not communicate that absence is possible, callers will forget to check.

## System Organization

**Depend toward stability.** High-level policy should not depend on low-level details. Both should depend on abstractions. A business rule module should never import a database driver or HTTP framework directly.

**No dependency cycles.** If module A depends on B and B depends on A, extract the shared concept into a third module or merge them. The dependency graph between modules should always be a directed acyclic graph.

**Make temporal coupling explicit.** If operations must happen in a specific order, enforce it through the API: have each step return the input for the next, or use a builder/pipeline pattern. A caller should not need to read the implementation to discover the required sequence.

**Group by change.** Classes that change for the same reason belong in the same module. Prefer organizing by feature or domain concept over organizing by technical layer (all controllers together, all models together).

**Separate construction from use.** Building and wiring objects is a distinct concern from using them. Push object creation to the boundaries of the system. Business logic receives its dependencies, it does not create them.

## Tests

**Clean tests follow these rules:**
- **Fast.** Tests should run quickly.
- **Independent.** Tests should not depend on each other.
- **Repeatable.** Tests should work in any environment.
- **Self-validating.** Tests should have a boolean output: pass or fail.

**One concept per test.** Each test function should test a single concept. Do not write long test functions that test one thing after another.

**Test readability matters.** Tests should be as clean as production code. They are documentation. Build domain-specific testing utilities and helper functions that make tests read as clearly as the production code.

**Test the public interface.** Tests should exercise the public API, not internal implementation details. This makes refactoring possible without breaking tests.

## Emergent Design

Kent Beck's four rules of simple design, in priority order:

1. **Runs all the tests.** A system that cannot be verified should never be deployed.
2. **Contains no duplication.** Duplication is the primary enemy of a well-designed system.
3. **Expresses the intent of the programmer.** Choose good names, keep functions and classes small, use standard nomenclature and design patterns.
4. **Minimizes the number of classes and methods.** Keep the overall system small while following the above rules. This is the lowest priority, meaning do not create extra abstractions just for the sake of it.
