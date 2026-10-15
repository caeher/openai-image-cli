import { describe, expect, it } from "vitest";
import { PROMPT_TEMPLATES } from "../../src/templates/prompt-templates.js";
import { STYLE_TEMPLATES } from "../../src/templates/style-templates.js";
import { PromptEngine, PROMPT_SECTIONS, normalizeVarKey } from "../../src/services/prompting/engine.js";
import { ModelRegistry } from "../../src/services/models/registry.js";
import { CapabilityError, UsageError } from "../../src/core/errors/errors.js";

const EXPECTED_TEMPLATE_IDS = [
  "product",
  "advertising",
  "ecommerce",
  "real-estate",
  "interiors",
  "architecture",
  "furniture",
  "portraits",
  "children",
  "book-covers",
  "signs",
  "posters",
  "social",
  "icons",
  "concept-art",
  "games",
  "characters",
  "infographics",
  "education",
  "diagrams",
  "storyboards",
  "mockups",
  "packaging",
  "brands",
];

const EXPECTED_STYLE_PHRASES: Record<string, string> = {
  photorealistic: "Fotografía realista, detalle óptico creíble, sin aspecto de ilustración.",
  cinematic: "Luz de cine, profundidad y encuadre narrativo.",
  anime: "Dibujo anime, línea clara y color plano controlado.",
  manga: "Tinta de manga, trama y contraste gráfico.",
  watercolor: "Acuarela sobre papel, bordes húmedos.",
  "oil-painting": "Óleo con pincelada visible.",
  "pencil-sketch": "Boceto a lápiz, grafito sobre papel.",
  "pixel-art": "Pixel art con píxel cuadrado y paleta limitada.",
  "3d-render": "Render 3D con materiales definidos.",
  clay: "Modelado de arcilla o plastilina.",
  minimalist: "Composición mínima y mucho espacio vacío.",
  isometric: "Proyección isométrica coherente.",
  architectural: "Dibujo de arquitectura con líneas precisas.",
  editorial: "Fotografía editorial, estilo de revista.",
  "product-photography": "Fotografía de producto de estudio.",
  vintage: "Emulsión antigua, color envejecido, sin fecha falsa impresa.",
  cyberpunk: "Ciudad nocturna, neón y humedad.",
  fantasy: "Fantasía ilustrada, un foco mágico.",
  "technical-illustration": "Ilustración técnica, corte claro y etiquetas solo si se piden.",
  infographic: "Gráfico informativo, bloques ordenados.",
};

describe("prompt engine", () => {
  const engine = new PromptEngine();
  const model = new ModelRegistry().resolve("gpt-image-2.5-flare");

  it("lists 24 templates in plan order with exact objectives", () => {
    expect(PROMPT_TEMPLATES.map((t) => t.id)).toEqual(EXPECTED_TEMPLATE_IDS);
    for (const template of PROMPT_TEMPLATES) {
      const expected = PROMPT_TEMPLATES.find((t) => t.id === template.id);
      expect(template.defaultObjective).toBe(expected?.defaultObjective);
    }
  });

  it("has 20 style phrases character-for-character", () => {
    expect(Object.keys(STYLE_TEMPLATES)).toHaveLength(20);
    for (const [id, phrase] of Object.entries(EXPECTED_STYLE_PHRASES)) {
      expect(STYLE_TEMPLATES[id]).toBe(phrase);
    }
  });

  it("orders all 22 section labels", () => {
    const fields: Record<string, string> = {};
    for (const section of PROMPT_SECTIONS) {
      fields[section.key] = section.key;
    }
    const text = engine.create(fields);
    const labels = PROMPT_SECTIONS.map((s) => s.label);
    let last = -1;
    for (const label of labels) {
      const idx = text.indexOf(label);
      if (idx >= 0) {
        expect(idx).toBeGreaterThan(last);
        last = idx;
      }
    }
    expect(PROMPT_SECTIONS).toHaveLength(22);
  });

  it("maps template vars including aliases", () => {
    const built = engine.build({
      fields: {},
      vars: { "color-palette": "azul", "camera-angle": "cenital", subject: "taza" },
    });
    expect(built.text).toContain("Paleta: azul");
    expect(built.text).toContain("Ángulo de cámara: cenital");
    expect(built.text).toContain("Sujeto: taza");
    expect(() =>
      engine.build({ fields: {}, vars: { "no-existe": "x" } }),
    ).toThrow(UsageError);
  });

  it("normalizeVarKey covers section keys", () => {
    expect(normalizeVarKey("environment")).toBe("environment");
    expect(normalizeVarKey("text-to-render")).toBe("textToRender");
  });

  it("validates length", () => {
    const validation = engine.validate("x".repeat(32_001), model);
    expect(validation.ok).toBe(false);
  });

  it("optimize without model throws capability error", async () => {
    await expect(engine.optimize("hi", "", new AbortController().signal)).rejects.toBeInstanceOf(
      CapabilityError,
    );
  });
});
