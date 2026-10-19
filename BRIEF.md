# Meadow House Repairs — Problem brief and judging tests

> Omega Digital university hackathon · 19 October 2026
> Judging version: omega-2026-10-19-core-v2

## How to use this file

This is the complete task description and published judging checklist for this challenge. Read it as your brief, paste it into your planning or coding assistant, or add the file to your project as context. Build in small steps and check the app against each test.

You choose the design, programming language and tools. Planning with Claude and building with your chosen coding tool is optional. Tool choice and paid AI access earn no bonus marks.

## The problem

Staff at the fictional Meadow House need a simple way to report repairs, see their progress and understand what was done. Build a browser app that keeps each repair and its history together.

## What to build

- A repair-report form with a description, reporter name and Normal or Urgent priority. Reject empty or whitespace-only descriptions and reporter names with useful feedback.
- On a valid report, create a New job with an automatic unique ID, date and the fixed house name Meadow House. Show the description, reporter and selected priority.
- A way to view multiple separate jobs. Editing one job must not change another job.
- A way to move a job to In Progress, save a progress note and show dated/timed history while retaining earlier entries.
- A way to mark a job Completed with a non-blank completion note. Reject blank completion attempts without losing the earlier status, notes or history.
- Save jobs, their fields, status, notes and history across a page refresh. Browser local storage is sufficient; a hosted database is not required.
- Display typed descriptions and notes as plain text, including literal HTML-looking characters. Do not interpret them as HTML.

## Scope and data

- Use fictional people and care data only. Meadow House is the dummy house name.
- The core app needs no paid service, LLM API key, user account system or particular framework.
- A deployed demo is optional. Your public GitHub repository must contain the source needed to run your app; a short README with running instructions is recommended.
- Focus on the published behaviour below. Extra features do not add functional marks.

## How the 100 marks work

- **Functional checks: 80 marks.** There are ten published tests, worth 8 marks each. A test earns 8 when the complete expected behaviour is demonstrated, or 0 when it is demonstrated to fail. There are no partial marks within a functional test.
- **Human UI review: 20 marks.** The twenty checks at the end are worth 1 mark each when met and 0 when not met.
- A setup or infrastructure problem that prevents a test from running needs review; it is not automatically scored as a functional failure.
- The examples below show the required behaviour. Equivalent fictional inputs may be used to check the same published rules; no additional features are required.
- Both sessions are ranked together within each challenge. Three teams per challenge are shortlisted, including ties at the functional cutoff. Organisers review UI marks and any close contenders before confirming the final ranking.

## Functional judging tests — 80 marks

### 1. Valid repair report — 8 marks

**Do:** Submit Garden fence damaged, reporter Alex Morgan, priority Urgent.

**Pass when:** A distinct New job shows automatic unique ID, date, Meadow House, description, reporter and Urgent priority.

### 2. Description required — 8 marks

**Do:** Try a blank description, then spaces only.

**Pass when:** Neither attempt creates a job. Useful validation feedback appears.

### 3. Reporter required — 8 marks

**Do:** Try a blank reporter, then spaces only.

**Pass when:** Neither attempt creates a job. Useful validation feedback appears.

### 4. Priority retained — 8 marks

**Do:** Create one Normal and one Urgent report.

**Pass when:** Each retains its selected priority. Urgent is identified in words.

### 5. Independent jobs — 8 marks

**Do:** Create fence and kitchen-light jobs. Change only the fence.

**Pass when:** Distinct IDs. Kitchen-light fields, status, notes and history remain unchanged.

### 6. Progress and history — 8 marks

**Do:** Move fence to In Progress. Add Temporary barrier fitted.

**Pass when:** Shows In Progress and latest note. Adds dated/timed history and retains earlier entries.

### 7. Completion note required — 8 marks

**Do:** Attempt completion with an empty note and then spaces only.

**Pass when:** Both rejected with feedback. Earlier status, saved notes and history remain intact.

### 8. Complete a repair — 8 marks

**Do:** Complete with Fence repaired and checked.

**Pass when:** Shows Completed and the completion note. Earlier New and In Progress history remains.

### 9. Refresh persistence — 8 marks

**Do:** Save two jobs, one completed with history. Refresh.

**Pass when:** Both retain their own fields, status, notes and history.

### 10. Typed text stays plain — 8 marks

**Do:** Enter literal `<b>check gate</b>` in a report and note.

**Pass when:** Literal characters display plainly without HTML interpretation or execution.

## Human UI checklist — 20 marks

Each item below earns exactly 1 mark if met. A judge records a met/not-met decision for all twenty items; there are no additional UI categories.

### Workflow — 5 marks

- [ ] Find the main action within 10 seconds without a hint. **(1 mark)**
- [ ] Find a record or suggestion within 30 seconds. **(1 mark)**
- [ ] Find update or Accept/Ignore actions within 30 seconds. **(1 mark)**
- [ ] Identify saved outcome or original/reviewed versions within 20 seconds. **(1 mark)**
- [ ] Complete core tasks without coaching or source inspection. **(1 mark)**

### Readability — 5 marks

- [ ] At 1440 × 900, no clipping, overlap or page-level horizontal scrolling. **(1 mark)**
- [ ] At 390 × 844, required content remains reachable without page-level horizontal scrolling. **(1 mark)**
- [ ] Main text, labels and actions at least 14px; secondary instructions at least 12px. **(1 mark)**
- [ ] Consistent action names and distinguishable controls. **(1 mark)**
- [ ] A 200-character description/note and its feedback remain fully readable. **(1 mark)**

### Feedback — 5 marks

- [ ] Clear creation confirmation. **(1 mark)**
- [ ] Validation explains the error and preserves valid input. **(1 mark)**
- [ ] Progress updates clearly confirm the saved result. **(1 mark)**
- [ ] Urgent priority is conveyed in words. **(1 mark)**
- [ ] Completed status and completion explanation are clear. **(1 mark)**

### Accessibility — 5 marks

- [ ] Every control has an accessible name; placeholder alone is insufficient. **(1 mark)**
- [ ] Core tasks work by keyboard without a trap. **(1 mark)**
- [ ] Keyboard focus is visible on main controls. **(1 mark)**
- [ ] Text contrast at least 4.5:1; large text at least 3:1. **(1 mark)**
- [ ] Errors are associated with inputs; updates announced or focus moves to a named result. **(1 mark)**

## Submit your work

- Open [the submission portal](https://omegalifedigital.uk/submissions/) and choose the correct challenge.
- Teams have 4–6 students. Provide the team details, one or more contact emails separated by commas, your session and your public GitHub repository.
- The portal records the GitHub commit automatically. You do not need to enter a Commit SHA.
- A hosted demo, running notes, three-test notes and AI-tools notes are optional form fields.
- Code freeze is **12:30 UK time for the morning session** and **16:30 UK time for the afternoon session**, on 19 October 2026.
- Keep the private submission receipt/edit code. Use it if you need to update your repository submission before the relevant code freeze.
- Keep real care records, passwords and API keys out of your app and repository. Understand and test the code you submit.

The functional steps, expected results, marks and human UI checks in this file are generated from the same rubric used by the judging system.
