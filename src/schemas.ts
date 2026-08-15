/**
 * Canonical v1 EAS schema definitions.
 *
 * These strings are the source of truth. A schema UID is the keccak of the
 * schema string, so a single changed character — whitespace included — is not
 * an edit but a different schema with a different UID, and the UID is what
 * every proof bundle, every config file and any future mainnet registration is
 * pinned to. That makes this file effectively append-only.
 *
 * "Source of truth" is meant across the whole system, not just this
 * repository. The Karvstokk application carries a byte-identical **mirror** of
 * the marked block below, and its build fetches this file from `main` every
 * time and fails if the two differ. So a change here is a change everywhere,
 * and a change to the copy alone is a red build.
 *
 * Everything between the `karvstokk:constants` markers is mirrored verbatim.
 * Anything outside them — this comment included — is local to this file, which
 * is how the copy gets to say it is a copy while the block stays identical.
 * Both sides format with the same Prettier settings, so the formatter cannot
 * introduce a difference on its own either.
 *
 * Re-derive the UIDs yourself, offline and without trusting us:
 *
 *   pnpm install && pnpm verify
 */

// --- karvstokk:constants:begin ---

/**
 * The v1 schemas are registered with no resolver, so they have no admin and no
 * hook. The resolver address is part of the UID preimage, which is why it lives
 * here rather than in a deployment config.
 */
export const RESOLVER = "0x0000000000000000000000000000000000000000";

/** OP-stack predeploys — identical on Base and Base Sepolia. */
export const SCHEMA_REGISTRY = "0x4200000000000000000000000000000000000020";
export const EAS = "0x4200000000000000000000000000000000000021";

export interface SchemaDefinition {
  /** Cosmetic only. The UID is what anything actually depends on. */
  readonly name: string;
  /** The registered schema string. One changed character is a new schema. */
  readonly schema: string;
  readonly revocable: boolean;
  /** keccak256(abi.encodePacked(schema, resolver, revocable)). */
  readonly uid: `0x${string}`;
  readonly notes: string;
}

/**
 * Registration order matters only for readability; UIDs are content-addressed,
 * so the four registrations are independent transactions.
 *
 * `uid` is precomputed offline as
 *   keccak256(abi.encodePacked(schema, resolver, revocable))
 * which is exactly SchemaRegistry._getUID — no nonce, no registrant, no chain
 * id. `verify-uids.ts` re-derives all four with no network access, and Base
 * Sepolia has reported every one of them back unchanged.
 */
export const SCHEMAS = [
  {
    name: "ProfileGenesis",
    schema:
      "string displayName, string authorityClaim, string websiteUrl, string ensName",
    revocable: true,
    uid: "0x4dc83f2811d4c6c84ef67e86e77b55059400e8617329f587c79ae4f96b6f3f8c",
    notes:
      "Attester = founding wallet. refUID = 0. Revocable retires the identity.",
  },
  {
    name: "ProfileBinding",
    schema: "",
    revocable: true,
    uid: "0x32d2887185b9529bc752499f905fb490e1581bfac02d7c6cdd54e3393247b49b",
    notes:
      "Empty schema string — all-native: refUID -> ProfileGenesis, recipient = " +
      "controlling wallet, attester = an already-valid controlling address.",
  },
  {
    name: "SignatureAttestation",
    schema:
      "bytes32 commitment, bytes32 signerProfileUID, bytes32 roleCommitment, string contentLocator",
    revocable: true,
    uid: "0x43797579a7f5271510bae3c83fe8be5a79bba265f4cd5ecd300b1e857466041e",
    notes: "refUID -> EnvelopeOpened. Attester = the signing smart wallet.",
  },
  {
    name: "EnvelopeOpened",
    schema:
      "bytes32 commitment, bytes32 originatorProfileUID, uint16 paidSignerSlots, bytes32 intentCommitment, string contentLocator",
    revocable: false,
    uid: "0x669fbbaf9d535f6e878487c9402480889a59bf27b02176a18e2382fb599221e3",
    notes:
      "Irrevocable — makes 'envelopes never expire, no withdrawn state' structural.",
  },
] as const satisfies readonly SchemaDefinition[];

export type SchemaName = (typeof SCHEMAS)[number]["name"];

export const byName = (name: SchemaName): SchemaDefinition => {
  const found = SCHEMAS.find((s) => s.name === name);
  if (!found) throw new Error(`no such schema: ${name}`);
  return found;
};

export const SCHEMA_REGISTRY_ABI = [
  {
    type: "event",
    name: "Registered",
    inputs: [
      { name: "uid", type: "bytes32", indexed: true },
      { name: "registerer", type: "address", indexed: true },
      {
        name: "schema",
        type: "tuple",
        indexed: false,
        components: [
          { name: "uid", type: "bytes32" },
          { name: "resolver", type: "address" },
          { name: "revocable", type: "bool" },
          { name: "schema", type: "string" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "register",
    stateMutability: "nonpayable",
    inputs: [
      { name: "schema", type: "string" },
      { name: "resolver", type: "address" },
      { name: "revocable", type: "bool" },
    ],
    outputs: [{ name: "", type: "bytes32" }],
  },
  {
    type: "function",
    name: "getSchema",
    stateMutability: "view",
    inputs: [{ name: "uid", type: "bytes32" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "uid", type: "bytes32" },
          { name: "resolver", type: "address" },
          { name: "revocable", type: "bool" },
          { name: "schema", type: "string" },
        ],
      },
    ],
  },
] as const;

const ATTESTATION_REQUEST_DATA = {
  type: "tuple",
  name: "data",
  components: [
    { name: "recipient", type: "address" },
    { name: "expirationTime", type: "uint64" },
    { name: "revocable", type: "bool" },
    { name: "refUID", type: "bytes32" },
    { name: "data", type: "bytes" },
    { name: "value", type: "uint256" },
  ],
} as const;

export const EAS_ABI = [
  {
    type: "event",
    name: "Attested",
    inputs: [
      { name: "recipient", type: "address", indexed: true },
      { name: "attester", type: "address", indexed: true },
      { name: "uid", type: "bytes32", indexed: false },
      { name: "schemaUID", type: "bytes32", indexed: true },
    ],
  },
  {
    type: "function",
    name: "attest",
    stateMutability: "payable",
    inputs: [
      {
        type: "tuple",
        name: "request",
        components: [
          { name: "schema", type: "bytes32" },
          ATTESTATION_REQUEST_DATA,
        ],
      },
    ],
    outputs: [{ name: "", type: "bytes32" }],
  },
  {
    type: "function",
    name: "getAttestation",
    stateMutability: "view",
    inputs: [{ name: "uid", type: "bytes32" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "uid", type: "bytes32" },
          { name: "schema", type: "bytes32" },
          { name: "time", type: "uint64" },
          { name: "expirationTime", type: "uint64" },
          { name: "revocationTime", type: "uint64" },
          { name: "refUID", type: "bytes32" },
          { name: "recipient", type: "address" },
          { name: "attester", type: "address" },
          { name: "revocable", type: "bool" },
          { name: "data", type: "bytes" },
        ],
      },
    ],
  },
] as const;

// --- karvstokk:constants:end ---
