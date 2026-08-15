# Karvstokk validity rules

> ## PRE-RELEASE — rules not yet authoritative
>
> These rules are **not yet implemented and not yet stable**. They describe the
> intended behaviour of an indexer whose handlers do not exist in this
> repository at the time of writing, so there is nothing here to verify against
> and nothing here to build against. They may change without notice, without a
> migration note, and without a version bump.
>
> They become authoritative at **M3**, when the Profile-replay handlers land and
> this header is removed. Until that happens, treat this document as a statement
> of intent by its authors, not as a specification anyone is entitled to rely on.

## What this document is

Karvstokk derives state — which Profile bindings are valid, which signatures
count, how far an envelope has got — from EAS attestations on Base. The point of
this repository is that a third party can recompute that state instead of taking
our word for it.

This document is the prose companion to the code that does the deriving. It
states, in English, *what* the rules claim, so that a human auditor can read the
claims before reading the TypeScript that implements them.

**It is a reading aid, not the specification.** The commented handler code in
this repository is canonical. If prose and code disagree, **the code wins and
this document is the thing that is wrong** — file an issue and it gets fixed
here.

That precedence is deliberate. Prose specs drift behind their implementations,
and pretending otherwise is how a reader ends up trusting a document that stopped
being true two releases ago. A later version of Karvstokk may promote these
rules to a normative, language-agnostic specification with generated conformance
vectors, at which point the precedence flips. That is not this version.

## The through-line: judge as-of, never revisit

One principle produces the rules below, and it is worth reading first because
the rest is consequence:

> **Every judgment is made as-of the judged attestation's own native `time`, is
> immutable thereafter, and nothing cascades or acts retroactively.**

Authority is monotonic. To decide whether an attestation is valid, look only at
what was already true at that attestation's own timestamp — never at what
happened afterwards. A later event can add new facts going forward; it cannot
reach back and change a judgment that was already made.

The consequence people find surprising is worth stating plainly: **revocation is
not a "kill everything this key ever did" button.** It is forward-only. A key
that was validly authorised, used honestly, and later revoked leaves behind
history that still counts as valid as-of its time.

That is the intended behaviour, not an oversight. The alternative — cascading,
retroactive invalidation — means one compromised key retroactively destroys the
entire authority tree it ever touched. It would make key rotation unusable and
erase honestly-made history.

## Rule 1 — ProfileBinding validity, as-of the binding's time

A `ProfileBinding` is valid if and only if its attester was a valid controlling
address of the target Profile **at the binding's own `time`**.

- **Bootstrap.** The attester of the Profile's `ProfileGenesis` is the first
  valid controlling address. Every other controlling address traces back to it
  through a chain of bindings that were each valid when they were made.
- **No cascade.** Once a binding is established, its validity does not depend on
  what later happens to the address that authorised it. Revoking the authorising
  address does not invalidate the bindings it made while it was valid.
- **Forward-only removal.** Only the binding's *own* revocation removes it, and
  only from the revocation forward. It was valid before; it is not valid after.

## Rule 2 — Junk bindings are excluded, with no special case

A stranger can attest a `ProfileBinding` naming somebody else's Profile UID.
Nothing on-chain stops them.

Such a binding is excluded, and Rule 1 already excludes it: the stranger was
never a valid controlling address of that Profile at that time, so the "if and
only if" simply fails. There is no separate junk-detection step, no heuristic and
no allowlist — the authority rule does the whole job.

This is called out as its own rule because it is the question every auditor asks
first, not because it needs any machinery of its own.

## Rule 3 — Signature validity, frozen at the signing instant

A `SignatureAttestation` is valid if and only if its attester was a valid binding
of the `signerProfileUID` it claims **at the signature's own `time`**.

Later revocation of that binding stamps a revocation time on the binding. It
**never un-signs** the signature. Signature validity is frozen at the instant of
signing, and what a revocation records is repudiation on the record — the
revocation is visible, dated, and does not pretend the signature never happened.

## Rule 4 — Completion is two layers, and they are never collapsed

"Cryptographically valid" is not the same thing as "admitted", and raw chain data
cannot tell the two apart. Anyone with their own valid Profile can mint a real,
cryptographically valid `SignatureAttestation` against any `EnvelopeOpened`
without ever having been handed a paid link. So completion has two layers, and
this repository is honest about owning only one of them.

**Layer 1 — replayable, and this is the layer you can recompute.** For each
envelope the indexer publishes:

- `paidSignerSlots`, read from the `EnvelopeOpened` attestation on chain;
- the set of cryptographically valid signatures under Rule 3, deduplicated to
  **distinct valid signer Profiles** — one Profile signing twice fills one slot,
  not two, because slots are not Profile-pinned in v1 and this is the only
  dedup that chain data alone supports;
- from those two, a **replayable-completion candidate**: whether
  `distinct valid signer Profiles ≥ paidSignerSlots`.

That candidate is **explicitly labelled "slot admission not verified —
service-attested"** wherever it is published. Anyone re-running this indexer
reproduces exactly this and nothing more.

**Layer 2 — service-attested, and this repository cannot compute it.**
Authoritative completion additionally requires that each signature was admitted
through a paid slot. Only the Karvstokk gate service knows that, because only it
issued and consumed the capability tokens. That service is closed-source and
lives in a different repository, by design — which is also why you can see for
yourself that this repository contains no gate endpoints, no token logic and no
secrets.

**The two layers are never collapsed into one number.** A bare "complete" derived
from Layer 1 alone would launder a service-attested fact into something that
looks recomputable. Consumers of this data are expected to surface both layers
separately, in the shape of: *"On chain: N cryptographically valid signatures,
recomputable. Service view: complete, all N admitted through paid slots."*

The residue you are asked to take on trust is exactly one thing — slot-admission
legitimacy. Keeping that residue explicit and small is the whole point of the
split.

## What is deliberately not here

- **Anything from the gate service.** No endpoints, no capability-token logic, no
  secrets. It is in a separate repository so that this absence is structural
  rather than a matter of discipline.
- **Conformance test vectors.** A small golden-fixture suite arrives with the
  handlers at M3. Generated language-agnostic conformance vectors are a
  post-v1 upgrade, designed to be additive rather than a rewrite.
- **Multi-chain semantics.** Each Karvstokk deployment indexes exactly one chain.
