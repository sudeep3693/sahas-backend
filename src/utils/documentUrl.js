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

export function resolveDocumentUrl(baseUrl, filePath) {
  if (!filePath) return '#';
  if (/^https?:\/\//i.test(filePath)) return filePath;

  const cleanBase = (baseUrl || '').replace(/\/$/, '');
  const cleanPath = filePath.startsWith('/') ? filePath : `/${filePath}`;
  return `${cleanBase}${cleanPath}`;
}
