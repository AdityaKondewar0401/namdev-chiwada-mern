// Triggers a browser save for an axios blob response (PDF/CSV downloads
// authenticated via the shared axios instance — see api.js's comment on
// why a plain <a href> can't be used here). Revokes the object URL right
// after the click so it doesn't leak for the life of the page.
export function downloadBlobResponse(response, filename) {
  const url = window.URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
