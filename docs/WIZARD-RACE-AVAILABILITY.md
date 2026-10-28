# COSMOS Race Wizard — standard list with per-trait review locks

The normal race selector displays all 59 registered races without a global "testing" banner or label. **This does not mean the underlying extracted rules have been independently approved**: the staged definitions still retain `needs_review` and `partial` coverage.

Rules needing a missing player-choice UI or an unresolved alternate/heritage replacement are dimmed and nonselectable, with a reason under the full trait description. Unaffected traits remain accessible. Source conflicts that require manual tracking may be visually dimmed, but do not create fictional automatic bonuses. Build validation rejects active unsupported required choices and forged/old unsupported alternate selections.

The generated race catalog is rebuilt via `scripts/build.mjs` in the normal site build. A commit to GitHub does not by itself prove the hosted site deployed successfully.

After **all races** have been extracted, prepare a human-readable TXT document, one entry per **exact race and trait** that needs review, giving the source wording, the decision needed, and plain-language recommended behavior. The user will review it and approve/change those decisions. Do not ask the user to read raw JSON.

No Railway access occurred.
