import ar from "./ar.json";

type Dict = typeof ar;

function resolve(dict: Dict, path: string): string {
  const value = path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in acc) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, dict);
  return typeof value === "string" ? value : path;
}

export function t(path: string, vars?: Record<string, string>): string {
  let text = resolve(ar, path);
  if (vars) {
    for (const [key, value] of Object.entries(vars)) {
      text = text.replace(`{${key}}`, value);
    }
  }
  return text;
}
