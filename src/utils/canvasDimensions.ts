/**
 * Computes optimal canvas dimensions for a given image,
 * preserving the image's natural aspect ratio and fitting it within
 * a max size constraint.
 *
 * @param naturalWidth  - natural pixel width of the image
 * @param naturalHeight - natural pixel height of the image
 * @param maxWidth      - maximum allowed canvas width (default: 480)
 * @param maxHeight     - maximum allowed canvas height (default: 860)
 */
export function getCanvasDimensions(
  naturalWidth: number,
  naturalHeight: number,
  maxWidth = 480,
  maxHeight = 860
): { width: number; height: number } {
  if (!naturalWidth || !naturalHeight) {
    // Fallback: portrait 9:16
    return { width: 450, height: 800 };
  }

  const aspectRatio = naturalWidth / naturalHeight;

  let width = maxWidth;
  let height = Math.round(width / aspectRatio);

  if (height > maxHeight) {
    height = maxHeight;
    width = Math.round(height * aspectRatio);
  }

  return { width, height };
}

/**
 * Returns a human-readable aspect ratio string, e.g. "9:16" or "16:9"
 */
export function getAspectRatioLabel(width: number, height: number): string {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const d = gcd(width, height);
  return `${width / d}:${height / d}`;
}
