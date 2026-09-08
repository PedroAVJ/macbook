# Repository guidance

- This repository is the canonical source for the `macbook` plugin.
- Keep the Codex and Claude manifests synchronized when both are present. The Claude plugin is intentionally absent for Codex-only plugins.
- Marketplace catalogs reference this repository; do not duplicate runtime behavior back into a marketplace repository.
- Keep credentials, pairing secrets, network endpoints, and hardware serial numbers out of Git. `context/mac-control-host.md` documents comparison rules; operator baselines belong outside Git and live inspection takes precedence.
- Bump the plugin version for released behavior changes and run `npm test` before publishing.
