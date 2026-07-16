import type { RoadmapExtraction } from "@common/utils/groqExtraction";

import {
  formatRoadmapContext,
  formatSimulationContext,
  formatAgendaContext,
  formatNotesContext,
  wrapContextForPrompt,
  MAX_CHAT_CONTEXT_CHARS,
} from "./chat-context";

describe("chat-context formatters", () => {
  describe("formatRoadmapContext", () => {
    it("includes the score, summary, topics and talking points", () => {
      const out = formatRoadmapContext(
        { company_name: "Datadog", job_title: "SRE" },
        {
          match_score: 72,
          summary: "Solid fit",
          topics: [
            {
              title: "Kubernetes",
              priority: "HIGH",
              rationale: "core gap",
              gap: true,
            },
          ],
          talking_points: [{ mission: "on-call", angle: "ran pager duty" }],
        },
      );
      expect(out).toContain("SRE at Datadog");
      expect(out).toContain("72/100");
      expect(out).toContain("Solid fit");
      expect(out).toContain("Kubernetes");
      expect(out).toContain("[gap]");
      expect(out).toContain("on-call");
    });
  });

  describe("formatSimulationContext", () => {
    it("labels turns by speaker and surfaces the score", () => {
      const out = formatSimulationContext(
        { company_name: "Datadog", job_title: "SRE" },
        { status: "COMPLETED", score: 80, feedback: "Good pacing" },
        [
          { who_stated: "ai", content: "Tell me about a failure." },
          { who_stated: "user", content: "We had an outage…" },
        ],
        75,
      );
      expect(out).toContain("Interviewer: Tell me about a failure.");
      expect(out).toContain("Candidate: We had an outage");
      expect(out).toContain("80/100");
      expect(out).toContain("75/100");
    });
  });

  describe("formatAgendaContext", () => {
    it("lists upcoming events", () => {
      const out = formatAgendaContext([
        {
          title: "Datadog interview",
          start_at: new Date("2026-08-01T09:00:00.000Z"),
          location: "Zoom",
        } as any,
      ]);
      expect(out).toContain("Datadog interview");
      expect(out).toContain("Zoom");
    });

    it("states clearly when the agenda is empty", () => {
      expect(formatAgendaContext([])).toMatch(/no upcoming events/i);
    });
  });

  describe("formatNotesContext", () => {
    it("strips HTML from note previews", () => {
      const out = formatNotesContext(
        [{ title: "Prep", content: "<p>Ask about <b>on-call</b></p>" }],
        "application",
      );
      expect(out).toContain("Prep");
      expect(out).toContain("Ask about on-call");
      expect(out).not.toContain("<p>");
    });

    it("distinguishes the empty message by scope", () => {
      expect(formatNotesContext([], "application")).toMatch(
        /no notes for this application/i,
      );
      expect(formatNotesContext([], "all")).toMatch(/no notes yet/i);
      expect(formatNotesContext([], "note")).toMatch(/note is empty/i);
    });

    it("grounds a single open note on its full body, not a preview", () => {
      const body = "z".repeat(600);
      const out = formatNotesContext(
        [{ title: "Datadog prep", content: `<p>${body}</p>` }],
        "note",
      );

      expect(out).toContain("Datadog prep");
      // The list scope truncates each note at 200 chars; the open note must not.
      expect(out).toContain(body);
      expect(out).not.toContain("<p>");
    });
  });

  describe("truncation + wrapping", () => {
    it("caps a block that overruns the max length and marks it truncated", () => {
      // The roadmap block is unbounded in topic count, so it is the surface
      // that can actually overrun the cap — notes are pre-sliced to 20 short
      // previews and never get near it.
      const roadmap = {
        match_score: 70,
        summary: "s",
        topics: Array.from({ length: 200 }, (_, i) => ({
          priority: "high",
          gap: false,
          title: `Topic ${i}`,
          rationale: "y".repeat(100),
        })),
        talking_points: [],
      } as unknown as RoadmapExtraction;

      const out = formatRoadmapContext({ job_title: "Dev" }, roadmap);

      expect(out.length).toBeLessThanOrEqual(MAX_CHAT_CONTEXT_CHARS + 20);
      expect(out).toContain("…(truncated)");
    });

    it("leaves a block under the cap untouched", () => {
      const out = formatNotesContext([{ title: "N", content: "short" }], "all");

      expect(out).not.toContain("…(truncated)");
    });

    it("wraps a block under a context heading and returns '' for null", () => {
      expect(wrapContextForPrompt("hello")).toContain("Current page context");
      expect(wrapContextForPrompt(null)).toBe("");
    });
  });
});
