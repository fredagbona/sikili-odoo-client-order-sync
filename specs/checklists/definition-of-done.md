# Definition of Done

Before submitting:

## Functionality

- [ ] Client can be created in the web app.
- [ ] Client appears locally.
- [ ] Client appears in Odoo as `res.partner`.
- [ ] Sale order can be created for a client.
- [ ] Sale order appears locally.
- [ ] Sale order appears in Odoo as `sale.order`.
- [ ] Sale order is linked to the correct partner.

## Architecture

- [ ] Odoo API calls are isolated in a service layer.
- [ ] Route handlers are thin.
- [ ] Local DB stores Odoo IDs.
- [ ] Sync status is persisted.
- [ ] Errors are not silently ignored.

## Setup

- [ ] `.env.example` exists.
- [ ] Docker Compose starts the project.
- [ ] Odoo addons folder is mounted at `/mnt/extra-addons` (e.g. `./addons:/mnt/extra-addons` in Compose).
- [ ] README explains local setup.

## Documentation

- [ ] README explains Odoo objects used.
- [ ] README explains assumptions.
- [ ] README explains what would be improved with more time.
- [ ] AI usage is documented.

## Final Review

- [ ] Run `docker compose down -v`.
- [ ] Run `docker compose up --build`.
- [ ] Test the full flow from scratch.
