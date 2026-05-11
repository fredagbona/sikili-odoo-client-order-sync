# ADR 001 — Monorepo Architecture

## Decision

Use a monorepo containing:

- Next.js frontend
- Express API
- shared database package
- shared types package
- Docker Compose setup
- documentation and specs

## Why

The assessment requires a project that can be reviewed and executed locally.

A monorepo makes this easier because:

- all source code is in one place
- Docker Compose can orchestrate the whole stack
- setup is easier for the reviewer
- shared types and schemas can be centralized
- documentation and AI workflow are versioned with the code

## Trade-off

In production, the frontend and backend could be deployed separately.

For this assessment, reproducibility is more important than deployment separation.
