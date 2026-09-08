import assert from "node:assert/strict";
import { test } from "node:test";
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const repo = fileURLToPath(new URL("..", import.meta.url));
const plugin = repo;
const memory = readFileSync(join(plugin, "skills", "memory", "SKILL.md"), "utf8");
const storage = readFileSync(join(plugin, "skills", "storage", "SKILL.md"), "utf8");
const controlHost = readFileSync(join(plugin, "skills", "control-host", "SKILL.md"), "utf8");
const credentialAuthorization = readFileSync(join(plugin, "skills", "credential-authorization", "SKILL.md"), "utf8");
const credentialBroker = readFileSync(join(plugin, "native", "MacBookCredentialBroker.swift"), "utf8");
const snapshot = join(plugin, "scripts", "snapshot.sh");
const snapshotSource = readFileSync(snapshot, "utf8");

test("memory skill owns live measurement and composes Toolchain eligibility", () => {
  assert.match(memory, /sysctl -n hw\.memsize/);
  assert.match(memory, /Apply `toolchain:resource-hygiene`/);
  assert.match(memory, /Own the live macOS measurement/);
  assert.match(memory, /aggregate RSS, process count/);
  assert.match(memory, /Toolchain.*owns the candidate\/no-candidate result/is);
  assert.match(memory, /PID or stable process family grow over time/);
  assert.match(memory, /kern\.memorystatus_vm_pressure_level/);
  assert.match(memory, /\| 1 \| Warning \| Yellow \|/);
  assert.match(memory, /\| 2 \| Urgent \| Yellow \|/);
  assert.match(memory, /not an optimization\s+score/);
  assert.doesNotMatch(memory, /pass all three gates/);
  assert.doesNotMatch(memory, /Do not list active Codex\/ChatGPT/);
  assert.doesNotMatch(memory, /Potential candidates/);
  assert.doesNotMatch(memory, /healthy settled-state target/);
  assert.doesNotMatch(memory, /return to level 0 as the acceptance criterion/i);
  assert.match(snapshotSource, /Kernel Memory Pressure \(Primary\)/);
  assert.match(snapshotSource, /kernel_memory_pressure_level=%s/);
  assert.doesNotMatch(snapshotSource, /target_level=0/);
  assert.match(snapshotSource, /2:urgent-warning/);
});

test("storage skill owns APFS measurement and not candidate policy", () => {
  assert.match(storage, /Apply `toolchain:resource-hygiene`/);
  assert.match(storage, /Own the live macOS and APFS measurement/);
  assert.match(storage, /passed\s+Toolchain's ownership and relevance gates/);
  assert.match(storage, /Storage candidates:\s*none proven/);
  assert.doesNotMatch(storage, /Candidate Order/);
  assert.doesNotMatch(storage, /DerivedData/);
  assert.doesNotMatch(storage, /\.build/);
  assert.doesNotMatch(storage, /Trash/);
  assert.doesNotMatch(storage, /cache/i);
  assert.doesNotMatch(storage, /active workspace can still contain removable/);
});

test("storage planning targets exactly twenty percent without inventing native pressure categories", () => {
  assert.match(storage, /Use exactly \*\*20% free capacity\*\*/);
  assert.match(storage, /Do not add a safety buffer/);
  assert.match(storage, /stop\s+when the selected percentage is physically reached/);
  assert.match(storage, /Total listed:/);
  assert.match(storage, /exact remaining gap/);
  assert.doesNotMatch(storage, /Where it went:/);
  assert.match(snapshotSource, /storage_target_pct=20/);
  assert.match(snapshotSource, /target_state="met"/);
  assert.match(snapshotSource, /target_state="below"/);
});

test("control-host skill measures live state before using its baseline", () => {
  assert.match(controlHost, /sw_vers/);
  assert.match(controlHost, /adb version/);
  assert.match(controlHost, /scrcpy --version/);
  assert.match(controlHost, /\.\.\/\.\.\/context\/mac-control-host\.md/);
  assert.match(controlHost, /live output takes precedence/i);
});

test("snapshot script is valid shell and ships only memory and storage", () => {
  execFileSync("bash", ["-n", snapshot]);
  const result = spawnSync(snapshot, ["invalid-mode"], { encoding: "utf8" });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /\[memory\|storage\|all\]/);
  assert.doesNotMatch(snapshotSource, /heat/);
});

test("credential authorization never gives the agent a secret-return path", () => {
  assert.match(credentialAuthorization, /Never request, repeat, transcribe, reveal, export, log/);
  assert.match(credentialAuthorization, /Never run `security \.\.\. -w`/);
  assert.match(credentialAuthorization, /Never press Return/);
  assert.match(credentialAuthorization, /AXWebArea/);
  assert.match(credentialAuthorization, /fixed `macos-login`/);

  assert.match(credentialBroker, /authorize_and_fill_credential/);
  assert.match(credentialBroker, /kAXSecureTextFieldSubrole/);
  assert.match(credentialBroker, /containsWebArea/);
  assert.match(credentialBroker, /parentIsApprovedHost/);
  assert.match(credentialBroker, /secretReturned": false/);
  assert.doesNotMatch(credentialBroker, /"(?:get|read|reveal|export|copy)_credential"/);
  assert.doesNotMatch(credentialBroker, /pbcopy|NSPasteboard|security find-generic-password/);
});

test("credential broker scripts are valid shell", () => {
  for (const name of [
    "build-credential-broker",
    "install-credential-broker",
    "launch-credential-broker-mcp",
  ]) {
    execFileSync("bash", ["-n", join(plugin, "scripts", name)]);
  }
});
