# karvstokk-indexer

> **PRE-RELEASE.** This repository currently contains its licence, its
> guardrails and a statement of intent. There is no indexer in it yet, and
> [`docs/validity-rules.md`](docs/validity-rules.md) is not yet authoritative.
> There is nothing here to build against.

The open-source indexer for [Karvstokk](https://github.com/Ancient-Consulting/karvstokk),
and the published rules by which it derives state from EAS attestations on Base.

## Why this repository exists

Karvstokk derives state — which Profile bindings are valid, which signatures
count, how far an envelope has got — from attestations on a public chain. A
third party has to be able to recompute that state rather than take our word for
it, so the code that does the deriving is open, MIT-licensed, and self-hostable:
clone it, point it at Base, and check that what you get matches what we publish.

It is a **separate** repository from the Karvstokk application on purpose. The
gate service holds secrets — capability tokens, paymaster credentials — and the
trust boundary between "recomputable by anyone" and "you are trusting our
service" should be a thing you can see rather than a promise. Private endpoints
cannot leak in here, because they live somewhere else entirely.

That boundary is also why this repository is honest about the one thing it
*cannot* compute: whether a cryptographically valid signature was admitted
through a paid slot. See Rule 4 in the validity rules.

## Contents

| | |
|---|---|
| [`docs/validity-rules.md`](docs/validity-rules.md) | the derivation rules in English — the prose companion to the handlers |
| [`LICENSE`](LICENSE) | MIT |

The Ponder handlers, the canonical EAS constants, the offline UID re-derivation
tool and the golden fixtures land here as the milestones that produce them are
built.

## Precedence

Once the handlers exist, **the code is canonical** and the prose is a reading
aid: where they disagree, the code wins and the document is the thing to fix.
This is stated up front because prose specifications drift behind their
implementations, and a reader deserves to know which artifact is the real one.

## Guardrails

Public git history is not retractable — a key leaked in commit 3 stays reachable
after the fix — so gitleaks has been in CI since the first commit, scanning the
whole history rather than the diff.

## Licence

MIT. See [`LICENSE`](LICENSE).

The permissiveness is the point: there is nothing to protect in a set of
derivation rules whose value depends on other people re-running and
reimplementing them.
