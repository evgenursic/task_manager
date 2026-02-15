/**
 * @param {Date | null | undefined} value
 */
export function formatEmailDate(value) {
  if (!value) {
    return "N/A";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(value);
}

/**
 * @param {Date | null | undefined} value
 */
export function formatEmailDateTime(value) {
  if (!value) {
    return "No due date";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}
