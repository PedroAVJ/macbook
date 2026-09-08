# MacBook

Diagnostics, local host context, and human-approved native credential fills for
the user's Mac.

"My MacBook is slow" is never one question. Memory and disk fail
independently — the machine can be swapping hard with plenty of free disk, or
dying of memory starvation because the disk filled up. Collapsing them into a
single health check produces a verdict that is right about one thing and
silently wrong about the other.

So this plugin splits them, and each skill says which one it answered.

## Skills

| Skill | Question |
| --- | --- |
| `memory` | What are current RAM pressure, swap, and process-owner measurements? |
| `storage` | What is current APFS headroom and the exact shortfall to the free-space target? |
| `control-host` | What macOS, architecture, ADB, and scrcpy setup is available right now? |
| `credential-authorization` | Can a native signed macOS prompt receive one approved Mac login password fill without exposing the secret to the agent? |

MacBook owns live host measurement, not cleanup eligibility. Both diagnostic
skills compose `toolchain:resource-hygiene`, which owns whether any measured
file, application, or process may appear in a cleanup recommendation.

Unless the user chooses another threshold, storage cleanup plans target 20%
free capacity. That percentage is the literal measurement target, with no
safety buffer, and any separately authorized cleanup verifies the actual result
with `df`.

Storage answers return the target line plus only Toolchain-qualified candidates.
If none qualify, they say so even when the target remains unmet. Logical sizes
remain projections until physical APFS reclaim is verified with `df`.

## Snapshot Script

One read-only script backs both, sectioned by concern:

```bash
./scripts/snapshot.sh memory
./scripts/snapshot.sh storage
./scripts/snapshot.sh all
```

Nothing in it mutates state, kills processes, or triggers macOS Automation
prompts.

## Credential Broker

`credential-authorization` is deliberately narrower than a password manager.
It owns one fixed alias, `macos-login`, and exposes presence, target inspection,
one-time approval plus fill, and synthetic verification. There is no read,
reveal, export, copy, or unattended-fill operation.

The broker fills only a native secure field inside a signed allowlisted dialog.
It rejects web-page password fields, re-verifies the target after approval, and
never presses Return. The stable helper lives under
`~/Library/Application Support/MacBookCredentialBroker`; its Keychain item is
created later through a native secure provisioning dialog, never through chat
or a shell argument.

Newly installed MCP tools become available in fresh Codex or Claude tasks.

## Where They Connect

Swap files share the APFS container with everything else, so free disk is the
hard ceiling on how far swap can grow. On a small-RAM machine, a full disk
lowers the OOM threshold directly — which is why `memory` checks headroom
before blaming an app, and hands off to `storage` when that is the real
constraint.

## Calibration

The snapshot derives RAM, processor count, and APFS capacity from the current
Mac. The skills use proportional pressure and headroom bands, then report the
measured hardware beside the verdict. Operator host baselines belong in private local configuration. The skill
measures the live Mac first and compares prior measurements only when supplied.

Memory diagnosis uses the kernel's categorical pressure level to establish
urgency and aggregates current process-owner trees. Toolchain applies the
cleanup eligibility decision. Level 0 is not an optimization target for this
Mac's normal workload.

## Install

```bash
claude plugin install toolchain@package-manager
claude plugin install macbook@package-manager
```

```bash
codex plugin add toolchain@package-manager
codex plugin add macbook@package-manager
```
