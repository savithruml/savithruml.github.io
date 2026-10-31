/* Offline + fast repeat loads. Music is left to the browser (range requests). */
var V='sn-v2',HOSTS=['fonts.googleapis.com','fonts.gstatic.com'];
self.addEventListener('install',function(e){
  e.waitUntil(caches.open(V).then(function(c){return c.addAll(['./','assets/favicon.svg','assets/swing.webp'])}).then(function(){return self.skipWaiting()}));
});
self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k!==V}).map(function(k){return caches.delete(k)}))}).then(function(){return self.clients.claim()}));
});
function put(req,res){
  if(res&&(res.ok||res.type==='opaque')){var cp=res.clone();caches.open(V).then(function(c){c.put(req,cp)})}
  return res;
}
self.addEventListener('fetch',function(e){
  var r=e.request,u=new URL(r.url);
  if(r.method!=='GET'||r.headers.has('range')||/\.mp3$/.test(u.pathname))return;
  if(u.origin!==self.location.origin&&HOSTS.indexOf(u.hostname)<0)return;
  if(r.mode==='navigate'){
    /* network first (3.5s), else the cached copy: slow data still opens */
    e.respondWith(new Promise(function(ok){
      var done=false;
      function fall(){caches.match('./',{ignoreSearch:true}).then(function(m){if(m&&!done){done=true;ok(m)}})}
      var t=setTimeout(fall,3500);
      fetch(r).then(function(res){clearTimeout(t);if(done)return;done=true;put(new Request('./'),res.clone());ok(res)}).catch(function(){clearTimeout(t);fall();
        setTimeout(function(){if(!done){done=true;ok(new Response('Offline',{status:503}))}},300)});
    }));
    return;
  }
  e.respondWith(caches.match(r).then(function(m){
    var net=fetch(r).then(function(res){return put(r,res)}).catch(function(){return m});
    return m||net;
  }));
});
