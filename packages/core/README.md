# @specferret/core

Core engine for SpecFerret contract extraction, validation, graph reconciliation, and drift analysis.

[![npm version](https://img.shields.io/npm/v/@specferret/core)](https://www.npmjs.com/package/@specferret/core)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](../../LICENSE)

## What this package is for

`@specferret/core` is the runtime library behind the CLI. Use it when you want to embed SpecFerret behavior in scripts, custom tooling, or internal workflows.

It includes:

- Store implementations (`sqlite`, `postgres`)
- Frontmatter extraction and schema validation
- Reconciler logic for direct/transitive impact
- Context graph generation utilities

## Install

```bash
npm i @specferret/core
```

## Runtime requirements

- Bun 1.0+

SpecFerret core is Bun-first and uses Bun-compatible runtime behavior.

## Typical consumers

- Internal platform tooling that needs drift checks in-process
- CI wrappers that need machine-readable drift metadata
- Custom developer workflows on top of SpecFerret reconciliation data

## Looking for the CLI?

Install `@specferret/cli` if you want the end-user command interface:

```bash
bun install -g @specferret/cli
```

## Links

- Source: https://github.com/BenGardiner123/spec-ferret
- Docs: https://specferret.dev
- CLI package: https://www.npmjs.com/package/@specferret/cli
