# ChatGPT drafting → Comos integration packet

Copy this into a regular chat along with the smallest relevant set of current source files. Replace the bracketed fields. Do not include account credentials, private keys or campaign exports unless the task and destination are explicitly intended for that data.

## Prompt

We are developing Comos incrementally. Draft only [module/behavior] for roadmap substep [ID], based on project version [version] and the attached [exact relevant files]. This is preparation for later integration, not permission to rewrite the app.

Preserve these contracts: [exports, input fields, output fields, stable IDs, errors and scope]. Use JavaScript ES modules and existing dependencies; propose a new dependency only with a concrete reason. Keep calculations/data transformations separate from UI and persistence. Do not invent rule data, legacy mappings or production permissions. Flag missing evidence.

Return:
1. Proposed file paths and complete module code or a patch against the supplied files.
2. Exported function signatures and an example input/output.
3. Positive, negative and boundary test cases with justified expected results.
4. Dependencies, schema changes and assumptions; explicitly say none if there are none.
5. What was actually executed or tested in this chat, and what remains unverified.
6. Integration steps and any source references used.

Do not publish, connect live accounts or mark the feature implemented in the actual Comos project. Stop once this bounded draft is complete.

## Integration checklist for the project agent

- [ ] Compare the packet’s baseline with the current project files.
- [ ] Confirm exports, IDs, schema and source evidence; resolve conflicting assumptions before edits.
- [ ] Merge the bounded change without replacing unrelated working code.
- [ ] Run meaningful tests and inspect actual integration behavior.
- [ ] Preserve fixture-only preview and server-side authorization.
- [ ] Update ROADMAP, STATUS, VERIFICATION and the current ZIP.
- [ ] Report what the user should test on Android.

## First economical drafting tasks

1. A permission truth table for Step 4 using the existing world/party/player scope contract, including removed membership and cross-world denial. This is a spec/test draft, not server security code approval.
2. Character card HTML/CSS using existing shared tokens and fields from ARCHITECTURE.md; omit network calls and permission decisions.
3. Wizard draft-state transition cases for source changes, back/next, refresh, validation failure and retries. Actual rule adapters wait for the source JSON.

These tasks can be prepared while live authentication waits for configuration. Integration order still follows the roadmap dependencies.
