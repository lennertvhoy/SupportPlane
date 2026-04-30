# BL-117 Proof Mapping Table

| # | File | Proof State | Type |
|---|------|-------------|------|
| 01 | 01-baseline-runtime-and-bl116-regression.txt | BL-116 baseline preserved | CLI |
| 02 | 02-telephony-architecture-proof.md | Architecture decision record | Doc |
| 03 | 03-asterisk-topology-proof.txt | Asterisk K8s deployment state | CLI |
| 04 | 04-telephony-registry-proof.txt | Telephony registry JSON output | CLI |
| 05 | 05-asterisk-ami-connection-proof.txt | AMI login + event injection | CLI |
| 06 | 06-real-call-event-ingestion-proof.txt | Call event created via API | CLI |
| 07 | 07-caller-match-session-proof.txt | Caller match + session auto-create | CLI |
| 09 | 09-blocked-pbx-actions-proof.txt | FreePBX deferred, no PSTN | Doc |
| 10 | 10-no-secret-no-pstn-boundary-proof.txt | Security boundary verification | Doc |
| 11 | 11-ai-registry-direct-proof.txt | AI provider registry actually used | CLI |
| 12 | 12-registry-truth-cleanup-proof.txt | osTicket fixture-only, DeliveryPolicy honest | Doc |
| 13 | 13-cluster-redeploy-proof.txt | Fresh API pod after rebuild | CLI |
| 14 | 14-validation-gate-summary.txt | All validation gates pass | Doc |
| 15 | 15-ui-call-console-asterisk-proof.png | Call Console shows Asterisk call | Screenshot |
| 16 | 16-ui-telephony-registry-proof.png | Telephony registry JSON in browser | Screenshot |
| 17 | 17-proof-mapping-table.md | This mapping table | Doc |

Screenshot count: 2 (max 20)
Duplicate check: md5sums unique — no duplicates detected.
