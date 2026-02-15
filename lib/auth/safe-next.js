// @ts-check

/**
 * @param {unknown} value
 */
export function toSafeNextPath(value) {
  if (typeof value !== "string") {
    return "/tasks";
  }

  const trimmed = value.trim();

  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return "/tasks";
  }

  if (trimmed.includes("\\") || trimmed.includes("\n") || trimmed.includes("\r")) {
    return "/tasks";
  }

  return trimmed;
}
