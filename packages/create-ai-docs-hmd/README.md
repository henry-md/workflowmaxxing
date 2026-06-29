# create-ai-docs-hmd

Scaffolds AI agent documentation entry points for Codex, Claude, and Cursor.

## Use

```sh
npm init ai-docs-hmd@latest
```

## Test locally

Create the files in a visible `test-output` folder with the default command behavior:

```sh
npm --prefix packages/create-ai-docs-hmd test
```

Rerun against the existing `test-output` folder with managed-block merge behavior:

```sh
npm --prefix packages/create-ai-docs-hmd run test:merge
```

Rerun against the existing `test-output` folder with overwrite behavior:

```sh
npm --prefix packages/create-ai-docs-hmd run test:force
```

Package checks:

```sh
npm --prefix packages/create-ai-docs-hmd run check
npm --prefix packages/create-ai-docs-hmd run pack:dry-run
```

## Publish

First publish:

```sh
cd packages/create-ai-docs-hmd
npm publish --access public
```

Update npm package:

```sh
cd packages/create-ai-docs-hmd
npm version patch --no-git-tag-version
npm publish --access public
```
