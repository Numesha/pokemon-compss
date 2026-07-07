const CACHE_NAME = "pokesuri-compass-v1";

const APP_SHELL = [
  "./",
  "./index.html",
  "./public/manifest.json",
  "./public/icon3.png",
  "./public/master.json",
  "./src/styles.css",
  "./src/app.js",
  "./src/utils/html.js",
  "./src/master/masterLoader.js",
  "./src/master/masterMapper.js",
  "./src/pages/DexPage.js",
  "./src/pages/HomePage.js",
  "./src/pages/IslandPage.js",
  "./src/pages/PokemonPage.js",
  "./src/pages/RolePage.js",
  "./src/pages/SettingsPage.js",
  "./src/pages/TodoPage.js",
  "./src/pages/UnsetListPage.js",
  "./src/services/goalService.js",
  "./src/services/roleProgressService.js",
  "./src/services/roleService.js",
  "./src/services/roleViewService.js",
  "./src/services/speciesRoleCandidateService.js",
  "./src/services/speciesSettingService.js",
  "./src/services/todoCandidateMapper.js",
  "./src/services/todoGroupService.js",
  "./src/services/todoService.js",
  "./src/services/unsetListService.js",
  "./src/services/userDataBackupService.js",
  "./src/stores/goalStore.js",
  "./src/stores/indexedDb.js",
  "./src/stores/roleStore.js",
  "./src/stores/speciesRoleCandidateStore.js",
  "./src/stores/speciesSettingStore.js",
  "./src/stores/todoStore.js",
  "./src/stores/userPokemonStore.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match("./index.html")))
  );
});
