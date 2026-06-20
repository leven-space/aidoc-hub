export async function triggerFileDownload(url: string, filename: string) {
  const token = localStorage.getItem('accessToken');
  const response = await fetch(url, {
    credentials: 'include',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    let message = 'Download failed';
    try {
      const data = await response.json();
      message = data.message || message;
    } catch {
      // ignore non-json error body
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}
