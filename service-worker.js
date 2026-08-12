const CACHE_NAME="ligao-hhims-v12";
const APP_SHELL=["./","./index.html","./styles.css","./app.js","./config.js","./manifest.webmanifest","./icon-192.png","./icon-512.png"];

self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate",event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET") return;
  const url=new URL(event.request.url);

  if(url.hostname.includes("supabase.co")){
    event.respondWith(fetch(event.request));
    return;
  }

  if(url.origin===self.location.origin){
    event.respondWith(
      caches.match(event.request).then(cached=>{
        const fresh=fetch(event.request).then(response=>{
          caches.open(CACHE_NAME).then(cache=>cache.put(event.request,response.clone()));
          return response;
        }).catch(()=>cached);
        return cached||fresh;
      })
    );
    return;
  }

  event.respondWith(fetch(event.request).catch(()=>caches.match(event.request)));
});
