export async function loadMaster(path = "public/master.json") {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`master.json load failed: HTTP ${response.status}`);
  }
  return response.json();
}
