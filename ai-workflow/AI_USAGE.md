# AI Usage

AI tools were used during this assessment.

## How AI Was Used

AI was used to help with:

- clarifying the assessment requirements
- planning the architecture
- drafting implementation specs
- exploring Odoo JSON-RPC integration patterns
- reviewing README structure
- identifying potential edge cases

## What Was Decided Manually

The following decisions were reviewed and made manually:

- using a monorepo for reviewer experience
- isolating Odoo calls in a service layer
- storing Odoo references locally
- tracking sync status locally
- using simple UI to avoid over-engineering
- documenting trade-offs clearly

## Validation Approach

AI suggestions are not accepted blindly.

Implementation is validated through:

- local Docker Compose runs
- manual end-to-end testing
- checking records in Odoo
- reviewing logs and sync status
- reading and adjusting generated code
