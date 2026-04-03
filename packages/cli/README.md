# @specferret/cli

Spec drift detection CLI for contract-driven teams.

[![npm version](https://img.shields.io/npm/v/@specferret/cli)](https://www.npmjs.com/package/@specferret/cli)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](../../LICENSE)

`@specferret/cli` catches breaking contract drift before merge by scanning markdown contracts, classifying impact, and enforcing safe resolution paths.

## Install

```bash
bun install -g @specferret/cli
```

## Quickstart

```bash
ferret init
ferret lint
```

If drift is detected:

```bash
ferret review
```

## Core commands

```bash
ferret init
ferret scan
ferret lint
ferret extract
ferret review
```

## CI usage

```bash
ferret lint --ci
```

Supports CI baseline modes:

- `--ci-baseline committed` (default)
- `--ci-baseline rebuild`

## Validation status

Sprint 5 branch-matrix validation (spec-kit + BMAD) is green with explicit S40/S41/S42 assertions:

- spec-kit: https://github.com/BenGardiner123/spec-ferret-validation-spec-kit/actions/runs/23962649755
- BMAD: https://github.com/BenGardiner123/specferret-validation-bmad/actions/runs/23962652352

## Runtime requirements

- Bun 1.0+

The CLI is Bun-first and designed for low-latency local and CI runs.

## Links

- Source: https://github.com/BenGardiner123/spec-ferret
- Docs: https://specferret.dev
- Core package: https://www.npmjs.com/package/@specferret/core
