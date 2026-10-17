/**
 * One-off login probe using project credentials module.
 * Reads credentials from env only; never prints password.
 */
import { pathToFileURL } from "node:url";
import { register } from "node:module";

// Load TS via Next/tsx if available; otherwise compile path via dynamic import of built logic.
// Prefer spawning through a small TS runner.

const username = process.env.EDUVULCAN_TEST_USER ?? "";
const password = process.env.EDUVULCAN_TEST_PASS ?? "";

if (!username || !password) {
  console.error(JSON.stringify({ ok: false, error: "Missing EDUVULCAN_TEST_USER/PASS env" }));
  process.exit(1);
}

// Use tsx if present, else fail clearly.
console.log(JSON.stringify({ stage: "start", userLen: username.length, passLen: password.length }));
