# @statecraft/governance-native

statecraft's governance spine as a napi-rs addon (spec 008). It wraps four
crates.io crates (extracted from OAP's policy-kernel, published under the
statecraft-ing org) and exposes them to the Encore.ts `governance/` service as
plain-JSON-in / plain-JSON-out functions:

| crate | primitive |
|---|---|
| `canonical-keysort-json` | byte-identical canonical JSON |
| `attest-ledger` | tamper-evident record chain + Ed25519 anchors |
| `action-gate` | deterministic gate over an ordered check registry |
| `trust-window` | rolling-window trust scorer |

## Surface

```
canonicalize(json)                 -> { canonical, sha256 }
ledgerAppend(stateDir, record)     -> { seq, recordHash, chainHash }
ledgerVerify(stateDir)             -> { ok, seq, error? }
ledgerAnchor(stateDir, keyRef)     -> anchor JSON   (keyRef: base64 32-byte Ed25519 seed)
gateEvaluate(configJson, ctxJson)  -> { outcome, reason, checkIds, blocking, configHash }
trustSample(snapshotJson, sample)  -> snapshot JSON  (snapshotJson may be null)
trustLevel(snapshotJson)           -> { level, score }
```

The ledger file store (`<stateDir>/records.jsonl` + `anchor.json`, the `seq`
counter, the genesis anchor) lives here: `attest-ledger` is storage-agnostic by
design. The gate config schema and the four v1 checks (`posture-required`,
`confirm-name-required`, `tenant-active`, `actor-authenticated`) live here too:
`action-gate` ships the machinery, not the domain policy.

## Build & test

```bash
cargo test --no-default-features   # pure-logic tests, no Node C API linkage
npm install && npm run build       # build the per-platform .node (needs @napi-rs/cli)
```

The `#[napi]` bindings are behind the default `node` feature; `cargo test`
turns it off so the test harness links without Node's symbols. All four
governance crates are exact-pinned (`=0.1.0`) per spec 008 §1.
