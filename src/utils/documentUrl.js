export function isCloudinaryUrl(url) {
  return typeof url === 'string' && /^https?:\/\//i.test(url) && url.includes('cloudinary.com');
}

export function extractCloudinaryPublicId(url) {
  if (!isCloudinaryUrl(url)) return null;

  try {
    const match = url.match(/\/upload(?:\/v\d+)?\/(.+)$/i);
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

export function normalizeCloudinaryDocumentUrl(filePath) {
  if (!filePath || typeof filePath !== 'string') return filePath;

  if (!isCloudinaryUrl(filePath)) return filePath;

  const normalized = filePath.replace('/image/upload/', '/raw/upload/');
  const hasFileExtension = /\.(pdf|PDF)(?:\?|$)/.test(normalized);
  if (!hasFileExtension) return normalized;

  return normalized;
}

export function resolveDocumentUrl(baseUrl, filePath) {
  if (!filePath) return '#';
  if (/^https?:\/\//i.test(filePath)) return normalizeCloudinaryDocumentUrl(filePath);

  const cleanBase = (baseUrl || '').replace(/\/$/, '');
  const cleanPath = filePath.startsWith('/') ? filePath : `/${filePath}`;
  return `${cleanBase}${cleanPath}`;
}
