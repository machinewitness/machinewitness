# Security

## We hold no user data to breach

There is no server, no account, no database, no log, and no telemetry. Everything these skills do happens on your machine. There is no store of anyone's material for an attacker to reach, and that is an architectural decision rather than a promise about our operational practices.

## Report a security defect

Open a GitHub issue. If disclosure itself would put someone at risk, say so in a minimal issue and ask for a private channel before giving details.

Maintainers are pseudonymous, so there is no PGP key tied to a legal identity. Do not send anything that identifies a real person or a real matter. **A report should describe the defect, never the case you found it in.**

## Report a privacy defect, the same weight

A privacy defect is a security defect here. Report it the same way:

- Anything that transmits, uploads, or phones home
- Anything writing outside the working directory unexpectedly
- Anything leaking a path, username, hostname, or identifier into output, logs, or an error message
- Anything that could expose a licensed text, a private file, or a real identifier

## Threat model

**In scope:** a leak of the user's own material out of the tooling · a write that damages a record the user is preserving · a dependency or code path that transmits anything · a silent failure that produces a confident wrong result, especially a wrong page cite, a wrong page number, or a false empty read as a negative finding.

**Out of scope:** attacks needing physical access to an unlocked machine · a compromised operating system · anything requiring the user to run code we did not ship.

## What "verify" means here

Scripts are standard-library-only, single-file, and readable end to end in a few minutes. That is deliberate. **Under pseudonymous maintainership, auditability is the only credibility available**. No reputation to lean on, so read the code. Every script ships a `--selftest` that runs offline with no data.
