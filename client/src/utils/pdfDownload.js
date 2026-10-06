// PDF endpoints need the auth header (the token lives in localStorage), so
// files are fetched as blobs and saved through a temporary object URL.
export async function downloadPdf(request, fallbackName = 'invoice.pdf') {
  const res = await request();
  const disposition = res.headers?.['content-disposition'] || '';
  const fileName = /filename="?([^";]+)"?/i.exec(disposition)?.[1] || fallbackName;
  const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  return fileName;
}

// A failed blob request carries its JSON error body as a Blob.
export async function apiErrorMessage(err, fallback = 'Something went wrong. Please try again.') {
  const data = err?.response?.data;
  if (data instanceof Blob) {
    try {
      return JSON.parse(await data.text()).message || fallback;
    } catch {
      return fallback;
    }
  }
  return data?.errors?.[0]?.message || data?.message || fallback;
}
