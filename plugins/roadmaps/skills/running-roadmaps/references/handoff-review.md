# Reviewer handoff

**A reviewer judges one pull request in a fresh context and changes nothing.** The manager wrote the build handoff, so the manager shares the worker's assumptions. The reviewer does not.

## Fill

1. Copy `templates/review.md` to the handoff file, per `SKILL.md` Dispatch.
2. Paste the whole build handoff and every fix list sent for the pull request, verbatim, into the Build task section.
3. Paste the worker's last report verbatim into the Report section.
4. Copy the Review greps and the Protected list of the profile into the Checklist.
5. NEVER add your own opinion of the pull request: an opinion anchors the reviewer.
6. If a fix list came from an earlier review, paste that review verbatim into the Earlier findings section. Otherwise, delete that section.
7. Replace every `<placeholder>`. Delete each template line that does not apply.
