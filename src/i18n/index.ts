import { readStored, writeStored } from "../core/storage";
import { en } from "./en";
import { es } from "./es";

// The shape of en.ts with every text widened to string, for the other languages to fill.
type Shape<T> = {
  readonly [K in keyof T]: T[K] extends string ? string : Shape<T[K]>;
};
export type Messages = Shape<typeof en>;

// Every dotted path to a single text, so a misspelled key fails the typecheck.
type TextPath<T> = {
  [K in keyof T & string]: T[K] extends string ? K : `${K}.${TextPath<T[K]>}`;
}[keyof T & string];
export type MessagePath = TextPath<Messages>;

export const LANGUAGES = ["en", "es"] as const;
export type Language = (typeof LANGUAGES)[number];

const MESSAGES: Record<Language, Messages> = { en, es };
const LANGUAGE_KEY = "forkfling.lang";

let current: Language = "en";

// From ?lang=, then the saved choice, else English.
export function detectLanguage(search: string, saved: string | null): Language {
  const requested = new URLSearchParams(search).get("lang");
  return asLanguage(requested) ?? asLanguage(saved) ?? "en";
}

export function initLanguage(search: string): void {
  current = detectLanguage(search, readStored(LANGUAGE_KEY));
}

export function language(): Language {
  return current;
}

export function setLanguage(next: Language): void {
  current = next;
  writeStored(LANGUAGE_KEY, next);
}

// The text at a path in the current language, with {name} placeholders filled in.
export function t(
  path: MessagePath,
  params: Readonly<Record<string, string | number>> = {},
): string {
  const text = lookup(MESSAGES[current], path);
  return text.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}

function lookup(messages: Messages, path: string): string {
  let node: unknown = messages;
  for (const key of path.split(".")) {
    if (typeof node !== "object" || node === null || !(key in node)) break;
    node = Reflect.get(node, key);
  }
  if (typeof node !== "string") throw new Error(`No text at "${path}"`);
  return node;
}

function asLanguage(value: string | null): Language | undefined {
  return LANGUAGES.find((language) => language === value);
}
