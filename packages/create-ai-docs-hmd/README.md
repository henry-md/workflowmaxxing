# create-ai-docs-hmd

Scaffolds AI agent documentation entry points for Codex, Claude, and Cursor.

## Use once uploaded to npm

```sh
npm init ai-docs-hmd@latest
npm init ai-docs-hmd@latest -- --merge
npm init ai-docs-hmd@latest -- --force
```

## Test locally

```sh
npm --prefix packages/create-ai-docs-hmd test
npm --prefix packages/create-ai-docs-hmd test -- --merge
npm --prefix packages/create-ai-docs-hmd test -- --force
```

1. default script will give an error if any file we work with exists, and isn't empty
2. merge will replace only <!-- Generated --> blocks, keeping content as-is
3. force will override existing content in files w/o <!-- Generated --> blocks

Tests show up in test-output folder.

## Publish

Update npm package:

```sh
gh auth login
npm login

cd packages/create-ai-docs-hmd
npm version patch --no-git-tag-version
npm publish --access public
```
