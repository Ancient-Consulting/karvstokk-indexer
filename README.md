# karvstokk-indexer

> **PRE-RELEASE.** There is no indexer in this repository yet, and
> [`docs/validity-rules.md`](docs/validity-rules.md) is not yet authoritative —
> do not build against the rules.
>
> **One exception, and it is not pre-release:**
> [`src/schemas.ts`](src/schemas.ts) is canonical *now*. Those four schema
> strings and their UIDs are registered on Base Sepolia and are what the
> application repo mirrors under a CI drift check. They are safe to depend on.

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
| [`src/schemas.ts`](src/schemas.ts) | **canonical** EAS constants — the four schema strings, their UIDs, the OP-stack predeploys, the ABI fragments |
| [`src/verify-uids.ts`](src/verify-uids.ts) | re-derives all four UIDs offline, with no network access |
| [`docs/validity-rules.md`](docs/validity-rules.md) | the derivation rules in English — the prose companion to the handlers |
| [`LICENSE`](LICENSE) | MIT |

The Ponder handlers and the golden fixtures land here as the milestones that
produce them are built.

## Check the UIDs yourself

An EAS schema UID is `keccak256(abi.encodePacked(schema, resolver, revocable))`
— no nonce, no registrant, no chain id. So the UIDs in `src/schemas.ts` are a
pure function of the strings printed next to them, and you can confirm that
without a chain, without an RPC endpoint, and without trusting us:

```sh
pnpm install
pnpm verify
```

That runs straight off the TypeScript source via Node's type stripping. There is
no build step to trust either.

What a pass proves is exactly one thing: the recorded UIDs match the recorded
schema strings, on any chain. What is actually registered on Base is a separate
question, and this tool deliberately does not touch the network to answer it —
look each UID up on [easscan](https://base-sepolia.easscan.org) instead.

## Why the constants are canonical here

The schema strings decide the UIDs, and the UIDs are what every proof bundle and
every future mainnet registration is pinned to. A constant that everything
depends on should be readable by the people who have to check it, not held in a
repository they cannot see — which is why these four strings live in the public
repo and the private application repo carries the copy.

That copy is a **mirror**, kept honest mechanically rather than by discipline.
Everything between the `karvstokk:constants` markers in `src/schemas.ts` is
duplicated byte for byte on the application side, whose build fetches this file
from `main` every time and fails if the two differ. It fetches `main` rather
than a pinned tag deliberately: pinning would defer drift detection to whenever
someone next bumped the pin, and since a UID is the hash of its schema string —
so these values cannot change without becoming different schemas — a difference
means something is genuinely wrong and worth hearing about the same day.

## Precedence

Once the handlers exist, **the code is canonical** and the prose is a reading
aid: where they disagree, the code wins and the document is the thing to fix.
This is stated up front because prose specifications drift behind their
implementations, and a reader deserves to know which artifact is the real one.

## Guardrails

Public git history is not retractable — a key leaked in commit 3 stays reachable
after the fix — so gitleaks has been in CI since the first commit, scanning the
whole history rather than the diff.

CI also runs `pnpm verify` on every push and pull request, so the UID claim
above is not merely checkable but continuously checked.

## Licence

MIT. See [`LICENSE`](LICENSE).

The permissiveness is the point: there is nothing to protect in a set of
derivation rules whose value depends on other people re-running and
reimplementing them.
