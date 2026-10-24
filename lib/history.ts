/** Updates the URL without a server round trip; Next keeps useSearchParams in step. */
export function navigate(search: URLSearchParams, replace = false) {
  const query = search.toString();
  const url = query ? `?${query}` : window.location.pathname;
  if (replace) window.history.replaceState(null, "", url);
  else window.history.pushState(null, "", url);
}
