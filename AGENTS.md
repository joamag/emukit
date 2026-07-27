# AGENTS.md file

## Formatting

Always format the code before commiting using, making sure that the TypeScript code is properly formatted using:

```bash
yarn install
yarn run pretty
```

Then verify that the linting rules are respected using:

```bash
yarn run lint
```

## Testing

To run the custom suite of unit test for EmuKit use the following sequence of commands that will install dependencies
and run the appropriate test suite (last command).

Try to run the unit tests whenever making changes to the codebase, before commiting new code.

```bash
yarn install
yarn test
```

## Style Guide

- Always update `CHANGELOG.md` according to semantic versioning, mentioning your changes in the unreleased section.
- Write commit messages using [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).
- Never bump the internal package version in `package.json`. This is handled automatically by the release process.
- TypeScript and Javascript files use CRLF as the line ending.
- The style should respect the "pretty" formatting (4 spaces of indentation, double quotes and no trailing commas).
- Imports must always be explicit, including the file extension (eg: `./structs.ts`, `./button/button.tsx`).
- Framework agnostic code goes into `ts/`, React specific code goes into `react/`, the `logic.ts` entry point must remain free of any React dependency.
- New React components live in their own `react/components/<name>/` folder (`.tsx` plus optional `.css`) and must be exported from `react/components/index.ts`.
- The implementation should be done in a way that is compatible with the existing codebase.
- The commenting style of the project is unique, try to keep commenting style consistent.

## Commit Messages

This project follows [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) with the following structure:

```text
<type>: <description>

<body>
```

### Commit Types

| Type       | Description                                             |
| ---------- | ------------------------------------------------------- |
| `feat`     | A new feature or functionality                          |
| `fix`      | A bug fix                                               |
| `docs`     | Documentation only changes                              |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `chore`    | Maintenance tasks, dependency updates, build changes    |
| `test`     | Adding or updating tests                                |
| `version`  | Version bump commits (reserved for releases)            |

### Guidelines

- Use lowercase for the type prefix.
- Use imperative mood in the description (e.g., "Add feature" not "Added feature").
- Keep the first line under 50 characters.
- Reference issue/PR numbers when applicable using `(#123)` at the end.
- For version releases, use the format `version: X.Y.Z`.
- Add an extra newline between subject and body.
- Make the body a series of bullet points about the commit.
- Be descriptive always making use of the body of the message.

### Examples

```text
feat: Add headless logic entry point and stoppable main loop (#13)
fix: Resolve stack overflow in keyboard display toggling
docs: Add integration documentation for the Emulator interface
refactor: Extract save state handling into reusable base class
chore: Update dependencies to latest stable versions
test: Add unit tests for the animation frame loop mode
version: 0.10.23
```

## Pre-Commit Checklist

Before committing, ensure that the following operations items check:

- [ ] Code is formatted with `yarn run pretty`
- [ ] Linting passes: `yarn run lint`
- [ ] Tests pass: `yarn test`
- [ ] CHANGELOG.md is updated in [Unreleased] section
- [ ] No debugging print statements or commented-out code
- [ ] CRLF line endings are preserved

## New Release

To create a new release follow the following steps:

- Make sure that both the tests pass and the code formatting are valid.
- Increment (look at `CHANGELOG.md` for semver changes) the `version` field in `package.json`.
- Move all the `CHANGELOG.md` Unreleased items that have at least one non empty item the into a new section with the new version number and date, and then create new empty sub-sections (Added, Changed and Fixed) for the Unreleased section with a single empty item.
- Create a commit with the following message `version: $VERSION_NUMBER`.
- Push the commit.
- Create a new tag with the value fo the new version number `$VERSION_NUMBER`.
- Create a new release on the GitHub repo using the Markdown from the corresponding version entry in `CHANGELOG.md` as the description of the release and the version number as the title. Do not include the title of the release (version and date) in the description.

## License

EmuKit is licensed under the [Apache License, Version 2.0](http://www.apache.org/licenses/).
