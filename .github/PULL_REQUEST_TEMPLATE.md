<!-- Keep this short. Delete the sections that do not apply. -->

## What changed

## Why

<!-- If this fixes a failure, describe the failure itself: what the agent claimed, what it
     had actually fetched in that session, and what the user saw. "Improves the skill" is
     not a problem statement. -->

## Checks

- [ ] `node scripts/validate.mjs` passes
- [ ] `node scripts/validate.test.mjs` passes
- [ ] `node scripts/eval-routing.mjs` and `node scripts/eval-routing.test.mjs` pass
- [ ] `node scripts/probe.test.mjs` passes
- [ ] `claude plugin validate .` passes (CI runs it)
- [ ] `SKILL.md` is still between 25 and 150 lines
- [ ] New rules name the case that required them
- [ ] `README.md` and `README.zh.md` still agree (the validator checks their structure)
- [ ] The skill version and the marketplace version are equal, and `CHANGELOG.md` names the change
- [ ] Any claim about another repository added to the docs was fetched, not recalled
