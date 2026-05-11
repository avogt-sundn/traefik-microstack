# Counterargument: The Case Against One Screen

*This document argues against the single-screen rationale from a traditional web application design perspective. It is written as a steelman of the opposing position — not as a rejection of the design, but as a discipline: every strong design decision should survive its best-case opposition.*

---

## 1. The comparison set is rigged

The rationale compares the Sachbearbeiter dashboard to Bloomberg Terminal, Vim, and Bash. These are tools designed for a narrow class of highly trained specialists who spend years building muscle memory. A Bloomberg analyst trains for months before they are productive. Vim famously has a joke that its hardest feature is quitting. Bash requires knowing command names before you can discover anything.

The IHK Carnet clerk is not this user. They are a professional in their domain — not a professional in their interface. The correct comparison set is not "power tools for specialists" but "professional tools for domain experts who should not need to learn a new operating paradigm": PeopleSoft, Salesforce, SAP Fiori, Microsoft Dynamics. These systems are ugly and sometimes slow. They are also what every clerk in a German Kammer can use on day one without onboarding to a new interaction vocabulary.

The rationale dismisses the SAP comparison by pointing to navigation costs. But the lesson from SAP Fiori (SAP's own redesign of SAP GUI) was not "remove all navigation" — it was "make navigation predictable, fast, and consistent." Fiori kept pages. It fixed the pages.

---

## 2. The web has native navigation primitives. Abandoning them has costs.

The URL is the most powerful information unit in the history of computing. A URL is a bookmark, a share target, a debug artifact, a test fixture, a support ticket attachment, and a browser history entry. A single-screen application with no URL-per-entity throws all of this away.

Concrete costs:

- **A clerk cannot share a Vorgang with a colleague** by copying the address bar. They must describe it in words or use a separate reference number.
- **A supervisor cannot audit what a clerk was looking at** at 14:23 on Tuesday from browser history.
- **Support cannot reproduce a bug report** from a URL. They need a full session replay or a verbal recreation.
- **Automated testing cannot target a specific entity** with a stable address. Every test must navigate from the root command field, making tests brittle against token resolution changes.
- **The browser back button does nothing useful.** Every clerk will press it instinctively, get thrown to the previous page (login, or wherever they came from), and lose their current context — the exact loss of context the design claims to prevent.

The rationale treats URL-based navigation as synonymous with page navigation and context loss. It is not. A well-designed SPA can update the URL on every state transition, preserving full browser history semantics, without ever doing a full page reload or losing screen state.

---

## 3. Discoverability is a first-order requirement, not a novice problem

The rationale acknowledges novice users but treats discoverability as a temporary concern: "A novice clerk types `günther` and sees all available actions listed." This assumes the novice knows to type `günther`. It assumes they know that the command field is the entry point to everything. It assumes the suggestion list is comprehensive enough to surface the right action for a situation they have never encountered.

Traditional navigation solves a different problem: **the user who does not know what they do not know.** A menu labeled "Carnets → Beantragen" tells a user that Carnets can be applied for, before they think to ask. A command field that suggests `carnet beantragen` only helps after the user has typed `carnet` — which requires knowing the concept exists.

This is the difference between **navigation as instruction** and **navigation as overhead**. The rationale only addresses the overhead case. For a new hire at a Kammer, navigation as instruction may dominate their experience for the first two to four weeks — the period during which the system either builds competence or destroys confidence.

The research citation (Cooper's "perpetual intermediates") supports designing for proficient users. It does not support abandoning the novice path. Cooper's argument is that systems optimized exclusively for novices frustrate experts. It is not an argument for systems that make the novice path invisible.

---

## 4. The "re-orientation tax" is solved by modern SPA architecture, not by eliminating pages

The re-orientation problem the rationale describes is real — in 2005. It is the problem of full-page HTTP navigation, where each click triggers a server round-trip and a blank screen flash while the next page loads. Modern single-page applications solved this problem at the framework level. React Router, Angular Router, and Vue Router maintain DOM state across route transitions. The user sees an instant layout shift, not a blank page. The scroll position, the input focus, and the peripheral context can all be preserved.

A well-implemented Angular SPA with:
- `RouteReuseStrategy` to cache component state
- Skeleton loaders that match the incoming layout
- Shared persistent layout components (scope bar, notification tray) outside the router outlet

...provides the peripheral stability the rationale promises, with URLs, with back-button support, and with the full discoverability of visible navigation.

The rationale conflates "page navigation" (the 2005 model) with "context loss" (the actual problem). Modern SPAs decouple them. The choice is not "one screen vs. context loss" — it is "one screen vs. multi-route SPA with persistent layout."

---

## 5. The keyboard-first model excludes a real segment of the target user population

The rationale's interaction model is: type tokens, resolve entities, execute actions. This is a keyboard-first model. It is efficient for the 20% of clerks who have developed command vocabulary. For the other 80%:

- Users with motor or cognitive disabilities who rely on screen readers navigate by HTML landmarks, headings, and ARIA roles. A custom token-resolution UI is a bespoke component that screen reader software has never seen and cannot interpret without custom implementation work that will be done incorrectly.
- Users who are comfortable with mouse-primary interaction cannot "click to" an action — they must first discover that the command field exists, then discover the token vocabulary. There is no visible affordance for "what can I do here?" other than the command field itself.
- Users who do not touch-type will find the token model slower than a structured form with tab stops, because they must look at the keyboard while typing and lose the visual confirmation of what they typed.

The German public sector has explicit accessibility requirements under BITV 2.0 (Barrierefreie-Informationstechnik-Verordnung), which implements WCAG 2.1 AA. A command-palette-primary interface faces a steeper BITV compliance path than a structured form with labeled inputs, proper heading hierarchy, and standard navigation patterns.

---

## 6. Zone 3 conflates two different time-horizon needs in one spatial slot

The rationale puts both the Vorgangsstrahl (shared, append-only, auditable events) and the Arbeitsstrahl (private, session-local command history) in Zone 3. These have different update rates, different audiences (shared vs. private), different purposes (compliance record vs. personal recall), and different interaction models (read-only vs. navigable/replayable).

Placing them in the same zone under a shared "stream" metaphor creates ambiguity: the clerk sees a stream entry — is this something that happened to the Vorgang (visible to their colleagues, written to the audit log) or something they did in their session (private, ephemeral)? The distinction matters for compliance. In a regulated environment, conflating audit log with browser history is a design error, not a design elegance.

Traditional detail-view design solves this with explicit separation: an "Activity" tab for the shared audit log and a browser-native history model (back/forward) for personal navigation. The boundary between the two is the browser's own navigation metaphor — universally understood, zero training required.

---

## 7. "No detail pages" is a constraint that collapses under real entity complexity

The rationale asserts: "There is no 'partner detail view' or 'Carnet detail view' as a separate screen. All detail is shown inline in Zone 2 (command resolution) or Zone 3 (stream entries)."

A Carnet application in the ATA Carnet system includes:
- Cover page with holder, issuing Kammer, validity period, guarantee amount
- General list of goods with descriptions, quantities, values, and customs tariff numbers
- Up to 6 exportation counterfoils and vouchers
- Up to 6 importation counterfoils and vouchers
- Up to 6 transit counterfoils and vouchers
- Discharge annotations per country
- Extension endorsements
- Claim records against the guarantee

This is not "detail shown inline in Zone 2." This is a structured document with 20–40 fields per section, cross-referenced across sections, with version history and country-specific annotations. Attempting to render this inside a panel that "expands inside Zone 2 without ever replacing the clerk's workspace" produces a panel that is either unreadably small or so large that it *is* a page — but a page without a URL, without a back button, and without the structural benefits of a dedicated route.

The wizard replacement hierarchy acknowledges this case with the "Full-width panel (Zone 3 consumed)" pattern — which is, by any other name, a modal that occupies most of the viewport. At that point, the "single screen" claim is nominal. The clerk is on a different visual state with no URL, no history, and no way to share what they are looking at.

---

## 8. The empirical foundation is thin

The rationale cites Miller (1956), Carroll & Rosson (1987), Raskin (2000), and Nielsen (1994). These are foundational HCI texts. They are also 25–70 years old. The user research specifically on German Kammer clerks using Carnet administration software is: zero citations.

The Bloomberg Terminal comparison is appealing but misleading. Bloomberg users are selected for financial expertise and keyboard comfort, trained on the terminal specifically, and paid compensation that reflects that specialization. They also use Bloomberg alongside a web browser, multiple monitors, and other software — the terminal is one tool among many, not the single interface for all work.

The Superhuman comparison (email processing speed doubles) cites a product's own marketing claim, not an independent study. Superhuman's speed advantage comes from keyboard shortcuts, pre-fetched content, and a curated user base — not from its lack of folder navigation.

A traditional web designer would insist: before committing to a novel interaction model for a compliance-critical administrative tool, run a usability study with five actual IHK Carnet clerks. Give three of them the command-palette interface and two of them a well-designed Fiori-style SPA. Measure error rate, task completion time, and training time. The theoretical arguments are interesting. The empirical question is open.

---

## What the rationale proves vs. what it claims

| Claim | What is actually proven |
|---|---|
| Navigation causes re-orientation tax | True for full-page HTTP navigation. Not proven for modern SPA routing with persistent layout. |
| One screen eliminates re-orientation | True if the single screen is stable and the user knows how to use it. Unproven for the novice path. |
| Command palette scales from novice to expert | True for tools where the user already knows the domain vocabulary. Unproven for first-week clerks. |
| Complex forms work without pages | Demonstrated in principle with inline expansion. Not validated with actual Carnet document complexity. |
| Zone 3 as Kassenbuch | Strong metaphor. Does not address the private/shared distinction that matters for compliance. |

---

## The legitimate core

None of this argues that the single-screen rationale is wrong. It argues that the rationale is incomplete and that the comparison set flatters the conclusion. The legitimate core of the argument is:

- Peripheral stability (fixed zones) is valuable.
- Navigation overhead in legacy enterprise tools is real and costly.
- A command palette can serve both novice and expert users if the suggestion layer is well-designed.
- The Kassenbuch metaphor is pedagogically powerful for German-speaking clerks.

These points survive scrutiny. The stronger claim — that a single screen is the *only* architecture that achieves them, and that URL-based page navigation is categorically incompatible with them — does not.

A traditional web designer's recommendation: take the peripheral stability, the Kassenbuch metaphor, and the command palette. Implement them in a multi-route Angular SPA where each entity type has a stable URL, the scope bar and stream zone persist across route transitions, and the command field is the primary (but not only) entry point. Keep the browser as an ally. The design goal is zero re-orientation tax — not zero URLs.
