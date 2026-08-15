#!/usr/bin/env node
/**
 * Offline: re-derive every schema UID from its (schema, resolver, revocable)
 * tuple and check it against the recorded constant. No network access.
 *
 * This is the guard on the chain-independence claim: if this passes, a
 * byte-identical registration on any chain yields these same UIDs.
 *
 * It lives in this repository rather than beside the registration scripts
 * because "check our UIDs yourself, without trusting us" is the kind of claim
 * that is only worth anything when the code behind it is public:
 *
 *   pnpm install && pnpm verify
 *
 * A pass means the four UIDs in `schemas.ts` really are the keccak of the four
 * schema strings printed next to them, on any chain. It says nothing about
 * what is actually registered on Base — for that, look each UID up on easscan.
 */
import { encodePacked, keccak256 } from "viem";

import { RESOLVER, SCHEMAS } from "./schemas.ts";

let failed = 0;

for (const s of SCHEMAS) {
  const derived = keccak256(
    encodePacked(
      ["string", "address", "bool"],
      [s.schema, RESOLVER, s.revocable],
    ),
  );
  const ok = derived === s.uid;
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${s.name.padEnd(22)} ${derived}`);
  if (!ok) console.log(`     recorded: ${s.uid}`);
}

if (failed) {
  console.error(
    `\n${failed} UID mismatch(es). Either a schema string changed (which means ` +
      `a new schema, a new UID, and an ADR) or the recorded UID is wrong.`,
  );
  process.exit(1);
}

console.log(`\nAll ${SCHEMAS.length} UIDs match. Resolver ${RESOLVER}.`);
