import {
  MAX_SIMULATION_CONTEXT_CHARS,
  buildSimulationContextFromApplication,
} from "./simulation-application-context";
import type { application } from "@entities/application.entity";

describe("buildSimulationContextFromApplication", () => {
  it("formats job offer and CV sections from an application row", () => {
    const app = {
      company_name: "Sopra Steria",
      job_title: "Développeur web",
      offer_url: "https://example.com/job/1",
      offer_details: {
        job_title: "Développeur web",
        company_name: "Sopra Steria",
        location: "Paris",
        required_skills: ["React", "TypeScript"],
        missions: [
          "Développer des interfaces",
          "Participer aux revues de code",
        ],
      },
      cv_details: {
        desired_job: "Développeur full-stack",
        resume: "5 ans d'expérience en développement web.",
        experiences: [
          {
            title: "Développeur frontend",
            company: "Acme",
            period: "2020 - 2024",
          },
        ],
        technical_skills: ["React", "Node.js"],
      },
    } as application;

    const context = buildSimulationContextFromApplication(app);

    expect(context).toContain("## Poste visé");
    expect(context).toContain("Développeur web");
    expect(context).toContain("Sopra Steria");
    expect(context).toContain("## Détails de l'offre");
    expect(context).toContain("React");
    expect(context).toContain("## CV du candidat");
    expect(context).toContain("5 ans d'expérience");
    expect(context).toContain("Développeur frontend @ Acme");
  });

  it("returns an empty string when no context is available", () => {
    const app = {
      company_name: null,
      job_title: null,
      offer_url: null,
      offer_details: null,
      cv_details: null,
    } as unknown as application;

    expect(buildSimulationContextFromApplication(app)).toBe("");
  });

  it("caps the context at the max length and appends a truncation marker", () => {
    const app = {
      company_name: "Acme",
      job_title: "Dev",
      offer_url: null,
      offer_details: null,
      cv_details: {
        resume: "x".repeat(MAX_SIMULATION_CONTEXT_CHARS + 5000),
      },
    } as unknown as application;

    const context = buildSimulationContextFromApplication(app);

    expect(context.length).toBeLessThanOrEqual(MAX_SIMULATION_CONTEXT_CHARS);
    expect(context).toContain(
      "[... contexte tronqué pour respecter la limite]",
    );
  });

  it("joins unrecognized object fields instead of emitting raw JSON", () => {
    const app = {
      company_name: null,
      job_title: null,
      offer_url: null,
      offer_details: null,
      cv_details: {
        experiences: [{ description: "A meaningful description" }],
      },
    } as unknown as application;

    const context = buildSimulationContextFromApplication(app);

    expect(context).toContain("A meaningful description");
    expect(context).not.toContain("{");
    expect(context).not.toContain('"description"');
  });
});
