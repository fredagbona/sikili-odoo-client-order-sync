# Architecture Overview

This project uses a monorepo architecture with separated frontend and backend applications.

## System Flow

```text
User
  ↓
Next.js Web App
  ↓ HTTP
Express API
  ↓
Local PostgreSQL Database
  ↓
Odoo Service Layer
  ↓ JSON-RPC
Odoo 18

Design Principles
Keep Odoo API calls isolated in a dedicated service layer.
Keep route handlers thin.
Store local sync status to avoid silent failures.
Prefer clarity over over-engineering.
Make the project easy to run for reviewers.
