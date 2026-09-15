# Osborn Ministries Jobs Platform memory

Durable facts discovered while working on this project, one per file in [memory/](memory/).

**This is not the onboarding manual.** [project-brief.md](project-brief.md) states what this project is, what is decided, and what is open; read that first. Memory holds what was *discovered* along the way: technical gotchas, IDs, status, decisions made while reconciling things. If a rule is fully stated in a context file, it does not also belong here.

## Projects

- [Scope Conflict Brief Vs Stage1](memory/scope_conflict_brief_vs_stage1.md): resolved — pastor approved the full network vision (Stage 1/2) over the brief's fast-slice-only scope; verification badges resolve the warranty question, with a copy caveat that badges must not imply a conduct guarantee.
- [Compliance Deferred To Post Launch](memory/compliance_deferred_to_post_launch.md): legal/PDPA compliance, employment-agency status, and dispute handling are deliberately deferred until the system is confirmed running, not pre-launch gates. Technical stack is NO LONGER part of this deferral (see Stage 19/20). Verification *criteria* (not who verifies) remains unresolved and is NOT part of this deferral.
- [M1 Schema Verification Fields Corrected](memory/m1_schema_verification_fields_corrected.md): a received M1 migration spec conflated membership/credentials verification into one column; corrected to the decided three-field split. Check any future implementation doc's members/profile schema against this specifically.
