export function generateProductId(existingCount) {
  const next = existingCount + 1;
  return String(next).padStart(4, "0");
}
