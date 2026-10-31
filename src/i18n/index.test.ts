import { afterEach, describe, expect, it } from "vitest";
import { detectLanguage, setLanguage, t } from ".";
import { en } from "./en";
import { es } from "./es";

describe("detectLanguage", () => {
  it("prefers the URL, then the saved choice, then English", () => {
    expect(detectLanguage("?lang=es", "en")).toBe("es");
    expect(detectLanguage("", "es")).toBe("es");
    expect(detectLanguage("?lang=fr", null)).toBe("en");
  });
});

describe("t", () => {
  afterEach(() => setLanguage("en"));

  it("reads the current language", () => {
    expect(t("result.won")).toBe(en.result.won);
    setLanguage("es");
    expect(t("result.won")).toBe(es.result.won);
  });
});

describe("the translations", () => {
  // The typecheck already demands every key; this catches an empty text.
  it("never leave a text empty", () => {
    const texts = (node: object): string[] =>
      Object.values(node).flatMap((value) =>
        typeof value === "string" ? [value] : texts(value),
      );

    for (const messages of [en, es])
      for (const text of texts(messages)) expect(text.trim()).not.toBe("");
  });
});
