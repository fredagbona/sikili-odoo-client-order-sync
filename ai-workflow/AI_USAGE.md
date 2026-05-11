# AI Usage Documentation

This file documents how AI tools were used during the assessment.

The objective was not to blindly generate code, but to accelerate implementation while keeping architecture, technical decisions, and engineering ownership fully manual.

---

# Engineering Ownership

The following parts were designed and decided manually before implementation:

* global architecture choices
* monorepo structure
* backend/frontend separation
* Odoo integration strategy
* Docker and local environment setup
* project organization
* coding conventions
* error handling philosophy
* sync strategy
* feature decomposition
* specifications and definition of done
* commit strategy
* AI workflow rules
* reviewer experience considerations

The project structure, workflow, and implementation constraints were intentionally defined upfront before asking AI to generate code.

---

# How AI Was Used

AI tools were used as implementation assistants to:

* accelerate repetitive setup work
* generate first-pass implementations
* help structure boilerplate
* review architecture decisions
* explore Odoo JSON-RPC payloads
* improve documentation clarity
* identify edge cases
* review implementation trade-offs
* validate consistency with specifications

AI was always guided using explicit project rules, specifications, and implementation constraints.

---

# AI Constraints and Rules

Before implementation, project-specific rules and specifications were written manually to guide AI generation.

The AI was instructed to:

* avoid over-engineering
* keep architecture simple and reviewable
* isolate Odoo logic in a dedicated service layer
* keep route handlers thin
* preserve sync status visibility
* avoid hidden failures
* avoid hardcoded credentials
* prefer explicit naming
* produce small incremental changes
* follow the written specifications strictly

The AI was intentionally not asked to generate the entire project at once.

---

# Validation Process

All generated code was manually:

* reviewed
* validated
* adjusted when necessary
* tested locally
* compared against specifications

No code was accepted without understanding the implementation and validating that it matched the project requirements.

---

# Development Philosophy

The objective of using AI in this assessment was not to replace engineering thinking.

The objective was to:

* accelerate execution
* improve iteration speed
* reduce repetitive work
* focus more time on architecture and correctness
* preserve implementation quality and maintainability

AI was treated as a collaborative engineering assistant, not as an autonomous code generator.

---

# Ongoing Updates

This file may be updated during development to document:

* important AI-assisted implementation decisions
* architectural adjustments
* manual fixes applied after generation
* validation notes
* trade-offs identified during implementation
