---
name: always_update_changelog
description: Always update CHANGELOG.md with every commit — features, fixes, and developer instructions
type: feedback
---

Always update CHANGELOG.md in the same commit as the code change. Never skip it.

**Why:** User explicitly asked multiple times — changelog gets missed repeatedly and they need it for future reference and onboarding.

**How to apply:**
- Every feature, fix, or config change → add entry to CHANGELOG.md in the same git commit
- Include: what changed, why, and any developer instructions (how to add/modify similar things in future)
- If it's a new config pattern (e.g. patterns.js, options, cameraPosition), add a "How to use" section in the changelog AND as comments in the config file itself
- Never commit code without updating CHANGELOG.md
