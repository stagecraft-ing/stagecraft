/**
 * Governance service configuration: the ledger state directory, the gate
 * config (committed JSON, spec 008 §2), and the anchor signing key.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { secret } from "encore.dev/config";

/**
 * Where the tamper-evident chain lives on the container volume. The chain file
 * is the authority; CoreLedger keeps only a query index. Overridable so tests
 * and dev use a scratch dir.
 */
export const GOVERNANCE_STATE_DIR: string =
  process.env.STAGECRAFT_GOVERNANCE_STATE_DIR ?? "./.data/governance";

/**
 * The committed gate config v1, read once at module load. Its stable hash is
 * pinned by an addon test (addon/governance-native/src/gate.rs), so any change
 * to this file is visible in review.
 */
export const GATE_CONFIG_JSON: string = readFileSync(
  fileURLToPath(new URL("./config/gate.v1.json", import.meta.url)),
  "utf8",
);

/**
 * Ed25519 anchor signing key: a base64-encoded 32-byte seed, provisioned at
 * first boot (spec 007) and injected as an Encore secret. Never on disk
 * unencrypted (spec 008 §2); only `ledgerAnchor` ever sees it.
 */
export const governanceAnchorKey = secret("GovernanceAnchorKey");
