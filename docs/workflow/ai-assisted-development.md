# AI-Assisted Development Workflow

---

This project uses AI as a development assistant, not as an unchecked code generator.

The goal is to accelerate reasoning, exploration, documentation, and implementation while keeping engineering decisions explicit and manually validated.

---

# How AI Is Used

AI may be used for:

* clarifying requirements
* drafting implementation specs
* reviewing architecture
* exploring Odoo JSON-RPC payloads
* generating first-pass code
* improving documentation
* identifying edge cases
* brainstorming trade-offs
* reviewing developer experience and project structure

---

# How AI Output Is Reviewed

Every AI-generated suggestion must be reviewed manually.

Before accepting AI output, validate the following:

* does it match the assessment requirements?
* does it preserve separation of concerns?
* does it avoid hardcoded credentials?
* does it handle errors clearly?
* can I explain every line?
* does it keep the solution simple and reviewable?
* does it introduce unnecessary abstractions?
* does it improve maintainability?

AI-generated code should never be accepted blindly.

The final responsibility for architecture, implementation quality, and correctness remains manual.

---

# Documentation Requirement

Important AI-assisted decisions should be documented in:

```text
ai-workflow/AI_USAGE.md
```

This documentation should include:

* what AI was used for
* what suggestions were accepted
* what was modified manually
* architectural decisions taken manually
* how generated output was validated
* edge cases reviewed during implementation

---

# Prompting Style

Prefer prompts that ask AI to:

* review architecture
* identify risks
* generate implementation steps
* propose trade-offs
* explain decisions
* review separation of concerns
* generate small focused changes
* improve documentation clarity

---

# Prompts to Avoid

Avoid prompts that ask AI to:

* generate the entire project at once
* hide complexity
* skip explanations
* over-engineer abstractions
* bypass validation or testing
* generate code without architectural reasoning

---

# Engineering Philosophy

AI is treated as a collaborative engineering assistant.

The objective is not to maximize generated code volume.

The objective is to:

* ship reliable software
* keep architecture understandable
* improve implementation speed responsibly
* maintain clarity and reproducibility
* preserve engineering ownership over decisions
