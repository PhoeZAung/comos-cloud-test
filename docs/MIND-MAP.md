# Comos — mind map for efficient development

Updated 24 October 2026. Companion to [ROADMAP.md](ROADMAP.md). This is the cloud project’s planning note, ready to copy into Obsidian. The original Mind Map.md on your PC has NOT been edited.

## Central goal
Build Comos one coherent feature slice at a time, with responsive navigation and clear data boundaries. Keep Ghost preview isolated. Native QNAP hosting later, no Docker; only the focused character sheet integrates with Owlbear. Preserve the legacy repository and accounts. Nothing is published without a new instruction.

## Branch 1 — regular ChatGPT: prepare for later integration
Here “regular ChatGPT” means a conversation that is not operating this project checkout. Tools vary by chat; these are recommended work assignments, not claims that one model is unable to write particular kinds of code.

Good candidates:
- Requirements: agree what one tab does, write acceptance criteria, identify edge cases and choose interface labels.
- Content: introduction copy, original lore you authorize, help text and empty/error messages. Keep invented samples separate from canonical campaign content.
- Data design: draft JSON contracts and synthetic examples from the current architecture; record open questions rather than guessing legacy fields.
- Pure code: deterministic JavaScript functions with explicit inputs/outputs and no filesystem, browser, authentication, network or database access.
- Rules calculations: ability-score modifiers, filtering abilities by level, or other formulas ONLY after authoritative rules and sample inputs/expected outputs are supplied. Do not invent FFd20 HP/MP tables, archetype replacements or class/race schemas.
- View components: self-contained HTML/CSS proposals using the existing tokens; a module should accept data rather than fetch it or decide permissions.
- Tests: input/output cases, denied-access scenarios, interrupted-flow cases and representative data sizes. Treat generated expected answers as proposed until independently checked.

These drafts can be integrated later if their interfaces and source assumptions match the current project. Mark each “draft, not integrated”; never mark a roadmap feature complete just because a chat produced code.

## Branch 2 — Codex/project workspace: integrate and verify
Use the checkout for changes whose correctness depends on multiple existing files:
- Wire page modules, shared layouts, route imports, builds and isolated preview adapters.
- Connect forms to services, services to APIs and repositories to migrations.
- Review dependencies and SDK versions; run installation/build checks and retain the lockfile.
- Implement and test authentication, ownership, scoped permissions, upload handling and conflict behavior.
- Integrate chat-drafted modules against the real contracts; run tests and inspect differences before replacing existing files.
- Reproduce bugs, run targeted tests, check browser layout, update verification evidence and package a usable ZIP.

Codex can also draft everything listed under Branch 1. The reason to prepare drafts elsewhere is to reserve project-agent work for integration and verification, not because source text is impossible to write in a normal chat.

## Branch 3 — requires actual access or user testing
Neither a code draft nor passing mock tests can establish these outcomes:
- Firebase: configured project/providers/authorized domain, secure server credentials, real sign-in/reset/revocation and migration readiness.
- Android: actual touch keyboard, browser popup/cookie behavior, device zoom and accessibility.
- Legacy migration: actual authorized exports, record counts, schema mapping, reconciliation and rollback rehearsal.
- FFd20: actual source files and current authoritative rule tables; representative known characters to validate calculations.
- Owlbear: an actual room, manifest/host behavior, token permissions, reconnect and synchronization conflicts.
- QNAP: exact model/OS/native runtime, filesystem permissions, HTTPS/reverse proxy, reboot behavior and backup restore.
- Performance: representative populated catalogs/feed/media and measurements on agreed hardware. Empty placeholders prove no large-data performance claim.

These can be coded in advance as adapters and tests. They cannot honestly be called verified integrations until the real dependency is exercised. Credentials belong in secure service configuration, not pasted into a chat or shipped in a ZIP.

## Branch 4 — task allocation by roadmap

| Area | Prepare in regular ChatGPT | Integrate/test in the project | External evidence needed |
| --- | --- | --- | --- |
| 1: shell | Page names, labels, layout suggestions | Shared layouts, navigation, responsive/keyboard checks | Phone and zoom review |
| 2: identity | Flow diagrams, error wording, test cases | Provider/session wiring, onboarding, throttling and preview isolation | Configured Firebase + HTTPS + real accounts |
| 3: Account | Profile field design and validation examples | Upload validation/storage, edit conflicts, theme application | Real uploads and sessions |
| 4: Admin/groups | Membership examples, permission truth table | Server authorization and scoped queries | Four world names and trusted admin assignments |
| 5: Home feed | Post/reply contracts, persona UX, fixture records | Pagination, writes, media and author ownership | Real membership scenarios |
| 6: Lore | Authorized content, filter semantics, entry presentation | Scoped API, editor, imports and lazy media | Actual legacy records and scope mapping |
| 7: Characters | Card markup, copy/delete behavior and acceptance cases | Summary queries, ownership and cleanup | Representative saved characters |
| 8: Wizard | Input contracts, draft state transitions, source-grounded pure adapters | Actual source audit, validation, drafts and persistence | Actual race/class JSON and versioned source rules |
| 9: Sheet/shop | Pure calculation modules and exact test vectors | Sheet migration, revision-safe saves, lazy shop and bounded search | Known character results and large catalogs |
| 10: Owlbear | Adapter interface and sync/conflict rules | Manifest, SDK boundary and messaging | Actual room tests |
| 11: QNAP | Inventory checklist, backup and rollback plan | Native service/configuration scripts | Actual NAS access and restore rehearsal |
| 12: Final design | Design tokens, typography proposals and copy | Integrate styles, accessibility and regression checks | Real-device and populated-data checks |

## Branch 5 — handoff rules that prevent expensive rewrites
1. Use the latest ZIP as the baseline. Send the drafting chat only the relevant files and contracts, plus the constraints it needs.
2. Request one coherent module with a filename, exported API, example input/output, edge cases and dependencies. Prefer existing dependencies and plain ES modules.
3. Preserve stable IDs and schemas. If a change is necessary, label it as a proposed migration; do not silently rename fields across drafts.
4. Bring back the files or a patch, baseline version, relevant source citations, test cases, assumptions and unresolved questions. Use [INTEGRATION-PACKET.md](INTEGRATION-PACKET.md).
5. Integrate once per coherent slice. Compare the current files first, run meaningful checks, and update status. Do not paste an entire alternate app over the working project.
6. Re-test when code, assumptions, dependencies or observed failures change. Avoid repeatedly running unchanged full suites just to narrate progress.

## Branch 6 — how “continue” works now
The user authorized larger coherent batches for efficiency. A continuation should finish as much of the selected roadmap area as can be reliably implemented and verified: related UI, service/API work, tests, documentation and packaging together. Do not stop after each trivial edit, and do not combine unrelated tabs into an unreviewable rewrite. Ask only for consequential choices or genuinely missing access.

Before each batch, check [STATUS.md](STATUS.md) and the relevant current files. Finish with what changed, what was tested, remaining real-world blockers and a short phone test checklist. Keep one current ZIP and update it rather than generating unnecessary variants.

## Accuracy and credit limits
I cannot self-certify a numerical accuracy rate or reliably predict exact credits for a change. Use evidence instead: source-grounded, unit-tested, integrated, browser-checked, and real-service-verified are different statuses. Authentication, migration, permission logic and game calculations need explicit negative cases and representative expected results. Do not skip them to save credits.

Official OpenAI documentation says ChatGPT Work and Codex share usage, and task complexity, context, tools and other execution choices affect consumption. Moving a task to another Work conversation therefore does not by itself avoid Codex usage. Check the usage display for your plan; API prices are not a proxy for subscription credits. Preparing focused drafts in a regular chat may reduce repeated project work, but no percentage saving is promised.

Sources checked 24 October 2026:
- https://learn.chatgpt.com/docs/pricing
- https://learn.chatgpt.com/docs/learn/best-practices

The task-allocation table and batching rules above are project-specific engineering recommendations, not OpenAI product guarantees.

## 0.7.0 handoff update
Step 4 admin implementations now cover Groups, Character controls and Item controls. Continue using regular ChatGPT for source-grounded item descriptions, category suggestions and import mapping drafts; keep the real import adapter, permissions, revision checks and deployment integration here. Do not upload private account exports as catalog fixtures. Next implementation slice is 5.1 scoped Home feed; first test the owner Admin entry and group assignments on the phone. The character wizard navigation is sequential (current name, Back/Next); actual wizard inputs and rule adapters are still Step 8.
