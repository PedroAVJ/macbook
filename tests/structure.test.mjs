import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

const root = fileURLToPath(new URL("..", import.meta.url));
const expected = {
  "name": "macbook",
  "version": "0.6.2",
  "url": "https://github.com/PedroAVJ/macbook",
  "dependencies": ["toolchain@package-manager"]
};

async function json(...parts) {
  return JSON.parse(await readFile(join(root, ...parts), "utf8"));
}

test("standalone plugin metadata is synchronized", async () => {
  const codex = await json(".codex-plugin", "plugin.json");
  assert.equal(codex.name, expected.name);
  assert.equal(codex.version, expected.version);
  assert.equal(codex.homepage, expected.url);
  assert.equal(codex.repository, expected.url);
  assert.equal(codex.mcpServers, "./.mcp.json");
  assert.ok(codex.interface.defaultPrompt.length <= 3);
  await access(join(root, "README.md"));
  await access(join(root, "AGENTS.md"));
  await access(join(root, "context", "mac-control-host.md"));
  await access(join(root, "skills", "control-host", "SKILL.md"));

  if (expected.codexOnly) {
    await assert.rejects(access(join(root, ".claude-plugin", "plugin.json")));
  } else {
    const claude = await json(".claude-plugin", "plugin.json");
    assert.equal(claude.name, codex.name);
    assert.equal(claude.version, codex.version);
    assert.equal(claude.homepage, expected.url);
    assert.equal(claude.repository, expected.url);
    assert.equal(claude.mcpServers, codex.mcpServers);
    for (const dependency of expected.dependencies) {
      assert.ok((claude.dependencies ?? []).includes(dependency));
    }
  }

  const pkg = await json("package.json");
  assert.equal(pkg.version, expected.version);
  assert.equal(pkg.homepage, expected.url + "#readme");
  assert.equal(pkg.repository.url, "git+" + expected.url + ".git");

  const mcp = await json(".mcp.json");
  const broker = mcp.mcpServers["macbook-credential-broker"];
  assert.equal(broker.type, "stdio");
  assert.equal(broker.command, "/bin/sh");
  assert.match(broker.args.join(" "), /launch-credential-broker-mcp/);

  await access(join(root, "skills", "credential-authorization", "SKILL.md"));
  await access(join(root, "native", "MacBookCredentialBroker.swift"));
  await access(join(root, "runtime", "bin", "macbook-credential-broker"));
  await access(join(root, "scripts", "build-credential-broker"));
  await access(join(root, "scripts", "install-credential-broker"));
  await access(join(root, "scripts", "launch-credential-broker-mcp"));
});
