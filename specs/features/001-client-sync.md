# Feature 001 — Client Sync with Odoo

## Goal

Allow a user to create a client in the web app and automatically create a matching `res.partner` record in Odoo.

## User Flow

1. User opens the client creation form.
2. User enters name, phone number, and email.
3. Backend creates the client locally.
4. Backend calls Odoo JSON-RPC to create a `res.partner`.
5. Backend stores the returned Odoo partner ID.
6. Client appears in the local client list.
7. Client is visible in Odoo Contacts.

## Data

Required fields:

- name
- phone
- email

Local fields:

- id
- name
- phone
- email
- odoo_partner_id
- sync_status
- sync_error
- created_at
- updated_at

## Definition of Done

- Client can be created from the web app.
- Client is stored locally.
- `res.partner` is created in Odoo.
- Odoo partner ID is stored locally.
- Sync errors are logged and surfaced.
- Odoo logic is isolated in the Odoo service layer.
