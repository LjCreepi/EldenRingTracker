/** GET `url` as JSON, throwing with the status on a non-OK response. */
async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

/** Every entry of a Fan API `resource` collection at `apiBase`, following `limit`/`page`. */
export async function getAll(apiBase, resource) {
  const out = [];
  for (let page = 0; ; page++) {
    const { data } = await getJson(`${apiBase}/${resource}?limit=100&page=${page}`);
    if (!data?.length) break;
    out.push(...data);
    if (data.length < 100) break;
  }
  console.log(`  ${resource}: ${out.length}`);
  return out;
}
