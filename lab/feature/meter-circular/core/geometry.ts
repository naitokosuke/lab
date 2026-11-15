/**
 * The ring's geometry in the SVG's user units (its viewBox is `0 0 100 100`). The stylesheet
 * draws with these and the animation strokes the same circumference, so both read them here.
 */
export const center = 50;
export const strokeWidth = 20;
export const barBorderWidth = 1;

/** The stroke runs along this circle, so its outer edge, border included, meets the viewBox */
export const strokeRadius = center - (strokeWidth + barBorderWidth) / 2;
export const circumference = 2 * Math.PI * strokeRadius;
