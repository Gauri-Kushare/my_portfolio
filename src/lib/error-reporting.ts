export function reportError(error: unknown, context: Record<string, unknown> = {}) {
  if (typeof console !== "undefined" && console.error) {
    console.error("[Runtime Error]", error, context);
  }
}
