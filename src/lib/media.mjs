export function projectThumb(src = '') {
  return String(src).replace('/images/projects/', '/images/projects/thumbs/');
}

/** Retina-safe sources: compact thumb + full screenshot. */
export function projectSrcSet(src = '') {
  const full = String(src || '');
  if (!full) return '';
  const thumb = projectThumb(full);
  return `${thumb} 640w, ${full} 1100w`;
}
