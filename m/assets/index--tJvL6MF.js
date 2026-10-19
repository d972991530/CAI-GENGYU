(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))n(s);new MutationObserver(s=>{for(const a of s)if(a.type==="childList")for(const r of a.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&n(r)}).observe(document,{childList:!0,subtree:!0});function e(s){const a={};return s.integrity&&(a.integrity=s.integrity),s.referrerPolicy&&(a.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?a.credentials="include":s.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function n(s){if(s.ep)return;s.ep=!0;const a=e(s);fetch(s.href,a)}})();var zn;(function(i){i.Unimplemented="UNIMPLEMENTED",i.Unavailable="UNAVAILABLE"})(zn||(zn={}));class ya extends Error{constructor(t,e,n){super(t),this.message=t,this.code=e,this.data=n}}const Hc=i=>{var t,e;return i?.androidBridge?"android":!((e=(t=i?.webkit)===null||t===void 0?void 0:t.messageHandlers)===null||e===void 0)&&e.bridge?"ios":"web"},Gc=i=>{const t=i.CapacitorCustomPlatform||null,e=i.Capacitor||{},n=e.Plugins=e.Plugins||{},s=()=>t!==null?t.name:Hc(i),a=()=>s()!=="web",r=u=>{const d=c.get(u);return!!(d?.platforms.has(s())||o(u))},o=u=>{var d;return(d=e.PluginHeaders)===null||d===void 0?void 0:d.find(f=>f.name===u)},l=u=>i.console.error(u),c=new Map,h=(u,d={})=>{const f=c.get(u);if(f)return console.warn(`Capacitor plugin "${u}" already registered. Cannot register plugins twice.`),f.proxy;const g=s(),_=o(u);let m;const p=async()=>(!m&&g in d?m=typeof d[g]=="function"?m=await d[g]():m=d[g]:t!==null&&!m&&"web"in d&&(m=typeof d.web=="function"?m=await d.web():m=d.web),m),w=(C,x)=>{var y,E;if(_){const I=_?.methods.find(N=>x===N.name);if(I)return I.rtype==="promise"?N=>e.nativePromise(u,x.toString(),N):(N,H)=>e.nativeCallback(u,x.toString(),N,H);if(C)return(y=C[x])===null||y===void 0?void 0:y.bind(C)}else{if(C)return(E=C[x])===null||E===void 0?void 0:E.bind(C);throw new ya(`"${u}" plugin is not implemented on ${g}`,zn.Unimplemented)}},A=C=>{let x;const y=(...E)=>{const I=p().then(N=>{const H=w(N,C);if(H){const V=H(...E);return x=V?.remove,V}else throw new ya(`"${u}.${C}()" is not implemented on ${g}`,zn.Unimplemented)});return C==="addListener"&&(I.remove=async()=>x()),I};return y.toString=()=>`${C.toString()}() { [capacitor code] }`,Object.defineProperty(y,"name",{value:C,writable:!1,configurable:!1}),y},M=A("addListener"),P=A("removeListener"),S=(C,x)=>{const y=M({eventName:C},x),E=async()=>{const N=await y;P({eventName:C,callbackId:N},x)},I=new Promise(N=>y.then(()=>N({remove:E})));return I.remove=async()=>{console.warn("Using addListener() without 'await' is deprecated."),await E()},I},T=new Proxy({},{get(C,x){switch(x){case"$$typeof":return;case"toJSON":return()=>({});case"addListener":return _?S:M;case"removeListener":return P;default:return A(x)}}});return n[u]=T,c.set(u,{name:u,proxy:T,platforms:new Set([...Object.keys(d),..._?[g]:[]])}),T};return e.convertFileSrc||(e.convertFileSrc=u=>u),e.getPlatform=s,e.handleError=l,e.isNativePlatform=a,e.isPluginAvailable=r,e.registerPlugin=h,e.Exception=ya,e.DEBUG=!!e.DEBUG,e.isLoggingEnabled=!!e.isLoggingEnabled,e},Vc=i=>i.Capacitor=Gc(i),ps=Vc(typeof globalThis<"u"?globalThis:typeof self<"u"?self:typeof window<"u"?window:typeof global<"u"?global:{}),ma=ps.registerPlugin;class jr{constructor(){this.listeners={},this.retainedEventArguments={},this.windowListeners={}}addListener(t,e){let n=!1;this.listeners[t]||(this.listeners[t]=[],n=!0),this.listeners[t].push(e);const a=this.windowListeners[t];a&&!a.registered&&this.addWindowListener(a),n&&this.sendRetainedArgumentsForEvent(t);const r=async()=>this.removeListener(t,e);return Promise.resolve({remove:r})}async removeAllListeners(){this.listeners={};for(const t in this.windowListeners)this.removeWindowListener(this.windowListeners[t]);this.windowListeners={}}notifyListeners(t,e,n){const s=this.listeners[t];if(!s){if(n){let a=this.retainedEventArguments[t];a||(a=[]),a.push(e),this.retainedEventArguments[t]=a}return}s.forEach(a=>a(e))}hasListeners(t){var e;return!!(!((e=this.listeners[t])===null||e===void 0)&&e.length)}registerWindowListener(t,e){this.windowListeners[e]={registered:!1,windowEventName:t,pluginEventName:e,handler:n=>{this.notifyListeners(e,n)}}}unimplemented(t="not implemented"){return new ps.Exception(t,zn.Unimplemented)}unavailable(t="not available"){return new ps.Exception(t,zn.Unavailable)}async removeListener(t,e){const n=this.listeners[t];if(!n)return;const s=n.indexOf(e);s!==-1&&this.listeners[t].splice(s,1),this.listeners[t].length||this.removeWindowListener(this.windowListeners[t])}addWindowListener(t){window.addEventListener(t.windowEventName,t.handler),t.registered=!0}removeWindowListener(t){t&&(window.removeEventListener(t.windowEventName,t.handler),t.registered=!1)}sendRetainedArgumentsForEvent(t){const e=this.retainedEventArguments[t];e&&(delete this.retainedEventArguments[t],e.forEach(n=>{this.notifyListeners(t,n)}))}}const Io=i=>encodeURIComponent(i).replace(/%(2[346B]|5E|60|7C)/g,decodeURIComponent).replace(/[()]/g,escape),Uo=i=>i.replace(/(%[\dA-F]{2})+/gi,decodeURIComponent);class Wc extends jr{async getCookies(){const t=document.cookie,e={};return t.split(";").forEach(n=>{if(n.length<=0)return;let[s,a]=n.replace(/=/,"CAP_COOKIE").split("CAP_COOKIE");s=Uo(s).trim(),a=Uo(a).trim(),e[s]=a}),e}async setCookie(t){try{const e=Io(t.key),n=Io(t.value),s=t.expires?`; expires=${t.expires.replace("expires=","")}`:"",a=(t.path||"/").replace("path=",""),r=t.url!=null&&t.url.length>0?`domain=${t.url}`:"";document.cookie=`${e}=${n||""}${s}; path=${a}; ${r};`}catch(e){return Promise.reject(e)}}async deleteCookie(t){try{document.cookie=`${t.key}=; Max-Age=0`}catch(e){return Promise.reject(e)}}async clearCookies(){try{const t=document.cookie.split(";")||[];for(const e of t)document.cookie=e.replace(/^ +/,"").replace(/=.*/,`=;expires=${new Date().toUTCString()};path=/`)}catch(t){return Promise.reject(t)}}async clearAllCookies(){try{await this.clearCookies()}catch(t){return Promise.reject(t)}}}ma("CapacitorCookies",{web:()=>new Wc});const Xc=async i=>new Promise((t,e)=>{const n=new FileReader;n.onload=()=>{const s=n.result;t(s.indexOf(",")>=0?s.split(",")[1]:s)},n.onerror=s=>e(s),n.readAsDataURL(i)}),$c=(i={})=>{const t=Object.keys(i);return Object.keys(i).map(s=>s.toLocaleLowerCase()).reduce((s,a,r)=>(s[a]=i[t[r]],s),{})},qc=(i,t=!0)=>i?Object.entries(i).reduce((n,s)=>{const[a,r]=s;let o,l;return Array.isArray(r)?(l="",r.forEach(c=>{o=t?encodeURIComponent(c):c,l+=`${a}=${o}&`}),l.slice(0,-1)):(o=t?encodeURIComponent(r):r,l=`${a}=${o}`),`${n}&${l}`},"").substr(1):null,jc=(i,t={})=>{const e=Object.assign({method:i.method||"GET",headers:i.headers},t),s=$c(i.headers)["content-type"]||"";if(typeof i.data=="string")e.body=i.data;else if(s.includes("application/x-www-form-urlencoded")){const a=new URLSearchParams;for(const[r,o]of Object.entries(i.data||{}))a.set(r,o);e.body=a.toString()}else if(s.includes("multipart/form-data")||i.data instanceof FormData){const a=new FormData;if(i.data instanceof FormData)i.data.forEach((o,l)=>{a.append(l,o)});else for(const o of Object.keys(i.data))a.append(o,i.data[o]);e.body=a;const r=new Headers(e.headers);r.delete("content-type"),e.headers=r}else(s.includes("application/json")||typeof i.data=="object")&&(e.body=JSON.stringify(i.data));return e};class Yc extends jr{async request(t){const e=jc(t,t.webFetchExtra),n=qc(t.params,t.shouldEncodeUrlParams),s=n?`${t.url}?${n}`:t.url,a=await fetch(s,e),r=a.headers.get("content-type")||"";let{responseType:o="text"}=a.ok?t:{};r.includes("application/json")&&(o="json");let l,c;switch(o){case"arraybuffer":case"blob":c=await a.blob(),l=await Xc(c);break;case"json":l=await a.json();break;default:l=await a.text()}const h={};return a.headers.forEach((u,d)=>{h[d]=u}),{data:l,headers:h,status:a.status,url:a.url}}async get(t){return this.request(Object.assign(Object.assign({},t),{method:"GET"}))}async post(t){return this.request(Object.assign(Object.assign({},t),{method:"POST"}))}async put(t){return this.request(Object.assign(Object.assign({},t),{method:"PUT"}))}async patch(t){return this.request(Object.assign(Object.assign({},t),{method:"PATCH"}))}async delete(t){return this.request(Object.assign(Object.assign({},t),{method:"DELETE"}))}}ma("CapacitorHttp",{web:()=>new Yc});var ko;(function(i){i.Dark="DARK",i.Light="LIGHT",i.Default="DEFAULT"})(ko||(ko={}));var No;(function(i){i.StatusBar="StatusBar",i.NavigationBar="NavigationBar"})(No||(No={}));class Kc extends jr{async setStyle(){this.unavailable("not available for web")}async setAnimation(){this.unavailable("not available for web")}async show(){this.unavailable("not available for web")}async hide(){this.unavailable("not available for web")}}ma("SystemBars",{web:()=>new Kc});var Fo;(function(i){i.Dark="DARK",i.Light="LIGHT",i.Default="DEFAULT"})(Fo||(Fo={}));var Oo;(function(i){i.None="NONE",i.Slide="SLIDE",i.Fade="FADE"})(Oo||(Oo={}));const Zc=ma("StatusBar");class Jc{ctx=null;master;sfx;amb;noiseBuf;heartTimer=0;ambientStarted=!1;volume=.8;init(){if(this.ctx){this.ctx.state==="suspended"&&this.ctx.resume();return}const t=window.AudioContext||window.webkitAudioContext;this.ctx=new t,this.master=this.ctx.createGain(),this.master.gain.value=this.volume;const e=this.ctx.createDynamicsCompressor();this.master.connect(e).connect(this.ctx.destination),this.sfx=this.ctx.createGain(),this.sfx.connect(this.master),this.amb=this.ctx.createGain(),this.amb.gain.value=.55,this.amb.connect(this.master);const n=this.ctx.sampleRate*2;this.noiseBuf=this.ctx.createBuffer(1,n,this.ctx.sampleRate);const s=this.noiseBuf.getChannelData(0);for(let a=0;a<n;a++)s[a]=Math.random()*2-1}setVolume(t){this.volume=t,this.ctx&&(this.master.gain.value=t)}setListener(t,e,n,s,a){if(!this.ctx)return;const r=this.ctx.listener;r.positionX?(r.positionX.value=t,r.positionY.value=e,r.positionZ.value=n,r.forwardX.value=s,r.forwardY.value=0,r.forwardZ.value=a,r.upX.value=0,r.upY.value=1,r.upZ.value=0):(r.setPosition(t,e,n),r.setOrientation(s,0,a,0,1,0))}out(t){if(!t||!this.ctx)return this.sfx;const e=this.ctx.createPanner();return e.panningModel="HRTF",e.distanceModel="inverse",e.refDistance=2,e.maxDistance=60,e.rolloffFactor=1.4,e.positionX.value=t.x,e.positionY.value=t.y,e.positionZ.value=t.z,e.connect(this.sfx),e}noise(t,e,n,s,a,r=1,o=.002){const l=this.ctx,c=l.createBufferSource();c.buffer=this.noiseBuf;const h=l.createBiquadFilter();h.type=n,h.frequency.value=s,h.Q.value=r;const u=l.createGain(),d=l.currentTime;return u.gain.setValueAtTime(0,d),u.gain.linearRampToValueAtTime(a,d+o),u.gain.exponentialRampToValueAtTime(1e-4,d+t),c.connect(h).connect(u).connect(e),c.start(d,Math.random()),c.stop(d+t+.05),h}tone(t,e,n,s,a,r,o=0){const l=this.ctx,c=l.createOscillator();c.type=t;const h=l.createGain(),u=l.currentTime+o;c.frequency.setValueAtTime(e,u),c.frequency.exponentialRampToValueAtTime(Math.max(1,n),u+s),h.gain.setValueAtTime(0,u),h.gain.linearRampToValueAtTime(a,u+.01),h.gain.exponentialRampToValueAtTime(1e-4,u+s),c.connect(h).connect(r),c.start(u),c.stop(u+s+.05)}startAmbient(){if(!this.ctx||this.ambientStarted)return;this.ambientStarted=!0;const t=this.ctx,e=t.createBufferSource();e.buffer=this.noiseBuf,e.loop=!0;const n=t.createBiquadFilter();n.type="lowpass",n.frequency.value=420;const s=t.createGain();s.gain.value=.25;const a=t.createOscillator();a.frequency.value=.13;const r=t.createGain();r.gain.value=.12,a.connect(r).connect(s.gain),e.connect(n).connect(s).connect(this.amb),e.start(),a.start();for(const[l,c]of[[41.2,.18],[43.6,.12],[61.7,.06],[92.5,.03]]){const h=t.createOscillator();h.type="sawtooth",h.frequency.value=l;const u=t.createBiquadFilter();u.type="lowpass",u.frequency.value=180;const d=t.createGain();d.gain.value=c,h.connect(u).connect(d).connect(this.amb),h.start()}const o=()=>{this.ctx&&(this.tone("triangle",70+Math.random()*60,40+Math.random()*30,2.5,.05,this.amb),setTimeout(o,7e3+Math.random()*12e3))};setTimeout(o,5e3)}setAmbientLevel(t){this.ctx&&this.amb.gain.setTargetAtTime(t,this.ctx.currentTime,.8)}gunshot(){this.ctx&&(this.noise(.35,this.sfx,"lowpass",2600,1,.7),this.noise(.08,this.sfx,"highpass",3e3,.5),this.tone("sine",140,40,.25,.9,this.sfx))}dryFire(){this.ctx&&this.noise(.04,this.sfx,"bandpass",3500,.4,4)}reload(){this.ctx&&(this.noise(.05,this.sfx,"bandpass",2e3,.4,5),setTimeout(()=>this.ctx&&this.noise(.06,this.sfx,"bandpass",1400,.5,5),450),setTimeout(()=>this.ctx&&this.noise(.05,this.sfx,"bandpass",2600,.5,6),1e3))}step(t){this.ctx&&this.noise(.12,this.sfx,"lowpass",t?500:750,.13,1)}groan(t,e=1,n=.5){if(!this.ctx)return;const s=this.ctx,a=this.out(t),r=s.createOscillator();r.type="sawtooth";const o=(70+Math.random()*40)*e,l=s.currentTime,c=1.2+Math.random()*1.2;r.frequency.setValueAtTime(o,l),r.frequency.linearRampToValueAtTime(o*(.7+Math.random()*.5),l+c);const h=s.createBiquadFilter();h.type="bandpass",h.frequency.value=500+Math.random()*300,h.Q.value=6;const u=s.createBiquadFilter();u.type="bandpass",u.frequency.value=1100+Math.random()*400,u.Q.value=8;const d=s.createGain();d.gain.setValueAtTime(0,l),d.gain.linearRampToValueAtTime(n,l+.25),d.gain.linearRampToValueAtTime(0,l+c);const f=s.createOscillator();f.frequency.value=5+Math.random()*6;const g=s.createGain();g.gain.value=o*.06,f.connect(g).connect(r.frequency),r.connect(h).connect(d),r.connect(u).connect(d),d.connect(a),r.start(l),f.start(l),r.stop(l+c+.1),f.stop(l+c+.1),this.noise(c*.8,a,"bandpass",900,n*.25,2,.2)}roar(t){this.groan(t,.5,1),this.groan(t,.7,.7)}hitFlesh(t){this.ctx&&this.noise(.15,this.out(t),"lowpass",900,.6,2)}playerHurt(){this.ctx&&(this.tone("sawtooth",180,90,.3,.25,this.sfx),this.noise(.25,this.sfx,"lowpass",600,.5))}bell(t,e=.6){if(!this.ctx)return;const n=this.ctx,s=this.out(t),a=1180;for(const[r,o,l]of[[1,1,3],[2.32,.5,2.2],[4.25,.3,1.4],[5.4,.18,1],[.5,.25,3.5]]){const c=n.createOscillator();c.type="sine",c.frequency.value=a*r*(1+(Math.random()-.5)*.004);const h=n.createGain(),u=n.currentTime;h.gain.setValueAtTime(0,u),h.gain.linearRampToValueAtTime(e*o*.3,u+.004),h.gain.exponentialRampToValueAtTime(1e-4,u+l),c.connect(h).connect(s),c.start(u),c.stop(u+l+.05)}}bellRing(t){for(let e=0;e<4;e++)setTimeout(()=>this.bell(t,.7-e*.12),e*220)}stinger(){if(this.ctx){for(const t of[233,247,349,370])this.tone("sawtooth",t,t*.96,2.2,.06,this.sfx);this.noise(1.5,this.sfx,"highpass",4e3,.15,1,.6)}}scan(){this.ctx&&(this.tone("sine",400,1600,.4,.15,this.sfx),this.tone("sine",800,3200,.4,.06,this.sfx,.05))}flash(){this.ctx&&(this.noise(.4,this.sfx,"highpass",5e3,.25,1,.02),this.tone("square",2400,900,.15,.05,this.sfx))}pickup(){this.ctx&&this.tone("triangle",660,990,.18,.18,this.sfx)}door(){this.ctx&&(this.tone("sawtooth",90,60,1.6,.08,this.sfx),this.noise(1.4,this.sfx,"lowpass",300,.3,1,.2))}explosion(t){if(!this.ctx)return;const e=this.out(t);this.noise(1.8,e,"lowpass",900,1.2,.5),this.noise(1.2,e,"highpass",3e3,.4,1,.01),this.tone("sine",90,25,1.2,1,e)}impact(){this.ctx&&(this.tone("sine",55,20,2.5,1.2,this.sfx),this.noise(2.5,this.sfx,"lowpass",400,1,.5))}radio(){this.ctx&&this.noise(.25,this.sfx,"bandpass",2200,.12,3)}heartbeat(t,e){!this.ctx||e<=0||(this.heartTimer-=t,this.heartTimer<=0&&(this.heartTimer=1.1-e*.5,this.tone("sine",62,40,.18,.5*e,this.sfx),this.tone("sine",55,36,.18,.35*e,this.sfx,.22)))}samples=new Map;async loadSamples(t,e){this.ctx&&await Promise.all(t.map(async n=>{try{const s=await fetch(`${e}${n}.wav`),a=await this.ctx.decodeAudioData(await s.arrayBuffer());this.samples.set(n,a)}catch{}}))}sample(t,e=.8,n=1,s){if(!this.ctx)return!1;const a=this.samples.get(t);if(!a)return!1;const r=this.ctx.createBufferSource();r.buffer=a,r.playbackRate.value=n;const o=this.ctx.createGain();return o.gain.value=e,r.connect(o).connect(this.out(s)),r.start(),!0}scream(){if(!this.ctx)return;const t=this.ctx,e=t.currentTime;for(const[n,s]of[[620,.35],[910,.25],[1400,.15]]){const a=t.createOscillator();a.type="sawtooth",a.frequency.setValueAtTime(n,e),a.frequency.exponentialRampToValueAtTime(n*.55,e+1.1);const r=t.createOscillator();r.frequency.value=23;const o=t.createGain();o.gain.value=n*.08,r.connect(o).connect(a.frequency);const l=t.createGain();l.gain.setValueAtTime(0,e),l.gain.linearRampToValueAtTime(s,e+.03),l.gain.exponentialRampToValueAtTime(1e-4,e+1.2),a.connect(l).connect(this.sfx),a.start(e),r.start(e),a.stop(e+1.3),r.stop(e+1.3)}this.noise(1,this.sfx,"highpass",2500,.6,.7,.01),this.tone("sine",70,25,.9,1.2,this.sfx)}whisper(){if(this.ctx)for(let t=0;t<3;t++)setTimeout(()=>this.ctx&&this.noise(.6,this.amb,"bandpass",1800+Math.random()*1500,.12,8,.2),t*380)}}const X=new Jc;const Yr="180",Qc=0,zo=1,th=2,Yl=1,Kl=2,Ai=3,Xi=0,Ve=1,Qe=2,Gi=0,kn=1,ca=2,Bo=3,Ho=4,eh=5,sn=100,ih=101,nh=102,sh=103,ah=104,rh=200,oh=201,lh=202,ch=203,sr=204,ar=205,hh=206,uh=207,dh=208,fh=209,ph=210,mh=211,gh=212,_h=213,vh=214,rr=0,or=1,lr=2,Bn=3,cr=4,hr=5,ur=6,dr=7,Zl=0,xh=1,yh=2,Vi=0,bh=1,Mh=2,wh=3,Jl=4,Sh=5,Eh=6,Th=7,Ql=300,Hn=301,Gn=302,fr=303,pr=304,ga=306,ms=1e3,rn=1001,mr=1002,ti=1003,Ah=1004,Rs=1005,gi=1006,ba=1007,on=1008,xi=1009,tc=1010,ec=1011,gs=1012,Kr=1013,hn=1014,_i=1015,ws=1016,Zr=1017,Jr=1018,_s=1020,ic=35902,nc=35899,sc=1021,ac=1022,hi=1023,vs=1026,xs=1027,Qr=1028,to=1029,rc=1030,eo=1031,io=1033,ea=33776,ia=33777,na=33778,sa=33779,gr=35840,_r=35841,vr=35842,xr=35843,yr=36196,br=37492,Mr=37496,wr=37808,Sr=37809,Er=37810,Tr=37811,Ar=37812,Rr=37813,Cr=37814,Pr=37815,Lr=37816,Dr=37817,Ir=37818,Ur=37819,kr=37820,Nr=37821,Fr=36492,Or=36494,zr=36495,Br=36283,Hr=36284,Gr=36285,Vr=36286,Rh=3200,Ch=3201,oc=0,Ph=1,Hi="",Pe="srgb",Vn="srgb-linear",ha="linear",Qt="srgb",pn=7680,Go=519,Lh=512,Dh=513,Ih=514,lc=515,Uh=516,kh=517,Nh=518,Fh=519,Wr=35044,Vo="300 es",vi=2e3,ua=2001;class qn{addEventListener(t,e){this._listeners===void 0&&(this._listeners={});const n=this._listeners;n[t]===void 0&&(n[t]=[]),n[t].indexOf(e)===-1&&n[t].push(e)}hasEventListener(t,e){const n=this._listeners;return n===void 0?!1:n[t]!==void 0&&n[t].indexOf(e)!==-1}removeEventListener(t,e){const n=this._listeners;if(n===void 0)return;const s=n[t];if(s!==void 0){const a=s.indexOf(e);a!==-1&&s.splice(a,1)}}dispatchEvent(t){const e=this._listeners;if(e===void 0)return;const n=e[t.type];if(n!==void 0){t.target=this;const s=n.slice(0);for(let a=0,r=s.length;a<r;a++)s[a].call(this,t);t.target=null}}}const Fe=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],Ma=Math.PI/180,da=180/Math.PI;function Wi(){const i=Math.random()*4294967295|0,t=Math.random()*4294967295|0,e=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(Fe[i&255]+Fe[i>>8&255]+Fe[i>>16&255]+Fe[i>>24&255]+"-"+Fe[t&255]+Fe[t>>8&255]+"-"+Fe[t>>16&15|64]+Fe[t>>24&255]+"-"+Fe[e&63|128]+Fe[e>>8&255]+"-"+Fe[e>>16&255]+Fe[e>>24&255]+Fe[n&255]+Fe[n>>8&255]+Fe[n>>16&255]+Fe[n>>24&255]).toLowerCase()}function Vt(i,t,e){return Math.max(t,Math.min(e,i))}function Oh(i,t){return(i%t+t)%t}function wa(i,t,e){return(1-e)*i+e*t}function mi(i,t){switch(t.constructor){case Float32Array:return i;case Uint32Array:return i/4294967295;case Uint16Array:return i/65535;case Uint8Array:return i/255;case Int32Array:return Math.max(i/2147483647,-1);case Int16Array:return Math.max(i/32767,-1);case Int8Array:return Math.max(i/127,-1);default:throw new Error("Invalid component type.")}}function te(i,t){switch(t.constructor){case Float32Array:return i;case Uint32Array:return Math.round(i*4294967295);case Uint16Array:return Math.round(i*65535);case Uint8Array:return Math.round(i*255);case Int32Array:return Math.round(i*2147483647);case Int16Array:return Math.round(i*32767);case Int8Array:return Math.round(i*127);default:throw new Error("Invalid component type.")}}class Ut{constructor(t=0,e=0){Ut.prototype.isVector2=!0,this.x=t,this.y=e}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,e){return this.x=t,this.y=e,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){const e=this.x,n=this.y,s=t.elements;return this.x=s[0]*e+s[3]*n+s[6],this.y=s[1]*e+s[4]*n+s[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,e){return this.x=Vt(this.x,t.x,e.x),this.y=Vt(this.y,t.y,e.y),this}clampScalar(t,e){return this.x=Vt(this.x,t,e),this.y=Vt(this.y,t,e),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Vt(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const n=this.dot(t)/e;return Math.acos(Vt(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,n=this.y-t.y;return e*e+n*n}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this}rotateAround(t,e){const n=Math.cos(e),s=Math.sin(e),a=this.x-t.x,r=this.y-t.y;return this.x=a*n-r*s+t.x,this.y=a*s+r*n+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class Ss{constructor(t=0,e=0,n=0,s=1){this.isQuaternion=!0,this._x=t,this._y=e,this._z=n,this._w=s}static slerpFlat(t,e,n,s,a,r,o){let l=n[s+0],c=n[s+1],h=n[s+2],u=n[s+3];const d=a[r+0],f=a[r+1],g=a[r+2],_=a[r+3];if(o===0){t[e+0]=l,t[e+1]=c,t[e+2]=h,t[e+3]=u;return}if(o===1){t[e+0]=d,t[e+1]=f,t[e+2]=g,t[e+3]=_;return}if(u!==_||l!==d||c!==f||h!==g){let m=1-o;const p=l*d+c*f+h*g+u*_,w=p>=0?1:-1,A=1-p*p;if(A>Number.EPSILON){const P=Math.sqrt(A),S=Math.atan2(P,p*w);m=Math.sin(m*S)/P,o=Math.sin(o*S)/P}const M=o*w;if(l=l*m+d*M,c=c*m+f*M,h=h*m+g*M,u=u*m+_*M,m===1-o){const P=1/Math.sqrt(l*l+c*c+h*h+u*u);l*=P,c*=P,h*=P,u*=P}}t[e]=l,t[e+1]=c,t[e+2]=h,t[e+3]=u}static multiplyQuaternionsFlat(t,e,n,s,a,r){const o=n[s],l=n[s+1],c=n[s+2],h=n[s+3],u=a[r],d=a[r+1],f=a[r+2],g=a[r+3];return t[e]=o*g+h*u+l*f-c*d,t[e+1]=l*g+h*d+c*u-o*f,t[e+2]=c*g+h*f+o*d-l*u,t[e+3]=h*g-o*u-l*d-c*f,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,e,n,s){return this._x=t,this._y=e,this._z=n,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,e=!0){const n=t._x,s=t._y,a=t._z,r=t._order,o=Math.cos,l=Math.sin,c=o(n/2),h=o(s/2),u=o(a/2),d=l(n/2),f=l(s/2),g=l(a/2);switch(r){case"XYZ":this._x=d*h*u+c*f*g,this._y=c*f*u-d*h*g,this._z=c*h*g+d*f*u,this._w=c*h*u-d*f*g;break;case"YXZ":this._x=d*h*u+c*f*g,this._y=c*f*u-d*h*g,this._z=c*h*g-d*f*u,this._w=c*h*u+d*f*g;break;case"ZXY":this._x=d*h*u-c*f*g,this._y=c*f*u+d*h*g,this._z=c*h*g+d*f*u,this._w=c*h*u-d*f*g;break;case"ZYX":this._x=d*h*u-c*f*g,this._y=c*f*u+d*h*g,this._z=c*h*g-d*f*u,this._w=c*h*u+d*f*g;break;case"YZX":this._x=d*h*u+c*f*g,this._y=c*f*u+d*h*g,this._z=c*h*g-d*f*u,this._w=c*h*u-d*f*g;break;case"XZY":this._x=d*h*u-c*f*g,this._y=c*f*u-d*h*g,this._z=c*h*g+d*f*u,this._w=c*h*u+d*f*g;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+r)}return e===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,e){const n=e/2,s=Math.sin(n);return this._x=t.x*s,this._y=t.y*s,this._z=t.z*s,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(t){const e=t.elements,n=e[0],s=e[4],a=e[8],r=e[1],o=e[5],l=e[9],c=e[2],h=e[6],u=e[10],d=n+o+u;if(d>0){const f=.5/Math.sqrt(d+1);this._w=.25/f,this._x=(h-l)*f,this._y=(a-c)*f,this._z=(r-s)*f}else if(n>o&&n>u){const f=2*Math.sqrt(1+n-o-u);this._w=(h-l)/f,this._x=.25*f,this._y=(s+r)/f,this._z=(a+c)/f}else if(o>u){const f=2*Math.sqrt(1+o-n-u);this._w=(a-c)/f,this._x=(s+r)/f,this._y=.25*f,this._z=(l+h)/f}else{const f=2*Math.sqrt(1+u-n-o);this._w=(r-s)/f,this._x=(a+c)/f,this._y=(l+h)/f,this._z=.25*f}return this._onChangeCallback(),this}setFromUnitVectors(t,e){let n=t.dot(e)+1;return n<1e-8?(n=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=n):(this._x=0,this._y=-t.z,this._z=t.y,this._w=n)):(this._x=t.y*e.z-t.z*e.y,this._y=t.z*e.x-t.x*e.z,this._z=t.x*e.y-t.y*e.x,this._w=n),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(Vt(this.dot(t),-1,1)))}rotateTowards(t,e){const n=this.angleTo(t);if(n===0)return this;const s=Math.min(1,e/n);return this.slerp(t,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,e){const n=t._x,s=t._y,a=t._z,r=t._w,o=e._x,l=e._y,c=e._z,h=e._w;return this._x=n*h+r*o+s*c-a*l,this._y=s*h+r*l+a*o-n*c,this._z=a*h+r*c+n*l-s*o,this._w=r*h-n*o-s*l-a*c,this._onChangeCallback(),this}slerp(t,e){if(e===0)return this;if(e===1)return this.copy(t);const n=this._x,s=this._y,a=this._z,r=this._w;let o=r*t._w+n*t._x+s*t._y+a*t._z;if(o<0?(this._w=-t._w,this._x=-t._x,this._y=-t._y,this._z=-t._z,o=-o):this.copy(t),o>=1)return this._w=r,this._x=n,this._y=s,this._z=a,this;const l=1-o*o;if(l<=Number.EPSILON){const f=1-e;return this._w=f*r+e*this._w,this._x=f*n+e*this._x,this._y=f*s+e*this._y,this._z=f*a+e*this._z,this.normalize(),this}const c=Math.sqrt(l),h=Math.atan2(c,o),u=Math.sin((1-e)*h)/c,d=Math.sin(e*h)/c;return this._w=r*u+this._w*d,this._x=n*u+this._x*d,this._y=s*u+this._y*d,this._z=a*u+this._z*d,this._onChangeCallback(),this}slerpQuaternions(t,e,n){return this.copy(t).slerp(e,n)}random(){const t=2*Math.PI*Math.random(),e=2*Math.PI*Math.random(),n=Math.random(),s=Math.sqrt(1-n),a=Math.sqrt(n);return this.set(s*Math.sin(t),s*Math.cos(t),a*Math.sin(e),a*Math.cos(e))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,e=0){return this._x=t[e],this._y=t[e+1],this._z=t[e+2],this._w=t[e+3],this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._w,t}fromBufferAttribute(t,e){return this._x=t.getX(e),this._y=t.getY(e),this._z=t.getZ(e),this._w=t.getW(e),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class D{constructor(t=0,e=0,n=0){D.prototype.isVector3=!0,this.x=t,this.y=e,this.z=n}set(t,e,n){return n===void 0&&(n=this.z),this.x=t,this.y=e,this.z=n,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,e){return this.x=t.x*e.x,this.y=t.y*e.y,this.z=t.z*e.z,this}applyEuler(t){return this.applyQuaternion(Wo.setFromEuler(t))}applyAxisAngle(t,e){return this.applyQuaternion(Wo.setFromAxisAngle(t,e))}applyMatrix3(t){const e=this.x,n=this.y,s=this.z,a=t.elements;return this.x=a[0]*e+a[3]*n+a[6]*s,this.y=a[1]*e+a[4]*n+a[7]*s,this.z=a[2]*e+a[5]*n+a[8]*s,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){const e=this.x,n=this.y,s=this.z,a=t.elements,r=1/(a[3]*e+a[7]*n+a[11]*s+a[15]);return this.x=(a[0]*e+a[4]*n+a[8]*s+a[12])*r,this.y=(a[1]*e+a[5]*n+a[9]*s+a[13])*r,this.z=(a[2]*e+a[6]*n+a[10]*s+a[14])*r,this}applyQuaternion(t){const e=this.x,n=this.y,s=this.z,a=t.x,r=t.y,o=t.z,l=t.w,c=2*(r*s-o*n),h=2*(o*e-a*s),u=2*(a*n-r*e);return this.x=e+l*c+r*u-o*h,this.y=n+l*h+o*c-a*u,this.z=s+l*u+a*h-r*c,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){const e=this.x,n=this.y,s=this.z,a=t.elements;return this.x=a[0]*e+a[4]*n+a[8]*s,this.y=a[1]*e+a[5]*n+a[9]*s,this.z=a[2]*e+a[6]*n+a[10]*s,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,e){return this.x=Vt(this.x,t.x,e.x),this.y=Vt(this.y,t.y,e.y),this.z=Vt(this.z,t.z,e.z),this}clampScalar(t,e){return this.x=Vt(this.x,t,e),this.y=Vt(this.y,t,e),this.z=Vt(this.z,t,e),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Vt(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,e){const n=t.x,s=t.y,a=t.z,r=e.x,o=e.y,l=e.z;return this.x=s*l-a*o,this.y=a*r-n*l,this.z=n*o-s*r,this}projectOnVector(t){const e=t.lengthSq();if(e===0)return this.set(0,0,0);const n=t.dot(this)/e;return this.copy(t).multiplyScalar(n)}projectOnPlane(t){return Sa.copy(this).projectOnVector(t),this.sub(Sa)}reflect(t){return this.sub(Sa.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const n=this.dot(t)/e;return Math.acos(Vt(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,n=this.y-t.y,s=this.z-t.z;return e*e+n*n+s*s}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,e,n){const s=Math.sin(e)*t;return this.x=s*Math.sin(n),this.y=Math.cos(e)*t,this.z=s*Math.cos(n),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,e,n){return this.x=t*Math.sin(e),this.y=n,this.z=t*Math.cos(e),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this}setFromMatrixScale(t){const e=this.setFromMatrixColumn(t,0).length(),n=this.setFromMatrixColumn(t,1).length(),s=this.setFromMatrixColumn(t,2).length();return this.x=e,this.y=n,this.z=s,this}setFromMatrixColumn(t,e){return this.fromArray(t.elements,e*4)}setFromMatrix3Column(t,e){return this.fromArray(t.elements,e*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const t=Math.random()*Math.PI*2,e=Math.random()*2-1,n=Math.sqrt(1-e*e);return this.x=n*Math.cos(t),this.y=e,this.z=n*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}const Sa=new D,Wo=new Ss;class Nt{constructor(t,e,n,s,a,r,o,l,c){Nt.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,e,n,s,a,r,o,l,c)}set(t,e,n,s,a,r,o,l,c){const h=this.elements;return h[0]=t,h[1]=s,h[2]=o,h[3]=e,h[4]=a,h[5]=l,h[6]=n,h[7]=r,h[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){const e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],this}extractBasis(t,e,n){return t.setFromMatrix3Column(this,0),e.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(t){const e=t.elements;return this.set(e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const n=t.elements,s=e.elements,a=this.elements,r=n[0],o=n[3],l=n[6],c=n[1],h=n[4],u=n[7],d=n[2],f=n[5],g=n[8],_=s[0],m=s[3],p=s[6],w=s[1],A=s[4],M=s[7],P=s[2],S=s[5],T=s[8];return a[0]=r*_+o*w+l*P,a[3]=r*m+o*A+l*S,a[6]=r*p+o*M+l*T,a[1]=c*_+h*w+u*P,a[4]=c*m+h*A+u*S,a[7]=c*p+h*M+u*T,a[2]=d*_+f*w+g*P,a[5]=d*m+f*A+g*S,a[8]=d*p+f*M+g*T,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[3]*=t,e[6]*=t,e[1]*=t,e[4]*=t,e[7]*=t,e[2]*=t,e[5]*=t,e[8]*=t,this}determinant(){const t=this.elements,e=t[0],n=t[1],s=t[2],a=t[3],r=t[4],o=t[5],l=t[6],c=t[7],h=t[8];return e*r*h-e*o*c-n*a*h+n*o*l+s*a*c-s*r*l}invert(){const t=this.elements,e=t[0],n=t[1],s=t[2],a=t[3],r=t[4],o=t[5],l=t[6],c=t[7],h=t[8],u=h*r-o*c,d=o*l-h*a,f=c*a-r*l,g=e*u+n*d+s*f;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);const _=1/g;return t[0]=u*_,t[1]=(s*c-h*n)*_,t[2]=(o*n-s*r)*_,t[3]=d*_,t[4]=(h*e-s*l)*_,t[5]=(s*a-o*e)*_,t[6]=f*_,t[7]=(n*l-c*e)*_,t[8]=(r*e-n*a)*_,this}transpose(){let t;const e=this.elements;return t=e[1],e[1]=e[3],e[3]=t,t=e[2],e[2]=e[6],e[6]=t,t=e[5],e[5]=e[7],e[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){const e=this.elements;return t[0]=e[0],t[1]=e[3],t[2]=e[6],t[3]=e[1],t[4]=e[4],t[5]=e[7],t[6]=e[2],t[7]=e[5],t[8]=e[8],this}setUvTransform(t,e,n,s,a,r,o){const l=Math.cos(a),c=Math.sin(a);return this.set(n*l,n*c,-n*(l*r+c*o)+r+t,-s*c,s*l,-s*(-c*r+l*o)+o+e,0,0,1),this}scale(t,e){return this.premultiply(Ea.makeScale(t,e)),this}rotate(t){return this.premultiply(Ea.makeRotation(-t)),this}translate(t,e){return this.premultiply(Ea.makeTranslation(t,e)),this}makeTranslation(t,e){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,e,0,0,1),this}makeRotation(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,n,e,0,0,0,1),this}makeScale(t,e){return this.set(t,0,0,0,e,0,0,0,1),this}equals(t){const e=this.elements,n=t.elements;for(let s=0;s<9;s++)if(e[s]!==n[s])return!1;return!0}fromArray(t,e=0){for(let n=0;n<9;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){const n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t}clone(){return new this.constructor().fromArray(this.elements)}}const Ea=new Nt;function cc(i){for(let t=i.length-1;t>=0;--t)if(i[t]>=65535)return!0;return!1}function fa(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}function zh(){const i=fa("canvas");return i.style.display="block",i}const Xo={};function ys(i){i in Xo||(Xo[i]=!0,console.warn(i))}function Bh(i,t,e){return new Promise(function(n,s){function a(){switch(i.clientWaitSync(t,i.SYNC_FLUSH_COMMANDS_BIT,0)){case i.WAIT_FAILED:s();break;case i.TIMEOUT_EXPIRED:setTimeout(a,e);break;default:n()}}setTimeout(a,e)})}const $o=new Nt().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),qo=new Nt().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function Hh(){const i={enabled:!0,workingColorSpace:Vn,spaces:{},convert:function(s,a,r){return this.enabled===!1||a===r||!a||!r||(this.spaces[a].transfer===Qt&&(s.r=Li(s.r),s.g=Li(s.g),s.b=Li(s.b)),this.spaces[a].primaries!==this.spaces[r].primaries&&(s.applyMatrix3(this.spaces[a].toXYZ),s.applyMatrix3(this.spaces[r].fromXYZ)),this.spaces[r].transfer===Qt&&(s.r=Nn(s.r),s.g=Nn(s.g),s.b=Nn(s.b))),s},workingToColorSpace:function(s,a){return this.convert(s,this.workingColorSpace,a)},colorSpaceToWorking:function(s,a){return this.convert(s,a,this.workingColorSpace)},getPrimaries:function(s){return this.spaces[s].primaries},getTransfer:function(s){return s===Hi?ha:this.spaces[s].transfer},getToneMappingMode:function(s){return this.spaces[s].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(s,a=this.workingColorSpace){return s.fromArray(this.spaces[a].luminanceCoefficients)},define:function(s){Object.assign(this.spaces,s)},_getMatrix:function(s,a,r){return s.copy(this.spaces[a].toXYZ).multiply(this.spaces[r].fromXYZ)},_getDrawingBufferColorSpace:function(s){return this.spaces[s].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(s=this.workingColorSpace){return this.spaces[s].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(s,a){return ys("THREE.ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),i.workingToColorSpace(s,a)},toWorkingColorSpace:function(s,a){return ys("THREE.ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),i.colorSpaceToWorking(s,a)}},t=[.64,.33,.3,.6,.15,.06],e=[.2126,.7152,.0722],n=[.3127,.329];return i.define({[Vn]:{primaries:t,whitePoint:n,transfer:ha,toXYZ:$o,fromXYZ:qo,luminanceCoefficients:e,workingColorSpaceConfig:{unpackColorSpace:Pe},outputColorSpaceConfig:{drawingBufferColorSpace:Pe}},[Pe]:{primaries:t,whitePoint:n,transfer:Qt,toXYZ:$o,fromXYZ:qo,luminanceCoefficients:e,outputColorSpaceConfig:{drawingBufferColorSpace:Pe}}}),i}const qt=Hh();function Li(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function Nn(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}let mn;class Gh{static getDataURL(t,e="image/png"){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement>"u")return t.src;let n;if(t instanceof HTMLCanvasElement)n=t;else{mn===void 0&&(mn=fa("canvas")),mn.width=t.width,mn.height=t.height;const s=mn.getContext("2d");t instanceof ImageData?s.putImageData(t,0,0):s.drawImage(t,0,0,t.width,t.height),n=mn}return n.toDataURL(e)}static sRGBToLinear(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap){const e=fa("canvas");e.width=t.width,e.height=t.height;const n=e.getContext("2d");n.drawImage(t,0,0,t.width,t.height);const s=n.getImageData(0,0,t.width,t.height),a=s.data;for(let r=0;r<a.length;r++)a[r]=Li(a[r]/255)*255;return n.putImageData(s,0,0),e}else if(t.data){const e=t.data.slice(0);for(let n=0;n<e.length;n++)e instanceof Uint8Array||e instanceof Uint8ClampedArray?e[n]=Math.floor(Li(e[n]/255)*255):e[n]=Li(e[n]);return{data:e,width:t.width,height:t.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}}let Vh=0;class no{constructor(t=null){this.isSource=!0,Object.defineProperty(this,"id",{value:Vh++}),this.uuid=Wi(),this.data=t,this.dataReady=!0,this.version=0}getSize(t){const e=this.data;return typeof HTMLVideoElement<"u"&&e instanceof HTMLVideoElement?t.set(e.videoWidth,e.videoHeight,0):e instanceof VideoFrame?t.set(e.displayHeight,e.displayWidth,0):e!==null?t.set(e.width,e.height,e.depth||0):t.set(0,0,0),t}set needsUpdate(t){t===!0&&this.version++}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.images[this.uuid]!==void 0)return t.images[this.uuid];const n={uuid:this.uuid,url:""},s=this.data;if(s!==null){let a;if(Array.isArray(s)){a=[];for(let r=0,o=s.length;r<o;r++)s[r].isDataTexture?a.push(Ta(s[r].image)):a.push(Ta(s[r]))}else a=Ta(s);n.url=a}return e||(t.images[this.uuid]=n),n}}function Ta(i){return typeof HTMLImageElement<"u"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&i instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&i instanceof ImageBitmap?Gh.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}let Wh=0;const Aa=new D;class De extends qn{constructor(t=De.DEFAULT_IMAGE,e=De.DEFAULT_MAPPING,n=rn,s=rn,a=gi,r=on,o=hi,l=xi,c=De.DEFAULT_ANISOTROPY,h=Hi){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Wh++}),this.uuid=Wi(),this.name="",this.source=new no(t),this.mipmaps=[],this.mapping=e,this.channel=0,this.wrapS=n,this.wrapT=s,this.magFilter=a,this.minFilter=r,this.anisotropy=c,this.format=o,this.internalFormat=null,this.type=l,this.offset=new Ut(0,0),this.repeat=new Ut(1,1),this.center=new Ut(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Nt,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(t&&t.depth&&t.depth>1),this.pmremVersion=0}get width(){return this.source.getSize(Aa).x}get height(){return this.source.getSize(Aa).y}get depth(){return this.source.getSize(Aa).z}get image(){return this.source.data}set image(t=null){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.renderTarget=t.renderTarget,this.isRenderTargetTexture=t.isRenderTargetTexture,this.isArrayTexture=t.isArrayTexture,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}setValues(t){for(const e in t){const n=t[e];if(n===void 0){console.warn(`THREE.Texture.setValues(): parameter '${e}' has value of undefined.`);continue}const s=this[e];if(s===void 0){console.warn(`THREE.Texture.setValues(): property '${e}' does not exist.`);continue}s&&n&&s.isVector2&&n.isVector2||s&&n&&s.isVector3&&n.isVector3||s&&n&&s.isMatrix3&&n.isMatrix3?s.copy(n):this[e]=n}}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];const n={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),e||(t.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==Ql)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case ms:t.x=t.x-Math.floor(t.x);break;case rn:t.x=t.x<0?0:1;break;case mr:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case ms:t.y=t.y-Math.floor(t.y);break;case rn:t.y=t.y<0?0:1;break;case mr:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(t){t===!0&&this.pmremVersion++}}De.DEFAULT_IMAGE=null;De.DEFAULT_MAPPING=Ql;De.DEFAULT_ANISOTROPY=1;class ne{constructor(t=0,e=0,n=0,s=1){ne.prototype.isVector4=!0,this.x=t,this.y=e,this.z=n,this.w=s}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,e,n,s){return this.x=t,this.y=e,this.z=n,this.w=s,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;case 3:this.w=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this.w=t.w+e.w,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this.w+=t.w*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this.w=t.w-e.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){const e=this.x,n=this.y,s=this.z,a=this.w,r=t.elements;return this.x=r[0]*e+r[4]*n+r[8]*s+r[12]*a,this.y=r[1]*e+r[5]*n+r[9]*s+r[13]*a,this.z=r[2]*e+r[6]*n+r[10]*s+r[14]*a,this.w=r[3]*e+r[7]*n+r[11]*s+r[15]*a,this}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this.w/=t.w,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);const e=Math.sqrt(1-t.w*t.w);return e<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/e,this.y=t.y/e,this.z=t.z/e),this}setAxisAngleFromRotationMatrix(t){let e,n,s,a;const l=t.elements,c=l[0],h=l[4],u=l[8],d=l[1],f=l[5],g=l[9],_=l[2],m=l[6],p=l[10];if(Math.abs(h-d)<.01&&Math.abs(u-_)<.01&&Math.abs(g-m)<.01){if(Math.abs(h+d)<.1&&Math.abs(u+_)<.1&&Math.abs(g+m)<.1&&Math.abs(c+f+p-3)<.1)return this.set(1,0,0,0),this;e=Math.PI;const A=(c+1)/2,M=(f+1)/2,P=(p+1)/2,S=(h+d)/4,T=(u+_)/4,C=(g+m)/4;return A>M&&A>P?A<.01?(n=0,s=.707106781,a=.707106781):(n=Math.sqrt(A),s=S/n,a=T/n):M>P?M<.01?(n=.707106781,s=0,a=.707106781):(s=Math.sqrt(M),n=S/s,a=C/s):P<.01?(n=.707106781,s=.707106781,a=0):(a=Math.sqrt(P),n=T/a,s=C/a),this.set(n,s,a,e),this}let w=Math.sqrt((m-g)*(m-g)+(u-_)*(u-_)+(d-h)*(d-h));return Math.abs(w)<.001&&(w=1),this.x=(m-g)/w,this.y=(u-_)/w,this.z=(d-h)/w,this.w=Math.acos((c+f+p-1)/2),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this.w=e[15],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,e){return this.x=Vt(this.x,t.x,e.x),this.y=Vt(this.y,t.y,e.y),this.z=Vt(this.z,t.z,e.z),this.w=Vt(this.w,t.w,e.w),this}clampScalar(t,e){return this.x=Vt(this.x,t,e),this.y=Vt(this.y,t,e),this.z=Vt(this.z,t,e),this.w=Vt(this.w,t,e),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Vt(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this.w+=(t.w-this.w)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this.w=t.w+(e.w-t.w)*n,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this.w=t[e+3],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t[e+3]=this.w,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this.w=t.getW(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class Xh extends qn{constructor(t=1,e=1,n={}){super(),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:gi,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1},n),this.isRenderTarget=!0,this.width=t,this.height=e,this.depth=n.depth,this.scissor=new ne(0,0,t,e),this.scissorTest=!1,this.viewport=new ne(0,0,t,e);const s={width:t,height:e,depth:n.depth},a=new De(s);this.textures=[];const r=n.count;for(let o=0;o<r;o++)this.textures[o]=a.clone(),this.textures[o].isRenderTargetTexture=!0,this.textures[o].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview}_setTextureOptions(t={}){const e={minFilter:gi,generateMipmaps:!1,flipY:!1,internalFormat:null};t.mapping!==void 0&&(e.mapping=t.mapping),t.wrapS!==void 0&&(e.wrapS=t.wrapS),t.wrapT!==void 0&&(e.wrapT=t.wrapT),t.wrapR!==void 0&&(e.wrapR=t.wrapR),t.magFilter!==void 0&&(e.magFilter=t.magFilter),t.minFilter!==void 0&&(e.minFilter=t.minFilter),t.format!==void 0&&(e.format=t.format),t.type!==void 0&&(e.type=t.type),t.anisotropy!==void 0&&(e.anisotropy=t.anisotropy),t.colorSpace!==void 0&&(e.colorSpace=t.colorSpace),t.flipY!==void 0&&(e.flipY=t.flipY),t.generateMipmaps!==void 0&&(e.generateMipmaps=t.generateMipmaps),t.internalFormat!==void 0&&(e.internalFormat=t.internalFormat);for(let n=0;n<this.textures.length;n++)this.textures[n].setValues(e)}get texture(){return this.textures[0]}set texture(t){this.textures[0]=t}set depthTexture(t){this._depthTexture!==null&&(this._depthTexture.renderTarget=null),t!==null&&(t.renderTarget=this),this._depthTexture=t}get depthTexture(){return this._depthTexture}setSize(t,e,n=1){if(this.width!==t||this.height!==e||this.depth!==n){this.width=t,this.height=e,this.depth=n;for(let s=0,a=this.textures.length;s<a;s++)this.textures[s].image.width=t,this.textures[s].image.height=e,this.textures[s].image.depth=n,this.textures[s].isArrayTexture=this.textures[s].image.depth>1;this.dispose()}this.viewport.set(0,0,t,e),this.scissor.set(0,0,t,e)}clone(){return new this.constructor().copy(this)}copy(t){this.width=t.width,this.height=t.height,this.depth=t.depth,this.scissor.copy(t.scissor),this.scissorTest=t.scissorTest,this.viewport.copy(t.viewport),this.textures.length=0;for(let e=0,n=t.textures.length;e<n;e++){this.textures[e]=t.textures[e].clone(),this.textures[e].isRenderTargetTexture=!0,this.textures[e].renderTarget=this;const s=Object.assign({},t.textures[e].image);this.textures[e].source=new no(s)}return this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,this.resolveDepthBuffer=t.resolveDepthBuffer,this.resolveStencilBuffer=t.resolveStencilBuffer,t.depthTexture!==null&&(this.depthTexture=t.depthTexture.clone()),this.samples=t.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}}class un extends Xh{constructor(t=1,e=1,n={}){super(t,e,n),this.isWebGLRenderTarget=!0}}class hc extends De{constructor(t=null,e=1,n=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:t,width:e,height:n,depth:s},this.magFilter=ti,this.minFilter=ti,this.wrapR=rn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(t){this.layerUpdates.add(t)}clearLayerUpdates(){this.layerUpdates.clear()}}class $h extends De{constructor(t=null,e=1,n=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:t,width:e,height:n,depth:s},this.magFilter=ti,this.minFilter=ti,this.wrapR=rn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class dn{constructor(t=new D(1/0,1/0,1/0),e=new D(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromArray(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e+=3)this.expandByPoint(oi.fromArray(t,e));return this}setFromBufferAttribute(t){this.makeEmpty();for(let e=0,n=t.count;e<n;e++)this.expandByPoint(oi.fromBufferAttribute(t,e));return this}setFromPoints(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){const n=oi.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(n),this.max.copy(t).add(n),this}setFromObject(t,e=!1){return this.makeEmpty(),this.expandByObject(t,e)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,e=!1){t.updateWorldMatrix(!1,!1);const n=t.geometry;if(n!==void 0){const a=n.getAttribute("position");if(e===!0&&a!==void 0&&t.isInstancedMesh!==!0)for(let r=0,o=a.count;r<o;r++)t.isMesh===!0?t.getVertexPosition(r,oi):oi.fromBufferAttribute(a,r),oi.applyMatrix4(t.matrixWorld),this.expandByPoint(oi);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),Cs.copy(t.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),Cs.copy(n.boundingBox)),Cs.applyMatrix4(t.matrixWorld),this.union(Cs)}const s=t.children;for(let a=0,r=s.length;a<r;a++)this.expandByObject(s[a],e);return this}containsPoint(t){return t.x>=this.min.x&&t.x<=this.max.x&&t.y>=this.min.y&&t.y<=this.max.y&&t.z>=this.min.z&&t.z<=this.max.z}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return t.max.x>=this.min.x&&t.min.x<=this.max.x&&t.max.y>=this.min.y&&t.min.y<=this.max.y&&t.max.z>=this.min.z&&t.min.z<=this.max.z}intersectsSphere(t){return this.clampPoint(t.center,oi),oi.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let e,n;return t.normal.x>0?(e=t.normal.x*this.min.x,n=t.normal.x*this.max.x):(e=t.normal.x*this.max.x,n=t.normal.x*this.min.x),t.normal.y>0?(e+=t.normal.y*this.min.y,n+=t.normal.y*this.max.y):(e+=t.normal.y*this.max.y,n+=t.normal.y*this.min.y),t.normal.z>0?(e+=t.normal.z*this.min.z,n+=t.normal.z*this.max.z):(e+=t.normal.z*this.max.z,n+=t.normal.z*this.min.z),e<=-t.constant&&n>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(Zn),Ps.subVectors(this.max,Zn),gn.subVectors(t.a,Zn),_n.subVectors(t.b,Zn),vn.subVectors(t.c,Zn),Ii.subVectors(_n,gn),Ui.subVectors(vn,_n),Yi.subVectors(gn,vn);let e=[0,-Ii.z,Ii.y,0,-Ui.z,Ui.y,0,-Yi.z,Yi.y,Ii.z,0,-Ii.x,Ui.z,0,-Ui.x,Yi.z,0,-Yi.x,-Ii.y,Ii.x,0,-Ui.y,Ui.x,0,-Yi.y,Yi.x,0];return!Ra(e,gn,_n,vn,Ps)||(e=[1,0,0,0,1,0,0,0,1],!Ra(e,gn,_n,vn,Ps))?!1:(Ls.crossVectors(Ii,Ui),e=[Ls.x,Ls.y,Ls.z],Ra(e,gn,_n,vn,Ps))}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,oi).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(oi).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(Mi[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),Mi[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),Mi[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),Mi[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),Mi[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),Mi[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),Mi[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),Mi[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(Mi),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(t){return this.min.fromArray(t.min),this.max.fromArray(t.max),this}}const Mi=[new D,new D,new D,new D,new D,new D,new D,new D],oi=new D,Cs=new dn,gn=new D,_n=new D,vn=new D,Ii=new D,Ui=new D,Yi=new D,Zn=new D,Ps=new D,Ls=new D,Ki=new D;function Ra(i,t,e,n,s){for(let a=0,r=i.length-3;a<=r;a+=3){Ki.fromArray(i,a);const o=s.x*Math.abs(Ki.x)+s.y*Math.abs(Ki.y)+s.z*Math.abs(Ki.z),l=t.dot(Ki),c=e.dot(Ki),h=n.dot(Ki);if(Math.max(-Math.max(l,c,h),Math.min(l,c,h))>o)return!1}return!0}const qh=new dn,Jn=new D,Ca=new D;class Es{constructor(t=new D,e=-1){this.isSphere=!0,this.center=t,this.radius=e}set(t,e){return this.center.copy(t),this.radius=e,this}setFromPoints(t,e){const n=this.center;e!==void 0?n.copy(e):qh.setFromPoints(t).getCenter(n);let s=0;for(let a=0,r=t.length;a<r;a++)s=Math.max(s,n.distanceToSquared(t[a]));return this.radius=Math.sqrt(s),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){const e=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=e*e}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,e){const n=this.center.distanceToSquared(t);return e.copy(t),n>this.radius*this.radius&&(e.sub(this.center).normalize(),e.multiplyScalar(this.radius).add(this.center)),e}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;Jn.subVectors(t,this.center);const e=Jn.lengthSq();if(e>this.radius*this.radius){const n=Math.sqrt(e),s=(n-this.radius)*.5;this.center.addScaledVector(Jn,s/n),this.radius+=s}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(Ca.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(Jn.copy(t.center).add(Ca)),this.expandByPoint(Jn.copy(t.center).sub(Ca))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(t){return this.radius=t.radius,this.center.fromArray(t.center),this}}const wi=new D,Pa=new D,Ds=new D,ki=new D,La=new D,Is=new D,Da=new D;class uc{constructor(t=new D,e=new D(0,0,-1)){this.origin=t,this.direction=e}set(t,e){return this.origin.copy(t),this.direction.copy(e),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,e){return e.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,wi)),this}closestPointToPoint(t,e){e.subVectors(t,this.origin);const n=e.dot(this.direction);return n<0?e.copy(this.origin):e.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){const e=wi.subVectors(t,this.origin).dot(this.direction);return e<0?this.origin.distanceToSquared(t):(wi.copy(this.origin).addScaledVector(this.direction,e),wi.distanceToSquared(t))}distanceSqToSegment(t,e,n,s){Pa.copy(t).add(e).multiplyScalar(.5),Ds.copy(e).sub(t).normalize(),ki.copy(this.origin).sub(Pa);const a=t.distanceTo(e)*.5,r=-this.direction.dot(Ds),o=ki.dot(this.direction),l=-ki.dot(Ds),c=ki.lengthSq(),h=Math.abs(1-r*r);let u,d,f,g;if(h>0)if(u=r*l-o,d=r*o-l,g=a*h,u>=0)if(d>=-g)if(d<=g){const _=1/h;u*=_,d*=_,f=u*(u+r*d+2*o)+d*(r*u+d+2*l)+c}else d=a,u=Math.max(0,-(r*d+o)),f=-u*u+d*(d+2*l)+c;else d=-a,u=Math.max(0,-(r*d+o)),f=-u*u+d*(d+2*l)+c;else d<=-g?(u=Math.max(0,-(-r*a+o)),d=u>0?-a:Math.min(Math.max(-a,-l),a),f=-u*u+d*(d+2*l)+c):d<=g?(u=0,d=Math.min(Math.max(-a,-l),a),f=d*(d+2*l)+c):(u=Math.max(0,-(r*a+o)),d=u>0?a:Math.min(Math.max(-a,-l),a),f=-u*u+d*(d+2*l)+c);else d=r>0?-a:a,u=Math.max(0,-(r*d+o)),f=-u*u+d*(d+2*l)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,u),s&&s.copy(Pa).addScaledVector(Ds,d),f}intersectSphere(t,e){wi.subVectors(t.center,this.origin);const n=wi.dot(this.direction),s=wi.dot(wi)-n*n,a=t.radius*t.radius;if(s>a)return null;const r=Math.sqrt(a-s),o=n-r,l=n+r;return l<0?null:o<0?this.at(l,e):this.at(o,e)}intersectsSphere(t){return t.radius<0?!1:this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){const e=t.normal.dot(this.direction);if(e===0)return t.distanceToPoint(this.origin)===0?0:null;const n=-(this.origin.dot(t.normal)+t.constant)/e;return n>=0?n:null}intersectPlane(t,e){const n=this.distanceToPlane(t);return n===null?null:this.at(n,e)}intersectsPlane(t){const e=t.distanceToPoint(this.origin);return e===0||t.normal.dot(this.direction)*e<0}intersectBox(t,e){let n,s,a,r,o,l;const c=1/this.direction.x,h=1/this.direction.y,u=1/this.direction.z,d=this.origin;return c>=0?(n=(t.min.x-d.x)*c,s=(t.max.x-d.x)*c):(n=(t.max.x-d.x)*c,s=(t.min.x-d.x)*c),h>=0?(a=(t.min.y-d.y)*h,r=(t.max.y-d.y)*h):(a=(t.max.y-d.y)*h,r=(t.min.y-d.y)*h),n>r||a>s||((a>n||isNaN(n))&&(n=a),(r<s||isNaN(s))&&(s=r),u>=0?(o=(t.min.z-d.z)*u,l=(t.max.z-d.z)*u):(o=(t.max.z-d.z)*u,l=(t.min.z-d.z)*u),n>l||o>s)||((o>n||n!==n)&&(n=o),(l<s||s!==s)&&(s=l),s<0)?null:this.at(n>=0?n:s,e)}intersectsBox(t){return this.intersectBox(t,wi)!==null}intersectTriangle(t,e,n,s,a){La.subVectors(e,t),Is.subVectors(n,t),Da.crossVectors(La,Is);let r=this.direction.dot(Da),o;if(r>0){if(s)return null;o=1}else if(r<0)o=-1,r=-r;else return null;ki.subVectors(this.origin,t);const l=o*this.direction.dot(Is.crossVectors(ki,Is));if(l<0)return null;const c=o*this.direction.dot(La.cross(ki));if(c<0||l+c>r)return null;const h=-o*ki.dot(Da);return h<0?null:this.at(h/r,a)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class se{constructor(t,e,n,s,a,r,o,l,c,h,u,d,f,g,_,m){se.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,e,n,s,a,r,o,l,c,h,u,d,f,g,_,m)}set(t,e,n,s,a,r,o,l,c,h,u,d,f,g,_,m){const p=this.elements;return p[0]=t,p[4]=e,p[8]=n,p[12]=s,p[1]=a,p[5]=r,p[9]=o,p[13]=l,p[2]=c,p[6]=h,p[10]=u,p[14]=d,p[3]=f,p[7]=g,p[11]=_,p[15]=m,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new se().fromArray(this.elements)}copy(t){const e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],e[9]=n[9],e[10]=n[10],e[11]=n[11],e[12]=n[12],e[13]=n[13],e[14]=n[14],e[15]=n[15],this}copyPosition(t){const e=this.elements,n=t.elements;return e[12]=n[12],e[13]=n[13],e[14]=n[14],this}setFromMatrix3(t){const e=t.elements;return this.set(e[0],e[3],e[6],0,e[1],e[4],e[7],0,e[2],e[5],e[8],0,0,0,0,1),this}extractBasis(t,e,n){return t.setFromMatrixColumn(this,0),e.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this}makeBasis(t,e,n){return this.set(t.x,e.x,n.x,0,t.y,e.y,n.y,0,t.z,e.z,n.z,0,0,0,0,1),this}extractRotation(t){const e=this.elements,n=t.elements,s=1/xn.setFromMatrixColumn(t,0).length(),a=1/xn.setFromMatrixColumn(t,1).length(),r=1/xn.setFromMatrixColumn(t,2).length();return e[0]=n[0]*s,e[1]=n[1]*s,e[2]=n[2]*s,e[3]=0,e[4]=n[4]*a,e[5]=n[5]*a,e[6]=n[6]*a,e[7]=0,e[8]=n[8]*r,e[9]=n[9]*r,e[10]=n[10]*r,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromEuler(t){const e=this.elements,n=t.x,s=t.y,a=t.z,r=Math.cos(n),o=Math.sin(n),l=Math.cos(s),c=Math.sin(s),h=Math.cos(a),u=Math.sin(a);if(t.order==="XYZ"){const d=r*h,f=r*u,g=o*h,_=o*u;e[0]=l*h,e[4]=-l*u,e[8]=c,e[1]=f+g*c,e[5]=d-_*c,e[9]=-o*l,e[2]=_-d*c,e[6]=g+f*c,e[10]=r*l}else if(t.order==="YXZ"){const d=l*h,f=l*u,g=c*h,_=c*u;e[0]=d+_*o,e[4]=g*o-f,e[8]=r*c,e[1]=r*u,e[5]=r*h,e[9]=-o,e[2]=f*o-g,e[6]=_+d*o,e[10]=r*l}else if(t.order==="ZXY"){const d=l*h,f=l*u,g=c*h,_=c*u;e[0]=d-_*o,e[4]=-r*u,e[8]=g+f*o,e[1]=f+g*o,e[5]=r*h,e[9]=_-d*o,e[2]=-r*c,e[6]=o,e[10]=r*l}else if(t.order==="ZYX"){const d=r*h,f=r*u,g=o*h,_=o*u;e[0]=l*h,e[4]=g*c-f,e[8]=d*c+_,e[1]=l*u,e[5]=_*c+d,e[9]=f*c-g,e[2]=-c,e[6]=o*l,e[10]=r*l}else if(t.order==="YZX"){const d=r*l,f=r*c,g=o*l,_=o*c;e[0]=l*h,e[4]=_-d*u,e[8]=g*u+f,e[1]=u,e[5]=r*h,e[9]=-o*h,e[2]=-c*h,e[6]=f*u+g,e[10]=d-_*u}else if(t.order==="XZY"){const d=r*l,f=r*c,g=o*l,_=o*c;e[0]=l*h,e[4]=-u,e[8]=c*h,e[1]=d*u+_,e[5]=r*h,e[9]=f*u-g,e[2]=g*u-f,e[6]=o*h,e[10]=_*u+d}return e[3]=0,e[7]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromQuaternion(t){return this.compose(jh,t,Yh)}lookAt(t,e,n){const s=this.elements;return Ye.subVectors(t,e),Ye.lengthSq()===0&&(Ye.z=1),Ye.normalize(),Ni.crossVectors(n,Ye),Ni.lengthSq()===0&&(Math.abs(n.z)===1?Ye.x+=1e-4:Ye.z+=1e-4,Ye.normalize(),Ni.crossVectors(n,Ye)),Ni.normalize(),Us.crossVectors(Ye,Ni),s[0]=Ni.x,s[4]=Us.x,s[8]=Ye.x,s[1]=Ni.y,s[5]=Us.y,s[9]=Ye.y,s[2]=Ni.z,s[6]=Us.z,s[10]=Ye.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const n=t.elements,s=e.elements,a=this.elements,r=n[0],o=n[4],l=n[8],c=n[12],h=n[1],u=n[5],d=n[9],f=n[13],g=n[2],_=n[6],m=n[10],p=n[14],w=n[3],A=n[7],M=n[11],P=n[15],S=s[0],T=s[4],C=s[8],x=s[12],y=s[1],E=s[5],I=s[9],N=s[13],H=s[2],V=s[6],q=s[10],Z=s[14],G=s[3],rt=s[7],ht=s[11],St=s[15];return a[0]=r*S+o*y+l*H+c*G,a[4]=r*T+o*E+l*V+c*rt,a[8]=r*C+o*I+l*q+c*ht,a[12]=r*x+o*N+l*Z+c*St,a[1]=h*S+u*y+d*H+f*G,a[5]=h*T+u*E+d*V+f*rt,a[9]=h*C+u*I+d*q+f*ht,a[13]=h*x+u*N+d*Z+f*St,a[2]=g*S+_*y+m*H+p*G,a[6]=g*T+_*E+m*V+p*rt,a[10]=g*C+_*I+m*q+p*ht,a[14]=g*x+_*N+m*Z+p*St,a[3]=w*S+A*y+M*H+P*G,a[7]=w*T+A*E+M*V+P*rt,a[11]=w*C+A*I+M*q+P*ht,a[15]=w*x+A*N+M*Z+P*St,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[4]*=t,e[8]*=t,e[12]*=t,e[1]*=t,e[5]*=t,e[9]*=t,e[13]*=t,e[2]*=t,e[6]*=t,e[10]*=t,e[14]*=t,e[3]*=t,e[7]*=t,e[11]*=t,e[15]*=t,this}determinant(){const t=this.elements,e=t[0],n=t[4],s=t[8],a=t[12],r=t[1],o=t[5],l=t[9],c=t[13],h=t[2],u=t[6],d=t[10],f=t[14],g=t[3],_=t[7],m=t[11],p=t[15];return g*(+a*l*u-s*c*u-a*o*d+n*c*d+s*o*f-n*l*f)+_*(+e*l*f-e*c*d+a*r*d-s*r*f+s*c*h-a*l*h)+m*(+e*c*u-e*o*f-a*r*u+n*r*f+a*o*h-n*c*h)+p*(-s*o*h-e*l*u+e*o*d+s*r*u-n*r*d+n*l*h)}transpose(){const t=this.elements;let e;return e=t[1],t[1]=t[4],t[4]=e,e=t[2],t[2]=t[8],t[8]=e,e=t[6],t[6]=t[9],t[9]=e,e=t[3],t[3]=t[12],t[12]=e,e=t[7],t[7]=t[13],t[13]=e,e=t[11],t[11]=t[14],t[14]=e,this}setPosition(t,e,n){const s=this.elements;return t.isVector3?(s[12]=t.x,s[13]=t.y,s[14]=t.z):(s[12]=t,s[13]=e,s[14]=n),this}invert(){const t=this.elements,e=t[0],n=t[1],s=t[2],a=t[3],r=t[4],o=t[5],l=t[6],c=t[7],h=t[8],u=t[9],d=t[10],f=t[11],g=t[12],_=t[13],m=t[14],p=t[15],w=u*m*c-_*d*c+_*l*f-o*m*f-u*l*p+o*d*p,A=g*d*c-h*m*c-g*l*f+r*m*f+h*l*p-r*d*p,M=h*_*c-g*u*c+g*o*f-r*_*f-h*o*p+r*u*p,P=g*u*l-h*_*l-g*o*d+r*_*d+h*o*m-r*u*m,S=e*w+n*A+s*M+a*P;if(S===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const T=1/S;return t[0]=w*T,t[1]=(_*d*a-u*m*a-_*s*f+n*m*f+u*s*p-n*d*p)*T,t[2]=(o*m*a-_*l*a+_*s*c-n*m*c-o*s*p+n*l*p)*T,t[3]=(u*l*a-o*d*a-u*s*c+n*d*c+o*s*f-n*l*f)*T,t[4]=A*T,t[5]=(h*m*a-g*d*a+g*s*f-e*m*f-h*s*p+e*d*p)*T,t[6]=(g*l*a-r*m*a-g*s*c+e*m*c+r*s*p-e*l*p)*T,t[7]=(r*d*a-h*l*a+h*s*c-e*d*c-r*s*f+e*l*f)*T,t[8]=M*T,t[9]=(g*u*a-h*_*a-g*n*f+e*_*f+h*n*p-e*u*p)*T,t[10]=(r*_*a-g*o*a+g*n*c-e*_*c-r*n*p+e*o*p)*T,t[11]=(h*o*a-r*u*a-h*n*c+e*u*c+r*n*f-e*o*f)*T,t[12]=P*T,t[13]=(h*_*s-g*u*s+g*n*d-e*_*d-h*n*m+e*u*m)*T,t[14]=(g*o*s-r*_*s-g*n*l+e*_*l+r*n*m-e*o*m)*T,t[15]=(r*u*s-h*o*s+h*n*l-e*u*l-r*n*d+e*o*d)*T,this}scale(t){const e=this.elements,n=t.x,s=t.y,a=t.z;return e[0]*=n,e[4]*=s,e[8]*=a,e[1]*=n,e[5]*=s,e[9]*=a,e[2]*=n,e[6]*=s,e[10]*=a,e[3]*=n,e[7]*=s,e[11]*=a,this}getMaxScaleOnAxis(){const t=this.elements,e=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],n=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],s=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(e,n,s))}makeTranslation(t,e,n){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,e,0,0,1,n,0,0,0,1),this}makeRotationX(t){const e=Math.cos(t),n=Math.sin(t);return this.set(1,0,0,0,0,e,-n,0,0,n,e,0,0,0,0,1),this}makeRotationY(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,0,n,0,0,1,0,0,-n,0,e,0,0,0,0,1),this}makeRotationZ(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,0,n,e,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,e){const n=Math.cos(e),s=Math.sin(e),a=1-n,r=t.x,o=t.y,l=t.z,c=a*r,h=a*o;return this.set(c*r+n,c*o-s*l,c*l+s*o,0,c*o+s*l,h*o+n,h*l-s*r,0,c*l-s*o,h*l+s*r,a*l*l+n,0,0,0,0,1),this}makeScale(t,e,n){return this.set(t,0,0,0,0,e,0,0,0,0,n,0,0,0,0,1),this}makeShear(t,e,n,s,a,r){return this.set(1,n,a,0,t,1,r,0,e,s,1,0,0,0,0,1),this}compose(t,e,n){const s=this.elements,a=e._x,r=e._y,o=e._z,l=e._w,c=a+a,h=r+r,u=o+o,d=a*c,f=a*h,g=a*u,_=r*h,m=r*u,p=o*u,w=l*c,A=l*h,M=l*u,P=n.x,S=n.y,T=n.z;return s[0]=(1-(_+p))*P,s[1]=(f+M)*P,s[2]=(g-A)*P,s[3]=0,s[4]=(f-M)*S,s[5]=(1-(d+p))*S,s[6]=(m+w)*S,s[7]=0,s[8]=(g+A)*T,s[9]=(m-w)*T,s[10]=(1-(d+_))*T,s[11]=0,s[12]=t.x,s[13]=t.y,s[14]=t.z,s[15]=1,this}decompose(t,e,n){const s=this.elements;let a=xn.set(s[0],s[1],s[2]).length();const r=xn.set(s[4],s[5],s[6]).length(),o=xn.set(s[8],s[9],s[10]).length();this.determinant()<0&&(a=-a),t.x=s[12],t.y=s[13],t.z=s[14],li.copy(this);const c=1/a,h=1/r,u=1/o;return li.elements[0]*=c,li.elements[1]*=c,li.elements[2]*=c,li.elements[4]*=h,li.elements[5]*=h,li.elements[6]*=h,li.elements[8]*=u,li.elements[9]*=u,li.elements[10]*=u,e.setFromRotationMatrix(li),n.x=a,n.y=r,n.z=o,this}makePerspective(t,e,n,s,a,r,o=vi,l=!1){const c=this.elements,h=2*a/(e-t),u=2*a/(n-s),d=(e+t)/(e-t),f=(n+s)/(n-s);let g,_;if(l)g=a/(r-a),_=r*a/(r-a);else if(o===vi)g=-(r+a)/(r-a),_=-2*r*a/(r-a);else if(o===ua)g=-r/(r-a),_=-r*a/(r-a);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return c[0]=h,c[4]=0,c[8]=d,c[12]=0,c[1]=0,c[5]=u,c[9]=f,c[13]=0,c[2]=0,c[6]=0,c[10]=g,c[14]=_,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(t,e,n,s,a,r,o=vi,l=!1){const c=this.elements,h=2/(e-t),u=2/(n-s),d=-(e+t)/(e-t),f=-(n+s)/(n-s);let g,_;if(l)g=1/(r-a),_=r/(r-a);else if(o===vi)g=-2/(r-a),_=-(r+a)/(r-a);else if(o===ua)g=-1/(r-a),_=-a/(r-a);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return c[0]=h,c[4]=0,c[8]=0,c[12]=d,c[1]=0,c[5]=u,c[9]=0,c[13]=f,c[2]=0,c[6]=0,c[10]=g,c[14]=_,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(t){const e=this.elements,n=t.elements;for(let s=0;s<16;s++)if(e[s]!==n[s])return!1;return!0}fromArray(t,e=0){for(let n=0;n<16;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){const n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t[e+9]=n[9],t[e+10]=n[10],t[e+11]=n[11],t[e+12]=n[12],t[e+13]=n[13],t[e+14]=n[14],t[e+15]=n[15],t}}const xn=new D,li=new se,jh=new D(0,0,0),Yh=new D(1,1,1),Ni=new D,Us=new D,Ye=new D,jo=new se,Yo=new Ss;class yi{constructor(t=0,e=0,n=0,s=yi.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=e,this._z=n,this._order=s}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,e,n,s=this._order){return this._x=t,this._y=e,this._z=n,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,e=this._order,n=!0){const s=t.elements,a=s[0],r=s[4],o=s[8],l=s[1],c=s[5],h=s[9],u=s[2],d=s[6],f=s[10];switch(e){case"XYZ":this._y=Math.asin(Vt(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-h,f),this._z=Math.atan2(-r,a)):(this._x=Math.atan2(d,c),this._z=0);break;case"YXZ":this._x=Math.asin(-Vt(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(o,f),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-u,a),this._z=0);break;case"ZXY":this._x=Math.asin(Vt(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-u,f),this._z=Math.atan2(-r,c)):(this._y=0,this._z=Math.atan2(l,a));break;case"ZYX":this._y=Math.asin(-Vt(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(d,f),this._z=Math.atan2(l,a)):(this._x=0,this._z=Math.atan2(-r,c));break;case"YZX":this._z=Math.asin(Vt(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-h,c),this._y=Math.atan2(-u,a)):(this._x=0,this._y=Math.atan2(o,f));break;case"XZY":this._z=Math.asin(-Vt(r,-1,1)),Math.abs(r)<.9999999?(this._x=Math.atan2(d,c),this._y=Math.atan2(o,a)):(this._x=Math.atan2(-h,f),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+e)}return this._order=e,n===!0&&this._onChangeCallback(),this}setFromQuaternion(t,e,n){return jo.makeRotationFromQuaternion(t),this.setFromRotationMatrix(jo,e,n)}setFromVector3(t,e=this._order){return this.set(t.x,t.y,t.z,e)}reorder(t){return Yo.setFromEuler(this),this.setFromQuaternion(Yo,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}yi.DEFAULT_ORDER="XYZ";class so{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}}let Kh=0;const Ko=new D,yn=new Ss,Si=new se,ks=new D,Qn=new D,Zh=new D,Jh=new Ss,Zo=new D(1,0,0),Jo=new D(0,1,0),Qo=new D(0,0,1),tl={type:"added"},Qh={type:"removed"},bn={type:"childadded",child:null},Ia={type:"childremoved",child:null};class Ie extends qn{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Kh++}),this.uuid=Wi(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=Ie.DEFAULT_UP.clone();const t=new D,e=new yi,n=new Ss,s=new D(1,1,1);function a(){n.setFromEuler(e,!1)}function r(){e.setFromQuaternion(n,void 0,!1)}e._onChange(a),n._onChange(r),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:e},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new se},normalMatrix:{value:new Nt}}),this.matrix=new se,this.matrixWorld=new se,this.matrixAutoUpdate=Ie.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=Ie.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new so,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,e){this.quaternion.setFromAxisAngle(t,e)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,e){return yn.setFromAxisAngle(t,e),this.quaternion.multiply(yn),this}rotateOnWorldAxis(t,e){return yn.setFromAxisAngle(t,e),this.quaternion.premultiply(yn),this}rotateX(t){return this.rotateOnAxis(Zo,t)}rotateY(t){return this.rotateOnAxis(Jo,t)}rotateZ(t){return this.rotateOnAxis(Qo,t)}translateOnAxis(t,e){return Ko.copy(t).applyQuaternion(this.quaternion),this.position.add(Ko.multiplyScalar(e)),this}translateX(t){return this.translateOnAxis(Zo,t)}translateY(t){return this.translateOnAxis(Jo,t)}translateZ(t){return this.translateOnAxis(Qo,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(Si.copy(this.matrixWorld).invert())}lookAt(t,e,n){t.isVector3?ks.copy(t):ks.set(t,e,n);const s=this.parent;this.updateWorldMatrix(!0,!1),Qn.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Si.lookAt(Qn,ks,this.up):Si.lookAt(ks,Qn,this.up),this.quaternion.setFromRotationMatrix(Si),s&&(Si.extractRotation(s.matrixWorld),yn.setFromRotationMatrix(Si),this.quaternion.premultiply(yn.invert()))}add(t){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return t===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.removeFromParent(),t.parent=this,this.children.push(t),t.dispatchEvent(tl),bn.child=t,this.dispatchEvent(bn),bn.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}const e=this.children.indexOf(t);return e!==-1&&(t.parent=null,this.children.splice(e,1),t.dispatchEvent(Qh),Ia.child=t,this.dispatchEvent(Ia),Ia.child=null),this}removeFromParent(){const t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),Si.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),Si.multiply(t.parent.matrixWorld)),t.applyMatrix4(Si),t.removeFromParent(),t.parent=this,this.children.push(t),t.updateWorldMatrix(!1,!0),t.dispatchEvent(tl),bn.child=t,this.dispatchEvent(bn),bn.child=null,this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,e){if(this[t]===e)return this;for(let n=0,s=this.children.length;n<s;n++){const r=this.children[n].getObjectByProperty(t,e);if(r!==void 0)return r}}getObjectsByProperty(t,e,n=[]){this[t]===e&&n.push(this);const s=this.children;for(let a=0,r=s.length;a<r;a++)s[a].getObjectsByProperty(t,e,n);return n}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Qn,t,Zh),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Qn,Jh,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);const e=this.matrixWorld.elements;return t.set(e[8],e[9],e[10]).normalize()}raycast(){}traverse(t){t(this);const e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);const e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].traverseVisible(t)}traverseAncestors(t){const e=this.parent;e!==null&&(t(e),e.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,t=!0);const e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].updateMatrixWorld(t)}updateWorldMatrix(t,e){const n=this.parent;if(t===!0&&n!==null&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),e===!0){const s=this.children;for(let a=0,r=s.length;a<r;a++)s[a].updateWorldMatrix(!1,!0)}}toJSON(t){const e=t===void 0||typeof t=="string",n={};e&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});const s={};s.uuid=this.uuid,s.type=this.type,this.name!==""&&(s.name=this.name),this.castShadow===!0&&(s.castShadow=!0),this.receiveShadow===!0&&(s.receiveShadow=!0),this.visible===!1&&(s.visible=!1),this.frustumCulled===!1&&(s.frustumCulled=!1),this.renderOrder!==0&&(s.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(s.matrixAutoUpdate=!1),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.geometryInfo=this._geometryInfo.map(o=>({...o,boundingBox:o.boundingBox?o.boundingBox.toJSON():void 0,boundingSphere:o.boundingSphere?o.boundingSphere.toJSON():void 0})),s.instanceInfo=this._instanceInfo.map(o=>({...o})),s.availableInstanceIds=this._availableInstanceIds.slice(),s.availableGeometryIds=this._availableGeometryIds.slice(),s.nextIndexStart=this._nextIndexStart,s.nextVertexStart=this._nextVertexStart,s.geometryCount=this._geometryCount,s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.matricesTexture=this._matricesTexture.toJSON(t),s.indirectTexture=this._indirectTexture.toJSON(t),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(t)),this.boundingSphere!==null&&(s.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(s.boundingBox=this.boundingBox.toJSON()));function a(o,l){return o[l.uuid]===void 0&&(o[l.uuid]=l.toJSON(t)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=a(t.geometries,this.geometry);const o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){const l=o.shapes;if(Array.isArray(l))for(let c=0,h=l.length;c<h;c++){const u=l[c];a(t.shapes,u)}else a(t.shapes,l)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(a(t.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const o=[];for(let l=0,c=this.material.length;l<c;l++)o.push(a(t.materials,this.material[l]));s.material=o}else s.material=a(t.materials,this.material);if(this.children.length>0){s.children=[];for(let o=0;o<this.children.length;o++)s.children.push(this.children[o].toJSON(t).object)}if(this.animations.length>0){s.animations=[];for(let o=0;o<this.animations.length;o++){const l=this.animations[o];s.animations.push(a(t.animations,l))}}if(e){const o=r(t.geometries),l=r(t.materials),c=r(t.textures),h=r(t.images),u=r(t.shapes),d=r(t.skeletons),f=r(t.animations),g=r(t.nodes);o.length>0&&(n.geometries=o),l.length>0&&(n.materials=l),c.length>0&&(n.textures=c),h.length>0&&(n.images=h),u.length>0&&(n.shapes=u),d.length>0&&(n.skeletons=d),f.length>0&&(n.animations=f),g.length>0&&(n.nodes=g)}return n.object=s,n;function r(o){const l=[];for(const c in o){const h=o[c];delete h.metadata,l.push(h)}return l}}clone(t){return new this.constructor().copy(this,t)}copy(t,e=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),e===!0)for(let n=0;n<t.children.length;n++){const s=t.children[n];this.add(s.clone())}return this}}Ie.DEFAULT_UP=new D(0,1,0);Ie.DEFAULT_MATRIX_AUTO_UPDATE=!0;Ie.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;const ci=new D,Ei=new D,Ua=new D,Ti=new D,Mn=new D,wn=new D,el=new D,ka=new D,Na=new D,Fa=new D,Oa=new ne,za=new ne,Ba=new ne;class ri{constructor(t=new D,e=new D,n=new D){this.a=t,this.b=e,this.c=n}static getNormal(t,e,n,s){s.subVectors(n,e),ci.subVectors(t,e),s.cross(ci);const a=s.lengthSq();return a>0?s.multiplyScalar(1/Math.sqrt(a)):s.set(0,0,0)}static getBarycoord(t,e,n,s,a){ci.subVectors(s,e),Ei.subVectors(n,e),Ua.subVectors(t,e);const r=ci.dot(ci),o=ci.dot(Ei),l=ci.dot(Ua),c=Ei.dot(Ei),h=Ei.dot(Ua),u=r*c-o*o;if(u===0)return a.set(0,0,0),null;const d=1/u,f=(c*l-o*h)*d,g=(r*h-o*l)*d;return a.set(1-f-g,g,f)}static containsPoint(t,e,n,s){return this.getBarycoord(t,e,n,s,Ti)===null?!1:Ti.x>=0&&Ti.y>=0&&Ti.x+Ti.y<=1}static getInterpolation(t,e,n,s,a,r,o,l){return this.getBarycoord(t,e,n,s,Ti)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(a,Ti.x),l.addScaledVector(r,Ti.y),l.addScaledVector(o,Ti.z),l)}static getInterpolatedAttribute(t,e,n,s,a,r){return Oa.setScalar(0),za.setScalar(0),Ba.setScalar(0),Oa.fromBufferAttribute(t,e),za.fromBufferAttribute(t,n),Ba.fromBufferAttribute(t,s),r.setScalar(0),r.addScaledVector(Oa,a.x),r.addScaledVector(za,a.y),r.addScaledVector(Ba,a.z),r}static isFrontFacing(t,e,n,s){return ci.subVectors(n,e),Ei.subVectors(t,e),ci.cross(Ei).dot(s)<0}set(t,e,n){return this.a.copy(t),this.b.copy(e),this.c.copy(n),this}setFromPointsAndIndices(t,e,n,s){return this.a.copy(t[e]),this.b.copy(t[n]),this.c.copy(t[s]),this}setFromAttributeAndIndices(t,e,n,s){return this.a.fromBufferAttribute(t,e),this.b.fromBufferAttribute(t,n),this.c.fromBufferAttribute(t,s),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return ci.subVectors(this.c,this.b),Ei.subVectors(this.a,this.b),ci.cross(Ei).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return ri.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,e){return ri.getBarycoord(t,this.a,this.b,this.c,e)}getInterpolation(t,e,n,s,a){return ri.getInterpolation(t,this.a,this.b,this.c,e,n,s,a)}containsPoint(t){return ri.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return ri.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,e){const n=this.a,s=this.b,a=this.c;let r,o;Mn.subVectors(s,n),wn.subVectors(a,n),ka.subVectors(t,n);const l=Mn.dot(ka),c=wn.dot(ka);if(l<=0&&c<=0)return e.copy(n);Na.subVectors(t,s);const h=Mn.dot(Na),u=wn.dot(Na);if(h>=0&&u<=h)return e.copy(s);const d=l*u-h*c;if(d<=0&&l>=0&&h<=0)return r=l/(l-h),e.copy(n).addScaledVector(Mn,r);Fa.subVectors(t,a);const f=Mn.dot(Fa),g=wn.dot(Fa);if(g>=0&&f<=g)return e.copy(a);const _=f*c-l*g;if(_<=0&&c>=0&&g<=0)return o=c/(c-g),e.copy(n).addScaledVector(wn,o);const m=h*g-f*u;if(m<=0&&u-h>=0&&f-g>=0)return el.subVectors(a,s),o=(u-h)/(u-h+(f-g)),e.copy(s).addScaledVector(el,o);const p=1/(m+_+d);return r=_*p,o=d*p,e.copy(n).addScaledVector(Mn,r).addScaledVector(wn,o)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}}const dc={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Fi={h:0,s:0,l:0},Ns={h:0,s:0,l:0};function Ha(i,t,e){return e<0&&(e+=1),e>1&&(e-=1),e<1/6?i+(t-i)*6*e:e<1/2?t:e<2/3?i+(t-i)*6*(2/3-e):i}class Ft{constructor(t,e,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,e,n)}set(t,e,n){if(e===void 0&&n===void 0){const s=t;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(t,e,n);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,e=Pe){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,qt.colorSpaceToWorking(this,e),this}setRGB(t,e,n,s=qt.workingColorSpace){return this.r=t,this.g=e,this.b=n,qt.colorSpaceToWorking(this,s),this}setHSL(t,e,n,s=qt.workingColorSpace){if(t=Oh(t,1),e=Vt(e,0,1),n=Vt(n,0,1),e===0)this.r=this.g=this.b=n;else{const a=n<=.5?n*(1+e):n+e-n*e,r=2*n-a;this.r=Ha(r,a,t+1/3),this.g=Ha(r,a,t),this.b=Ha(r,a,t-1/3)}return qt.colorSpaceToWorking(this,s),this}setStyle(t,e=Pe){function n(a){a!==void 0&&parseFloat(a)<1&&console.warn("THREE.Color: Alpha component of "+t+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(t)){let a;const r=s[1],o=s[2];switch(r){case"rgb":case"rgba":if(a=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(a[4]),this.setRGB(Math.min(255,parseInt(a[1],10))/255,Math.min(255,parseInt(a[2],10))/255,Math.min(255,parseInt(a[3],10))/255,e);if(a=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(a[4]),this.setRGB(Math.min(100,parseInt(a[1],10))/100,Math.min(100,parseInt(a[2],10))/100,Math.min(100,parseInt(a[3],10))/100,e);break;case"hsl":case"hsla":if(a=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(a[4]),this.setHSL(parseFloat(a[1])/360,parseFloat(a[2])/100,parseFloat(a[3])/100,e);break;default:console.warn("THREE.Color: Unknown color model "+t)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(t)){const a=s[1],r=a.length;if(r===3)return this.setRGB(parseInt(a.charAt(0),16)/15,parseInt(a.charAt(1),16)/15,parseInt(a.charAt(2),16)/15,e);if(r===6)return this.setHex(parseInt(a,16),e);console.warn("THREE.Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,e);return this}setColorName(t,e=Pe){const n=dc[t.toLowerCase()];return n!==void 0?this.setHex(n,e):console.warn("THREE.Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=Li(t.r),this.g=Li(t.g),this.b=Li(t.b),this}copyLinearToSRGB(t){return this.r=Nn(t.r),this.g=Nn(t.g),this.b=Nn(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=Pe){return qt.workingToColorSpace(Oe.copy(this),t),Math.round(Vt(Oe.r*255,0,255))*65536+Math.round(Vt(Oe.g*255,0,255))*256+Math.round(Vt(Oe.b*255,0,255))}getHexString(t=Pe){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,e=qt.workingColorSpace){qt.workingToColorSpace(Oe.copy(this),e);const n=Oe.r,s=Oe.g,a=Oe.b,r=Math.max(n,s,a),o=Math.min(n,s,a);let l,c;const h=(o+r)/2;if(o===r)l=0,c=0;else{const u=r-o;switch(c=h<=.5?u/(r+o):u/(2-r-o),r){case n:l=(s-a)/u+(s<a?6:0);break;case s:l=(a-n)/u+2;break;case a:l=(n-s)/u+4;break}l/=6}return t.h=l,t.s=c,t.l=h,t}getRGB(t,e=qt.workingColorSpace){return qt.workingToColorSpace(Oe.copy(this),e),t.r=Oe.r,t.g=Oe.g,t.b=Oe.b,t}getStyle(t=Pe){qt.workingToColorSpace(Oe.copy(this),t);const e=Oe.r,n=Oe.g,s=Oe.b;return t!==Pe?`color(${t} ${e.toFixed(3)} ${n.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(e*255)},${Math.round(n*255)},${Math.round(s*255)})`}offsetHSL(t,e,n){return this.getHSL(Fi),this.setHSL(Fi.h+t,Fi.s+e,Fi.l+n)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,e){return this.r=t.r+e.r,this.g=t.g+e.g,this.b=t.b+e.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,e){return this.r+=(t.r-this.r)*e,this.g+=(t.g-this.g)*e,this.b+=(t.b-this.b)*e,this}lerpColors(t,e,n){return this.r=t.r+(e.r-t.r)*n,this.g=t.g+(e.g-t.g)*n,this.b=t.b+(e.b-t.b)*n,this}lerpHSL(t,e){this.getHSL(Fi),t.getHSL(Ns);const n=wa(Fi.h,Ns.h,e),s=wa(Fi.s,Ns.s,e),a=wa(Fi.l,Ns.l,e);return this.setHSL(n,s,a),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){const e=this.r,n=this.g,s=this.b,a=t.elements;return this.r=a[0]*e+a[3]*n+a[6]*s,this.g=a[1]*e+a[4]*n+a[7]*s,this.b=a[2]*e+a[5]*n+a[8]*s,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,e=0){return this.r=t[e],this.g=t[e+1],this.b=t[e+2],this}toArray(t=[],e=0){return t[e]=this.r,t[e+1]=this.g,t[e+2]=this.b,t}fromBufferAttribute(t,e){return this.r=t.getX(e),this.g=t.getY(e),this.b=t.getZ(e),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const Oe=new Ft;Ft.NAMES=dc;let tu=0;class jn extends qn{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:tu++}),this.uuid=Wi(),this.name="",this.type="Material",this.blending=kn,this.side=Xi,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=sr,this.blendDst=ar,this.blendEquation=sn,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Ft(0,0,0),this.blendAlpha=0,this.depthFunc=Bn,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Go,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=pn,this.stencilZFail=pn,this.stencilZPass=pn,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(const e in t){const n=t[e];if(n===void 0){console.warn(`THREE.Material: parameter '${e}' has value of undefined.`);continue}const s=this[e];if(s===void 0){console.warn(`THREE.Material: '${e}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(n):s&&s.isVector3&&n&&n.isVector3?s.copy(n):this[e]=n}}toJSON(t){const e=t===void 0||typeof t=="string";e&&(t={textures:{},images:{}});const n={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(t).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(t).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(t).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(t).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(t).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(t).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(t).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==kn&&(n.blending=this.blending),this.side!==Xi&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==sr&&(n.blendSrc=this.blendSrc),this.blendDst!==ar&&(n.blendDst=this.blendDst),this.blendEquation!==sn&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==Bn&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==Go&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==pn&&(n.stencilFail=this.stencilFail),this.stencilZFail!==pn&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==pn&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function s(a){const r=[];for(const o in a){const l=a[o];delete l.metadata,r.push(l)}return r}if(e){const a=s(t.textures),r=s(t.images);a.length>0&&(n.textures=a),r.length>0&&(n.images=r)}return n}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;const e=t.clippingPlanes;let n=null;if(e!==null){const s=e.length;n=new Array(s);for(let a=0;a!==s;++a)n[a]=e[a].clone()}return this.clippingPlanes=n,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===!0&&this.version++}}class ui extends jn{constructor(t){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Ft(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new yi,this.combine=Zl,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}}const ye=new D,Fs=new Ut;let eu=0;class ei{constructor(t,e,n=!1){if(Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:eu++}),this.name="",this.array=t,this.itemSize=e,this.count=t!==void 0?t.length/e:0,this.normalized=n,this.usage=Wr,this.updateRanges=[],this.gpuType=_i,this.version=0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this}copyAt(t,e,n){t*=this.itemSize,n*=e.itemSize;for(let s=0,a=this.itemSize;s<a;s++)this.array[t+s]=e.array[n+s];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let e=0,n=this.count;e<n;e++)Fs.fromBufferAttribute(this,e),Fs.applyMatrix3(t),this.setXY(e,Fs.x,Fs.y);else if(this.itemSize===3)for(let e=0,n=this.count;e<n;e++)ye.fromBufferAttribute(this,e),ye.applyMatrix3(t),this.setXYZ(e,ye.x,ye.y,ye.z);return this}applyMatrix4(t){for(let e=0,n=this.count;e<n;e++)ye.fromBufferAttribute(this,e),ye.applyMatrix4(t),this.setXYZ(e,ye.x,ye.y,ye.z);return this}applyNormalMatrix(t){for(let e=0,n=this.count;e<n;e++)ye.fromBufferAttribute(this,e),ye.applyNormalMatrix(t),this.setXYZ(e,ye.x,ye.y,ye.z);return this}transformDirection(t){for(let e=0,n=this.count;e<n;e++)ye.fromBufferAttribute(this,e),ye.transformDirection(t),this.setXYZ(e,ye.x,ye.y,ye.z);return this}set(t,e=0){return this.array.set(t,e),this}getComponent(t,e){let n=this.array[t*this.itemSize+e];return this.normalized&&(n=mi(n,this.array)),n}setComponent(t,e,n){return this.normalized&&(n=te(n,this.array)),this.array[t*this.itemSize+e]=n,this}getX(t){let e=this.array[t*this.itemSize];return this.normalized&&(e=mi(e,this.array)),e}setX(t,e){return this.normalized&&(e=te(e,this.array)),this.array[t*this.itemSize]=e,this}getY(t){let e=this.array[t*this.itemSize+1];return this.normalized&&(e=mi(e,this.array)),e}setY(t,e){return this.normalized&&(e=te(e,this.array)),this.array[t*this.itemSize+1]=e,this}getZ(t){let e=this.array[t*this.itemSize+2];return this.normalized&&(e=mi(e,this.array)),e}setZ(t,e){return this.normalized&&(e=te(e,this.array)),this.array[t*this.itemSize+2]=e,this}getW(t){let e=this.array[t*this.itemSize+3];return this.normalized&&(e=mi(e,this.array)),e}setW(t,e){return this.normalized&&(e=te(e,this.array)),this.array[t*this.itemSize+3]=e,this}setXY(t,e,n){return t*=this.itemSize,this.normalized&&(e=te(e,this.array),n=te(n,this.array)),this.array[t+0]=e,this.array[t+1]=n,this}setXYZ(t,e,n,s){return t*=this.itemSize,this.normalized&&(e=te(e,this.array),n=te(n,this.array),s=te(s,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=s,this}setXYZW(t,e,n,s,a){return t*=this.itemSize,this.normalized&&(e=te(e,this.array),n=te(n,this.array),s=te(s,this.array),a=te(a,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=s,this.array[t+3]=a,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(t.name=this.name),this.usage!==Wr&&(t.usage=this.usage),t}}class fc extends ei{constructor(t,e,n){super(new Uint16Array(t),e,n)}}class pc extends ei{constructor(t,e,n){super(new Uint32Array(t),e,n)}}class Se extends ei{constructor(t,e,n){super(new Float32Array(t),e,n)}}let iu=0;const ai=new se,Ga=new Ie,Sn=new D,Ke=new dn,ts=new dn,Re=new D;class ii extends qn{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:iu++}),this.uuid=Wi(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new(cc(t)?pc:fc)(t,1):this.index=t,this}setIndirect(t){return this.indirect=t,this}getIndirect(){return this.indirect}getAttribute(t){return this.attributes[t]}setAttribute(t,e){return this.attributes[t]=e,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,e,n=0){this.groups.push({start:t,count:e,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(t,e){this.drawRange.start=t,this.drawRange.count=e}applyMatrix4(t){const e=this.attributes.position;e!==void 0&&(e.applyMatrix4(t),e.needsUpdate=!0);const n=this.attributes.normal;if(n!==void 0){const a=new Nt().getNormalMatrix(t);n.applyNormalMatrix(a),n.needsUpdate=!0}const s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(t),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(t){return ai.makeRotationFromQuaternion(t),this.applyMatrix4(ai),this}rotateX(t){return ai.makeRotationX(t),this.applyMatrix4(ai),this}rotateY(t){return ai.makeRotationY(t),this.applyMatrix4(ai),this}rotateZ(t){return ai.makeRotationZ(t),this.applyMatrix4(ai),this}translate(t,e,n){return ai.makeTranslation(t,e,n),this.applyMatrix4(ai),this}scale(t,e,n){return ai.makeScale(t,e,n),this.applyMatrix4(ai),this}lookAt(t){return Ga.lookAt(t),Ga.updateMatrix(),this.applyMatrix4(Ga.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Sn).negate(),this.translate(Sn.x,Sn.y,Sn.z),this}setFromPoints(t){const e=this.getAttribute("position");if(e===void 0){const n=[];for(let s=0,a=t.length;s<a;s++){const r=t[s];n.push(r.x,r.y,r.z||0)}this.setAttribute("position",new Se(n,3))}else{const n=Math.min(t.length,e.count);for(let s=0;s<n;s++){const a=t[s];e.setXYZ(s,a.x,a.y,a.z||0)}t.length>e.count&&console.warn("THREE.BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),e.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new dn);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new D(-1/0,-1/0,-1/0),new D(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),e)for(let n=0,s=e.length;n<s;n++){const a=e[n];Ke.setFromBufferAttribute(a),this.morphTargetsRelative?(Re.addVectors(this.boundingBox.min,Ke.min),this.boundingBox.expandByPoint(Re),Re.addVectors(this.boundingBox.max,Ke.max),this.boundingBox.expandByPoint(Re)):(this.boundingBox.expandByPoint(Ke.min),this.boundingBox.expandByPoint(Ke.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Es);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new D,1/0);return}if(t){const n=this.boundingSphere.center;if(Ke.setFromBufferAttribute(t),e)for(let a=0,r=e.length;a<r;a++){const o=e[a];ts.setFromBufferAttribute(o),this.morphTargetsRelative?(Re.addVectors(Ke.min,ts.min),Ke.expandByPoint(Re),Re.addVectors(Ke.max,ts.max),Ke.expandByPoint(Re)):(Ke.expandByPoint(ts.min),Ke.expandByPoint(ts.max))}Ke.getCenter(n);let s=0;for(let a=0,r=t.count;a<r;a++)Re.fromBufferAttribute(t,a),s=Math.max(s,n.distanceToSquared(Re));if(e)for(let a=0,r=e.length;a<r;a++){const o=e[a],l=this.morphTargetsRelative;for(let c=0,h=o.count;c<h;c++)Re.fromBufferAttribute(o,c),l&&(Sn.fromBufferAttribute(t,c),Re.add(Sn)),s=Math.max(s,n.distanceToSquared(Re))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const t=this.index,e=this.attributes;if(t===null||e.position===void 0||e.normal===void 0||e.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const n=e.position,s=e.normal,a=e.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new ei(new Float32Array(4*n.count),4));const r=this.getAttribute("tangent"),o=[],l=[];for(let C=0;C<n.count;C++)o[C]=new D,l[C]=new D;const c=new D,h=new D,u=new D,d=new Ut,f=new Ut,g=new Ut,_=new D,m=new D;function p(C,x,y){c.fromBufferAttribute(n,C),h.fromBufferAttribute(n,x),u.fromBufferAttribute(n,y),d.fromBufferAttribute(a,C),f.fromBufferAttribute(a,x),g.fromBufferAttribute(a,y),h.sub(c),u.sub(c),f.sub(d),g.sub(d);const E=1/(f.x*g.y-g.x*f.y);isFinite(E)&&(_.copy(h).multiplyScalar(g.y).addScaledVector(u,-f.y).multiplyScalar(E),m.copy(u).multiplyScalar(f.x).addScaledVector(h,-g.x).multiplyScalar(E),o[C].add(_),o[x].add(_),o[y].add(_),l[C].add(m),l[x].add(m),l[y].add(m))}let w=this.groups;w.length===0&&(w=[{start:0,count:t.count}]);for(let C=0,x=w.length;C<x;++C){const y=w[C],E=y.start,I=y.count;for(let N=E,H=E+I;N<H;N+=3)p(t.getX(N+0),t.getX(N+1),t.getX(N+2))}const A=new D,M=new D,P=new D,S=new D;function T(C){P.fromBufferAttribute(s,C),S.copy(P);const x=o[C];A.copy(x),A.sub(P.multiplyScalar(P.dot(x))).normalize(),M.crossVectors(S,x);const E=M.dot(l[C])<0?-1:1;r.setXYZW(C,A.x,A.y,A.z,E)}for(let C=0,x=w.length;C<x;++C){const y=w[C],E=y.start,I=y.count;for(let N=E,H=E+I;N<H;N+=3)T(t.getX(N+0)),T(t.getX(N+1)),T(t.getX(N+2))}}computeVertexNormals(){const t=this.index,e=this.getAttribute("position");if(e!==void 0){let n=this.getAttribute("normal");if(n===void 0)n=new ei(new Float32Array(e.count*3),3),this.setAttribute("normal",n);else for(let d=0,f=n.count;d<f;d++)n.setXYZ(d,0,0,0);const s=new D,a=new D,r=new D,o=new D,l=new D,c=new D,h=new D,u=new D;if(t)for(let d=0,f=t.count;d<f;d+=3){const g=t.getX(d+0),_=t.getX(d+1),m=t.getX(d+2);s.fromBufferAttribute(e,g),a.fromBufferAttribute(e,_),r.fromBufferAttribute(e,m),h.subVectors(r,a),u.subVectors(s,a),h.cross(u),o.fromBufferAttribute(n,g),l.fromBufferAttribute(n,_),c.fromBufferAttribute(n,m),o.add(h),l.add(h),c.add(h),n.setXYZ(g,o.x,o.y,o.z),n.setXYZ(_,l.x,l.y,l.z),n.setXYZ(m,c.x,c.y,c.z)}else for(let d=0,f=e.count;d<f;d+=3)s.fromBufferAttribute(e,d+0),a.fromBufferAttribute(e,d+1),r.fromBufferAttribute(e,d+2),h.subVectors(r,a),u.subVectors(s,a),h.cross(u),n.setXYZ(d+0,h.x,h.y,h.z),n.setXYZ(d+1,h.x,h.y,h.z),n.setXYZ(d+2,h.x,h.y,h.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){const t=this.attributes.normal;for(let e=0,n=t.count;e<n;e++)Re.fromBufferAttribute(t,e),Re.normalize(),t.setXYZ(e,Re.x,Re.y,Re.z)}toNonIndexed(){function t(o,l){const c=o.array,h=o.itemSize,u=o.normalized,d=new c.constructor(l.length*h);let f=0,g=0;for(let _=0,m=l.length;_<m;_++){o.isInterleavedBufferAttribute?f=l[_]*o.data.stride+o.offset:f=l[_]*h;for(let p=0;p<h;p++)d[g++]=c[f++]}return new ei(d,h,u)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const e=new ii,n=this.index.array,s=this.attributes;for(const o in s){const l=s[o],c=t(l,n);e.setAttribute(o,c)}const a=this.morphAttributes;for(const o in a){const l=[],c=a[o];for(let h=0,u=c.length;h<u;h++){const d=c[h],f=t(d,n);l.push(f)}e.morphAttributes[o]=l}e.morphTargetsRelative=this.morphTargetsRelative;const r=this.groups;for(let o=0,l=r.length;o<l;o++){const c=r[o];e.addGroup(c.start,c.count,c.materialIndex)}return e}toJSON(){const t={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.type,this.name!==""&&(t.name=this.name),Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0){const l=this.parameters;for(const c in l)l[c]!==void 0&&(t[c]=l[c]);return t}t.data={attributes:{}};const e=this.index;e!==null&&(t.data.index={type:e.array.constructor.name,array:Array.prototype.slice.call(e.array)});const n=this.attributes;for(const l in n){const c=n[l];t.data.attributes[l]=c.toJSON(t.data)}const s={};let a=!1;for(const l in this.morphAttributes){const c=this.morphAttributes[l],h=[];for(let u=0,d=c.length;u<d;u++){const f=c[u];h.push(f.toJSON(t.data))}h.length>0&&(s[l]=h,a=!0)}a&&(t.data.morphAttributes=s,t.data.morphTargetsRelative=this.morphTargetsRelative);const r=this.groups;r.length>0&&(t.data.groups=JSON.parse(JSON.stringify(r)));const o=this.boundingSphere;return o!==null&&(t.data.boundingSphere=o.toJSON()),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const e={};this.name=t.name;const n=t.index;n!==null&&this.setIndex(n.clone());const s=t.attributes;for(const c in s){const h=s[c];this.setAttribute(c,h.clone(e))}const a=t.morphAttributes;for(const c in a){const h=[],u=a[c];for(let d=0,f=u.length;d<f;d++)h.push(u[d].clone(e));this.morphAttributes[c]=h}this.morphTargetsRelative=t.morphTargetsRelative;const r=t.groups;for(let c=0,h=r.length;c<h;c++){const u=r[c];this.addGroup(u.start,u.count,u.materialIndex)}const o=t.boundingBox;o!==null&&(this.boundingBox=o.clone());const l=t.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}}const il=new se,Zi=new uc,Os=new Es,nl=new D,zs=new D,Bs=new D,Hs=new D,Va=new D,Gs=new D,sl=new D,Vs=new D;class Mt extends Ie{constructor(t=new ii,e=new ui){super(),this.isMesh=!0,this.type="Mesh",this.geometry=t,this.material=e,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),t.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=t.morphTargetInfluences.slice()),t.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary)),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){const e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){const s=e[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let a=0,r=s.length;a<r;a++){const o=s[a].name||String(a);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=a}}}}getVertexPosition(t,e){const n=this.geometry,s=n.attributes.position,a=n.morphAttributes.position,r=n.morphTargetsRelative;e.fromBufferAttribute(s,t);const o=this.morphTargetInfluences;if(a&&o){Gs.set(0,0,0);for(let l=0,c=a.length;l<c;l++){const h=o[l],u=a[l];h!==0&&(Va.fromBufferAttribute(u,t),r?Gs.addScaledVector(Va,h):Gs.addScaledVector(Va.sub(e),h))}e.add(Gs)}return e}raycast(t,e){const n=this.geometry,s=this.material,a=this.matrixWorld;s!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),Os.copy(n.boundingSphere),Os.applyMatrix4(a),Zi.copy(t.ray).recast(t.near),!(Os.containsPoint(Zi.origin)===!1&&(Zi.intersectSphere(Os,nl)===null||Zi.origin.distanceToSquared(nl)>(t.far-t.near)**2))&&(il.copy(a).invert(),Zi.copy(t.ray).applyMatrix4(il),!(n.boundingBox!==null&&Zi.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(t,e,Zi)))}_computeIntersections(t,e,n){let s;const a=this.geometry,r=this.material,o=a.index,l=a.attributes.position,c=a.attributes.uv,h=a.attributes.uv1,u=a.attributes.normal,d=a.groups,f=a.drawRange;if(o!==null)if(Array.isArray(r))for(let g=0,_=d.length;g<_;g++){const m=d[g],p=r[m.materialIndex],w=Math.max(m.start,f.start),A=Math.min(o.count,Math.min(m.start+m.count,f.start+f.count));for(let M=w,P=A;M<P;M+=3){const S=o.getX(M),T=o.getX(M+1),C=o.getX(M+2);s=Ws(this,p,t,n,c,h,u,S,T,C),s&&(s.faceIndex=Math.floor(M/3),s.face.materialIndex=m.materialIndex,e.push(s))}}else{const g=Math.max(0,f.start),_=Math.min(o.count,f.start+f.count);for(let m=g,p=_;m<p;m+=3){const w=o.getX(m),A=o.getX(m+1),M=o.getX(m+2);s=Ws(this,r,t,n,c,h,u,w,A,M),s&&(s.faceIndex=Math.floor(m/3),e.push(s))}}else if(l!==void 0)if(Array.isArray(r))for(let g=0,_=d.length;g<_;g++){const m=d[g],p=r[m.materialIndex],w=Math.max(m.start,f.start),A=Math.min(l.count,Math.min(m.start+m.count,f.start+f.count));for(let M=w,P=A;M<P;M+=3){const S=M,T=M+1,C=M+2;s=Ws(this,p,t,n,c,h,u,S,T,C),s&&(s.faceIndex=Math.floor(M/3),s.face.materialIndex=m.materialIndex,e.push(s))}}else{const g=Math.max(0,f.start),_=Math.min(l.count,f.start+f.count);for(let m=g,p=_;m<p;m+=3){const w=m,A=m+1,M=m+2;s=Ws(this,r,t,n,c,h,u,w,A,M),s&&(s.faceIndex=Math.floor(m/3),e.push(s))}}}}function nu(i,t,e,n,s,a,r,o){let l;if(t.side===Ve?l=n.intersectTriangle(r,a,s,!0,o):l=n.intersectTriangle(s,a,r,t.side===Xi,o),l===null)return null;Vs.copy(o),Vs.applyMatrix4(i.matrixWorld);const c=e.ray.origin.distanceTo(Vs);return c<e.near||c>e.far?null:{distance:c,point:Vs.clone(),object:i}}function Ws(i,t,e,n,s,a,r,o,l,c){i.getVertexPosition(o,zs),i.getVertexPosition(l,Bs),i.getVertexPosition(c,Hs);const h=nu(i,t,e,n,zs,Bs,Hs,sl);if(h){const u=new D;ri.getBarycoord(sl,zs,Bs,Hs,u),s&&(h.uv=ri.getInterpolatedAttribute(s,o,l,c,u,new Ut)),a&&(h.uv1=ri.getInterpolatedAttribute(a,o,l,c,u,new Ut)),r&&(h.normal=ri.getInterpolatedAttribute(r,o,l,c,u,new D),h.normal.dot(n.direction)>0&&h.normal.multiplyScalar(-1));const d={a:o,b:l,c,normal:new D,materialIndex:0};ri.getNormal(zs,Bs,Hs,d.normal),h.face=d,h.barycoord=u}return h}class fe extends ii{constructor(t=1,e=1,n=1,s=1,a=1,r=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:e,depth:n,widthSegments:s,heightSegments:a,depthSegments:r};const o=this;s=Math.floor(s),a=Math.floor(a),r=Math.floor(r);const l=[],c=[],h=[],u=[];let d=0,f=0;g("z","y","x",-1,-1,n,e,t,r,a,0),g("z","y","x",1,-1,n,e,-t,r,a,1),g("x","z","y",1,1,t,n,e,s,r,2),g("x","z","y",1,-1,t,n,-e,s,r,3),g("x","y","z",1,-1,t,e,n,s,a,4),g("x","y","z",-1,-1,t,e,-n,s,a,5),this.setIndex(l),this.setAttribute("position",new Se(c,3)),this.setAttribute("normal",new Se(h,3)),this.setAttribute("uv",new Se(u,2));function g(_,m,p,w,A,M,P,S,T,C,x){const y=M/T,E=P/C,I=M/2,N=P/2,H=S/2,V=T+1,q=C+1;let Z=0,G=0;const rt=new D;for(let ht=0;ht<q;ht++){const St=ht*E-N;for(let Bt=0;Bt<V;Bt++){const re=Bt*y-I;rt[_]=re*w,rt[m]=St*A,rt[p]=H,c.push(rt.x,rt.y,rt.z),rt[_]=0,rt[m]=0,rt[p]=S>0?1:-1,h.push(rt.x,rt.y,rt.z),u.push(Bt/T),u.push(1-ht/C),Z+=1}}for(let ht=0;ht<C;ht++)for(let St=0;St<T;St++){const Bt=d+St+V*ht,re=d+St+V*(ht+1),he=d+(St+1)+V*(ht+1),jt=d+(St+1)+V*ht;l.push(Bt,re,jt),l.push(re,he,jt),G+=6}o.addGroup(f,G,x),f+=G,d+=Z}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new fe(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}}function Wn(i){const t={};for(const e in i){t[e]={};for(const n in i[e]){const s=i[e][n];s&&(s.isColor||s.isMatrix3||s.isMatrix4||s.isVector2||s.isVector3||s.isVector4||s.isTexture||s.isQuaternion)?s.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[e][n]=null):t[e][n]=s.clone():Array.isArray(s)?t[e][n]=s.slice():t[e][n]=s}}return t}function He(i){const t={};for(let e=0;e<i.length;e++){const n=Wn(i[e]);for(const s in n)t[s]=n[s]}return t}function su(i){const t=[];for(let e=0;e<i.length;e++)t.push(i[e].clone());return t}function mc(i){const t=i.getRenderTarget();return t===null?i.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:qt.workingColorSpace}const au={clone:Wn,merge:He};var ru=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,ou=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class $i extends jn{constructor(t){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=ru,this.fragmentShader=ou,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,t!==void 0&&this.setValues(t)}copy(t){return super.copy(t),this.fragmentShader=t.fragmentShader,this.vertexShader=t.vertexShader,this.uniforms=Wn(t.uniforms),this.uniformsGroups=su(t.uniformsGroups),this.defines=Object.assign({},t.defines),this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.fog=t.fog,this.lights=t.lights,this.clipping=t.clipping,this.extensions=Object.assign({},t.extensions),this.glslVersion=t.glslVersion,this}toJSON(t){const e=super.toJSON(t);e.glslVersion=this.glslVersion,e.uniforms={};for(const s in this.uniforms){const r=this.uniforms[s].value;r&&r.isTexture?e.uniforms[s]={type:"t",value:r.toJSON(t).uuid}:r&&r.isColor?e.uniforms[s]={type:"c",value:r.getHex()}:r&&r.isVector2?e.uniforms[s]={type:"v2",value:r.toArray()}:r&&r.isVector3?e.uniforms[s]={type:"v3",value:r.toArray()}:r&&r.isVector4?e.uniforms[s]={type:"v4",value:r.toArray()}:r&&r.isMatrix3?e.uniforms[s]={type:"m3",value:r.toArray()}:r&&r.isMatrix4?e.uniforms[s]={type:"m4",value:r.toArray()}:e.uniforms[s]={value:r}}Object.keys(this.defines).length>0&&(e.defines=this.defines),e.vertexShader=this.vertexShader,e.fragmentShader=this.fragmentShader,e.lights=this.lights,e.clipping=this.clipping;const n={};for(const s in this.extensions)this.extensions[s]===!0&&(n[s]=!0);return Object.keys(n).length>0&&(e.extensions=n),e}}class gc extends Ie{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new se,this.projectionMatrix=new se,this.projectionMatrixInverse=new se,this.coordinateSystem=vi,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(t,e){return super.copy(t,e),this.matrixWorldInverse.copy(t.matrixWorldInverse),this.projectionMatrix.copy(t.projectionMatrix),this.projectionMatrixInverse.copy(t.projectionMatrixInverse),this.coordinateSystem=t.coordinateSystem,this}getWorldDirection(t){return super.getWorldDirection(t).negate()}updateMatrixWorld(t){super.updateMatrixWorld(t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(t,e){super.updateWorldMatrix(t,e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}}const Oi=new D,al=new Ut,rl=new Ut;class $e extends gc{constructor(t=50,e=1,n=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=t,this.zoom=1,this.near=n,this.far=s,this.focus=10,this.aspect=e,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.fov=t.fov,this.zoom=t.zoom,this.near=t.near,this.far=t.far,this.focus=t.focus,this.aspect=t.aspect,this.view=t.view===null?null:Object.assign({},t.view),this.filmGauge=t.filmGauge,this.filmOffset=t.filmOffset,this}setFocalLength(t){const e=.5*this.getFilmHeight()/t;this.fov=da*2*Math.atan(e),this.updateProjectionMatrix()}getFocalLength(){const t=Math.tan(Ma*.5*this.fov);return .5*this.getFilmHeight()/t}getEffectiveFOV(){return da*2*Math.atan(Math.tan(Ma*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(t,e,n){Oi.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),e.set(Oi.x,Oi.y).multiplyScalar(-t/Oi.z),Oi.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(Oi.x,Oi.y).multiplyScalar(-t/Oi.z)}getViewSize(t,e){return this.getViewBounds(t,al,rl),e.subVectors(rl,al)}setViewOffset(t,e,n,s,a,r){this.aspect=t/e,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=s,this.view.width=a,this.view.height=r,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=this.near;let e=t*Math.tan(Ma*.5*this.fov)/this.zoom,n=2*e,s=this.aspect*n,a=-.5*s;const r=this.view;if(this.view!==null&&this.view.enabled){const l=r.fullWidth,c=r.fullHeight;a+=r.offsetX*s/l,e-=r.offsetY*n/c,s*=r.width/l,n*=r.height/c}const o=this.filmOffset;o!==0&&(a+=t*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(a,a+s,e,e-n,t,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.fov=this.fov,e.object.zoom=this.zoom,e.object.near=this.near,e.object.far=this.far,e.object.focus=this.focus,e.object.aspect=this.aspect,this.view!==null&&(e.object.view=Object.assign({},this.view)),e.object.filmGauge=this.filmGauge,e.object.filmOffset=this.filmOffset,e}}const En=-90,Tn=1;class lu extends Ie{constructor(t,e,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;const s=new $e(En,Tn,t,e);s.layers=this.layers,this.add(s);const a=new $e(En,Tn,t,e);a.layers=this.layers,this.add(a);const r=new $e(En,Tn,t,e);r.layers=this.layers,this.add(r);const o=new $e(En,Tn,t,e);o.layers=this.layers,this.add(o);const l=new $e(En,Tn,t,e);l.layers=this.layers,this.add(l);const c=new $e(En,Tn,t,e);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){const t=this.coordinateSystem,e=this.children.concat(),[n,s,a,r,o,l]=e;for(const c of e)this.remove(c);if(t===vi)n.up.set(0,1,0),n.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),a.up.set(0,0,-1),a.lookAt(0,1,0),r.up.set(0,0,1),r.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(t===ua)n.up.set(0,-1,0),n.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),a.up.set(0,0,1),a.lookAt(0,1,0),r.up.set(0,0,-1),r.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+t);for(const c of e)this.add(c),c.updateMatrixWorld()}update(t,e){this.parent===null&&this.updateMatrixWorld();const{renderTarget:n,activeMipmapLevel:s}=this;this.coordinateSystem!==t.coordinateSystem&&(this.coordinateSystem=t.coordinateSystem,this.updateCoordinateSystem());const[a,r,o,l,c,h]=this.children,u=t.getRenderTarget(),d=t.getActiveCubeFace(),f=t.getActiveMipmapLevel(),g=t.xr.enabled;t.xr.enabled=!1;const _=n.texture.generateMipmaps;n.texture.generateMipmaps=!1,t.setRenderTarget(n,0,s),t.render(e,a),t.setRenderTarget(n,1,s),t.render(e,r),t.setRenderTarget(n,2,s),t.render(e,o),t.setRenderTarget(n,3,s),t.render(e,l),t.setRenderTarget(n,4,s),t.render(e,c),n.texture.generateMipmaps=_,t.setRenderTarget(n,5,s),t.render(e,h),t.setRenderTarget(u,d,f),t.xr.enabled=g,n.texture.needsPMREMUpdate=!0}}class _c extends De{constructor(t=[],e=Hn,n,s,a,r,o,l,c,h){super(t,e,n,s,a,r,o,l,c,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(t){this.image=t}}class cu extends un{constructor(t=1,e={}){super(t,t,e),this.isWebGLCubeRenderTarget=!0;const n={width:t,height:t,depth:1},s=[n,n,n,n,n,n];this.texture=new _c(s),this._setTextureOptions(e),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(t,e){this.texture.type=e.type,this.texture.colorSpace=e.colorSpace,this.texture.generateMipmaps=e.generateMipmaps,this.texture.minFilter=e.minFilter,this.texture.magFilter=e.magFilter;const n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},s=new fe(5,5,5),a=new $i({name:"CubemapFromEquirect",uniforms:Wn(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:Ve,blending:Gi});a.uniforms.tEquirect.value=e;const r=new Mt(s,a),o=e.minFilter;return e.minFilter===on&&(e.minFilter=gi),new lu(1,10,this).update(t,r),e.minFilter=o,r.geometry.dispose(),r.material.dispose(),this}clear(t,e=!0,n=!0,s=!0){const a=t.getRenderTarget();for(let r=0;r<6;r++)t.setRenderTarget(this,r),t.clear(e,n,s);t.setRenderTarget(a)}}class Ci extends Ie{constructor(){super(),this.isGroup=!0,this.type="Group"}}const hu={type:"move"};class Wa{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Ci,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Ci,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new D,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new D),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Ci,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new D,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new D),this._grip}dispatchEvent(t){return this._targetRay!==null&&this._targetRay.dispatchEvent(t),this._grip!==null&&this._grip.dispatchEvent(t),this._hand!==null&&this._hand.dispatchEvent(t),this}connect(t){if(t&&t.hand){const e=this._hand;if(e)for(const n of t.hand.values())this._getHandJoint(e,n)}return this.dispatchEvent({type:"connected",data:t}),this}disconnect(t){return this.dispatchEvent({type:"disconnected",data:t}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(t,e,n){let s=null,a=null,r=null;const o=this._targetRay,l=this._grip,c=this._hand;if(t&&e.session.visibilityState!=="visible-blurred"){if(c&&t.hand){r=!0;for(const _ of t.hand.values()){const m=e.getJointPose(_,n),p=this._getHandJoint(c,_);m!==null&&(p.matrix.fromArray(m.transform.matrix),p.matrix.decompose(p.position,p.rotation,p.scale),p.matrixWorldNeedsUpdate=!0,p.jointRadius=m.radius),p.visible=m!==null}const h=c.joints["index-finger-tip"],u=c.joints["thumb-tip"],d=h.position.distanceTo(u.position),f=.02,g=.005;c.inputState.pinching&&d>f+g?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:t.handedness,target:this})):!c.inputState.pinching&&d<=f-g&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:t.handedness,target:this}))}else l!==null&&t.gripSpace&&(a=e.getPose(t.gripSpace,n),a!==null&&(l.matrix.fromArray(a.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,a.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(a.linearVelocity)):l.hasLinearVelocity=!1,a.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(a.angularVelocity)):l.hasAngularVelocity=!1));o!==null&&(s=e.getPose(t.targetRaySpace,n),s===null&&a!==null&&(s=a),s!==null&&(o.matrix.fromArray(s.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,s.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(s.linearVelocity)):o.hasLinearVelocity=!1,s.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(s.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(hu)))}return o!==null&&(o.visible=s!==null),l!==null&&(l.visible=a!==null),c!==null&&(c.visible=r!==null),this}_getHandJoint(t,e){if(t.joints[e.jointName]===void 0){const n=new Ci;n.matrixAutoUpdate=!1,n.visible=!1,t.joints[e.jointName]=n,t.add(n)}return t.joints[e.jointName]}}class ao{constructor(t,e=25e-5){this.isFogExp2=!0,this.name="",this.color=new Ft(t),this.density=e}clone(){return new ao(this.color,this.density)}toJSON(){return{type:"FogExp2",name:this.name,color:this.color.getHex(),density:this.density}}}class uu extends Ie{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new yi,this.environmentIntensity=1,this.environmentRotation=new yi,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(t,e){return super.copy(t,e),t.background!==null&&(this.background=t.background.clone()),t.environment!==null&&(this.environment=t.environment.clone()),t.fog!==null&&(this.fog=t.fog.clone()),this.backgroundBlurriness=t.backgroundBlurriness,this.backgroundIntensity=t.backgroundIntensity,this.backgroundRotation.copy(t.backgroundRotation),this.environmentIntensity=t.environmentIntensity,this.environmentRotation.copy(t.environmentRotation),t.overrideMaterial!==null&&(this.overrideMaterial=t.overrideMaterial.clone()),this.matrixAutoUpdate=t.matrixAutoUpdate,this}toJSON(t){const e=super.toJSON(t);return this.fog!==null&&(e.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(e.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(e.object.backgroundIntensity=this.backgroundIntensity),e.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(e.object.environmentIntensity=this.environmentIntensity),e.object.environmentRotation=this.environmentRotation.toArray(),e}}class du{constructor(t,e){this.isInterleavedBuffer=!0,this.array=t,this.stride=e,this.count=t!==void 0?t.length/e:0,this.usage=Wr,this.updateRanges=[],this.version=0,this.uuid=Wi()}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.array=new t.array.constructor(t.array),this.count=t.count,this.stride=t.stride,this.usage=t.usage,this}copyAt(t,e,n){t*=this.stride,n*=e.stride;for(let s=0,a=this.stride;s<a;s++)this.array[t+s]=e.array[n+s];return this}set(t,e=0){return this.array.set(t,e),this}clone(t){t.arrayBuffers===void 0&&(t.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=Wi()),t.arrayBuffers[this.array.buffer._uuid]===void 0&&(t.arrayBuffers[this.array.buffer._uuid]=this.array.slice(0).buffer);const e=new this.array.constructor(t.arrayBuffers[this.array.buffer._uuid]),n=new this.constructor(e,this.stride);return n.setUsage(this.usage),n}onUpload(t){return this.onUploadCallback=t,this}toJSON(t){return t.arrayBuffers===void 0&&(t.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=Wi()),t.arrayBuffers[this.array.buffer._uuid]===void 0&&(t.arrayBuffers[this.array.buffer._uuid]=Array.from(new Uint32Array(this.array.buffer))),{uuid:this.uuid,buffer:this.array.buffer._uuid,type:this.array.constructor.name,stride:this.stride}}}const Be=new D;class pa{constructor(t,e,n,s=!1){this.isInterleavedBufferAttribute=!0,this.name="",this.data=t,this.itemSize=e,this.offset=n,this.normalized=s}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(t){this.data.needsUpdate=t}applyMatrix4(t){for(let e=0,n=this.data.count;e<n;e++)Be.fromBufferAttribute(this,e),Be.applyMatrix4(t),this.setXYZ(e,Be.x,Be.y,Be.z);return this}applyNormalMatrix(t){for(let e=0,n=this.count;e<n;e++)Be.fromBufferAttribute(this,e),Be.applyNormalMatrix(t),this.setXYZ(e,Be.x,Be.y,Be.z);return this}transformDirection(t){for(let e=0,n=this.count;e<n;e++)Be.fromBufferAttribute(this,e),Be.transformDirection(t),this.setXYZ(e,Be.x,Be.y,Be.z);return this}getComponent(t,e){let n=this.array[t*this.data.stride+this.offset+e];return this.normalized&&(n=mi(n,this.array)),n}setComponent(t,e,n){return this.normalized&&(n=te(n,this.array)),this.data.array[t*this.data.stride+this.offset+e]=n,this}setX(t,e){return this.normalized&&(e=te(e,this.array)),this.data.array[t*this.data.stride+this.offset]=e,this}setY(t,e){return this.normalized&&(e=te(e,this.array)),this.data.array[t*this.data.stride+this.offset+1]=e,this}setZ(t,e){return this.normalized&&(e=te(e,this.array)),this.data.array[t*this.data.stride+this.offset+2]=e,this}setW(t,e){return this.normalized&&(e=te(e,this.array)),this.data.array[t*this.data.stride+this.offset+3]=e,this}getX(t){let e=this.data.array[t*this.data.stride+this.offset];return this.normalized&&(e=mi(e,this.array)),e}getY(t){let e=this.data.array[t*this.data.stride+this.offset+1];return this.normalized&&(e=mi(e,this.array)),e}getZ(t){let e=this.data.array[t*this.data.stride+this.offset+2];return this.normalized&&(e=mi(e,this.array)),e}getW(t){let e=this.data.array[t*this.data.stride+this.offset+3];return this.normalized&&(e=mi(e,this.array)),e}setXY(t,e,n){return t=t*this.data.stride+this.offset,this.normalized&&(e=te(e,this.array),n=te(n,this.array)),this.data.array[t+0]=e,this.data.array[t+1]=n,this}setXYZ(t,e,n,s){return t=t*this.data.stride+this.offset,this.normalized&&(e=te(e,this.array),n=te(n,this.array),s=te(s,this.array)),this.data.array[t+0]=e,this.data.array[t+1]=n,this.data.array[t+2]=s,this}setXYZW(t,e,n,s,a){return t=t*this.data.stride+this.offset,this.normalized&&(e=te(e,this.array),n=te(n,this.array),s=te(s,this.array),a=te(a,this.array)),this.data.array[t+0]=e,this.data.array[t+1]=n,this.data.array[t+2]=s,this.data.array[t+3]=a,this}clone(t){if(t===void 0){console.log("THREE.InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.");const e=[];for(let n=0;n<this.count;n++){const s=n*this.data.stride+this.offset;for(let a=0;a<this.itemSize;a++)e.push(this.data.array[s+a])}return new ei(new this.array.constructor(e),this.itemSize,this.normalized)}else return t.interleavedBuffers===void 0&&(t.interleavedBuffers={}),t.interleavedBuffers[this.data.uuid]===void 0&&(t.interleavedBuffers[this.data.uuid]=this.data.clone(t)),new pa(t.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(t){if(t===void 0){console.log("THREE.InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.");const e=[];for(let n=0;n<this.count;n++){const s=n*this.data.stride+this.offset;for(let a=0;a<this.itemSize;a++)e.push(this.data.array[s+a])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:e,normalized:this.normalized}}else return t.interleavedBuffers===void 0&&(t.interleavedBuffers={}),t.interleavedBuffers[this.data.uuid]===void 0&&(t.interleavedBuffers[this.data.uuid]=this.data.toJSON(t)),{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}}class In extends jn{constructor(t){super(),this.isSpriteMaterial=!0,this.type="SpriteMaterial",this.color=new Ft(16777215),this.map=null,this.alphaMap=null,this.rotation=0,this.sizeAttenuation=!0,this.transparent=!0,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.alphaMap=t.alphaMap,this.rotation=t.rotation,this.sizeAttenuation=t.sizeAttenuation,this.fog=t.fog,this}}let An;const es=new D,Rn=new D,Cn=new D,Pn=new Ut,is=new Ut,vc=new se,Xs=new D,ns=new D,$s=new D,ol=new Ut,Xa=new Ut,ll=new Ut;class cs extends Ie{constructor(t=new In){if(super(),this.isSprite=!0,this.type="Sprite",An===void 0){An=new ii;const e=new Float32Array([-.5,-.5,0,0,0,.5,-.5,0,1,0,.5,.5,0,1,1,-.5,.5,0,0,1]),n=new du(e,5);An.setIndex([0,1,2,0,2,3]),An.setAttribute("position",new pa(n,3,0,!1)),An.setAttribute("uv",new pa(n,2,3,!1))}this.geometry=An,this.material=t,this.center=new Ut(.5,.5),this.count=1}raycast(t,e){t.camera===null&&console.error('THREE.Sprite: "Raycaster.camera" needs to be set in order to raycast against sprites.'),Rn.setFromMatrixScale(this.matrixWorld),vc.copy(t.camera.matrixWorld),this.modelViewMatrix.multiplyMatrices(t.camera.matrixWorldInverse,this.matrixWorld),Cn.setFromMatrixPosition(this.modelViewMatrix),t.camera.isPerspectiveCamera&&this.material.sizeAttenuation===!1&&Rn.multiplyScalar(-Cn.z);const n=this.material.rotation;let s,a;n!==0&&(a=Math.cos(n),s=Math.sin(n));const r=this.center;qs(Xs.set(-.5,-.5,0),Cn,r,Rn,s,a),qs(ns.set(.5,-.5,0),Cn,r,Rn,s,a),qs($s.set(.5,.5,0),Cn,r,Rn,s,a),ol.set(0,0),Xa.set(1,0),ll.set(1,1);let o=t.ray.intersectTriangle(Xs,ns,$s,!1,es);if(o===null&&(qs(ns.set(-.5,.5,0),Cn,r,Rn,s,a),Xa.set(0,1),o=t.ray.intersectTriangle(Xs,$s,ns,!1,es),o===null))return;const l=t.ray.origin.distanceTo(es);l<t.near||l>t.far||e.push({distance:l,point:es.clone(),uv:ri.getInterpolation(es,Xs,ns,$s,ol,Xa,ll,new Ut),face:null,object:this})}copy(t,e){return super.copy(t,e),t.center!==void 0&&this.center.copy(t.center),this.material=t.material,this}}function qs(i,t,e,n,s,a){Pn.subVectors(i,e).addScalar(.5).multiply(n),s!==void 0?(is.x=a*Pn.x-s*Pn.y,is.y=s*Pn.x+a*Pn.y):is.copy(Pn),i.copy(t),i.x+=is.x,i.y+=is.y,i.applyMatrix4(vc)}class fu extends De{constructor(t=null,e=1,n=1,s,a,r,o,l,c=ti,h=ti,u,d){super(null,r,o,l,c,h,s,a,u,d),this.isDataTexture=!0,this.image={data:t,width:e,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class cl extends ei{constructor(t,e,n,s=1){super(t,e,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=s}copy(t){return super.copy(t),this.meshPerAttribute=t.meshPerAttribute,this}toJSON(){const t=super.toJSON();return t.meshPerAttribute=this.meshPerAttribute,t.isInstancedBufferAttribute=!0,t}}const Ln=new se,hl=new se,js=[],ul=new dn,pu=new se,ss=new Mt,as=new Es;class rs extends Mt{constructor(t,e,n){super(t,e),this.isInstancedMesh=!0,this.instanceMatrix=new cl(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let s=0;s<n;s++)this.setMatrixAt(s,pu)}computeBoundingBox(){const t=this.geometry,e=this.count;this.boundingBox===null&&(this.boundingBox=new dn),t.boundingBox===null&&t.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<e;n++)this.getMatrixAt(n,Ln),ul.copy(t.boundingBox).applyMatrix4(Ln),this.boundingBox.union(ul)}computeBoundingSphere(){const t=this.geometry,e=this.count;this.boundingSphere===null&&(this.boundingSphere=new Es),t.boundingSphere===null&&t.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<e;n++)this.getMatrixAt(n,Ln),as.copy(t.boundingSphere).applyMatrix4(Ln),this.boundingSphere.union(as)}copy(t,e){return super.copy(t,e),this.instanceMatrix.copy(t.instanceMatrix),t.morphTexture!==null&&(this.morphTexture=t.morphTexture.clone()),t.instanceColor!==null&&(this.instanceColor=t.instanceColor.clone()),this.count=t.count,t.boundingBox!==null&&(this.boundingBox=t.boundingBox.clone()),t.boundingSphere!==null&&(this.boundingSphere=t.boundingSphere.clone()),this}getColorAt(t,e){e.fromArray(this.instanceColor.array,t*3)}getMatrixAt(t,e){e.fromArray(this.instanceMatrix.array,t*16)}getMorphAt(t,e){const n=e.morphTargetInfluences,s=this.morphTexture.source.data.data,a=n.length+1,r=t*a+1;for(let o=0;o<n.length;o++)n[o]=s[r+o]}raycast(t,e){const n=this.matrixWorld,s=this.count;if(ss.geometry=this.geometry,ss.material=this.material,ss.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),as.copy(this.boundingSphere),as.applyMatrix4(n),t.ray.intersectsSphere(as)!==!1))for(let a=0;a<s;a++){this.getMatrixAt(a,Ln),hl.multiplyMatrices(n,Ln),ss.matrixWorld=hl,ss.raycast(t,js);for(let r=0,o=js.length;r<o;r++){const l=js[r];l.instanceId=a,l.object=this,e.push(l)}js.length=0}}setColorAt(t,e){this.instanceColor===null&&(this.instanceColor=new cl(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),e.toArray(this.instanceColor.array,t*3)}setMatrixAt(t,e){e.toArray(this.instanceMatrix.array,t*16)}setMorphAt(t,e){const n=e.morphTargetInfluences,s=n.length+1;this.morphTexture===null&&(this.morphTexture=new fu(new Float32Array(s*this.count),s,this.count,Qr,_i));const a=this.morphTexture.source.data.data;let r=0;for(let c=0;c<n.length;c++)r+=n[c];const o=this.geometry.morphTargetsRelative?1:1-r,l=s*t;a[l]=o,a.set(n,l+1)}updateMorphTargets(){}dispose(){this.dispatchEvent({type:"dispose"}),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null)}}const $a=new D,mu=new D,gu=new Nt;class en{constructor(t=new D(1,0,0),e=0){this.isPlane=!0,this.normal=t,this.constant=e}set(t,e){return this.normal.copy(t),this.constant=e,this}setComponents(t,e,n,s){return this.normal.set(t,e,n),this.constant=s,this}setFromNormalAndCoplanarPoint(t,e){return this.normal.copy(t),this.constant=-e.dot(this.normal),this}setFromCoplanarPoints(t,e,n){const s=$a.subVectors(n,e).cross(mu.subVectors(t,e)).normalize();return this.setFromNormalAndCoplanarPoint(s,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){const t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,e){return e.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,e){const n=t.delta($a),s=this.normal.dot(n);if(s===0)return this.distanceToPoint(t.start)===0?e.copy(t.start):null;const a=-(t.start.dot(this.normal)+this.constant)/s;return a<0||a>1?null:e.copy(t.start).addScaledVector(n,a)}intersectsLine(t){const e=this.distanceToPoint(t.start),n=this.distanceToPoint(t.end);return e<0&&n>0||n<0&&e>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,e){const n=e||gu.getNormalMatrix(t),s=this.coplanarPoint($a).applyMatrix4(t),a=this.normal.applyMatrix3(n).normalize();return this.constant=-s.dot(a),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}}const Ji=new Es,_u=new Ut(.5,.5),Ys=new D;class ro{constructor(t=new en,e=new en,n=new en,s=new en,a=new en,r=new en){this.planes=[t,e,n,s,a,r]}set(t,e,n,s,a,r){const o=this.planes;return o[0].copy(t),o[1].copy(e),o[2].copy(n),o[3].copy(s),o[4].copy(a),o[5].copy(r),this}copy(t){const e=this.planes;for(let n=0;n<6;n++)e[n].copy(t.planes[n]);return this}setFromProjectionMatrix(t,e=vi,n=!1){const s=this.planes,a=t.elements,r=a[0],o=a[1],l=a[2],c=a[3],h=a[4],u=a[5],d=a[6],f=a[7],g=a[8],_=a[9],m=a[10],p=a[11],w=a[12],A=a[13],M=a[14],P=a[15];if(s[0].setComponents(c-r,f-h,p-g,P-w).normalize(),s[1].setComponents(c+r,f+h,p+g,P+w).normalize(),s[2].setComponents(c+o,f+u,p+_,P+A).normalize(),s[3].setComponents(c-o,f-u,p-_,P-A).normalize(),n)s[4].setComponents(l,d,m,M).normalize(),s[5].setComponents(c-l,f-d,p-m,P-M).normalize();else if(s[4].setComponents(c-l,f-d,p-m,P-M).normalize(),e===vi)s[5].setComponents(c+l,f+d,p+m,P+M).normalize();else if(e===ua)s[5].setComponents(l,d,m,M).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+e);return this}intersectsObject(t){if(t.boundingSphere!==void 0)t.boundingSphere===null&&t.computeBoundingSphere(),Ji.copy(t.boundingSphere).applyMatrix4(t.matrixWorld);else{const e=t.geometry;e.boundingSphere===null&&e.computeBoundingSphere(),Ji.copy(e.boundingSphere).applyMatrix4(t.matrixWorld)}return this.intersectsSphere(Ji)}intersectsSprite(t){Ji.center.set(0,0,0);const e=_u.distanceTo(t.center);return Ji.radius=.7071067811865476+e,Ji.applyMatrix4(t.matrixWorld),this.intersectsSphere(Ji)}intersectsSphere(t){const e=this.planes,n=t.center,s=-t.radius;for(let a=0;a<6;a++)if(e[a].distanceToPoint(n)<s)return!1;return!0}intersectsBox(t){const e=this.planes;for(let n=0;n<6;n++){const s=e[n];if(Ys.x=s.normal.x>0?t.max.x:t.min.x,Ys.y=s.normal.y>0?t.max.y:t.min.y,Ys.z=s.normal.z>0?t.max.z:t.min.z,s.distanceToPoint(Ys)<0)return!1}return!0}containsPoint(t){const e=this.planes;for(let n=0;n<6;n++)if(e[n].distanceToPoint(t)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}class oo extends De{constructor(t,e,n,s,a,r,o,l,c){super(t,e,n,s,a,r,o,l,c),this.isCanvasTexture=!0,this.needsUpdate=!0}}class xc extends De{constructor(t,e,n=hn,s,a,r,o=ti,l=ti,c,h=vs,u=1){if(h!==vs&&h!==xs)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");const d={width:t,height:e,depth:u};super(d,s,a,r,o,l,h,n,c),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(t){return super.copy(t),this.source=new no(Object.assign({},t.image)),this.compareFunction=t.compareFunction,this}toJSON(t){const e=super.toJSON(t);return this.compareFunction!==null&&(e.compareFunction=this.compareFunction),e}}class yc extends De{constructor(t=null){super(),this.sourceTexture=t,this.isExternalTexture=!0}copy(t){return super.copy(t),this.sourceTexture=t.sourceTexture,this}}class lo extends ii{constructor(t=1,e=32,n=0,s=Math.PI*2){super(),this.type="CircleGeometry",this.parameters={radius:t,segments:e,thetaStart:n,thetaLength:s},e=Math.max(3,e);const a=[],r=[],o=[],l=[],c=new D,h=new Ut;r.push(0,0,0),o.push(0,0,1),l.push(.5,.5);for(let u=0,d=3;u<=e;u++,d+=3){const f=n+u/e*s;c.x=t*Math.cos(f),c.y=t*Math.sin(f),r.push(c.x,c.y,c.z),o.push(0,0,1),h.x=(r[d]/t+1)/2,h.y=(r[d+1]/t+1)/2,l.push(h.x,h.y)}for(let u=1;u<=e;u++)a.push(u,u+1,0);this.setIndex(a),this.setAttribute("position",new Se(r,3)),this.setAttribute("normal",new Se(o,3)),this.setAttribute("uv",new Se(l,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new lo(t.radius,t.segments,t.thetaStart,t.thetaLength)}}class Xe extends ii{constructor(t=1,e=1,n=1,s=32,a=1,r=!1,o=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:t,radiusBottom:e,height:n,radialSegments:s,heightSegments:a,openEnded:r,thetaStart:o,thetaLength:l};const c=this;s=Math.floor(s),a=Math.floor(a);const h=[],u=[],d=[],f=[];let g=0;const _=[],m=n/2;let p=0;w(),r===!1&&(t>0&&A(!0),e>0&&A(!1)),this.setIndex(h),this.setAttribute("position",new Se(u,3)),this.setAttribute("normal",new Se(d,3)),this.setAttribute("uv",new Se(f,2));function w(){const M=new D,P=new D;let S=0;const T=(e-t)/n;for(let C=0;C<=a;C++){const x=[],y=C/a,E=y*(e-t)+t;for(let I=0;I<=s;I++){const N=I/s,H=N*l+o,V=Math.sin(H),q=Math.cos(H);P.x=E*V,P.y=-y*n+m,P.z=E*q,u.push(P.x,P.y,P.z),M.set(V,T,q).normalize(),d.push(M.x,M.y,M.z),f.push(N,1-y),x.push(g++)}_.push(x)}for(let C=0;C<s;C++)for(let x=0;x<a;x++){const y=_[x][C],E=_[x+1][C],I=_[x+1][C+1],N=_[x][C+1];(t>0||x!==0)&&(h.push(y,E,N),S+=3),(e>0||x!==a-1)&&(h.push(E,I,N),S+=3)}c.addGroup(p,S,0),p+=S}function A(M){const P=g,S=new Ut,T=new D;let C=0;const x=M===!0?t:e,y=M===!0?1:-1;for(let I=1;I<=s;I++)u.push(0,m*y,0),d.push(0,y,0),f.push(.5,.5),g++;const E=g;for(let I=0;I<=s;I++){const H=I/s*l+o,V=Math.cos(H),q=Math.sin(H);T.x=x*q,T.y=m*y,T.z=x*V,u.push(T.x,T.y,T.z),d.push(0,y,0),S.x=V*.5+.5,S.y=q*.5*y+.5,f.push(S.x,S.y),g++}for(let I=0;I<s;I++){const N=P+I,H=E+I;M===!0?h.push(H,H+1,N):h.push(H+1,H,N),C+=3}c.addGroup(p,C,M===!0?1:2),p+=C}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Xe(t.radiusTop,t.radiusBottom,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}}class co extends Xe{constructor(t=1,e=1,n=32,s=1,a=!1,r=0,o=Math.PI*2){super(0,t,e,n,s,a,r,o),this.type="ConeGeometry",this.parameters={radius:t,height:e,radialSegments:n,heightSegments:s,openEnded:a,thetaStart:r,thetaLength:o}}static fromJSON(t){return new co(t.radius,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}}class Ge extends ii{constructor(t=1,e=1,n=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:t,height:e,widthSegments:n,heightSegments:s};const a=t/2,r=e/2,o=Math.floor(n),l=Math.floor(s),c=o+1,h=l+1,u=t/o,d=e/l,f=[],g=[],_=[],m=[];for(let p=0;p<h;p++){const w=p*d-r;for(let A=0;A<c;A++){const M=A*u-a;g.push(M,-w,0),_.push(0,0,1),m.push(A/o),m.push(1-p/l)}}for(let p=0;p<l;p++)for(let w=0;w<o;w++){const A=w+c*p,M=w+c*(p+1),P=w+1+c*(p+1),S=w+1+c*p;f.push(A,M,S),f.push(M,P,S)}this.setIndex(f),this.setAttribute("position",new Se(g,3)),this.setAttribute("normal",new Se(_,3)),this.setAttribute("uv",new Se(m,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Ge(t.width,t.height,t.widthSegments,t.heightSegments)}}class ho extends ii{constructor(t=.5,e=1,n=32,s=1,a=0,r=Math.PI*2){super(),this.type="RingGeometry",this.parameters={innerRadius:t,outerRadius:e,thetaSegments:n,phiSegments:s,thetaStart:a,thetaLength:r},n=Math.max(3,n),s=Math.max(1,s);const o=[],l=[],c=[],h=[];let u=t;const d=(e-t)/s,f=new D,g=new Ut;for(let _=0;_<=s;_++){for(let m=0;m<=n;m++){const p=a+m/n*r;f.x=u*Math.cos(p),f.y=u*Math.sin(p),l.push(f.x,f.y,f.z),c.push(0,0,1),g.x=(f.x/e+1)/2,g.y=(f.y/e+1)/2,h.push(g.x,g.y)}u+=d}for(let _=0;_<s;_++){const m=_*(n+1);for(let p=0;p<n;p++){const w=p+m,A=w,M=w+n+1,P=w+n+2,S=w+1;o.push(A,M,S),o.push(M,P,S)}}this.setIndex(o),this.setAttribute("position",new Se(l,3)),this.setAttribute("normal",new Se(c,3)),this.setAttribute("uv",new Se(h,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new ho(t.innerRadius,t.outerRadius,t.thetaSegments,t.phiSegments,t.thetaStart,t.thetaLength)}}class uo extends ii{constructor(t=1,e=.4,n=12,s=48,a=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:t,tube:e,radialSegments:n,tubularSegments:s,arc:a},n=Math.floor(n),s=Math.floor(s);const r=[],o=[],l=[],c=[],h=new D,u=new D,d=new D;for(let f=0;f<=n;f++)for(let g=0;g<=s;g++){const _=g/s*a,m=f/n*Math.PI*2;u.x=(t+e*Math.cos(m))*Math.cos(_),u.y=(t+e*Math.cos(m))*Math.sin(_),u.z=e*Math.sin(m),o.push(u.x,u.y,u.z),h.x=t*Math.cos(_),h.y=t*Math.sin(_),d.subVectors(u,h).normalize(),l.push(d.x,d.y,d.z),c.push(g/s),c.push(f/n)}for(let f=1;f<=n;f++)for(let g=1;g<=s;g++){const _=(s+1)*f+g-1,m=(s+1)*(f-1)+g-1,p=(s+1)*(f-1)+g,w=(s+1)*f+g;r.push(_,m,w),r.push(m,p,w)}this.setIndex(r),this.setAttribute("position",new Se(o,3)),this.setAttribute("normal",new Se(l,3)),this.setAttribute("uv",new Se(c,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new uo(t.radius,t.tube,t.radialSegments,t.tubularSegments,t.arc)}}class ce extends jn{constructor(t){super(),this.isMeshStandardMaterial=!0,this.type="MeshStandardMaterial",this.defines={STANDARD:""},this.color=new Ft(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Ft(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=oc,this.normalScale=new Ut(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new yi,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.defines={STANDARD:""},this.color.copy(t.color),this.roughness=t.roughness,this.metalness=t.metalness,this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.roughnessMap=t.roughnessMap,this.metalnessMap=t.metalnessMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.envMapIntensity=t.envMapIntensity,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.flatShading=t.flatShading,this.fog=t.fog,this}}class vu extends jn{constructor(t){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=Rh,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(t)}copy(t){return super.copy(t),this.depthPacking=t.depthPacking,this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this}}class xu extends jn{constructor(t){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(t)}copy(t){return super.copy(t),this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this}}class fo extends Ie{constructor(t,e=1){super(),this.isLight=!0,this.type="Light",this.color=new Ft(t),this.intensity=e}dispose(){}copy(t,e){return super.copy(t,e),this.color.copy(t.color),this.intensity=t.intensity,this}toJSON(t){const e=super.toJSON(t);return e.object.color=this.color.getHex(),e.object.intensity=this.intensity,this.groundColor!==void 0&&(e.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(e.object.distance=this.distance),this.angle!==void 0&&(e.object.angle=this.angle),this.decay!==void 0&&(e.object.decay=this.decay),this.penumbra!==void 0&&(e.object.penumbra=this.penumbra),this.shadow!==void 0&&(e.object.shadow=this.shadow.toJSON()),this.target!==void 0&&(e.object.target=this.target.uuid),e}}class yu extends fo{constructor(t,e,n){super(t,n),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(Ie.DEFAULT_UP),this.updateMatrix(),this.groundColor=new Ft(e)}copy(t,e){return super.copy(t,e),this.groundColor.copy(t.groundColor),this}}const qa=new se,dl=new D,fl=new D;class bc{constructor(t){this.camera=t,this.intensity=1,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new Ut(512,512),this.mapType=xi,this.map=null,this.mapPass=null,this.matrix=new se,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new ro,this._frameExtents=new Ut(1,1),this._viewportCount=1,this._viewports=[new ne(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(t){const e=this.camera,n=this.matrix;dl.setFromMatrixPosition(t.matrixWorld),e.position.copy(dl),fl.setFromMatrixPosition(t.target.matrixWorld),e.lookAt(fl),e.updateMatrixWorld(),qa.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),this._frustum.setFromProjectionMatrix(qa,e.coordinateSystem,e.reversedDepth),e.reversedDepth?n.set(.5,0,0,.5,0,.5,0,.5,0,0,1,0,0,0,0,1):n.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),n.multiply(qa)}getViewport(t){return this._viewports[t]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(t){return this.camera=t.camera.clone(),this.intensity=t.intensity,this.bias=t.bias,this.radius=t.radius,this.autoUpdate=t.autoUpdate,this.needsUpdate=t.needsUpdate,this.normalBias=t.normalBias,this.blurSamples=t.blurSamples,this.mapSize.copy(t.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){const t={};return this.intensity!==1&&(t.intensity=this.intensity),this.bias!==0&&(t.bias=this.bias),this.normalBias!==0&&(t.normalBias=this.normalBias),this.radius!==1&&(t.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(t.mapSize=this.mapSize.toArray()),t.camera=this.camera.toJSON(!1).object,delete t.camera.matrix,t}}class bu extends bc{constructor(){super(new $e(50,1,.5,500)),this.isSpotLightShadow=!0,this.focus=1,this.aspect=1}updateMatrices(t){const e=this.camera,n=da*2*t.angle*this.focus,s=this.mapSize.width/this.mapSize.height*this.aspect,a=t.distance||e.far;(n!==e.fov||s!==e.aspect||a!==e.far)&&(e.fov=n,e.aspect=s,e.far=a,e.updateProjectionMatrix()),super.updateMatrices(t)}copy(t){return super.copy(t),this.focus=t.focus,this}}class Mu extends fo{constructor(t,e,n=0,s=Math.PI/3,a=0,r=2){super(t,e),this.isSpotLight=!0,this.type="SpotLight",this.position.copy(Ie.DEFAULT_UP),this.updateMatrix(),this.target=new Ie,this.distance=n,this.angle=s,this.penumbra=a,this.decay=r,this.map=null,this.shadow=new bu}get power(){return this.intensity*Math.PI}set power(t){this.intensity=t/Math.PI}dispose(){this.shadow.dispose()}copy(t,e){return super.copy(t,e),this.distance=t.distance,this.angle=t.angle,this.penumbra=t.penumbra,this.decay=t.decay,this.target=t.target.clone(),this.shadow=t.shadow.clone(),this}}const pl=new se,os=new D,ja=new D;class wu extends bc{constructor(){super(new $e(90,1,.5,500)),this.isPointLightShadow=!0,this._frameExtents=new Ut(4,2),this._viewportCount=6,this._viewports=[new ne(2,1,1,1),new ne(0,1,1,1),new ne(3,1,1,1),new ne(1,1,1,1),new ne(3,0,1,1),new ne(1,0,1,1)],this._cubeDirections=[new D(1,0,0),new D(-1,0,0),new D(0,0,1),new D(0,0,-1),new D(0,1,0),new D(0,-1,0)],this._cubeUps=[new D(0,1,0),new D(0,1,0),new D(0,1,0),new D(0,1,0),new D(0,0,1),new D(0,0,-1)]}updateMatrices(t,e=0){const n=this.camera,s=this.matrix,a=t.distance||n.far;a!==n.far&&(n.far=a,n.updateProjectionMatrix()),os.setFromMatrixPosition(t.matrixWorld),n.position.copy(os),ja.copy(n.position),ja.add(this._cubeDirections[e]),n.up.copy(this._cubeUps[e]),n.lookAt(ja),n.updateMatrixWorld(),s.makeTranslation(-os.x,-os.y,-os.z),pl.multiplyMatrices(n.projectionMatrix,n.matrixWorldInverse),this._frustum.setFromProjectionMatrix(pl,n.coordinateSystem,n.reversedDepth)}}class Mc extends fo{constructor(t,e,n=0,s=2){super(t,e),this.isPointLight=!0,this.type="PointLight",this.distance=n,this.decay=s,this.shadow=new wu}get power(){return this.intensity*4*Math.PI}set power(t){this.intensity=t/(4*Math.PI)}dispose(){this.shadow.dispose()}copy(t,e){return super.copy(t,e),this.distance=t.distance,this.decay=t.decay,this.shadow=t.shadow.clone(),this}}class Su extends gc{constructor(t=-1,e=1,n=1,s=-1,a=.1,r=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=t,this.right=e,this.top=n,this.bottom=s,this.near=a,this.far=r,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.left=t.left,this.right=t.right,this.top=t.top,this.bottom=t.bottom,this.near=t.near,this.far=t.far,this.zoom=t.zoom,this.view=t.view===null?null:Object.assign({},t.view),this}setViewOffset(t,e,n,s,a,r){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=s,this.view.width=a,this.view.height=r,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=(this.right-this.left)/(2*this.zoom),e=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,s=(this.top+this.bottom)/2;let a=n-t,r=n+t,o=s+e,l=s-e;if(this.view!==null&&this.view.enabled){const c=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;a+=c*this.view.offsetX,r=a+c*this.view.width,o-=h*this.view.offsetY,l=o-h*this.view.height}this.projectionMatrix.makeOrthographic(a,r,o,l,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.zoom=this.zoom,e.object.left=this.left,e.object.right=this.right,e.object.top=this.top,e.object.bottom=this.bottom,e.object.near=this.near,e.object.far=this.far,this.view!==null&&(e.object.view=Object.assign({},this.view)),e}}class Eu extends $e{constructor(t=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=t}}const ml=new se;class Tu{constructor(t,e,n=0,s=1/0){this.ray=new uc(t,e),this.near=n,this.far=s,this.camera=null,this.layers=new so,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(t,e){this.ray.set(t,e)}setFromCamera(t,e){e.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(e.matrixWorld),this.ray.direction.set(t.x,t.y,.5).unproject(e).sub(this.ray.origin).normalize(),this.camera=e):e.isOrthographicCamera?(this.ray.origin.set(t.x,t.y,(e.near+e.far)/(e.near-e.far)).unproject(e),this.ray.direction.set(0,0,-1).transformDirection(e.matrixWorld),this.camera=e):console.error("THREE.Raycaster: Unsupported camera type: "+e.type)}setFromXRController(t){return ml.identity().extractRotation(t.matrixWorld),this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(0,0,-1).applyMatrix4(ml),this}intersectObject(t,e=!0,n=[]){return Xr(t,this,n,e),n.sort(gl),n}intersectObjects(t,e=!0,n=[]){for(let s=0,a=t.length;s<a;s++)Xr(t[s],this,n,e);return n.sort(gl),n}}function gl(i,t){return i.distance-t.distance}function Xr(i,t,e,n){let s=!0;if(i.layers.test(t.layers)&&i.raycast(t,e)===!1&&(s=!1),s===!0&&n===!0){const a=i.children;for(let r=0,o=a.length;r<o;r++)Xr(a[r],t,e,!0)}}function _l(i,t,e,n){const s=Au(n);switch(e){case sc:return i*t;case Qr:return i*t/s.components*s.byteLength;case to:return i*t/s.components*s.byteLength;case rc:return i*t*2/s.components*s.byteLength;case eo:return i*t*2/s.components*s.byteLength;case ac:return i*t*3/s.components*s.byteLength;case hi:return i*t*4/s.components*s.byteLength;case io:return i*t*4/s.components*s.byteLength;case ea:case ia:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*8;case na:case sa:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case _r:case xr:return Math.max(i,16)*Math.max(t,8)/4;case gr:case vr:return Math.max(i,8)*Math.max(t,8)/2;case yr:case br:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*8;case Mr:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case wr:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case Sr:return Math.floor((i+4)/5)*Math.floor((t+3)/4)*16;case Er:return Math.floor((i+4)/5)*Math.floor((t+4)/5)*16;case Tr:return Math.floor((i+5)/6)*Math.floor((t+4)/5)*16;case Ar:return Math.floor((i+5)/6)*Math.floor((t+5)/6)*16;case Rr:return Math.floor((i+7)/8)*Math.floor((t+4)/5)*16;case Cr:return Math.floor((i+7)/8)*Math.floor((t+5)/6)*16;case Pr:return Math.floor((i+7)/8)*Math.floor((t+7)/8)*16;case Lr:return Math.floor((i+9)/10)*Math.floor((t+4)/5)*16;case Dr:return Math.floor((i+9)/10)*Math.floor((t+5)/6)*16;case Ir:return Math.floor((i+9)/10)*Math.floor((t+7)/8)*16;case Ur:return Math.floor((i+9)/10)*Math.floor((t+9)/10)*16;case kr:return Math.floor((i+11)/12)*Math.floor((t+9)/10)*16;case Nr:return Math.floor((i+11)/12)*Math.floor((t+11)/12)*16;case Fr:case Or:case zr:return Math.ceil(i/4)*Math.ceil(t/4)*16;case Br:case Hr:return Math.ceil(i/4)*Math.ceil(t/4)*8;case Gr:case Vr:return Math.ceil(i/4)*Math.ceil(t/4)*16}throw new Error(`Unable to determine texture byte length for ${e} format.`)}function Au(i){switch(i){case xi:case tc:return{byteLength:1,components:1};case gs:case ec:case ws:return{byteLength:2,components:1};case Zr:case Jr:return{byteLength:2,components:4};case hn:case Kr:case _i:return{byteLength:4,components:1};case ic:case nc:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${i}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:Yr}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=Yr);function wc(){let i=null,t=!1,e=null,n=null;function s(a,r){e(a,r),n=i.requestAnimationFrame(s)}return{start:function(){t!==!0&&e!==null&&(n=i.requestAnimationFrame(s),t=!0)},stop:function(){i.cancelAnimationFrame(n),t=!1},setAnimationLoop:function(a){e=a},setContext:function(a){i=a}}}function Ru(i){const t=new WeakMap;function e(o,l){const c=o.array,h=o.usage,u=c.byteLength,d=i.createBuffer();i.bindBuffer(l,d),i.bufferData(l,c,h),o.onUploadCallback();let f;if(c instanceof Float32Array)f=i.FLOAT;else if(typeof Float16Array<"u"&&c instanceof Float16Array)f=i.HALF_FLOAT;else if(c instanceof Uint16Array)o.isFloat16BufferAttribute?f=i.HALF_FLOAT:f=i.UNSIGNED_SHORT;else if(c instanceof Int16Array)f=i.SHORT;else if(c instanceof Uint32Array)f=i.UNSIGNED_INT;else if(c instanceof Int32Array)f=i.INT;else if(c instanceof Int8Array)f=i.BYTE;else if(c instanceof Uint8Array)f=i.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)f=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:d,type:f,bytesPerElement:c.BYTES_PER_ELEMENT,version:o.version,size:u}}function n(o,l,c){const h=l.array,u=l.updateRanges;if(i.bindBuffer(c,o),u.length===0)i.bufferSubData(c,0,h);else{u.sort((f,g)=>f.start-g.start);let d=0;for(let f=1;f<u.length;f++){const g=u[d],_=u[f];_.start<=g.start+g.count+1?g.count=Math.max(g.count,_.start+_.count-g.start):(++d,u[d]=_)}u.length=d+1;for(let f=0,g=u.length;f<g;f++){const _=u[f];i.bufferSubData(c,_.start*h.BYTES_PER_ELEMENT,h,_.start,_.count)}l.clearUpdateRanges()}l.onUploadCallback()}function s(o){return o.isInterleavedBufferAttribute&&(o=o.data),t.get(o)}function a(o){o.isInterleavedBufferAttribute&&(o=o.data);const l=t.get(o);l&&(i.deleteBuffer(l.buffer),t.delete(o))}function r(o,l){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){const h=t.get(o);(!h||h.version<o.version)&&t.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}const c=t.get(o);if(c===void 0)t.set(o,e(o,l));else if(c.version<o.version){if(c.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(c.buffer,o,l),c.version=o.version}}return{get:s,remove:a,update:r}}var Cu=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,Pu=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,Lu=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,Du=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Iu=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,Uu=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,ku=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,Nu=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,Fu=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec3 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 ).rgb;
	}
#endif`,Ou=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,zu=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,Bu=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,Hu=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,Gu=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,Vu=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,Wu=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,Xu=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,$u=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,qu=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,ju=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,Yu=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,Ku=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,Zu=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif
#ifdef USE_BATCHING_COLOR
	vec3 batchingColor = getBatchingColor( getIndirectIndex( gl_DrawID ) );
	vColor.xyz *= batchingColor.xyz;
#endif`,Ju=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,Qu=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,td=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,ed=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,id=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,nd=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,sd=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,ad="gl_FragColor = linearToOutputTexel( gl_FragColor );",rd=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,od=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,ld=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,cd=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,hd=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,ud=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,dd=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,fd=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,pd=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,md=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,gd=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,_d=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,vd=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,xd=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,yd=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,bd=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,Md=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,wd=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Sd=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,Ed=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Td=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,Ad=`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return saturate(v);
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColor;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,Rd=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,Cd=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,Pd=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,Ld=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,Dd=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Id=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Ud=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,kd=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,Nd=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,Fd=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,Od=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,zd=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Bd=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,Hd=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,Gd=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Vd=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Wd=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,Xd=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,$d=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,qd=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,jd=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Yd=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Kd=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,Zd=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,Jd=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,Qd=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,tf=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,ef=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,nf=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,sf=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,af=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,rf=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,of=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,lf=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,cf=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,hf=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,uf=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		float depth = unpackRGBAToDepth( texture2D( depths, uv ) );
		#ifdef USE_REVERSED_DEPTH_BUFFER
			return step( depth, compare );
		#else
			return step( compare, depth );
		#endif
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow( sampler2D shadow, vec2 uv, float compare ) {
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		#ifdef USE_REVERSED_DEPTH_BUFFER
			float hard_shadow = step( distribution.x, compare );
		#else
			float hard_shadow = step( compare, distribution.x );
		#endif
		if ( hard_shadow != 1.0 ) {
			float distance = compare - distribution.x;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		
		float lightToPositionLength = length( lightToPosition );
		if ( lightToPositionLength - shadowCameraFar <= 0.0 && lightToPositionLength - shadowCameraNear >= 0.0 ) {
			float dp = ( lightToPositionLength - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
			#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
				vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
				shadow = (
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
				) * ( 1.0 / 9.0 );
			#else
				shadow = texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
			#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
#endif`,df=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,ff=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,pf=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,mf=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,gf=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,_f=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,vf=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,xf=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,yf=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,bf=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,Mf=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,wf=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,Sf=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,Ef=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Tf=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Af=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,Rf=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const Cf=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,Pf=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Lf=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Df=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,If=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Uf=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,kf=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,Nf=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,Ff=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,Of=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,zf=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,Bf=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Hf=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,Gf=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Vf=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,Wf=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Xf=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,$f=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,qf=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,jf=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Yf=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,Kf=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,Zf=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Jf=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Qf=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,tp=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,ep=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,ip=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,np=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,sp=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,ap=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,rp=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,op=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,lp=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,zt={alphahash_fragment:Cu,alphahash_pars_fragment:Pu,alphamap_fragment:Lu,alphamap_pars_fragment:Du,alphatest_fragment:Iu,alphatest_pars_fragment:Uu,aomap_fragment:ku,aomap_pars_fragment:Nu,batching_pars_vertex:Fu,batching_vertex:Ou,begin_vertex:zu,beginnormal_vertex:Bu,bsdfs:Hu,iridescence_fragment:Gu,bumpmap_pars_fragment:Vu,clipping_planes_fragment:Wu,clipping_planes_pars_fragment:Xu,clipping_planes_pars_vertex:$u,clipping_planes_vertex:qu,color_fragment:ju,color_pars_fragment:Yu,color_pars_vertex:Ku,color_vertex:Zu,common:Ju,cube_uv_reflection_fragment:Qu,defaultnormal_vertex:td,displacementmap_pars_vertex:ed,displacementmap_vertex:id,emissivemap_fragment:nd,emissivemap_pars_fragment:sd,colorspace_fragment:ad,colorspace_pars_fragment:rd,envmap_fragment:od,envmap_common_pars_fragment:ld,envmap_pars_fragment:cd,envmap_pars_vertex:hd,envmap_physical_pars_fragment:bd,envmap_vertex:ud,fog_vertex:dd,fog_pars_vertex:fd,fog_fragment:pd,fog_pars_fragment:md,gradientmap_pars_fragment:gd,lightmap_pars_fragment:_d,lights_lambert_fragment:vd,lights_lambert_pars_fragment:xd,lights_pars_begin:yd,lights_toon_fragment:Md,lights_toon_pars_fragment:wd,lights_phong_fragment:Sd,lights_phong_pars_fragment:Ed,lights_physical_fragment:Td,lights_physical_pars_fragment:Ad,lights_fragment_begin:Rd,lights_fragment_maps:Cd,lights_fragment_end:Pd,logdepthbuf_fragment:Ld,logdepthbuf_pars_fragment:Dd,logdepthbuf_pars_vertex:Id,logdepthbuf_vertex:Ud,map_fragment:kd,map_pars_fragment:Nd,map_particle_fragment:Fd,map_particle_pars_fragment:Od,metalnessmap_fragment:zd,metalnessmap_pars_fragment:Bd,morphinstance_vertex:Hd,morphcolor_vertex:Gd,morphnormal_vertex:Vd,morphtarget_pars_vertex:Wd,morphtarget_vertex:Xd,normal_fragment_begin:$d,normal_fragment_maps:qd,normal_pars_fragment:jd,normal_pars_vertex:Yd,normal_vertex:Kd,normalmap_pars_fragment:Zd,clearcoat_normal_fragment_begin:Jd,clearcoat_normal_fragment_maps:Qd,clearcoat_pars_fragment:tf,iridescence_pars_fragment:ef,opaque_fragment:nf,packing:sf,premultiplied_alpha_fragment:af,project_vertex:rf,dithering_fragment:of,dithering_pars_fragment:lf,roughnessmap_fragment:cf,roughnessmap_pars_fragment:hf,shadowmap_pars_fragment:uf,shadowmap_pars_vertex:df,shadowmap_vertex:ff,shadowmask_pars_fragment:pf,skinbase_vertex:mf,skinning_pars_vertex:gf,skinning_vertex:_f,skinnormal_vertex:vf,specularmap_fragment:xf,specularmap_pars_fragment:yf,tonemapping_fragment:bf,tonemapping_pars_fragment:Mf,transmission_fragment:wf,transmission_pars_fragment:Sf,uv_pars_fragment:Ef,uv_pars_vertex:Tf,uv_vertex:Af,worldpos_vertex:Rf,background_vert:Cf,background_frag:Pf,backgroundCube_vert:Lf,backgroundCube_frag:Df,cube_vert:If,cube_frag:Uf,depth_vert:kf,depth_frag:Nf,distanceRGBA_vert:Ff,distanceRGBA_frag:Of,equirect_vert:zf,equirect_frag:Bf,linedashed_vert:Hf,linedashed_frag:Gf,meshbasic_vert:Vf,meshbasic_frag:Wf,meshlambert_vert:Xf,meshlambert_frag:$f,meshmatcap_vert:qf,meshmatcap_frag:jf,meshnormal_vert:Yf,meshnormal_frag:Kf,meshphong_vert:Zf,meshphong_frag:Jf,meshphysical_vert:Qf,meshphysical_frag:tp,meshtoon_vert:ep,meshtoon_frag:ip,points_vert:np,points_frag:sp,shadow_vert:ap,shadow_frag:rp,sprite_vert:op,sprite_frag:lp},at={common:{diffuse:{value:new Ft(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Nt},alphaMap:{value:null},alphaMapTransform:{value:new Nt},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Nt}},envmap:{envMap:{value:null},envMapRotation:{value:new Nt},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Nt}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Nt}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Nt},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Nt},normalScale:{value:new Ut(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Nt},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Nt}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Nt}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Nt}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Ft(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new Ft(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Nt},alphaTest:{value:0},uvTransform:{value:new Nt}},sprite:{diffuse:{value:new Ft(16777215)},opacity:{value:1},center:{value:new Ut(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Nt},alphaMap:{value:null},alphaMapTransform:{value:new Nt},alphaTest:{value:0}}},pi={basic:{uniforms:He([at.common,at.specularmap,at.envmap,at.aomap,at.lightmap,at.fog]),vertexShader:zt.meshbasic_vert,fragmentShader:zt.meshbasic_frag},lambert:{uniforms:He([at.common,at.specularmap,at.envmap,at.aomap,at.lightmap,at.emissivemap,at.bumpmap,at.normalmap,at.displacementmap,at.fog,at.lights,{emissive:{value:new Ft(0)}}]),vertexShader:zt.meshlambert_vert,fragmentShader:zt.meshlambert_frag},phong:{uniforms:He([at.common,at.specularmap,at.envmap,at.aomap,at.lightmap,at.emissivemap,at.bumpmap,at.normalmap,at.displacementmap,at.fog,at.lights,{emissive:{value:new Ft(0)},specular:{value:new Ft(1118481)},shininess:{value:30}}]),vertexShader:zt.meshphong_vert,fragmentShader:zt.meshphong_frag},standard:{uniforms:He([at.common,at.envmap,at.aomap,at.lightmap,at.emissivemap,at.bumpmap,at.normalmap,at.displacementmap,at.roughnessmap,at.metalnessmap,at.fog,at.lights,{emissive:{value:new Ft(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:zt.meshphysical_vert,fragmentShader:zt.meshphysical_frag},toon:{uniforms:He([at.common,at.aomap,at.lightmap,at.emissivemap,at.bumpmap,at.normalmap,at.displacementmap,at.gradientmap,at.fog,at.lights,{emissive:{value:new Ft(0)}}]),vertexShader:zt.meshtoon_vert,fragmentShader:zt.meshtoon_frag},matcap:{uniforms:He([at.common,at.bumpmap,at.normalmap,at.displacementmap,at.fog,{matcap:{value:null}}]),vertexShader:zt.meshmatcap_vert,fragmentShader:zt.meshmatcap_frag},points:{uniforms:He([at.points,at.fog]),vertexShader:zt.points_vert,fragmentShader:zt.points_frag},dashed:{uniforms:He([at.common,at.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:zt.linedashed_vert,fragmentShader:zt.linedashed_frag},depth:{uniforms:He([at.common,at.displacementmap]),vertexShader:zt.depth_vert,fragmentShader:zt.depth_frag},normal:{uniforms:He([at.common,at.bumpmap,at.normalmap,at.displacementmap,{opacity:{value:1}}]),vertexShader:zt.meshnormal_vert,fragmentShader:zt.meshnormal_frag},sprite:{uniforms:He([at.sprite,at.fog]),vertexShader:zt.sprite_vert,fragmentShader:zt.sprite_frag},background:{uniforms:{uvTransform:{value:new Nt},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:zt.background_vert,fragmentShader:zt.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Nt}},vertexShader:zt.backgroundCube_vert,fragmentShader:zt.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:zt.cube_vert,fragmentShader:zt.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:zt.equirect_vert,fragmentShader:zt.equirect_frag},distanceRGBA:{uniforms:He([at.common,at.displacementmap,{referencePosition:{value:new D},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:zt.distanceRGBA_vert,fragmentShader:zt.distanceRGBA_frag},shadow:{uniforms:He([at.lights,at.fog,{color:{value:new Ft(0)},opacity:{value:1}}]),vertexShader:zt.shadow_vert,fragmentShader:zt.shadow_frag}};pi.physical={uniforms:He([pi.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Nt},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Nt},clearcoatNormalScale:{value:new Ut(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Nt},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Nt},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Nt},sheen:{value:0},sheenColor:{value:new Ft(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Nt},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Nt},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Nt},transmissionSamplerSize:{value:new Ut},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Nt},attenuationDistance:{value:0},attenuationColor:{value:new Ft(0)},specularColor:{value:new Ft(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Nt},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Nt},anisotropyVector:{value:new Ut},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Nt}}]),vertexShader:zt.meshphysical_vert,fragmentShader:zt.meshphysical_frag};const Ks={r:0,b:0,g:0},Qi=new yi,cp=new se;function hp(i,t,e,n,s,a,r){const o=new Ft(0);let l=a===!0?0:1,c,h,u=null,d=0,f=null;function g(A){let M=A.isScene===!0?A.background:null;return M&&M.isTexture&&(M=(A.backgroundBlurriness>0?e:t).get(M)),M}function _(A){let M=!1;const P=g(A);P===null?p(o,l):P&&P.isColor&&(p(P,1),M=!0);const S=i.xr.getEnvironmentBlendMode();S==="additive"?n.buffers.color.setClear(0,0,0,1,r):S==="alpha-blend"&&n.buffers.color.setClear(0,0,0,0,r),(i.autoClear||M)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil))}function m(A,M){const P=g(M);P&&(P.isCubeTexture||P.mapping===ga)?(h===void 0&&(h=new Mt(new fe(1,1,1),new $i({name:"BackgroundCubeMaterial",uniforms:Wn(pi.backgroundCube.uniforms),vertexShader:pi.backgroundCube.vertexShader,fragmentShader:pi.backgroundCube.fragmentShader,side:Ve,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),h.geometry.deleteAttribute("normal"),h.geometry.deleteAttribute("uv"),h.onBeforeRender=function(S,T,C){this.matrixWorld.copyPosition(C.matrixWorld)},Object.defineProperty(h.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),s.update(h)),Qi.copy(M.backgroundRotation),Qi.x*=-1,Qi.y*=-1,Qi.z*=-1,P.isCubeTexture&&P.isRenderTargetTexture===!1&&(Qi.y*=-1,Qi.z*=-1),h.material.uniforms.envMap.value=P,h.material.uniforms.flipEnvMap.value=P.isCubeTexture&&P.isRenderTargetTexture===!1?-1:1,h.material.uniforms.backgroundBlurriness.value=M.backgroundBlurriness,h.material.uniforms.backgroundIntensity.value=M.backgroundIntensity,h.material.uniforms.backgroundRotation.value.setFromMatrix4(cp.makeRotationFromEuler(Qi)),h.material.toneMapped=qt.getTransfer(P.colorSpace)!==Qt,(u!==P||d!==P.version||f!==i.toneMapping)&&(h.material.needsUpdate=!0,u=P,d=P.version,f=i.toneMapping),h.layers.enableAll(),A.unshift(h,h.geometry,h.material,0,0,null)):P&&P.isTexture&&(c===void 0&&(c=new Mt(new Ge(2,2),new $i({name:"BackgroundMaterial",uniforms:Wn(pi.background.uniforms),vertexShader:pi.background.vertexShader,fragmentShader:pi.background.fragmentShader,side:Xi,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),s.update(c)),c.material.uniforms.t2D.value=P,c.material.uniforms.backgroundIntensity.value=M.backgroundIntensity,c.material.toneMapped=qt.getTransfer(P.colorSpace)!==Qt,P.matrixAutoUpdate===!0&&P.updateMatrix(),c.material.uniforms.uvTransform.value.copy(P.matrix),(u!==P||d!==P.version||f!==i.toneMapping)&&(c.material.needsUpdate=!0,u=P,d=P.version,f=i.toneMapping),c.layers.enableAll(),A.unshift(c,c.geometry,c.material,0,0,null))}function p(A,M){A.getRGB(Ks,mc(i)),n.buffers.color.setClear(Ks.r,Ks.g,Ks.b,M,r)}function w(){h!==void 0&&(h.geometry.dispose(),h.material.dispose(),h=void 0),c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0)}return{getClearColor:function(){return o},setClearColor:function(A,M=1){o.set(A),l=M,p(o,l)},getClearAlpha:function(){return l},setClearAlpha:function(A){l=A,p(o,l)},render:_,addToRenderList:m,dispose:w}}function up(i,t){const e=i.getParameter(i.MAX_VERTEX_ATTRIBS),n={},s=d(null);let a=s,r=!1;function o(y,E,I,N,H){let V=!1;const q=u(N,I,E);a!==q&&(a=q,c(a.object)),V=f(y,N,I,H),V&&g(y,N,I,H),H!==null&&t.update(H,i.ELEMENT_ARRAY_BUFFER),(V||r)&&(r=!1,M(y,E,I,N),H!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,t.get(H).buffer))}function l(){return i.createVertexArray()}function c(y){return i.bindVertexArray(y)}function h(y){return i.deleteVertexArray(y)}function u(y,E,I){const N=I.wireframe===!0;let H=n[y.id];H===void 0&&(H={},n[y.id]=H);let V=H[E.id];V===void 0&&(V={},H[E.id]=V);let q=V[N];return q===void 0&&(q=d(l()),V[N]=q),q}function d(y){const E=[],I=[],N=[];for(let H=0;H<e;H++)E[H]=0,I[H]=0,N[H]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:E,enabledAttributes:I,attributeDivisors:N,object:y,attributes:{},index:null}}function f(y,E,I,N){const H=a.attributes,V=E.attributes;let q=0;const Z=I.getAttributes();for(const G in Z)if(Z[G].location>=0){const ht=H[G];let St=V[G];if(St===void 0&&(G==="instanceMatrix"&&y.instanceMatrix&&(St=y.instanceMatrix),G==="instanceColor"&&y.instanceColor&&(St=y.instanceColor)),ht===void 0||ht.attribute!==St||St&&ht.data!==St.data)return!0;q++}return a.attributesNum!==q||a.index!==N}function g(y,E,I,N){const H={},V=E.attributes;let q=0;const Z=I.getAttributes();for(const G in Z)if(Z[G].location>=0){let ht=V[G];ht===void 0&&(G==="instanceMatrix"&&y.instanceMatrix&&(ht=y.instanceMatrix),G==="instanceColor"&&y.instanceColor&&(ht=y.instanceColor));const St={};St.attribute=ht,ht&&ht.data&&(St.data=ht.data),H[G]=St,q++}a.attributes=H,a.attributesNum=q,a.index=N}function _(){const y=a.newAttributes;for(let E=0,I=y.length;E<I;E++)y[E]=0}function m(y){p(y,0)}function p(y,E){const I=a.newAttributes,N=a.enabledAttributes,H=a.attributeDivisors;I[y]=1,N[y]===0&&(i.enableVertexAttribArray(y),N[y]=1),H[y]!==E&&(i.vertexAttribDivisor(y,E),H[y]=E)}function w(){const y=a.newAttributes,E=a.enabledAttributes;for(let I=0,N=E.length;I<N;I++)E[I]!==y[I]&&(i.disableVertexAttribArray(I),E[I]=0)}function A(y,E,I,N,H,V,q){q===!0?i.vertexAttribIPointer(y,E,I,H,V):i.vertexAttribPointer(y,E,I,N,H,V)}function M(y,E,I,N){_();const H=N.attributes,V=I.getAttributes(),q=E.defaultAttributeValues;for(const Z in V){const G=V[Z];if(G.location>=0){let rt=H[Z];if(rt===void 0&&(Z==="instanceMatrix"&&y.instanceMatrix&&(rt=y.instanceMatrix),Z==="instanceColor"&&y.instanceColor&&(rt=y.instanceColor)),rt!==void 0){const ht=rt.normalized,St=rt.itemSize,Bt=t.get(rt);if(Bt===void 0)continue;const re=Bt.buffer,he=Bt.type,jt=Bt.bytesPerElement,j=he===i.INT||he===i.UNSIGNED_INT||rt.gpuType===Kr;if(rt.isInterleavedBufferAttribute){const J=rt.data,ft=J.stride,Lt=rt.offset;if(J.isInstancedInterleavedBuffer){for(let wt=0;wt<G.locationSize;wt++)p(G.location+wt,J.meshPerAttribute);y.isInstancedMesh!==!0&&N._maxInstanceCount===void 0&&(N._maxInstanceCount=J.meshPerAttribute*J.count)}else for(let wt=0;wt<G.locationSize;wt++)m(G.location+wt);i.bindBuffer(i.ARRAY_BUFFER,re);for(let wt=0;wt<G.locationSize;wt++)A(G.location+wt,St/G.locationSize,he,ht,ft*jt,(Lt+St/G.locationSize*wt)*jt,j)}else{if(rt.isInstancedBufferAttribute){for(let J=0;J<G.locationSize;J++)p(G.location+J,rt.meshPerAttribute);y.isInstancedMesh!==!0&&N._maxInstanceCount===void 0&&(N._maxInstanceCount=rt.meshPerAttribute*rt.count)}else for(let J=0;J<G.locationSize;J++)m(G.location+J);i.bindBuffer(i.ARRAY_BUFFER,re);for(let J=0;J<G.locationSize;J++)A(G.location+J,St/G.locationSize,he,ht,St*jt,St/G.locationSize*J*jt,j)}}else if(q!==void 0){const ht=q[Z];if(ht!==void 0)switch(ht.length){case 2:i.vertexAttrib2fv(G.location,ht);break;case 3:i.vertexAttrib3fv(G.location,ht);break;case 4:i.vertexAttrib4fv(G.location,ht);break;default:i.vertexAttrib1fv(G.location,ht)}}}}w()}function P(){C();for(const y in n){const E=n[y];for(const I in E){const N=E[I];for(const H in N)h(N[H].object),delete N[H];delete E[I]}delete n[y]}}function S(y){if(n[y.id]===void 0)return;const E=n[y.id];for(const I in E){const N=E[I];for(const H in N)h(N[H].object),delete N[H];delete E[I]}delete n[y.id]}function T(y){for(const E in n){const I=n[E];if(I[y.id]===void 0)continue;const N=I[y.id];for(const H in N)h(N[H].object),delete N[H];delete I[y.id]}}function C(){x(),r=!0,a!==s&&(a=s,c(a.object))}function x(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:o,reset:C,resetDefaultState:x,dispose:P,releaseStatesOfGeometry:S,releaseStatesOfProgram:T,initAttributes:_,enableAttribute:m,disableUnusedAttributes:w}}function dp(i,t,e){let n;function s(c){n=c}function a(c,h){i.drawArrays(n,c,h),e.update(h,n,1)}function r(c,h,u){u!==0&&(i.drawArraysInstanced(n,c,h,u),e.update(h,n,u))}function o(c,h,u){if(u===0)return;t.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,c,0,h,0,u);let f=0;for(let g=0;g<u;g++)f+=h[g];e.update(f,n,1)}function l(c,h,u,d){if(u===0)return;const f=t.get("WEBGL_multi_draw");if(f===null)for(let g=0;g<c.length;g++)r(c[g],h[g],d[g]);else{f.multiDrawArraysInstancedWEBGL(n,c,0,h,0,d,0,u);let g=0;for(let _=0;_<u;_++)g+=h[_]*d[_];e.update(g,n,1)}}this.setMode=s,this.render=a,this.renderInstances=r,this.renderMultiDraw=o,this.renderMultiDrawInstances=l}function fp(i,t,e,n){let s;function a(){if(s!==void 0)return s;if(t.has("EXT_texture_filter_anisotropic")===!0){const T=t.get("EXT_texture_filter_anisotropic");s=i.getParameter(T.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function r(T){return!(T!==hi&&n.convert(T)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(T){const C=T===ws&&(t.has("EXT_color_buffer_half_float")||t.has("EXT_color_buffer_float"));return!(T!==xi&&n.convert(T)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_TYPE)&&T!==_i&&!C)}function l(T){if(T==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";T="mediump"}return T==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=e.precision!==void 0?e.precision:"highp";const h=l(c);h!==c&&(console.warn("THREE.WebGLRenderer:",c,"not supported, using",h,"instead."),c=h);const u=e.logarithmicDepthBuffer===!0,d=e.reversedDepthBuffer===!0&&t.has("EXT_clip_control"),f=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),g=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),_=i.getParameter(i.MAX_TEXTURE_SIZE),m=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),p=i.getParameter(i.MAX_VERTEX_ATTRIBS),w=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),A=i.getParameter(i.MAX_VARYING_VECTORS),M=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),P=g>0,S=i.getParameter(i.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:a,getMaxPrecision:l,textureFormatReadable:r,textureTypeReadable:o,precision:c,logarithmicDepthBuffer:u,reversedDepthBuffer:d,maxTextures:f,maxVertexTextures:g,maxTextureSize:_,maxCubemapSize:m,maxAttributes:p,maxVertexUniforms:w,maxVaryings:A,maxFragmentUniforms:M,vertexTextures:P,maxSamples:S}}function pp(i){const t=this;let e=null,n=0,s=!1,a=!1;const r=new en,o=new Nt,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(u,d){const f=u.length!==0||d||n!==0||s;return s=d,n=u.length,f},this.beginShadows=function(){a=!0,h(null)},this.endShadows=function(){a=!1},this.setGlobalState=function(u,d){e=h(u,d,0)},this.setState=function(u,d,f){const g=u.clippingPlanes,_=u.clipIntersection,m=u.clipShadows,p=i.get(u);if(!s||g===null||g.length===0||a&&!m)a?h(null):c();else{const w=a?0:n,A=w*4;let M=p.clippingState||null;l.value=M,M=h(g,d,A,f);for(let P=0;P!==A;++P)M[P]=e[P];p.clippingState=M,this.numIntersection=_?this.numPlanes:0,this.numPlanes+=w}};function c(){l.value!==e&&(l.value=e,l.needsUpdate=n>0),t.numPlanes=n,t.numIntersection=0}function h(u,d,f,g){const _=u!==null?u.length:0;let m=null;if(_!==0){if(m=l.value,g!==!0||m===null){const p=f+_*4,w=d.matrixWorldInverse;o.getNormalMatrix(w),(m===null||m.length<p)&&(m=new Float32Array(p));for(let A=0,M=f;A!==_;++A,M+=4)r.copy(u[A]).applyMatrix4(w,o),r.normal.toArray(m,M),m[M+3]=r.constant}l.value=m,l.needsUpdate=!0}return t.numPlanes=_,t.numIntersection=0,m}}function mp(i){let t=new WeakMap;function e(r,o){return o===fr?r.mapping=Hn:o===pr&&(r.mapping=Gn),r}function n(r){if(r&&r.isTexture){const o=r.mapping;if(o===fr||o===pr)if(t.has(r)){const l=t.get(r).texture;return e(l,r.mapping)}else{const l=r.image;if(l&&l.height>0){const c=new cu(l.height);return c.fromEquirectangularTexture(i,r),t.set(r,c),r.addEventListener("dispose",s),e(c.texture,r.mapping)}else return null}}return r}function s(r){const o=r.target;o.removeEventListener("dispose",s);const l=t.get(o);l!==void 0&&(t.delete(o),l.dispose())}function a(){t=new WeakMap}return{get:n,dispose:a}}const Un=4,vl=[.125,.215,.35,.446,.526,.582],an=20,Ya=new Su,xl=new Ft;let Ka=null,Za=0,Ja=0,Qa=!1;const nn=(1+Math.sqrt(5))/2,Dn=1/nn,yl=[new D(-nn,Dn,0),new D(nn,Dn,0),new D(-Dn,0,nn),new D(Dn,0,nn),new D(0,nn,-Dn),new D(0,nn,Dn),new D(-1,1,-1),new D(1,1,-1),new D(-1,1,1),new D(1,1,1)],gp=new D;class bl{constructor(t){this._renderer=t,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(t,e=0,n=.1,s=100,a={}){const{size:r=256,position:o=gp}=a;Ka=this._renderer.getRenderTarget(),Za=this._renderer.getActiveCubeFace(),Ja=this._renderer.getActiveMipmapLevel(),Qa=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(r);const l=this._allocateTargets();return l.depthBuffer=!0,this._sceneToCubeUV(t,n,s,l,o),e>0&&this._blur(l,0,0,e),this._applyPMREM(l),this._cleanup(l),l}fromEquirectangular(t,e=null){return this._fromTexture(t,e)}fromCubemap(t,e=null){return this._fromTexture(t,e)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Sl(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=wl(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(t){this._lodMax=Math.floor(Math.log2(t)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let t=0;t<this._lodPlanes.length;t++)this._lodPlanes[t].dispose()}_cleanup(t){this._renderer.setRenderTarget(Ka,Za,Ja),this._renderer.xr.enabled=Qa,t.scissorTest=!1,Zs(t,0,0,t.width,t.height)}_fromTexture(t,e){t.mapping===Hn||t.mapping===Gn?this._setSize(t.image.length===0?16:t.image[0].width||t.image[0].image.width):this._setSize(t.image.width/4),Ka=this._renderer.getRenderTarget(),Za=this._renderer.getActiveCubeFace(),Ja=this._renderer.getActiveMipmapLevel(),Qa=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;const n=e||this._allocateTargets();return this._textureToCubeUV(t,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){const t=3*Math.max(this._cubeSize,112),e=4*this._cubeSize,n={magFilter:gi,minFilter:gi,generateMipmaps:!1,type:ws,format:hi,colorSpace:Vn,depthBuffer:!1},s=Ml(t,e,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==t||this._pingPongRenderTarget.height!==e){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Ml(t,e,n);const{_lodMax:a}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=_p(a)),this._blurMaterial=vp(a,t,e)}return s}_compileMaterial(t){const e=new Mt(this._lodPlanes[0],t);this._renderer.compile(e,Ya)}_sceneToCubeUV(t,e,n,s,a){const l=new $e(90,1,e,n),c=[1,-1,1,1,1,1],h=[1,1,1,-1,-1,-1],u=this._renderer,d=u.autoClear,f=u.toneMapping;u.getClearColor(xl),u.toneMapping=Vi,u.autoClear=!1,u.state.buffers.depth.getReversed()&&(u.setRenderTarget(s),u.clearDepth(),u.setRenderTarget(null));const _=new ui({name:"PMREM.Background",side:Ve,depthWrite:!1,depthTest:!1}),m=new Mt(new fe,_);let p=!1;const w=t.background;w?w.isColor&&(_.color.copy(w),t.background=null,p=!0):(_.color.copy(xl),p=!0);for(let A=0;A<6;A++){const M=A%3;M===0?(l.up.set(0,c[A],0),l.position.set(a.x,a.y,a.z),l.lookAt(a.x+h[A],a.y,a.z)):M===1?(l.up.set(0,0,c[A]),l.position.set(a.x,a.y,a.z),l.lookAt(a.x,a.y+h[A],a.z)):(l.up.set(0,c[A],0),l.position.set(a.x,a.y,a.z),l.lookAt(a.x,a.y,a.z+h[A]));const P=this._cubeSize;Zs(s,M*P,A>2?P:0,P,P),u.setRenderTarget(s),p&&u.render(m,l),u.render(t,l)}m.geometry.dispose(),m.material.dispose(),u.toneMapping=f,u.autoClear=d,t.background=w}_textureToCubeUV(t,e){const n=this._renderer,s=t.mapping===Hn||t.mapping===Gn;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=Sl()),this._cubemapMaterial.uniforms.flipEnvMap.value=t.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=wl());const a=s?this._cubemapMaterial:this._equirectMaterial,r=new Mt(this._lodPlanes[0],a),o=a.uniforms;o.envMap.value=t;const l=this._cubeSize;Zs(e,0,0,3*l,2*l),n.setRenderTarget(e),n.render(r,Ya)}_applyPMREM(t){const e=this._renderer,n=e.autoClear;e.autoClear=!1;const s=this._lodPlanes.length;for(let a=1;a<s;a++){const r=Math.sqrt(this._sigmas[a]*this._sigmas[a]-this._sigmas[a-1]*this._sigmas[a-1]),o=yl[(s-a-1)%yl.length];this._blur(t,a-1,a,r,o)}e.autoClear=n}_blur(t,e,n,s,a){const r=this._pingPongRenderTarget;this._halfBlur(t,r,e,n,s,"latitudinal",a),this._halfBlur(r,t,n,n,s,"longitudinal",a)}_halfBlur(t,e,n,s,a,r,o){const l=this._renderer,c=this._blurMaterial;r!=="latitudinal"&&r!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");const h=3,u=new Mt(this._lodPlanes[s],c),d=c.uniforms,f=this._sizeLods[n]-1,g=isFinite(a)?Math.PI/(2*f):2*Math.PI/(2*an-1),_=a/g,m=isFinite(a)?1+Math.floor(h*_):an;m>an&&console.warn(`sigmaRadians, ${a}, is too large and will clip, as it requested ${m} samples when the maximum is set to ${an}`);const p=[];let w=0;for(let T=0;T<an;++T){const C=T/_,x=Math.exp(-C*C/2);p.push(x),T===0?w+=x:T<m&&(w+=2*x)}for(let T=0;T<p.length;T++)p[T]=p[T]/w;d.envMap.value=t.texture,d.samples.value=m,d.weights.value=p,d.latitudinal.value=r==="latitudinal",o&&(d.poleAxis.value=o);const{_lodMax:A}=this;d.dTheta.value=g,d.mipInt.value=A-n;const M=this._sizeLods[s],P=3*M*(s>A-Un?s-A+Un:0),S=4*(this._cubeSize-M);Zs(e,P,S,3*M,2*M),l.setRenderTarget(e),l.render(u,Ya)}}function _p(i){const t=[],e=[],n=[];let s=i;const a=i-Un+1+vl.length;for(let r=0;r<a;r++){const o=Math.pow(2,s);e.push(o);let l=1/o;r>i-Un?l=vl[r-i+Un-1]:r===0&&(l=0),n.push(l);const c=1/(o-2),h=-c,u=1+c,d=[h,h,u,h,u,u,h,h,u,u,h,u],f=6,g=6,_=3,m=2,p=1,w=new Float32Array(_*g*f),A=new Float32Array(m*g*f),M=new Float32Array(p*g*f);for(let S=0;S<f;S++){const T=S%3*2/3-1,C=S>2?0:-1,x=[T,C,0,T+2/3,C,0,T+2/3,C+1,0,T,C,0,T+2/3,C+1,0,T,C+1,0];w.set(x,_*g*S),A.set(d,m*g*S);const y=[S,S,S,S,S,S];M.set(y,p*g*S)}const P=new ii;P.setAttribute("position",new ei(w,_)),P.setAttribute("uv",new ei(A,m)),P.setAttribute("faceIndex",new ei(M,p)),t.push(P),s>Un&&s--}return{lodPlanes:t,sizeLods:e,sigmas:n}}function Ml(i,t,e){const n=new un(i,t,e);return n.texture.mapping=ga,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function Zs(i,t,e,n,s){i.viewport.set(t,e,n,s),i.scissor.set(t,e,n,s)}function vp(i,t,e){const n=new Float32Array(an),s=new D(0,1,0);return new $i({name:"SphericalGaussianBlur",defines:{n:an,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:n},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:s}},vertexShader:po(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:Gi,depthTest:!1,depthWrite:!1})}function wl(){return new $i({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:po(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:Gi,depthTest:!1,depthWrite:!1})}function Sl(){return new $i({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:po(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:Gi,depthTest:!1,depthWrite:!1})}function po(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function xp(i){let t=new WeakMap,e=null;function n(o){if(o&&o.isTexture){const l=o.mapping,c=l===fr||l===pr,h=l===Hn||l===Gn;if(c||h){let u=t.get(o);const d=u!==void 0?u.texture.pmremVersion:0;if(o.isRenderTargetTexture&&o.pmremVersion!==d)return e===null&&(e=new bl(i)),u=c?e.fromEquirectangular(o,u):e.fromCubemap(o,u),u.texture.pmremVersion=o.pmremVersion,t.set(o,u),u.texture;if(u!==void 0)return u.texture;{const f=o.image;return c&&f&&f.height>0||h&&f&&s(f)?(e===null&&(e=new bl(i)),u=c?e.fromEquirectangular(o):e.fromCubemap(o),u.texture.pmremVersion=o.pmremVersion,t.set(o,u),o.addEventListener("dispose",a),u.texture):null}}}return o}function s(o){let l=0;const c=6;for(let h=0;h<c;h++)o[h]!==void 0&&l++;return l===c}function a(o){const l=o.target;l.removeEventListener("dispose",a);const c=t.get(l);c!==void 0&&(t.delete(l),c.dispose())}function r(){t=new WeakMap,e!==null&&(e.dispose(),e=null)}return{get:n,dispose:r}}function yp(i){const t={};function e(n){if(t[n]!==void 0)return t[n];let s;switch(n){case"WEBGL_depth_texture":s=i.getExtension("WEBGL_depth_texture")||i.getExtension("MOZ_WEBGL_depth_texture")||i.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":s=i.getExtension("EXT_texture_filter_anisotropic")||i.getExtension("MOZ_EXT_texture_filter_anisotropic")||i.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":s=i.getExtension("WEBGL_compressed_texture_s3tc")||i.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":s=i.getExtension("WEBGL_compressed_texture_pvrtc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:s=i.getExtension(n)}return t[n]=s,s}return{has:function(n){return e(n)!==null},init:function(){e("EXT_color_buffer_float"),e("WEBGL_clip_cull_distance"),e("OES_texture_float_linear"),e("EXT_color_buffer_half_float"),e("WEBGL_multisampled_render_to_texture"),e("WEBGL_render_shared_exponent")},get:function(n){const s=e(n);return s===null&&ys("THREE.WebGLRenderer: "+n+" extension not supported."),s}}}function bp(i,t,e,n){const s={},a=new WeakMap;function r(u){const d=u.target;d.index!==null&&t.remove(d.index);for(const g in d.attributes)t.remove(d.attributes[g]);d.removeEventListener("dispose",r),delete s[d.id];const f=a.get(d);f&&(t.remove(f),a.delete(d)),n.releaseStatesOfGeometry(d),d.isInstancedBufferGeometry===!0&&delete d._maxInstanceCount,e.memory.geometries--}function o(u,d){return s[d.id]===!0||(d.addEventListener("dispose",r),s[d.id]=!0,e.memory.geometries++),d}function l(u){const d=u.attributes;for(const f in d)t.update(d[f],i.ARRAY_BUFFER)}function c(u){const d=[],f=u.index,g=u.attributes.position;let _=0;if(f!==null){const w=f.array;_=f.version;for(let A=0,M=w.length;A<M;A+=3){const P=w[A+0],S=w[A+1],T=w[A+2];d.push(P,S,S,T,T,P)}}else if(g!==void 0){const w=g.array;_=g.version;for(let A=0,M=w.length/3-1;A<M;A+=3){const P=A+0,S=A+1,T=A+2;d.push(P,S,S,T,T,P)}}else return;const m=new(cc(d)?pc:fc)(d,1);m.version=_;const p=a.get(u);p&&t.remove(p),a.set(u,m)}function h(u){const d=a.get(u);if(d){const f=u.index;f!==null&&d.version<f.version&&c(u)}else c(u);return a.get(u)}return{get:o,update:l,getWireframeAttribute:h}}function Mp(i,t,e){let n;function s(d){n=d}let a,r;function o(d){a=d.type,r=d.bytesPerElement}function l(d,f){i.drawElements(n,f,a,d*r),e.update(f,n,1)}function c(d,f,g){g!==0&&(i.drawElementsInstanced(n,f,a,d*r,g),e.update(f,n,g))}function h(d,f,g){if(g===0)return;t.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,f,0,a,d,0,g);let m=0;for(let p=0;p<g;p++)m+=f[p];e.update(m,n,1)}function u(d,f,g,_){if(g===0)return;const m=t.get("WEBGL_multi_draw");if(m===null)for(let p=0;p<d.length;p++)c(d[p]/r,f[p],_[p]);else{m.multiDrawElementsInstancedWEBGL(n,f,0,a,d,0,_,0,g);let p=0;for(let w=0;w<g;w++)p+=f[w]*_[w];e.update(p,n,1)}}this.setMode=s,this.setIndex=o,this.render=l,this.renderInstances=c,this.renderMultiDraw=h,this.renderMultiDrawInstances=u}function wp(i){const t={geometries:0,textures:0},e={frame:0,calls:0,triangles:0,points:0,lines:0};function n(a,r,o){switch(e.calls++,r){case i.TRIANGLES:e.triangles+=o*(a/3);break;case i.LINES:e.lines+=o*(a/2);break;case i.LINE_STRIP:e.lines+=o*(a-1);break;case i.LINE_LOOP:e.lines+=o*a;break;case i.POINTS:e.points+=o*a;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",r);break}}function s(){e.calls=0,e.triangles=0,e.points=0,e.lines=0}return{memory:t,render:e,programs:null,autoReset:!0,reset:s,update:n}}function Sp(i,t,e){const n=new WeakMap,s=new ne;function a(r,o,l){const c=r.morphTargetInfluences,h=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,u=h!==void 0?h.length:0;let d=n.get(o);if(d===void 0||d.count!==u){let y=function(){C.dispose(),n.delete(o),o.removeEventListener("dispose",y)};var f=y;d!==void 0&&d.texture.dispose();const g=o.morphAttributes.position!==void 0,_=o.morphAttributes.normal!==void 0,m=o.morphAttributes.color!==void 0,p=o.morphAttributes.position||[],w=o.morphAttributes.normal||[],A=o.morphAttributes.color||[];let M=0;g===!0&&(M=1),_===!0&&(M=2),m===!0&&(M=3);let P=o.attributes.position.count*M,S=1;P>t.maxTextureSize&&(S=Math.ceil(P/t.maxTextureSize),P=t.maxTextureSize);const T=new Float32Array(P*S*4*u),C=new hc(T,P,S,u);C.type=_i,C.needsUpdate=!0;const x=M*4;for(let E=0;E<u;E++){const I=p[E],N=w[E],H=A[E],V=P*S*4*E;for(let q=0;q<I.count;q++){const Z=q*x;g===!0&&(s.fromBufferAttribute(I,q),T[V+Z+0]=s.x,T[V+Z+1]=s.y,T[V+Z+2]=s.z,T[V+Z+3]=0),_===!0&&(s.fromBufferAttribute(N,q),T[V+Z+4]=s.x,T[V+Z+5]=s.y,T[V+Z+6]=s.z,T[V+Z+7]=0),m===!0&&(s.fromBufferAttribute(H,q),T[V+Z+8]=s.x,T[V+Z+9]=s.y,T[V+Z+10]=s.z,T[V+Z+11]=H.itemSize===4?s.w:1)}}d={count:u,texture:C,size:new Ut(P,S)},n.set(o,d),o.addEventListener("dispose",y)}if(r.isInstancedMesh===!0&&r.morphTexture!==null)l.getUniforms().setValue(i,"morphTexture",r.morphTexture,e);else{let g=0;for(let m=0;m<c.length;m++)g+=c[m];const _=o.morphTargetsRelative?1:1-g;l.getUniforms().setValue(i,"morphTargetBaseInfluence",_),l.getUniforms().setValue(i,"morphTargetInfluences",c)}l.getUniforms().setValue(i,"morphTargetsTexture",d.texture,e),l.getUniforms().setValue(i,"morphTargetsTextureSize",d.size)}return{update:a}}function Ep(i,t,e,n){let s=new WeakMap;function a(l){const c=n.render.frame,h=l.geometry,u=t.get(l,h);if(s.get(u)!==c&&(t.update(u),s.set(u,c)),l.isInstancedMesh&&(l.hasEventListener("dispose",o)===!1&&l.addEventListener("dispose",o),s.get(l)!==c&&(e.update(l.instanceMatrix,i.ARRAY_BUFFER),l.instanceColor!==null&&e.update(l.instanceColor,i.ARRAY_BUFFER),s.set(l,c))),l.isSkinnedMesh){const d=l.skeleton;s.get(d)!==c&&(d.update(),s.set(d,c))}return u}function r(){s=new WeakMap}function o(l){const c=l.target;c.removeEventListener("dispose",o),e.remove(c.instanceMatrix),c.instanceColor!==null&&e.remove(c.instanceColor)}return{update:a,dispose:r}}const Sc=new De,El=new xc(1,1),Ec=new hc,Tc=new $h,Ac=new _c,Tl=[],Al=[],Rl=new Float32Array(16),Cl=new Float32Array(9),Pl=new Float32Array(4);function Yn(i,t,e){const n=i[0];if(n<=0||n>0)return i;const s=t*e;let a=Tl[s];if(a===void 0&&(a=new Float32Array(s),Tl[s]=a),t!==0){n.toArray(a,0);for(let r=1,o=0;r!==t;++r)o+=e,i[r].toArray(a,o)}return a}function Ee(i,t){if(i.length!==t.length)return!1;for(let e=0,n=i.length;e<n;e++)if(i[e]!==t[e])return!1;return!0}function Te(i,t){for(let e=0,n=t.length;e<n;e++)i[e]=t[e]}function _a(i,t){let e=Al[t];e===void 0&&(e=new Int32Array(t),Al[t]=e);for(let n=0;n!==t;++n)e[n]=i.allocateTextureUnit();return e}function Tp(i,t){const e=this.cache;e[0]!==t&&(i.uniform1f(this.addr,t),e[0]=t)}function Ap(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2f(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Ee(e,t))return;i.uniform2fv(this.addr,t),Te(e,t)}}function Rp(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3f(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else if(t.r!==void 0)(e[0]!==t.r||e[1]!==t.g||e[2]!==t.b)&&(i.uniform3f(this.addr,t.r,t.g,t.b),e[0]=t.r,e[1]=t.g,e[2]=t.b);else{if(Ee(e,t))return;i.uniform3fv(this.addr,t),Te(e,t)}}function Cp(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4f(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Ee(e,t))return;i.uniform4fv(this.addr,t),Te(e,t)}}function Pp(i,t){const e=this.cache,n=t.elements;if(n===void 0){if(Ee(e,t))return;i.uniformMatrix2fv(this.addr,!1,t),Te(e,t)}else{if(Ee(e,n))return;Pl.set(n),i.uniformMatrix2fv(this.addr,!1,Pl),Te(e,n)}}function Lp(i,t){const e=this.cache,n=t.elements;if(n===void 0){if(Ee(e,t))return;i.uniformMatrix3fv(this.addr,!1,t),Te(e,t)}else{if(Ee(e,n))return;Cl.set(n),i.uniformMatrix3fv(this.addr,!1,Cl),Te(e,n)}}function Dp(i,t){const e=this.cache,n=t.elements;if(n===void 0){if(Ee(e,t))return;i.uniformMatrix4fv(this.addr,!1,t),Te(e,t)}else{if(Ee(e,n))return;Rl.set(n),i.uniformMatrix4fv(this.addr,!1,Rl),Te(e,n)}}function Ip(i,t){const e=this.cache;e[0]!==t&&(i.uniform1i(this.addr,t),e[0]=t)}function Up(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2i(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Ee(e,t))return;i.uniform2iv(this.addr,t),Te(e,t)}}function kp(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3i(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(Ee(e,t))return;i.uniform3iv(this.addr,t),Te(e,t)}}function Np(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4i(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Ee(e,t))return;i.uniform4iv(this.addr,t),Te(e,t)}}function Fp(i,t){const e=this.cache;e[0]!==t&&(i.uniform1ui(this.addr,t),e[0]=t)}function Op(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2ui(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Ee(e,t))return;i.uniform2uiv(this.addr,t),Te(e,t)}}function zp(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3ui(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(Ee(e,t))return;i.uniform3uiv(this.addr,t),Te(e,t)}}function Bp(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4ui(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Ee(e,t))return;i.uniform4uiv(this.addr,t),Te(e,t)}}function Hp(i,t,e){const n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s);let a;this.type===i.SAMPLER_2D_SHADOW?(El.compareFunction=lc,a=El):a=Sc,e.setTexture2D(t||a,s)}function Gp(i,t,e){const n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTexture3D(t||Tc,s)}function Vp(i,t,e){const n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTextureCube(t||Ac,s)}function Wp(i,t,e){const n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTexture2DArray(t||Ec,s)}function Xp(i){switch(i){case 5126:return Tp;case 35664:return Ap;case 35665:return Rp;case 35666:return Cp;case 35674:return Pp;case 35675:return Lp;case 35676:return Dp;case 5124:case 35670:return Ip;case 35667:case 35671:return Up;case 35668:case 35672:return kp;case 35669:case 35673:return Np;case 5125:return Fp;case 36294:return Op;case 36295:return zp;case 36296:return Bp;case 35678:case 36198:case 36298:case 36306:case 35682:return Hp;case 35679:case 36299:case 36307:return Gp;case 35680:case 36300:case 36308:case 36293:return Vp;case 36289:case 36303:case 36311:case 36292:return Wp}}function $p(i,t){i.uniform1fv(this.addr,t)}function qp(i,t){const e=Yn(t,this.size,2);i.uniform2fv(this.addr,e)}function jp(i,t){const e=Yn(t,this.size,3);i.uniform3fv(this.addr,e)}function Yp(i,t){const e=Yn(t,this.size,4);i.uniform4fv(this.addr,e)}function Kp(i,t){const e=Yn(t,this.size,4);i.uniformMatrix2fv(this.addr,!1,e)}function Zp(i,t){const e=Yn(t,this.size,9);i.uniformMatrix3fv(this.addr,!1,e)}function Jp(i,t){const e=Yn(t,this.size,16);i.uniformMatrix4fv(this.addr,!1,e)}function Qp(i,t){i.uniform1iv(this.addr,t)}function tm(i,t){i.uniform2iv(this.addr,t)}function em(i,t){i.uniform3iv(this.addr,t)}function im(i,t){i.uniform4iv(this.addr,t)}function nm(i,t){i.uniform1uiv(this.addr,t)}function sm(i,t){i.uniform2uiv(this.addr,t)}function am(i,t){i.uniform3uiv(this.addr,t)}function rm(i,t){i.uniform4uiv(this.addr,t)}function om(i,t,e){const n=this.cache,s=t.length,a=_a(e,s);Ee(n,a)||(i.uniform1iv(this.addr,a),Te(n,a));for(let r=0;r!==s;++r)e.setTexture2D(t[r]||Sc,a[r])}function lm(i,t,e){const n=this.cache,s=t.length,a=_a(e,s);Ee(n,a)||(i.uniform1iv(this.addr,a),Te(n,a));for(let r=0;r!==s;++r)e.setTexture3D(t[r]||Tc,a[r])}function cm(i,t,e){const n=this.cache,s=t.length,a=_a(e,s);Ee(n,a)||(i.uniform1iv(this.addr,a),Te(n,a));for(let r=0;r!==s;++r)e.setTextureCube(t[r]||Ac,a[r])}function hm(i,t,e){const n=this.cache,s=t.length,a=_a(e,s);Ee(n,a)||(i.uniform1iv(this.addr,a),Te(n,a));for(let r=0;r!==s;++r)e.setTexture2DArray(t[r]||Ec,a[r])}function um(i){switch(i){case 5126:return $p;case 35664:return qp;case 35665:return jp;case 35666:return Yp;case 35674:return Kp;case 35675:return Zp;case 35676:return Jp;case 5124:case 35670:return Qp;case 35667:case 35671:return tm;case 35668:case 35672:return em;case 35669:case 35673:return im;case 5125:return nm;case 36294:return sm;case 36295:return am;case 36296:return rm;case 35678:case 36198:case 36298:case 36306:case 35682:return om;case 35679:case 36299:case 36307:return lm;case 35680:case 36300:case 36308:case 36293:return cm;case 36289:case 36303:case 36311:case 36292:return hm}}class dm{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.setValue=Xp(e.type)}}class fm{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.size=e.size,this.setValue=um(e.type)}}class pm{constructor(t){this.id=t,this.seq=[],this.map={}}setValue(t,e,n){const s=this.seq;for(let a=0,r=s.length;a!==r;++a){const o=s[a];o.setValue(t,e[o.id],n)}}}const tr=/(\w+)(\])?(\[|\.)?/g;function Ll(i,t){i.seq.push(t),i.map[t.id]=t}function mm(i,t,e){const n=i.name,s=n.length;for(tr.lastIndex=0;;){const a=tr.exec(n),r=tr.lastIndex;let o=a[1];const l=a[2]==="]",c=a[3];if(l&&(o=o|0),c===void 0||c==="["&&r+2===s){Ll(e,c===void 0?new dm(o,i,t):new fm(o,i,t));break}else{let u=e.map[o];u===void 0&&(u=new pm(o),Ll(e,u)),e=u}}}class aa{constructor(t,e){this.seq=[],this.map={};const n=t.getProgramParameter(e,t.ACTIVE_UNIFORMS);for(let s=0;s<n;++s){const a=t.getActiveUniform(e,s),r=t.getUniformLocation(e,a.name);mm(a,r,this)}}setValue(t,e,n,s){const a=this.map[e];a!==void 0&&a.setValue(t,n,s)}setOptional(t,e,n){const s=e[n];s!==void 0&&this.setValue(t,n,s)}static upload(t,e,n,s){for(let a=0,r=e.length;a!==r;++a){const o=e[a],l=n[o.id];l.needsUpdate!==!1&&o.setValue(t,l.value,s)}}static seqWithValue(t,e){const n=[];for(let s=0,a=t.length;s!==a;++s){const r=t[s];r.id in e&&n.push(r)}return n}}function Dl(i,t,e){const n=i.createShader(t);return i.shaderSource(n,e),i.compileShader(n),n}const gm=37297;let _m=0;function vm(i,t){const e=i.split(`
`),n=[],s=Math.max(t-6,0),a=Math.min(t+6,e.length);for(let r=s;r<a;r++){const o=r+1;n.push(`${o===t?">":" "} ${o}: ${e[r]}`)}return n.join(`
`)}const Il=new Nt;function xm(i){qt._getMatrix(Il,qt.workingColorSpace,i);const t=`mat3( ${Il.elements.map(e=>e.toFixed(4))} )`;switch(qt.getTransfer(i)){case ha:return[t,"LinearTransferOETF"];case Qt:return[t,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space: ",i),[t,"LinearTransferOETF"]}}function Ul(i,t,e){const n=i.getShaderParameter(t,i.COMPILE_STATUS),a=(i.getShaderInfoLog(t)||"").trim();if(n&&a==="")return"";const r=/ERROR: 0:(\d+)/.exec(a);if(r){const o=parseInt(r[1]);return e.toUpperCase()+`

`+a+`

`+vm(i.getShaderSource(t),o)}else return a}function ym(i,t){const e=xm(t);return[`vec4 ${i}( vec4 value ) {`,`	return ${e[1]}( vec4( value.rgb * ${e[0]}, value.a ) );`,"}"].join(`
`)}function bm(i,t){let e;switch(t){case bh:e="Linear";break;case Mh:e="Reinhard";break;case wh:e="Cineon";break;case Jl:e="ACESFilmic";break;case Eh:e="AgX";break;case Th:e="Neutral";break;case Sh:e="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",t),e="Linear"}return"vec3 "+i+"( vec3 color ) { return "+e+"ToneMapping( color ); }"}const Js=new D;function Mm(){qt.getLuminanceCoefficients(Js);const i=Js.x.toFixed(4),t=Js.y.toFixed(4),e=Js.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${i}, ${t}, ${e} );`,"	return dot( weights, rgb );","}"].join(`
`)}function wm(i){return[i.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",i.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(hs).join(`
`)}function Sm(i){const t=[];for(const e in i){const n=i[e];n!==!1&&t.push("#define "+e+" "+n)}return t.join(`
`)}function Em(i,t){const e={},n=i.getProgramParameter(t,i.ACTIVE_ATTRIBUTES);for(let s=0;s<n;s++){const a=i.getActiveAttrib(t,s),r=a.name;let o=1;a.type===i.FLOAT_MAT2&&(o=2),a.type===i.FLOAT_MAT3&&(o=3),a.type===i.FLOAT_MAT4&&(o=4),e[r]={type:a.type,location:i.getAttribLocation(t,r),locationSize:o}}return e}function hs(i){return i!==""}function kl(i,t){const e=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return i.replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,e).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function Nl(i,t){return i.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}const Tm=/^[ \t]*#include +<([\w\d./]+)>/gm;function $r(i){return i.replace(Tm,Rm)}const Am=new Map;function Rm(i,t){let e=zt[t];if(e===void 0){const n=Am.get(t);if(n!==void 0)e=zt[n],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',t,n);else throw new Error("Can not resolve #include <"+t+">")}return $r(e)}const Cm=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Fl(i){return i.replace(Cm,Pm)}function Pm(i,t,e,n){let s="";for(let a=parseInt(t);a<parseInt(e);a++)s+=n.replace(/\[\s*i\s*\]/g,"[ "+a+" ]").replace(/UNROLLED_LOOP_INDEX/g,a);return s}function Ol(i){let t=`precision ${i.precision} float;
	precision ${i.precision} int;
	precision ${i.precision} sampler2D;
	precision ${i.precision} samplerCube;
	precision ${i.precision} sampler3D;
	precision ${i.precision} sampler2DArray;
	precision ${i.precision} sampler2DShadow;
	precision ${i.precision} samplerCubeShadow;
	precision ${i.precision} sampler2DArrayShadow;
	precision ${i.precision} isampler2D;
	precision ${i.precision} isampler3D;
	precision ${i.precision} isamplerCube;
	precision ${i.precision} isampler2DArray;
	precision ${i.precision} usampler2D;
	precision ${i.precision} usampler3D;
	precision ${i.precision} usamplerCube;
	precision ${i.precision} usampler2DArray;
	`;return i.precision==="highp"?t+=`
#define HIGH_PRECISION`:i.precision==="mediump"?t+=`
#define MEDIUM_PRECISION`:i.precision==="lowp"&&(t+=`
#define LOW_PRECISION`),t}function Lm(i){let t="SHADOWMAP_TYPE_BASIC";return i.shadowMapType===Yl?t="SHADOWMAP_TYPE_PCF":i.shadowMapType===Kl?t="SHADOWMAP_TYPE_PCF_SOFT":i.shadowMapType===Ai&&(t="SHADOWMAP_TYPE_VSM"),t}function Dm(i){let t="ENVMAP_TYPE_CUBE";if(i.envMap)switch(i.envMapMode){case Hn:case Gn:t="ENVMAP_TYPE_CUBE";break;case ga:t="ENVMAP_TYPE_CUBE_UV";break}return t}function Im(i){let t="ENVMAP_MODE_REFLECTION";return i.envMap&&i.envMapMode===Gn&&(t="ENVMAP_MODE_REFRACTION"),t}function Um(i){let t="ENVMAP_BLENDING_NONE";if(i.envMap)switch(i.combine){case Zl:t="ENVMAP_BLENDING_MULTIPLY";break;case xh:t="ENVMAP_BLENDING_MIX";break;case yh:t="ENVMAP_BLENDING_ADD";break}return t}function km(i){const t=i.envMapCubeUVHeight;if(t===null)return null;const e=Math.log2(t)-2,n=1/t;return{texelWidth:1/(3*Math.max(Math.pow(2,e),112)),texelHeight:n,maxMip:e}}function Nm(i,t,e,n){const s=i.getContext(),a=e.defines;let r=e.vertexShader,o=e.fragmentShader;const l=Lm(e),c=Dm(e),h=Im(e),u=Um(e),d=km(e),f=wm(e),g=Sm(a),_=s.createProgram();let m,p,w=e.glslVersion?"#version "+e.glslVersion+`
`:"";e.isRawShaderMaterial?(m=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g].filter(hs).join(`
`),m.length>0&&(m+=`
`),p=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g].filter(hs).join(`
`),p.length>0&&(p+=`
`)):(m=[Ol(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g,e.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",e.batching?"#define USE_BATCHING":"",e.batchingColor?"#define USE_BATCHING_COLOR":"",e.instancing?"#define USE_INSTANCING":"",e.instancingColor?"#define USE_INSTANCING_COLOR":"",e.instancingMorph?"#define USE_INSTANCING_MORPH":"",e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.map?"#define USE_MAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+h:"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.displacementMap?"#define USE_DISPLACEMENTMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.mapUv?"#define MAP_UV "+e.mapUv:"",e.alphaMapUv?"#define ALPHAMAP_UV "+e.alphaMapUv:"",e.lightMapUv?"#define LIGHTMAP_UV "+e.lightMapUv:"",e.aoMapUv?"#define AOMAP_UV "+e.aoMapUv:"",e.emissiveMapUv?"#define EMISSIVEMAP_UV "+e.emissiveMapUv:"",e.bumpMapUv?"#define BUMPMAP_UV "+e.bumpMapUv:"",e.normalMapUv?"#define NORMALMAP_UV "+e.normalMapUv:"",e.displacementMapUv?"#define DISPLACEMENTMAP_UV "+e.displacementMapUv:"",e.metalnessMapUv?"#define METALNESSMAP_UV "+e.metalnessMapUv:"",e.roughnessMapUv?"#define ROUGHNESSMAP_UV "+e.roughnessMapUv:"",e.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+e.anisotropyMapUv:"",e.clearcoatMapUv?"#define CLEARCOATMAP_UV "+e.clearcoatMapUv:"",e.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+e.clearcoatNormalMapUv:"",e.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+e.clearcoatRoughnessMapUv:"",e.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+e.iridescenceMapUv:"",e.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+e.iridescenceThicknessMapUv:"",e.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+e.sheenColorMapUv:"",e.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+e.sheenRoughnessMapUv:"",e.specularMapUv?"#define SPECULARMAP_UV "+e.specularMapUv:"",e.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+e.specularColorMapUv:"",e.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+e.specularIntensityMapUv:"",e.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+e.transmissionMapUv:"",e.thicknessMapUv?"#define THICKNESSMAP_UV "+e.thicknessMapUv:"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.flatShading?"#define FLAT_SHADED":"",e.skinning?"#define USE_SKINNING":"",e.morphTargets?"#define USE_MORPHTARGETS":"",e.morphNormals&&e.flatShading===!1?"#define USE_MORPHNORMALS":"",e.morphColors?"#define USE_MORPHCOLORS":"",e.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+e.morphTextureStride:"",e.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+e.morphTargetsCount:"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.sizeAttenuation?"#define USE_SIZEATTENUATION":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",e.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(hs).join(`
`),p=[Ol(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g,e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",e.map?"#define USE_MAP":"",e.matcap?"#define USE_MATCAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+c:"",e.envMap?"#define "+h:"",e.envMap?"#define "+u:"",d?"#define CUBEUV_TEXEL_WIDTH "+d.texelWidth:"",d?"#define CUBEUV_TEXEL_HEIGHT "+d.texelHeight:"",d?"#define CUBEUV_MAX_MIP "+d.maxMip+".0":"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoat?"#define USE_CLEARCOAT":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.dispersion?"#define USE_DISPERSION":"",e.iridescence?"#define USE_IRIDESCENCE":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaTest?"#define USE_ALPHATEST":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.sheen?"#define USE_SHEEN":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors||e.instancingColor||e.batchingColor?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.gradientMap?"#define USE_GRADIENTMAP":"",e.flatShading?"#define FLAT_SHADED":"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",e.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",e.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",e.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",e.toneMapping!==Vi?"#define TONE_MAPPING":"",e.toneMapping!==Vi?zt.tonemapping_pars_fragment:"",e.toneMapping!==Vi?bm("toneMapping",e.toneMapping):"",e.dithering?"#define DITHERING":"",e.opaque?"#define OPAQUE":"",zt.colorspace_pars_fragment,ym("linearToOutputTexel",e.outputColorSpace),Mm(),e.useDepthPacking?"#define DEPTH_PACKING "+e.depthPacking:"",`
`].filter(hs).join(`
`)),r=$r(r),r=kl(r,e),r=Nl(r,e),o=$r(o),o=kl(o,e),o=Nl(o,e),r=Fl(r),o=Fl(o),e.isRawShaderMaterial!==!0&&(w=`#version 300 es
`,m=[f,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+m,p=["#define varying in",e.glslVersion===Vo?"":"layout(location = 0) out highp vec4 pc_fragColor;",e.glslVersion===Vo?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+p);const A=w+m+r,M=w+p+o,P=Dl(s,s.VERTEX_SHADER,A),S=Dl(s,s.FRAGMENT_SHADER,M);s.attachShader(_,P),s.attachShader(_,S),e.index0AttributeName!==void 0?s.bindAttribLocation(_,0,e.index0AttributeName):e.morphTargets===!0&&s.bindAttribLocation(_,0,"position"),s.linkProgram(_);function T(E){if(i.debug.checkShaderErrors){const I=s.getProgramInfoLog(_)||"",N=s.getShaderInfoLog(P)||"",H=s.getShaderInfoLog(S)||"",V=I.trim(),q=N.trim(),Z=H.trim();let G=!0,rt=!0;if(s.getProgramParameter(_,s.LINK_STATUS)===!1)if(G=!1,typeof i.debug.onShaderError=="function")i.debug.onShaderError(s,_,P,S);else{const ht=Ul(s,P,"vertex"),St=Ul(s,S,"fragment");console.error("THREE.WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(_,s.VALIDATE_STATUS)+`

Material Name: `+E.name+`
Material Type: `+E.type+`

Program Info Log: `+V+`
`+ht+`
`+St)}else V!==""?console.warn("THREE.WebGLProgram: Program Info Log:",V):(q===""||Z==="")&&(rt=!1);rt&&(E.diagnostics={runnable:G,programLog:V,vertexShader:{log:q,prefix:m},fragmentShader:{log:Z,prefix:p}})}s.deleteShader(P),s.deleteShader(S),C=new aa(s,_),x=Em(s,_)}let C;this.getUniforms=function(){return C===void 0&&T(this),C};let x;this.getAttributes=function(){return x===void 0&&T(this),x};let y=e.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return y===!1&&(y=s.getProgramParameter(_,gm)),y},this.destroy=function(){n.releaseStatesOfProgram(this),s.deleteProgram(_),this.program=void 0},this.type=e.shaderType,this.name=e.shaderName,this.id=_m++,this.cacheKey=t,this.usedTimes=1,this.program=_,this.vertexShader=P,this.fragmentShader=S,this}let Fm=0;class Om{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(t){const e=t.vertexShader,n=t.fragmentShader,s=this._getShaderStage(e),a=this._getShaderStage(n),r=this._getShaderCacheForMaterial(t);return r.has(s)===!1&&(r.add(s),s.usedTimes++),r.has(a)===!1&&(r.add(a),a.usedTimes++),this}remove(t){const e=this.materialCache.get(t);for(const n of e)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(t),this}getVertexShaderID(t){return this._getShaderStage(t.vertexShader).id}getFragmentShaderID(t){return this._getShaderStage(t.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(t){const e=this.materialCache;let n=e.get(t);return n===void 0&&(n=new Set,e.set(t,n)),n}_getShaderStage(t){const e=this.shaderCache;let n=e.get(t);return n===void 0&&(n=new zm(t),e.set(t,n)),n}}class zm{constructor(t){this.id=Fm++,this.code=t,this.usedTimes=0}}function Bm(i,t,e,n,s,a,r){const o=new so,l=new Om,c=new Set,h=[],u=s.logarithmicDepthBuffer,d=s.vertexTextures;let f=s.precision;const g={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function _(x){return c.add(x),x===0?"uv":`uv${x}`}function m(x,y,E,I,N){const H=I.fog,V=N.geometry,q=x.isMeshStandardMaterial?I.environment:null,Z=(x.isMeshStandardMaterial?e:t).get(x.envMap||q),G=Z&&Z.mapping===ga?Z.image.height:null,rt=g[x.type];x.precision!==null&&(f=s.getMaxPrecision(x.precision),f!==x.precision&&console.warn("THREE.WebGLProgram.getParameters:",x.precision,"not supported, using",f,"instead."));const ht=V.morphAttributes.position||V.morphAttributes.normal||V.morphAttributes.color,St=ht!==void 0?ht.length:0;let Bt=0;V.morphAttributes.position!==void 0&&(Bt=1),V.morphAttributes.normal!==void 0&&(Bt=2),V.morphAttributes.color!==void 0&&(Bt=3);let re,he,jt,j;if(rt){const Yt=pi[rt];re=Yt.vertexShader,he=Yt.fragmentShader}else re=x.vertexShader,he=x.fragmentShader,l.update(x),jt=l.getVertexShaderID(x),j=l.getFragmentShaderID(x);const J=i.getRenderTarget(),ft=i.state.buffers.depth.getReversed(),Lt=N.isInstancedMesh===!0,wt=N.isBatchedMesh===!0,Wt=!!x.map,Ne=!!x.matcap,L=!!Z,ue=!!x.aoMap,It=!!x.lightMap,Ct=!!x.bumpMap,gt=!!x.normalMap,de=!!x.displacementMap,_t=!!x.emissiveMap,Ot=!!x.metalnessMap,Ae=!!x.roughnessMap,xe=x.anisotropy>0,R=x.clearcoat>0,v=x.dispersion>0,O=x.iridescence>0,$=x.sheen>0,K=x.transmission>0,W=xe&&!!x.anisotropyMap,bt=R&&!!x.clearcoatMap,nt=R&&!!x.clearcoatNormalMap,vt=R&&!!x.clearcoatRoughnessMap,xt=O&&!!x.iridescenceMap,et=O&&!!x.iridescenceThicknessMap,ct=$&&!!x.sheenColorMap,Rt=$&&!!x.sheenRoughnessMap,yt=!!x.specularMap,ot=!!x.specularColorMap,kt=!!x.specularIntensityMap,U=K&&!!x.transmissionMap,it=K&&!!x.thicknessMap,st=!!x.gradientMap,dt=!!x.alphaMap,Q=x.alphaTest>0,Y=!!x.alphaHash,mt=!!x.extensions;let Dt=Vi;x.toneMapped&&(J===null||J.isXRRenderTarget===!0)&&(Dt=i.toneMapping);const oe={shaderID:rt,shaderType:x.type,shaderName:x.name,vertexShader:re,fragmentShader:he,defines:x.defines,customVertexShaderID:jt,customFragmentShaderID:j,isRawShaderMaterial:x.isRawShaderMaterial===!0,glslVersion:x.glslVersion,precision:f,batching:wt,batchingColor:wt&&N._colorsTexture!==null,instancing:Lt,instancingColor:Lt&&N.instanceColor!==null,instancingMorph:Lt&&N.morphTexture!==null,supportsVertexTextures:d,outputColorSpace:J===null?i.outputColorSpace:J.isXRRenderTarget===!0?J.texture.colorSpace:Vn,alphaToCoverage:!!x.alphaToCoverage,map:Wt,matcap:Ne,envMap:L,envMapMode:L&&Z.mapping,envMapCubeUVHeight:G,aoMap:ue,lightMap:It,bumpMap:Ct,normalMap:gt,displacementMap:d&&de,emissiveMap:_t,normalMapObjectSpace:gt&&x.normalMapType===Ph,normalMapTangentSpace:gt&&x.normalMapType===oc,metalnessMap:Ot,roughnessMap:Ae,anisotropy:xe,anisotropyMap:W,clearcoat:R,clearcoatMap:bt,clearcoatNormalMap:nt,clearcoatRoughnessMap:vt,dispersion:v,iridescence:O,iridescenceMap:xt,iridescenceThicknessMap:et,sheen:$,sheenColorMap:ct,sheenRoughnessMap:Rt,specularMap:yt,specularColorMap:ot,specularIntensityMap:kt,transmission:K,transmissionMap:U,thicknessMap:it,gradientMap:st,opaque:x.transparent===!1&&x.blending===kn&&x.alphaToCoverage===!1,alphaMap:dt,alphaTest:Q,alphaHash:Y,combine:x.combine,mapUv:Wt&&_(x.map.channel),aoMapUv:ue&&_(x.aoMap.channel),lightMapUv:It&&_(x.lightMap.channel),bumpMapUv:Ct&&_(x.bumpMap.channel),normalMapUv:gt&&_(x.normalMap.channel),displacementMapUv:de&&_(x.displacementMap.channel),emissiveMapUv:_t&&_(x.emissiveMap.channel),metalnessMapUv:Ot&&_(x.metalnessMap.channel),roughnessMapUv:Ae&&_(x.roughnessMap.channel),anisotropyMapUv:W&&_(x.anisotropyMap.channel),clearcoatMapUv:bt&&_(x.clearcoatMap.channel),clearcoatNormalMapUv:nt&&_(x.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:vt&&_(x.clearcoatRoughnessMap.channel),iridescenceMapUv:xt&&_(x.iridescenceMap.channel),iridescenceThicknessMapUv:et&&_(x.iridescenceThicknessMap.channel),sheenColorMapUv:ct&&_(x.sheenColorMap.channel),sheenRoughnessMapUv:Rt&&_(x.sheenRoughnessMap.channel),specularMapUv:yt&&_(x.specularMap.channel),specularColorMapUv:ot&&_(x.specularColorMap.channel),specularIntensityMapUv:kt&&_(x.specularIntensityMap.channel),transmissionMapUv:U&&_(x.transmissionMap.channel),thicknessMapUv:it&&_(x.thicknessMap.channel),alphaMapUv:dt&&_(x.alphaMap.channel),vertexTangents:!!V.attributes.tangent&&(gt||xe),vertexColors:x.vertexColors,vertexAlphas:x.vertexColors===!0&&!!V.attributes.color&&V.attributes.color.itemSize===4,pointsUvs:N.isPoints===!0&&!!V.attributes.uv&&(Wt||dt),fog:!!H,useFog:x.fog===!0,fogExp2:!!H&&H.isFogExp2,flatShading:x.flatShading===!0&&x.wireframe===!1,sizeAttenuation:x.sizeAttenuation===!0,logarithmicDepthBuffer:u,reversedDepthBuffer:ft,skinning:N.isSkinnedMesh===!0,morphTargets:V.morphAttributes.position!==void 0,morphNormals:V.morphAttributes.normal!==void 0,morphColors:V.morphAttributes.color!==void 0,morphTargetsCount:St,morphTextureStride:Bt,numDirLights:y.directional.length,numPointLights:y.point.length,numSpotLights:y.spot.length,numSpotLightMaps:y.spotLightMap.length,numRectAreaLights:y.rectArea.length,numHemiLights:y.hemi.length,numDirLightShadows:y.directionalShadowMap.length,numPointLightShadows:y.pointShadowMap.length,numSpotLightShadows:y.spotShadowMap.length,numSpotLightShadowsWithMaps:y.numSpotLightShadowsWithMaps,numLightProbes:y.numLightProbes,numClippingPlanes:r.numPlanes,numClipIntersection:r.numIntersection,dithering:x.dithering,shadowMapEnabled:i.shadowMap.enabled&&E.length>0,shadowMapType:i.shadowMap.type,toneMapping:Dt,decodeVideoTexture:Wt&&x.map.isVideoTexture===!0&&qt.getTransfer(x.map.colorSpace)===Qt,decodeVideoTextureEmissive:_t&&x.emissiveMap.isVideoTexture===!0&&qt.getTransfer(x.emissiveMap.colorSpace)===Qt,premultipliedAlpha:x.premultipliedAlpha,doubleSided:x.side===Qe,flipSided:x.side===Ve,useDepthPacking:x.depthPacking>=0,depthPacking:x.depthPacking||0,index0AttributeName:x.index0AttributeName,extensionClipCullDistance:mt&&x.extensions.clipCullDistance===!0&&n.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(mt&&x.extensions.multiDraw===!0||wt)&&n.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:n.has("KHR_parallel_shader_compile"),customProgramCacheKey:x.customProgramCacheKey()};return oe.vertexUv1s=c.has(1),oe.vertexUv2s=c.has(2),oe.vertexUv3s=c.has(3),c.clear(),oe}function p(x){const y=[];if(x.shaderID?y.push(x.shaderID):(y.push(x.customVertexShaderID),y.push(x.customFragmentShaderID)),x.defines!==void 0)for(const E in x.defines)y.push(E),y.push(x.defines[E]);return x.isRawShaderMaterial===!1&&(w(y,x),A(y,x),y.push(i.outputColorSpace)),y.push(x.customProgramCacheKey),y.join()}function w(x,y){x.push(y.precision),x.push(y.outputColorSpace),x.push(y.envMapMode),x.push(y.envMapCubeUVHeight),x.push(y.mapUv),x.push(y.alphaMapUv),x.push(y.lightMapUv),x.push(y.aoMapUv),x.push(y.bumpMapUv),x.push(y.normalMapUv),x.push(y.displacementMapUv),x.push(y.emissiveMapUv),x.push(y.metalnessMapUv),x.push(y.roughnessMapUv),x.push(y.anisotropyMapUv),x.push(y.clearcoatMapUv),x.push(y.clearcoatNormalMapUv),x.push(y.clearcoatRoughnessMapUv),x.push(y.iridescenceMapUv),x.push(y.iridescenceThicknessMapUv),x.push(y.sheenColorMapUv),x.push(y.sheenRoughnessMapUv),x.push(y.specularMapUv),x.push(y.specularColorMapUv),x.push(y.specularIntensityMapUv),x.push(y.transmissionMapUv),x.push(y.thicknessMapUv),x.push(y.combine),x.push(y.fogExp2),x.push(y.sizeAttenuation),x.push(y.morphTargetsCount),x.push(y.morphAttributeCount),x.push(y.numDirLights),x.push(y.numPointLights),x.push(y.numSpotLights),x.push(y.numSpotLightMaps),x.push(y.numHemiLights),x.push(y.numRectAreaLights),x.push(y.numDirLightShadows),x.push(y.numPointLightShadows),x.push(y.numSpotLightShadows),x.push(y.numSpotLightShadowsWithMaps),x.push(y.numLightProbes),x.push(y.shadowMapType),x.push(y.toneMapping),x.push(y.numClippingPlanes),x.push(y.numClipIntersection),x.push(y.depthPacking)}function A(x,y){o.disableAll(),y.supportsVertexTextures&&o.enable(0),y.instancing&&o.enable(1),y.instancingColor&&o.enable(2),y.instancingMorph&&o.enable(3),y.matcap&&o.enable(4),y.envMap&&o.enable(5),y.normalMapObjectSpace&&o.enable(6),y.normalMapTangentSpace&&o.enable(7),y.clearcoat&&o.enable(8),y.iridescence&&o.enable(9),y.alphaTest&&o.enable(10),y.vertexColors&&o.enable(11),y.vertexAlphas&&o.enable(12),y.vertexUv1s&&o.enable(13),y.vertexUv2s&&o.enable(14),y.vertexUv3s&&o.enable(15),y.vertexTangents&&o.enable(16),y.anisotropy&&o.enable(17),y.alphaHash&&o.enable(18),y.batching&&o.enable(19),y.dispersion&&o.enable(20),y.batchingColor&&o.enable(21),y.gradientMap&&o.enable(22),x.push(o.mask),o.disableAll(),y.fog&&o.enable(0),y.useFog&&o.enable(1),y.flatShading&&o.enable(2),y.logarithmicDepthBuffer&&o.enable(3),y.reversedDepthBuffer&&o.enable(4),y.skinning&&o.enable(5),y.morphTargets&&o.enable(6),y.morphNormals&&o.enable(7),y.morphColors&&o.enable(8),y.premultipliedAlpha&&o.enable(9),y.shadowMapEnabled&&o.enable(10),y.doubleSided&&o.enable(11),y.flipSided&&o.enable(12),y.useDepthPacking&&o.enable(13),y.dithering&&o.enable(14),y.transmission&&o.enable(15),y.sheen&&o.enable(16),y.opaque&&o.enable(17),y.pointsUvs&&o.enable(18),y.decodeVideoTexture&&o.enable(19),y.decodeVideoTextureEmissive&&o.enable(20),y.alphaToCoverage&&o.enable(21),x.push(o.mask)}function M(x){const y=g[x.type];let E;if(y){const I=pi[y];E=au.clone(I.uniforms)}else E=x.uniforms;return E}function P(x,y){let E;for(let I=0,N=h.length;I<N;I++){const H=h[I];if(H.cacheKey===y){E=H,++E.usedTimes;break}}return E===void 0&&(E=new Nm(i,y,x,a),h.push(E)),E}function S(x){if(--x.usedTimes===0){const y=h.indexOf(x);h[y]=h[h.length-1],h.pop(),x.destroy()}}function T(x){l.remove(x)}function C(){l.dispose()}return{getParameters:m,getProgramCacheKey:p,getUniforms:M,acquireProgram:P,releaseProgram:S,releaseShaderCache:T,programs:h,dispose:C}}function Hm(){let i=new WeakMap;function t(r){return i.has(r)}function e(r){let o=i.get(r);return o===void 0&&(o={},i.set(r,o)),o}function n(r){i.delete(r)}function s(r,o,l){i.get(r)[o]=l}function a(){i=new WeakMap}return{has:t,get:e,remove:n,update:s,dispose:a}}function Gm(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.material.id!==t.material.id?i.material.id-t.material.id:i.z!==t.z?i.z-t.z:i.id-t.id}function zl(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.z!==t.z?t.z-i.z:i.id-t.id}function Bl(){const i=[];let t=0;const e=[],n=[],s=[];function a(){t=0,e.length=0,n.length=0,s.length=0}function r(u,d,f,g,_,m){let p=i[t];return p===void 0?(p={id:u.id,object:u,geometry:d,material:f,groupOrder:g,renderOrder:u.renderOrder,z:_,group:m},i[t]=p):(p.id=u.id,p.object=u,p.geometry=d,p.material=f,p.groupOrder=g,p.renderOrder=u.renderOrder,p.z=_,p.group=m),t++,p}function o(u,d,f,g,_,m){const p=r(u,d,f,g,_,m);f.transmission>0?n.push(p):f.transparent===!0?s.push(p):e.push(p)}function l(u,d,f,g,_,m){const p=r(u,d,f,g,_,m);f.transmission>0?n.unshift(p):f.transparent===!0?s.unshift(p):e.unshift(p)}function c(u,d){e.length>1&&e.sort(u||Gm),n.length>1&&n.sort(d||zl),s.length>1&&s.sort(d||zl)}function h(){for(let u=t,d=i.length;u<d;u++){const f=i[u];if(f.id===null)break;f.id=null,f.object=null,f.geometry=null,f.material=null,f.group=null}}return{opaque:e,transmissive:n,transparent:s,init:a,push:o,unshift:l,finish:h,sort:c}}function Vm(){let i=new WeakMap;function t(n,s){const a=i.get(n);let r;return a===void 0?(r=new Bl,i.set(n,[r])):s>=a.length?(r=new Bl,a.push(r)):r=a[s],r}function e(){i=new WeakMap}return{get:t,dispose:e}}function Wm(){const i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"DirectionalLight":e={direction:new D,color:new Ft};break;case"SpotLight":e={position:new D,direction:new D,color:new Ft,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":e={position:new D,color:new Ft,distance:0,decay:0};break;case"HemisphereLight":e={direction:new D,skyColor:new Ft,groundColor:new Ft};break;case"RectAreaLight":e={color:new Ft,position:new D,halfWidth:new D,halfHeight:new D};break}return i[t.id]=e,e}}}function Xm(){const i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"DirectionalLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Ut};break;case"SpotLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Ut};break;case"PointLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Ut,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[t.id]=e,e}}}let $m=0;function qm(i,t){return(t.castShadow?2:0)-(i.castShadow?2:0)+(t.map?1:0)-(i.map?1:0)}function jm(i){const t=new Wm,e=Xm(),n={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)n.probe.push(new D);const s=new D,a=new se,r=new se;function o(c){let h=0,u=0,d=0;for(let x=0;x<9;x++)n.probe[x].set(0,0,0);let f=0,g=0,_=0,m=0,p=0,w=0,A=0,M=0,P=0,S=0,T=0;c.sort(qm);for(let x=0,y=c.length;x<y;x++){const E=c[x],I=E.color,N=E.intensity,H=E.distance,V=E.shadow&&E.shadow.map?E.shadow.map.texture:null;if(E.isAmbientLight)h+=I.r*N,u+=I.g*N,d+=I.b*N;else if(E.isLightProbe){for(let q=0;q<9;q++)n.probe[q].addScaledVector(E.sh.coefficients[q],N);T++}else if(E.isDirectionalLight){const q=t.get(E);if(q.color.copy(E.color).multiplyScalar(E.intensity),E.castShadow){const Z=E.shadow,G=e.get(E);G.shadowIntensity=Z.intensity,G.shadowBias=Z.bias,G.shadowNormalBias=Z.normalBias,G.shadowRadius=Z.radius,G.shadowMapSize=Z.mapSize,n.directionalShadow[f]=G,n.directionalShadowMap[f]=V,n.directionalShadowMatrix[f]=E.shadow.matrix,w++}n.directional[f]=q,f++}else if(E.isSpotLight){const q=t.get(E);q.position.setFromMatrixPosition(E.matrixWorld),q.color.copy(I).multiplyScalar(N),q.distance=H,q.coneCos=Math.cos(E.angle),q.penumbraCos=Math.cos(E.angle*(1-E.penumbra)),q.decay=E.decay,n.spot[_]=q;const Z=E.shadow;if(E.map&&(n.spotLightMap[P]=E.map,P++,Z.updateMatrices(E),E.castShadow&&S++),n.spotLightMatrix[_]=Z.matrix,E.castShadow){const G=e.get(E);G.shadowIntensity=Z.intensity,G.shadowBias=Z.bias,G.shadowNormalBias=Z.normalBias,G.shadowRadius=Z.radius,G.shadowMapSize=Z.mapSize,n.spotShadow[_]=G,n.spotShadowMap[_]=V,M++}_++}else if(E.isRectAreaLight){const q=t.get(E);q.color.copy(I).multiplyScalar(N),q.halfWidth.set(E.width*.5,0,0),q.halfHeight.set(0,E.height*.5,0),n.rectArea[m]=q,m++}else if(E.isPointLight){const q=t.get(E);if(q.color.copy(E.color).multiplyScalar(E.intensity),q.distance=E.distance,q.decay=E.decay,E.castShadow){const Z=E.shadow,G=e.get(E);G.shadowIntensity=Z.intensity,G.shadowBias=Z.bias,G.shadowNormalBias=Z.normalBias,G.shadowRadius=Z.radius,G.shadowMapSize=Z.mapSize,G.shadowCameraNear=Z.camera.near,G.shadowCameraFar=Z.camera.far,n.pointShadow[g]=G,n.pointShadowMap[g]=V,n.pointShadowMatrix[g]=E.shadow.matrix,A++}n.point[g]=q,g++}else if(E.isHemisphereLight){const q=t.get(E);q.skyColor.copy(E.color).multiplyScalar(N),q.groundColor.copy(E.groundColor).multiplyScalar(N),n.hemi[p]=q,p++}}m>0&&(i.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=at.LTC_FLOAT_1,n.rectAreaLTC2=at.LTC_FLOAT_2):(n.rectAreaLTC1=at.LTC_HALF_1,n.rectAreaLTC2=at.LTC_HALF_2)),n.ambient[0]=h,n.ambient[1]=u,n.ambient[2]=d;const C=n.hash;(C.directionalLength!==f||C.pointLength!==g||C.spotLength!==_||C.rectAreaLength!==m||C.hemiLength!==p||C.numDirectionalShadows!==w||C.numPointShadows!==A||C.numSpotShadows!==M||C.numSpotMaps!==P||C.numLightProbes!==T)&&(n.directional.length=f,n.spot.length=_,n.rectArea.length=m,n.point.length=g,n.hemi.length=p,n.directionalShadow.length=w,n.directionalShadowMap.length=w,n.pointShadow.length=A,n.pointShadowMap.length=A,n.spotShadow.length=M,n.spotShadowMap.length=M,n.directionalShadowMatrix.length=w,n.pointShadowMatrix.length=A,n.spotLightMatrix.length=M+P-S,n.spotLightMap.length=P,n.numSpotLightShadowsWithMaps=S,n.numLightProbes=T,C.directionalLength=f,C.pointLength=g,C.spotLength=_,C.rectAreaLength=m,C.hemiLength=p,C.numDirectionalShadows=w,C.numPointShadows=A,C.numSpotShadows=M,C.numSpotMaps=P,C.numLightProbes=T,n.version=$m++)}function l(c,h){let u=0,d=0,f=0,g=0,_=0;const m=h.matrixWorldInverse;for(let p=0,w=c.length;p<w;p++){const A=c[p];if(A.isDirectionalLight){const M=n.directional[u];M.direction.setFromMatrixPosition(A.matrixWorld),s.setFromMatrixPosition(A.target.matrixWorld),M.direction.sub(s),M.direction.transformDirection(m),u++}else if(A.isSpotLight){const M=n.spot[f];M.position.setFromMatrixPosition(A.matrixWorld),M.position.applyMatrix4(m),M.direction.setFromMatrixPosition(A.matrixWorld),s.setFromMatrixPosition(A.target.matrixWorld),M.direction.sub(s),M.direction.transformDirection(m),f++}else if(A.isRectAreaLight){const M=n.rectArea[g];M.position.setFromMatrixPosition(A.matrixWorld),M.position.applyMatrix4(m),r.identity(),a.copy(A.matrixWorld),a.premultiply(m),r.extractRotation(a),M.halfWidth.set(A.width*.5,0,0),M.halfHeight.set(0,A.height*.5,0),M.halfWidth.applyMatrix4(r),M.halfHeight.applyMatrix4(r),g++}else if(A.isPointLight){const M=n.point[d];M.position.setFromMatrixPosition(A.matrixWorld),M.position.applyMatrix4(m),d++}else if(A.isHemisphereLight){const M=n.hemi[_];M.direction.setFromMatrixPosition(A.matrixWorld),M.direction.transformDirection(m),_++}}}return{setup:o,setupView:l,state:n}}function Hl(i){const t=new jm(i),e=[],n=[];function s(h){c.camera=h,e.length=0,n.length=0}function a(h){e.push(h)}function r(h){n.push(h)}function o(){t.setup(e)}function l(h){t.setupView(e,h)}const c={lightsArray:e,shadowsArray:n,camera:null,lights:t,transmissionRenderTarget:{}};return{init:s,state:c,setupLights:o,setupLightsView:l,pushLight:a,pushShadow:r}}function Ym(i){let t=new WeakMap;function e(s,a=0){const r=t.get(s);let o;return r===void 0?(o=new Hl(i),t.set(s,[o])):a>=r.length?(o=new Hl(i),r.push(o)):o=r[a],o}function n(){t=new WeakMap}return{get:e,dispose:n}}const Km=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,Zm=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`;function Jm(i,t,e){let n=new ro;const s=new Ut,a=new Ut,r=new ne,o=new vu({depthPacking:Ch}),l=new xu,c={},h=e.maxTextureSize,u={[Xi]:Ve,[Ve]:Xi,[Qe]:Qe},d=new $i({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new Ut},radius:{value:4}},vertexShader:Km,fragmentShader:Zm}),f=d.clone();f.defines.HORIZONTAL_PASS=1;const g=new ii;g.setAttribute("position",new ei(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const _=new Mt(g,d),m=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Yl;let p=this.type;this.render=function(S,T,C){if(m.enabled===!1||m.autoUpdate===!1&&m.needsUpdate===!1||S.length===0)return;const x=i.getRenderTarget(),y=i.getActiveCubeFace(),E=i.getActiveMipmapLevel(),I=i.state;I.setBlending(Gi),I.buffers.depth.getReversed()===!0?I.buffers.color.setClear(0,0,0,0):I.buffers.color.setClear(1,1,1,1),I.buffers.depth.setTest(!0),I.setScissorTest(!1);const N=p!==Ai&&this.type===Ai,H=p===Ai&&this.type!==Ai;for(let V=0,q=S.length;V<q;V++){const Z=S[V],G=Z.shadow;if(G===void 0){console.warn("THREE.WebGLShadowMap:",Z,"has no shadow.");continue}if(G.autoUpdate===!1&&G.needsUpdate===!1)continue;s.copy(G.mapSize);const rt=G.getFrameExtents();if(s.multiply(rt),a.copy(G.mapSize),(s.x>h||s.y>h)&&(s.x>h&&(a.x=Math.floor(h/rt.x),s.x=a.x*rt.x,G.mapSize.x=a.x),s.y>h&&(a.y=Math.floor(h/rt.y),s.y=a.y*rt.y,G.mapSize.y=a.y)),G.map===null||N===!0||H===!0){const St=this.type!==Ai?{minFilter:ti,magFilter:ti}:{};G.map!==null&&G.map.dispose(),G.map=new un(s.x,s.y,St),G.map.texture.name=Z.name+".shadowMap",G.camera.updateProjectionMatrix()}i.setRenderTarget(G.map),i.clear();const ht=G.getViewportCount();for(let St=0;St<ht;St++){const Bt=G.getViewport(St);r.set(a.x*Bt.x,a.y*Bt.y,a.x*Bt.z,a.y*Bt.w),I.viewport(r),G.updateMatrices(Z,St),n=G.getFrustum(),M(T,C,G.camera,Z,this.type)}G.isPointLightShadow!==!0&&this.type===Ai&&w(G,C),G.needsUpdate=!1}p=this.type,m.needsUpdate=!1,i.setRenderTarget(x,y,E)};function w(S,T){const C=t.update(_);d.defines.VSM_SAMPLES!==S.blurSamples&&(d.defines.VSM_SAMPLES=S.blurSamples,f.defines.VSM_SAMPLES=S.blurSamples,d.needsUpdate=!0,f.needsUpdate=!0),S.mapPass===null&&(S.mapPass=new un(s.x,s.y)),d.uniforms.shadow_pass.value=S.map.texture,d.uniforms.resolution.value=S.mapSize,d.uniforms.radius.value=S.radius,i.setRenderTarget(S.mapPass),i.clear(),i.renderBufferDirect(T,null,C,d,_,null),f.uniforms.shadow_pass.value=S.mapPass.texture,f.uniforms.resolution.value=S.mapSize,f.uniforms.radius.value=S.radius,i.setRenderTarget(S.map),i.clear(),i.renderBufferDirect(T,null,C,f,_,null)}function A(S,T,C,x){let y=null;const E=C.isPointLight===!0?S.customDistanceMaterial:S.customDepthMaterial;if(E!==void 0)y=E;else if(y=C.isPointLight===!0?l:o,i.localClippingEnabled&&T.clipShadows===!0&&Array.isArray(T.clippingPlanes)&&T.clippingPlanes.length!==0||T.displacementMap&&T.displacementScale!==0||T.alphaMap&&T.alphaTest>0||T.map&&T.alphaTest>0||T.alphaToCoverage===!0){const I=y.uuid,N=T.uuid;let H=c[I];H===void 0&&(H={},c[I]=H);let V=H[N];V===void 0&&(V=y.clone(),H[N]=V,T.addEventListener("dispose",P)),y=V}if(y.visible=T.visible,y.wireframe=T.wireframe,x===Ai?y.side=T.shadowSide!==null?T.shadowSide:T.side:y.side=T.shadowSide!==null?T.shadowSide:u[T.side],y.alphaMap=T.alphaMap,y.alphaTest=T.alphaToCoverage===!0?.5:T.alphaTest,y.map=T.map,y.clipShadows=T.clipShadows,y.clippingPlanes=T.clippingPlanes,y.clipIntersection=T.clipIntersection,y.displacementMap=T.displacementMap,y.displacementScale=T.displacementScale,y.displacementBias=T.displacementBias,y.wireframeLinewidth=T.wireframeLinewidth,y.linewidth=T.linewidth,C.isPointLight===!0&&y.isMeshDistanceMaterial===!0){const I=i.properties.get(y);I.light=C}return y}function M(S,T,C,x,y){if(S.visible===!1)return;if(S.layers.test(T.layers)&&(S.isMesh||S.isLine||S.isPoints)&&(S.castShadow||S.receiveShadow&&y===Ai)&&(!S.frustumCulled||n.intersectsObject(S))){S.modelViewMatrix.multiplyMatrices(C.matrixWorldInverse,S.matrixWorld);const N=t.update(S),H=S.material;if(Array.isArray(H)){const V=N.groups;for(let q=0,Z=V.length;q<Z;q++){const G=V[q],rt=H[G.materialIndex];if(rt&&rt.visible){const ht=A(S,rt,x,y);S.onBeforeShadow(i,S,T,C,N,ht,G),i.renderBufferDirect(C,null,N,ht,S,G),S.onAfterShadow(i,S,T,C,N,ht,G)}}}else if(H.visible){const V=A(S,H,x,y);S.onBeforeShadow(i,S,T,C,N,V,null),i.renderBufferDirect(C,null,N,V,S,null),S.onAfterShadow(i,S,T,C,N,V,null)}}const I=S.children;for(let N=0,H=I.length;N<H;N++)M(I[N],T,C,x,y)}function P(S){S.target.removeEventListener("dispose",P);for(const C in c){const x=c[C],y=S.target.uuid;y in x&&(x[y].dispose(),delete x[y])}}}const Qm={[rr]:or,[lr]:ur,[cr]:dr,[Bn]:hr,[or]:rr,[ur]:lr,[dr]:cr,[hr]:Bn};function t0(i,t){function e(){let U=!1;const it=new ne;let st=null;const dt=new ne(0,0,0,0);return{setMask:function(Q){st!==Q&&!U&&(i.colorMask(Q,Q,Q,Q),st=Q)},setLocked:function(Q){U=Q},setClear:function(Q,Y,mt,Dt,oe){oe===!0&&(Q*=Dt,Y*=Dt,mt*=Dt),it.set(Q,Y,mt,Dt),dt.equals(it)===!1&&(i.clearColor(Q,Y,mt,Dt),dt.copy(it))},reset:function(){U=!1,st=null,dt.set(-1,0,0,0)}}}function n(){let U=!1,it=!1,st=null,dt=null,Q=null;return{setReversed:function(Y){if(it!==Y){const mt=t.get("EXT_clip_control");Y?mt.clipControlEXT(mt.LOWER_LEFT_EXT,mt.ZERO_TO_ONE_EXT):mt.clipControlEXT(mt.LOWER_LEFT_EXT,mt.NEGATIVE_ONE_TO_ONE_EXT),it=Y;const Dt=Q;Q=null,this.setClear(Dt)}},getReversed:function(){return it},setTest:function(Y){Y?J(i.DEPTH_TEST):ft(i.DEPTH_TEST)},setMask:function(Y){st!==Y&&!U&&(i.depthMask(Y),st=Y)},setFunc:function(Y){if(it&&(Y=Qm[Y]),dt!==Y){switch(Y){case rr:i.depthFunc(i.NEVER);break;case or:i.depthFunc(i.ALWAYS);break;case lr:i.depthFunc(i.LESS);break;case Bn:i.depthFunc(i.LEQUAL);break;case cr:i.depthFunc(i.EQUAL);break;case hr:i.depthFunc(i.GEQUAL);break;case ur:i.depthFunc(i.GREATER);break;case dr:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}dt=Y}},setLocked:function(Y){U=Y},setClear:function(Y){Q!==Y&&(it&&(Y=1-Y),i.clearDepth(Y),Q=Y)},reset:function(){U=!1,st=null,dt=null,Q=null,it=!1}}}function s(){let U=!1,it=null,st=null,dt=null,Q=null,Y=null,mt=null,Dt=null,oe=null;return{setTest:function(Yt){U||(Yt?J(i.STENCIL_TEST):ft(i.STENCIL_TEST))},setMask:function(Yt){it!==Yt&&!U&&(i.stencilMask(Yt),it=Yt)},setFunc:function(Yt,bi,di){(st!==Yt||dt!==bi||Q!==di)&&(i.stencilFunc(Yt,bi,di),st=Yt,dt=bi,Q=di)},setOp:function(Yt,bi,di){(Y!==Yt||mt!==bi||Dt!==di)&&(i.stencilOp(Yt,bi,di),Y=Yt,mt=bi,Dt=di)},setLocked:function(Yt){U=Yt},setClear:function(Yt){oe!==Yt&&(i.clearStencil(Yt),oe=Yt)},reset:function(){U=!1,it=null,st=null,dt=null,Q=null,Y=null,mt=null,Dt=null,oe=null}}}const a=new e,r=new n,o=new s,l=new WeakMap,c=new WeakMap;let h={},u={},d=new WeakMap,f=[],g=null,_=!1,m=null,p=null,w=null,A=null,M=null,P=null,S=null,T=new Ft(0,0,0),C=0,x=!1,y=null,E=null,I=null,N=null,H=null;const V=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let q=!1,Z=0;const G=i.getParameter(i.VERSION);G.indexOf("WebGL")!==-1?(Z=parseFloat(/^WebGL (\d)/.exec(G)[1]),q=Z>=1):G.indexOf("OpenGL ES")!==-1&&(Z=parseFloat(/^OpenGL ES (\d)/.exec(G)[1]),q=Z>=2);let rt=null,ht={};const St=i.getParameter(i.SCISSOR_BOX),Bt=i.getParameter(i.VIEWPORT),re=new ne().fromArray(St),he=new ne().fromArray(Bt);function jt(U,it,st,dt){const Q=new Uint8Array(4),Y=i.createTexture();i.bindTexture(U,Y),i.texParameteri(U,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(U,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let mt=0;mt<st;mt++)U===i.TEXTURE_3D||U===i.TEXTURE_2D_ARRAY?i.texImage3D(it,0,i.RGBA,1,1,dt,0,i.RGBA,i.UNSIGNED_BYTE,Q):i.texImage2D(it+mt,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,Q);return Y}const j={};j[i.TEXTURE_2D]=jt(i.TEXTURE_2D,i.TEXTURE_2D,1),j[i.TEXTURE_CUBE_MAP]=jt(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),j[i.TEXTURE_2D_ARRAY]=jt(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),j[i.TEXTURE_3D]=jt(i.TEXTURE_3D,i.TEXTURE_3D,1,1),a.setClear(0,0,0,1),r.setClear(1),o.setClear(0),J(i.DEPTH_TEST),r.setFunc(Bn),Ct(!1),gt(zo),J(i.CULL_FACE),ue(Gi);function J(U){h[U]!==!0&&(i.enable(U),h[U]=!0)}function ft(U){h[U]!==!1&&(i.disable(U),h[U]=!1)}function Lt(U,it){return u[U]!==it?(i.bindFramebuffer(U,it),u[U]=it,U===i.DRAW_FRAMEBUFFER&&(u[i.FRAMEBUFFER]=it),U===i.FRAMEBUFFER&&(u[i.DRAW_FRAMEBUFFER]=it),!0):!1}function wt(U,it){let st=f,dt=!1;if(U){st=d.get(it),st===void 0&&(st=[],d.set(it,st));const Q=U.textures;if(st.length!==Q.length||st[0]!==i.COLOR_ATTACHMENT0){for(let Y=0,mt=Q.length;Y<mt;Y++)st[Y]=i.COLOR_ATTACHMENT0+Y;st.length=Q.length,dt=!0}}else st[0]!==i.BACK&&(st[0]=i.BACK,dt=!0);dt&&i.drawBuffers(st)}function Wt(U){return g!==U?(i.useProgram(U),g=U,!0):!1}const Ne={[sn]:i.FUNC_ADD,[ih]:i.FUNC_SUBTRACT,[nh]:i.FUNC_REVERSE_SUBTRACT};Ne[sh]=i.MIN,Ne[ah]=i.MAX;const L={[rh]:i.ZERO,[oh]:i.ONE,[lh]:i.SRC_COLOR,[sr]:i.SRC_ALPHA,[ph]:i.SRC_ALPHA_SATURATE,[dh]:i.DST_COLOR,[hh]:i.DST_ALPHA,[ch]:i.ONE_MINUS_SRC_COLOR,[ar]:i.ONE_MINUS_SRC_ALPHA,[fh]:i.ONE_MINUS_DST_COLOR,[uh]:i.ONE_MINUS_DST_ALPHA,[mh]:i.CONSTANT_COLOR,[gh]:i.ONE_MINUS_CONSTANT_COLOR,[_h]:i.CONSTANT_ALPHA,[vh]:i.ONE_MINUS_CONSTANT_ALPHA};function ue(U,it,st,dt,Q,Y,mt,Dt,oe,Yt){if(U===Gi){_===!0&&(ft(i.BLEND),_=!1);return}if(_===!1&&(J(i.BLEND),_=!0),U!==eh){if(U!==m||Yt!==x){if((p!==sn||M!==sn)&&(i.blendEquation(i.FUNC_ADD),p=sn,M=sn),Yt)switch(U){case kn:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case ca:i.blendFunc(i.ONE,i.ONE);break;case Bo:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case Ho:i.blendFuncSeparate(i.DST_COLOR,i.ONE_MINUS_SRC_ALPHA,i.ZERO,i.ONE);break;default:console.error("THREE.WebGLState: Invalid blending: ",U);break}else switch(U){case kn:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case ca:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE,i.ONE,i.ONE);break;case Bo:console.error("THREE.WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case Ho:console.error("THREE.WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:console.error("THREE.WebGLState: Invalid blending: ",U);break}w=null,A=null,P=null,S=null,T.set(0,0,0),C=0,m=U,x=Yt}return}Q=Q||it,Y=Y||st,mt=mt||dt,(it!==p||Q!==M)&&(i.blendEquationSeparate(Ne[it],Ne[Q]),p=it,M=Q),(st!==w||dt!==A||Y!==P||mt!==S)&&(i.blendFuncSeparate(L[st],L[dt],L[Y],L[mt]),w=st,A=dt,P=Y,S=mt),(Dt.equals(T)===!1||oe!==C)&&(i.blendColor(Dt.r,Dt.g,Dt.b,oe),T.copy(Dt),C=oe),m=U,x=!1}function It(U,it){U.side===Qe?ft(i.CULL_FACE):J(i.CULL_FACE);let st=U.side===Ve;it&&(st=!st),Ct(st),U.blending===kn&&U.transparent===!1?ue(Gi):ue(U.blending,U.blendEquation,U.blendSrc,U.blendDst,U.blendEquationAlpha,U.blendSrcAlpha,U.blendDstAlpha,U.blendColor,U.blendAlpha,U.premultipliedAlpha),r.setFunc(U.depthFunc),r.setTest(U.depthTest),r.setMask(U.depthWrite),a.setMask(U.colorWrite);const dt=U.stencilWrite;o.setTest(dt),dt&&(o.setMask(U.stencilWriteMask),o.setFunc(U.stencilFunc,U.stencilRef,U.stencilFuncMask),o.setOp(U.stencilFail,U.stencilZFail,U.stencilZPass)),_t(U.polygonOffset,U.polygonOffsetFactor,U.polygonOffsetUnits),U.alphaToCoverage===!0?J(i.SAMPLE_ALPHA_TO_COVERAGE):ft(i.SAMPLE_ALPHA_TO_COVERAGE)}function Ct(U){y!==U&&(U?i.frontFace(i.CW):i.frontFace(i.CCW),y=U)}function gt(U){U!==Qc?(J(i.CULL_FACE),U!==E&&(U===zo?i.cullFace(i.BACK):U===th?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):ft(i.CULL_FACE),E=U}function de(U){U!==I&&(q&&i.lineWidth(U),I=U)}function _t(U,it,st){U?(J(i.POLYGON_OFFSET_FILL),(N!==it||H!==st)&&(i.polygonOffset(it,st),N=it,H=st)):ft(i.POLYGON_OFFSET_FILL)}function Ot(U){U?J(i.SCISSOR_TEST):ft(i.SCISSOR_TEST)}function Ae(U){U===void 0&&(U=i.TEXTURE0+V-1),rt!==U&&(i.activeTexture(U),rt=U)}function xe(U,it,st){st===void 0&&(rt===null?st=i.TEXTURE0+V-1:st=rt);let dt=ht[st];dt===void 0&&(dt={type:void 0,texture:void 0},ht[st]=dt),(dt.type!==U||dt.texture!==it)&&(rt!==st&&(i.activeTexture(st),rt=st),i.bindTexture(U,it||j[U]),dt.type=U,dt.texture=it)}function R(){const U=ht[rt];U!==void 0&&U.type!==void 0&&(i.bindTexture(U.type,null),U.type=void 0,U.texture=void 0)}function v(){try{i.compressedTexImage2D(...arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function O(){try{i.compressedTexImage3D(...arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function $(){try{i.texSubImage2D(...arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function K(){try{i.texSubImage3D(...arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function W(){try{i.compressedTexSubImage2D(...arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function bt(){try{i.compressedTexSubImage3D(...arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function nt(){try{i.texStorage2D(...arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function vt(){try{i.texStorage3D(...arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function xt(){try{i.texImage2D(...arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function et(){try{i.texImage3D(...arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function ct(U){re.equals(U)===!1&&(i.scissor(U.x,U.y,U.z,U.w),re.copy(U))}function Rt(U){he.equals(U)===!1&&(i.viewport(U.x,U.y,U.z,U.w),he.copy(U))}function yt(U,it){let st=c.get(it);st===void 0&&(st=new WeakMap,c.set(it,st));let dt=st.get(U);dt===void 0&&(dt=i.getUniformBlockIndex(it,U.name),st.set(U,dt))}function ot(U,it){const dt=c.get(it).get(U);l.get(it)!==dt&&(i.uniformBlockBinding(it,dt,U.__bindingPointIndex),l.set(it,dt))}function kt(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),r.setReversed(!1),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),h={},rt=null,ht={},u={},d=new WeakMap,f=[],g=null,_=!1,m=null,p=null,w=null,A=null,M=null,P=null,S=null,T=new Ft(0,0,0),C=0,x=!1,y=null,E=null,I=null,N=null,H=null,re.set(0,0,i.canvas.width,i.canvas.height),he.set(0,0,i.canvas.width,i.canvas.height),a.reset(),r.reset(),o.reset()}return{buffers:{color:a,depth:r,stencil:o},enable:J,disable:ft,bindFramebuffer:Lt,drawBuffers:wt,useProgram:Wt,setBlending:ue,setMaterial:It,setFlipSided:Ct,setCullFace:gt,setLineWidth:de,setPolygonOffset:_t,setScissorTest:Ot,activeTexture:Ae,bindTexture:xe,unbindTexture:R,compressedTexImage2D:v,compressedTexImage3D:O,texImage2D:xt,texImage3D:et,updateUBOMapping:yt,uniformBlockBinding:ot,texStorage2D:nt,texStorage3D:vt,texSubImage2D:$,texSubImage3D:K,compressedTexSubImage2D:W,compressedTexSubImage3D:bt,scissor:ct,viewport:Rt,reset:kt}}function e0(i,t,e,n,s,a,r){const o=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new Ut,h=new WeakMap;let u;const d=new WeakMap;let f=!1;try{f=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function g(R,v){return f?new OffscreenCanvas(R,v):fa("canvas")}function _(R,v,O){let $=1;const K=xe(R);if((K.width>O||K.height>O)&&($=O/Math.max(K.width,K.height)),$<1)if(typeof HTMLImageElement<"u"&&R instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&R instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&R instanceof ImageBitmap||typeof VideoFrame<"u"&&R instanceof VideoFrame){const W=Math.floor($*K.width),bt=Math.floor($*K.height);u===void 0&&(u=g(W,bt));const nt=v?g(W,bt):u;return nt.width=W,nt.height=bt,nt.getContext("2d").drawImage(R,0,0,W,bt),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+K.width+"x"+K.height+") to ("+W+"x"+bt+")."),nt}else return"data"in R&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+K.width+"x"+K.height+")."),R;return R}function m(R){return R.generateMipmaps}function p(R){i.generateMipmap(R)}function w(R){return R.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:R.isWebGL3DRenderTarget?i.TEXTURE_3D:R.isWebGLArrayRenderTarget||R.isCompressedArrayTexture?i.TEXTURE_2D_ARRAY:i.TEXTURE_2D}function A(R,v,O,$,K=!1){if(R!==null){if(i[R]!==void 0)return i[R];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+R+"'")}let W=v;if(v===i.RED&&(O===i.FLOAT&&(W=i.R32F),O===i.HALF_FLOAT&&(W=i.R16F),O===i.UNSIGNED_BYTE&&(W=i.R8)),v===i.RED_INTEGER&&(O===i.UNSIGNED_BYTE&&(W=i.R8UI),O===i.UNSIGNED_SHORT&&(W=i.R16UI),O===i.UNSIGNED_INT&&(W=i.R32UI),O===i.BYTE&&(W=i.R8I),O===i.SHORT&&(W=i.R16I),O===i.INT&&(W=i.R32I)),v===i.RG&&(O===i.FLOAT&&(W=i.RG32F),O===i.HALF_FLOAT&&(W=i.RG16F),O===i.UNSIGNED_BYTE&&(W=i.RG8)),v===i.RG_INTEGER&&(O===i.UNSIGNED_BYTE&&(W=i.RG8UI),O===i.UNSIGNED_SHORT&&(W=i.RG16UI),O===i.UNSIGNED_INT&&(W=i.RG32UI),O===i.BYTE&&(W=i.RG8I),O===i.SHORT&&(W=i.RG16I),O===i.INT&&(W=i.RG32I)),v===i.RGB_INTEGER&&(O===i.UNSIGNED_BYTE&&(W=i.RGB8UI),O===i.UNSIGNED_SHORT&&(W=i.RGB16UI),O===i.UNSIGNED_INT&&(W=i.RGB32UI),O===i.BYTE&&(W=i.RGB8I),O===i.SHORT&&(W=i.RGB16I),O===i.INT&&(W=i.RGB32I)),v===i.RGBA_INTEGER&&(O===i.UNSIGNED_BYTE&&(W=i.RGBA8UI),O===i.UNSIGNED_SHORT&&(W=i.RGBA16UI),O===i.UNSIGNED_INT&&(W=i.RGBA32UI),O===i.BYTE&&(W=i.RGBA8I),O===i.SHORT&&(W=i.RGBA16I),O===i.INT&&(W=i.RGBA32I)),v===i.RGB&&(O===i.UNSIGNED_INT_5_9_9_9_REV&&(W=i.RGB9_E5),O===i.UNSIGNED_INT_10F_11F_11F_REV&&(W=i.R11F_G11F_B10F)),v===i.RGBA){const bt=K?ha:qt.getTransfer($);O===i.FLOAT&&(W=i.RGBA32F),O===i.HALF_FLOAT&&(W=i.RGBA16F),O===i.UNSIGNED_BYTE&&(W=bt===Qt?i.SRGB8_ALPHA8:i.RGBA8),O===i.UNSIGNED_SHORT_4_4_4_4&&(W=i.RGBA4),O===i.UNSIGNED_SHORT_5_5_5_1&&(W=i.RGB5_A1)}return(W===i.R16F||W===i.R32F||W===i.RG16F||W===i.RG32F||W===i.RGBA16F||W===i.RGBA32F)&&t.get("EXT_color_buffer_float"),W}function M(R,v){let O;return R?v===null||v===hn||v===_s?O=i.DEPTH24_STENCIL8:v===_i?O=i.DEPTH32F_STENCIL8:v===gs&&(O=i.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):v===null||v===hn||v===_s?O=i.DEPTH_COMPONENT24:v===_i?O=i.DEPTH_COMPONENT32F:v===gs&&(O=i.DEPTH_COMPONENT16),O}function P(R,v){return m(R)===!0||R.isFramebufferTexture&&R.minFilter!==ti&&R.minFilter!==gi?Math.log2(Math.max(v.width,v.height))+1:R.mipmaps!==void 0&&R.mipmaps.length>0?R.mipmaps.length:R.isCompressedTexture&&Array.isArray(R.image)?v.mipmaps.length:1}function S(R){const v=R.target;v.removeEventListener("dispose",S),C(v),v.isVideoTexture&&h.delete(v)}function T(R){const v=R.target;v.removeEventListener("dispose",T),y(v)}function C(R){const v=n.get(R);if(v.__webglInit===void 0)return;const O=R.source,$=d.get(O);if($){const K=$[v.__cacheKey];K.usedTimes--,K.usedTimes===0&&x(R),Object.keys($).length===0&&d.delete(O)}n.remove(R)}function x(R){const v=n.get(R);i.deleteTexture(v.__webglTexture);const O=R.source,$=d.get(O);delete $[v.__cacheKey],r.memory.textures--}function y(R){const v=n.get(R);if(R.depthTexture&&(R.depthTexture.dispose(),n.remove(R.depthTexture)),R.isWebGLCubeRenderTarget)for(let $=0;$<6;$++){if(Array.isArray(v.__webglFramebuffer[$]))for(let K=0;K<v.__webglFramebuffer[$].length;K++)i.deleteFramebuffer(v.__webglFramebuffer[$][K]);else i.deleteFramebuffer(v.__webglFramebuffer[$]);v.__webglDepthbuffer&&i.deleteRenderbuffer(v.__webglDepthbuffer[$])}else{if(Array.isArray(v.__webglFramebuffer))for(let $=0;$<v.__webglFramebuffer.length;$++)i.deleteFramebuffer(v.__webglFramebuffer[$]);else i.deleteFramebuffer(v.__webglFramebuffer);if(v.__webglDepthbuffer&&i.deleteRenderbuffer(v.__webglDepthbuffer),v.__webglMultisampledFramebuffer&&i.deleteFramebuffer(v.__webglMultisampledFramebuffer),v.__webglColorRenderbuffer)for(let $=0;$<v.__webglColorRenderbuffer.length;$++)v.__webglColorRenderbuffer[$]&&i.deleteRenderbuffer(v.__webglColorRenderbuffer[$]);v.__webglDepthRenderbuffer&&i.deleteRenderbuffer(v.__webglDepthRenderbuffer)}const O=R.textures;for(let $=0,K=O.length;$<K;$++){const W=n.get(O[$]);W.__webglTexture&&(i.deleteTexture(W.__webglTexture),r.memory.textures--),n.remove(O[$])}n.remove(R)}let E=0;function I(){E=0}function N(){const R=E;return R>=s.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+R+" texture units while this GPU supports only "+s.maxTextures),E+=1,R}function H(R){const v=[];return v.push(R.wrapS),v.push(R.wrapT),v.push(R.wrapR||0),v.push(R.magFilter),v.push(R.minFilter),v.push(R.anisotropy),v.push(R.internalFormat),v.push(R.format),v.push(R.type),v.push(R.generateMipmaps),v.push(R.premultiplyAlpha),v.push(R.flipY),v.push(R.unpackAlignment),v.push(R.colorSpace),v.join()}function V(R,v){const O=n.get(R);if(R.isVideoTexture&&Ot(R),R.isRenderTargetTexture===!1&&R.isExternalTexture!==!0&&R.version>0&&O.__version!==R.version){const $=R.image;if($===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if($.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{j(O,R,v);return}}else R.isExternalTexture&&(O.__webglTexture=R.sourceTexture?R.sourceTexture:null);e.bindTexture(i.TEXTURE_2D,O.__webglTexture,i.TEXTURE0+v)}function q(R,v){const O=n.get(R);if(R.isRenderTargetTexture===!1&&R.version>0&&O.__version!==R.version){j(O,R,v);return}e.bindTexture(i.TEXTURE_2D_ARRAY,O.__webglTexture,i.TEXTURE0+v)}function Z(R,v){const O=n.get(R);if(R.isRenderTargetTexture===!1&&R.version>0&&O.__version!==R.version){j(O,R,v);return}e.bindTexture(i.TEXTURE_3D,O.__webglTexture,i.TEXTURE0+v)}function G(R,v){const O=n.get(R);if(R.version>0&&O.__version!==R.version){J(O,R,v);return}e.bindTexture(i.TEXTURE_CUBE_MAP,O.__webglTexture,i.TEXTURE0+v)}const rt={[ms]:i.REPEAT,[rn]:i.CLAMP_TO_EDGE,[mr]:i.MIRRORED_REPEAT},ht={[ti]:i.NEAREST,[Ah]:i.NEAREST_MIPMAP_NEAREST,[Rs]:i.NEAREST_MIPMAP_LINEAR,[gi]:i.LINEAR,[ba]:i.LINEAR_MIPMAP_NEAREST,[on]:i.LINEAR_MIPMAP_LINEAR},St={[Lh]:i.NEVER,[Fh]:i.ALWAYS,[Dh]:i.LESS,[lc]:i.LEQUAL,[Ih]:i.EQUAL,[Nh]:i.GEQUAL,[Uh]:i.GREATER,[kh]:i.NOTEQUAL};function Bt(R,v){if(v.type===_i&&t.has("OES_texture_float_linear")===!1&&(v.magFilter===gi||v.magFilter===ba||v.magFilter===Rs||v.magFilter===on||v.minFilter===gi||v.minFilter===ba||v.minFilter===Rs||v.minFilter===on)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),i.texParameteri(R,i.TEXTURE_WRAP_S,rt[v.wrapS]),i.texParameteri(R,i.TEXTURE_WRAP_T,rt[v.wrapT]),(R===i.TEXTURE_3D||R===i.TEXTURE_2D_ARRAY)&&i.texParameteri(R,i.TEXTURE_WRAP_R,rt[v.wrapR]),i.texParameteri(R,i.TEXTURE_MAG_FILTER,ht[v.magFilter]),i.texParameteri(R,i.TEXTURE_MIN_FILTER,ht[v.minFilter]),v.compareFunction&&(i.texParameteri(R,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(R,i.TEXTURE_COMPARE_FUNC,St[v.compareFunction])),t.has("EXT_texture_filter_anisotropic")===!0){if(v.magFilter===ti||v.minFilter!==Rs&&v.minFilter!==on||v.type===_i&&t.has("OES_texture_float_linear")===!1)return;if(v.anisotropy>1||n.get(v).__currentAnisotropy){const O=t.get("EXT_texture_filter_anisotropic");i.texParameterf(R,O.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(v.anisotropy,s.getMaxAnisotropy())),n.get(v).__currentAnisotropy=v.anisotropy}}}function re(R,v){let O=!1;R.__webglInit===void 0&&(R.__webglInit=!0,v.addEventListener("dispose",S));const $=v.source;let K=d.get($);K===void 0&&(K={},d.set($,K));const W=H(v);if(W!==R.__cacheKey){K[W]===void 0&&(K[W]={texture:i.createTexture(),usedTimes:0},r.memory.textures++,O=!0),K[W].usedTimes++;const bt=K[R.__cacheKey];bt!==void 0&&(K[R.__cacheKey].usedTimes--,bt.usedTimes===0&&x(v)),R.__cacheKey=W,R.__webglTexture=K[W].texture}return O}function he(R,v,O){return Math.floor(Math.floor(R/O)/v)}function jt(R,v,O,$){const W=R.updateRanges;if(W.length===0)e.texSubImage2D(i.TEXTURE_2D,0,0,0,v.width,v.height,O,$,v.data);else{W.sort((et,ct)=>et.start-ct.start);let bt=0;for(let et=1;et<W.length;et++){const ct=W[bt],Rt=W[et],yt=ct.start+ct.count,ot=he(Rt.start,v.width,4),kt=he(ct.start,v.width,4);Rt.start<=yt+1&&ot===kt&&he(Rt.start+Rt.count-1,v.width,4)===ot?ct.count=Math.max(ct.count,Rt.start+Rt.count-ct.start):(++bt,W[bt]=Rt)}W.length=bt+1;const nt=i.getParameter(i.UNPACK_ROW_LENGTH),vt=i.getParameter(i.UNPACK_SKIP_PIXELS),xt=i.getParameter(i.UNPACK_SKIP_ROWS);i.pixelStorei(i.UNPACK_ROW_LENGTH,v.width);for(let et=0,ct=W.length;et<ct;et++){const Rt=W[et],yt=Math.floor(Rt.start/4),ot=Math.ceil(Rt.count/4),kt=yt%v.width,U=Math.floor(yt/v.width),it=ot,st=1;i.pixelStorei(i.UNPACK_SKIP_PIXELS,kt),i.pixelStorei(i.UNPACK_SKIP_ROWS,U),e.texSubImage2D(i.TEXTURE_2D,0,kt,U,it,st,O,$,v.data)}R.clearUpdateRanges(),i.pixelStorei(i.UNPACK_ROW_LENGTH,nt),i.pixelStorei(i.UNPACK_SKIP_PIXELS,vt),i.pixelStorei(i.UNPACK_SKIP_ROWS,xt)}}function j(R,v,O){let $=i.TEXTURE_2D;(v.isDataArrayTexture||v.isCompressedArrayTexture)&&($=i.TEXTURE_2D_ARRAY),v.isData3DTexture&&($=i.TEXTURE_3D);const K=re(R,v),W=v.source;e.bindTexture($,R.__webglTexture,i.TEXTURE0+O);const bt=n.get(W);if(W.version!==bt.__version||K===!0){e.activeTexture(i.TEXTURE0+O);const nt=qt.getPrimaries(qt.workingColorSpace),vt=v.colorSpace===Hi?null:qt.getPrimaries(v.colorSpace),xt=v.colorSpace===Hi||nt===vt?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,v.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,v.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,v.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,xt);let et=_(v.image,!1,s.maxTextureSize);et=Ae(v,et);const ct=a.convert(v.format,v.colorSpace),Rt=a.convert(v.type);let yt=A(v.internalFormat,ct,Rt,v.colorSpace,v.isVideoTexture);Bt($,v);let ot;const kt=v.mipmaps,U=v.isVideoTexture!==!0,it=bt.__version===void 0||K===!0,st=W.dataReady,dt=P(v,et);if(v.isDepthTexture)yt=M(v.format===xs,v.type),it&&(U?e.texStorage2D(i.TEXTURE_2D,1,yt,et.width,et.height):e.texImage2D(i.TEXTURE_2D,0,yt,et.width,et.height,0,ct,Rt,null));else if(v.isDataTexture)if(kt.length>0){U&&it&&e.texStorage2D(i.TEXTURE_2D,dt,yt,kt[0].width,kt[0].height);for(let Q=0,Y=kt.length;Q<Y;Q++)ot=kt[Q],U?st&&e.texSubImage2D(i.TEXTURE_2D,Q,0,0,ot.width,ot.height,ct,Rt,ot.data):e.texImage2D(i.TEXTURE_2D,Q,yt,ot.width,ot.height,0,ct,Rt,ot.data);v.generateMipmaps=!1}else U?(it&&e.texStorage2D(i.TEXTURE_2D,dt,yt,et.width,et.height),st&&jt(v,et,ct,Rt)):e.texImage2D(i.TEXTURE_2D,0,yt,et.width,et.height,0,ct,Rt,et.data);else if(v.isCompressedTexture)if(v.isCompressedArrayTexture){U&&it&&e.texStorage3D(i.TEXTURE_2D_ARRAY,dt,yt,kt[0].width,kt[0].height,et.depth);for(let Q=0,Y=kt.length;Q<Y;Q++)if(ot=kt[Q],v.format!==hi)if(ct!==null)if(U){if(st)if(v.layerUpdates.size>0){const mt=_l(ot.width,ot.height,v.format,v.type);for(const Dt of v.layerUpdates){const oe=ot.data.subarray(Dt*mt/ot.data.BYTES_PER_ELEMENT,(Dt+1)*mt/ot.data.BYTES_PER_ELEMENT);e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,Q,0,0,Dt,ot.width,ot.height,1,ct,oe)}v.clearLayerUpdates()}else e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,Q,0,0,0,ot.width,ot.height,et.depth,ct,ot.data)}else e.compressedTexImage3D(i.TEXTURE_2D_ARRAY,Q,yt,ot.width,ot.height,et.depth,0,ot.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else U?st&&e.texSubImage3D(i.TEXTURE_2D_ARRAY,Q,0,0,0,ot.width,ot.height,et.depth,ct,Rt,ot.data):e.texImage3D(i.TEXTURE_2D_ARRAY,Q,yt,ot.width,ot.height,et.depth,0,ct,Rt,ot.data)}else{U&&it&&e.texStorage2D(i.TEXTURE_2D,dt,yt,kt[0].width,kt[0].height);for(let Q=0,Y=kt.length;Q<Y;Q++)ot=kt[Q],v.format!==hi?ct!==null?U?st&&e.compressedTexSubImage2D(i.TEXTURE_2D,Q,0,0,ot.width,ot.height,ct,ot.data):e.compressedTexImage2D(i.TEXTURE_2D,Q,yt,ot.width,ot.height,0,ot.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):U?st&&e.texSubImage2D(i.TEXTURE_2D,Q,0,0,ot.width,ot.height,ct,Rt,ot.data):e.texImage2D(i.TEXTURE_2D,Q,yt,ot.width,ot.height,0,ct,Rt,ot.data)}else if(v.isDataArrayTexture)if(U){if(it&&e.texStorage3D(i.TEXTURE_2D_ARRAY,dt,yt,et.width,et.height,et.depth),st)if(v.layerUpdates.size>0){const Q=_l(et.width,et.height,v.format,v.type);for(const Y of v.layerUpdates){const mt=et.data.subarray(Y*Q/et.data.BYTES_PER_ELEMENT,(Y+1)*Q/et.data.BYTES_PER_ELEMENT);e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,Y,et.width,et.height,1,ct,Rt,mt)}v.clearLayerUpdates()}else e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,et.width,et.height,et.depth,ct,Rt,et.data)}else e.texImage3D(i.TEXTURE_2D_ARRAY,0,yt,et.width,et.height,et.depth,0,ct,Rt,et.data);else if(v.isData3DTexture)U?(it&&e.texStorage3D(i.TEXTURE_3D,dt,yt,et.width,et.height,et.depth),st&&e.texSubImage3D(i.TEXTURE_3D,0,0,0,0,et.width,et.height,et.depth,ct,Rt,et.data)):e.texImage3D(i.TEXTURE_3D,0,yt,et.width,et.height,et.depth,0,ct,Rt,et.data);else if(v.isFramebufferTexture){if(it)if(U)e.texStorage2D(i.TEXTURE_2D,dt,yt,et.width,et.height);else{let Q=et.width,Y=et.height;for(let mt=0;mt<dt;mt++)e.texImage2D(i.TEXTURE_2D,mt,yt,Q,Y,0,ct,Rt,null),Q>>=1,Y>>=1}}else if(kt.length>0){if(U&&it){const Q=xe(kt[0]);e.texStorage2D(i.TEXTURE_2D,dt,yt,Q.width,Q.height)}for(let Q=0,Y=kt.length;Q<Y;Q++)ot=kt[Q],U?st&&e.texSubImage2D(i.TEXTURE_2D,Q,0,0,ct,Rt,ot):e.texImage2D(i.TEXTURE_2D,Q,yt,ct,Rt,ot);v.generateMipmaps=!1}else if(U){if(it){const Q=xe(et);e.texStorage2D(i.TEXTURE_2D,dt,yt,Q.width,Q.height)}st&&e.texSubImage2D(i.TEXTURE_2D,0,0,0,ct,Rt,et)}else e.texImage2D(i.TEXTURE_2D,0,yt,ct,Rt,et);m(v)&&p($),bt.__version=W.version,v.onUpdate&&v.onUpdate(v)}R.__version=v.version}function J(R,v,O){if(v.image.length!==6)return;const $=re(R,v),K=v.source;e.bindTexture(i.TEXTURE_CUBE_MAP,R.__webglTexture,i.TEXTURE0+O);const W=n.get(K);if(K.version!==W.__version||$===!0){e.activeTexture(i.TEXTURE0+O);const bt=qt.getPrimaries(qt.workingColorSpace),nt=v.colorSpace===Hi?null:qt.getPrimaries(v.colorSpace),vt=v.colorSpace===Hi||bt===nt?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,v.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,v.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,v.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,vt);const xt=v.isCompressedTexture||v.image[0].isCompressedTexture,et=v.image[0]&&v.image[0].isDataTexture,ct=[];for(let Y=0;Y<6;Y++)!xt&&!et?ct[Y]=_(v.image[Y],!0,s.maxCubemapSize):ct[Y]=et?v.image[Y].image:v.image[Y],ct[Y]=Ae(v,ct[Y]);const Rt=ct[0],yt=a.convert(v.format,v.colorSpace),ot=a.convert(v.type),kt=A(v.internalFormat,yt,ot,v.colorSpace),U=v.isVideoTexture!==!0,it=W.__version===void 0||$===!0,st=K.dataReady;let dt=P(v,Rt);Bt(i.TEXTURE_CUBE_MAP,v);let Q;if(xt){U&&it&&e.texStorage2D(i.TEXTURE_CUBE_MAP,dt,kt,Rt.width,Rt.height);for(let Y=0;Y<6;Y++){Q=ct[Y].mipmaps;for(let mt=0;mt<Q.length;mt++){const Dt=Q[mt];v.format!==hi?yt!==null?U?st&&e.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Y,mt,0,0,Dt.width,Dt.height,yt,Dt.data):e.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Y,mt,kt,Dt.width,Dt.height,0,Dt.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):U?st&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Y,mt,0,0,Dt.width,Dt.height,yt,ot,Dt.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Y,mt,kt,Dt.width,Dt.height,0,yt,ot,Dt.data)}}}else{if(Q=v.mipmaps,U&&it){Q.length>0&&dt++;const Y=xe(ct[0]);e.texStorage2D(i.TEXTURE_CUBE_MAP,dt,kt,Y.width,Y.height)}for(let Y=0;Y<6;Y++)if(et){U?st&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Y,0,0,0,ct[Y].width,ct[Y].height,yt,ot,ct[Y].data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Y,0,kt,ct[Y].width,ct[Y].height,0,yt,ot,ct[Y].data);for(let mt=0;mt<Q.length;mt++){const oe=Q[mt].image[Y].image;U?st&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Y,mt+1,0,0,oe.width,oe.height,yt,ot,oe.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Y,mt+1,kt,oe.width,oe.height,0,yt,ot,oe.data)}}else{U?st&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Y,0,0,0,yt,ot,ct[Y]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Y,0,kt,yt,ot,ct[Y]);for(let mt=0;mt<Q.length;mt++){const Dt=Q[mt];U?st&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Y,mt+1,0,0,yt,ot,Dt.image[Y]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Y,mt+1,kt,yt,ot,Dt.image[Y])}}}m(v)&&p(i.TEXTURE_CUBE_MAP),W.__version=K.version,v.onUpdate&&v.onUpdate(v)}R.__version=v.version}function ft(R,v,O,$,K,W){const bt=a.convert(O.format,O.colorSpace),nt=a.convert(O.type),vt=A(O.internalFormat,bt,nt,O.colorSpace),xt=n.get(v),et=n.get(O);if(et.__renderTarget=v,!xt.__hasExternalTextures){const ct=Math.max(1,v.width>>W),Rt=Math.max(1,v.height>>W);K===i.TEXTURE_3D||K===i.TEXTURE_2D_ARRAY?e.texImage3D(K,W,vt,ct,Rt,v.depth,0,bt,nt,null):e.texImage2D(K,W,vt,ct,Rt,0,bt,nt,null)}e.bindFramebuffer(i.FRAMEBUFFER,R),_t(v)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,$,K,et.__webglTexture,0,de(v)):(K===i.TEXTURE_2D||K>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&K<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,$,K,et.__webglTexture,W),e.bindFramebuffer(i.FRAMEBUFFER,null)}function Lt(R,v,O){if(i.bindRenderbuffer(i.RENDERBUFFER,R),v.depthBuffer){const $=v.depthTexture,K=$&&$.isDepthTexture?$.type:null,W=M(v.stencilBuffer,K),bt=v.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,nt=de(v);_t(v)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,nt,W,v.width,v.height):O?i.renderbufferStorageMultisample(i.RENDERBUFFER,nt,W,v.width,v.height):i.renderbufferStorage(i.RENDERBUFFER,W,v.width,v.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,bt,i.RENDERBUFFER,R)}else{const $=v.textures;for(let K=0;K<$.length;K++){const W=$[K],bt=a.convert(W.format,W.colorSpace),nt=a.convert(W.type),vt=A(W.internalFormat,bt,nt,W.colorSpace),xt=de(v);O&&_t(v)===!1?i.renderbufferStorageMultisample(i.RENDERBUFFER,xt,vt,v.width,v.height):_t(v)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,xt,vt,v.width,v.height):i.renderbufferStorage(i.RENDERBUFFER,vt,v.width,v.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function wt(R,v){if(v&&v.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(e.bindFramebuffer(i.FRAMEBUFFER,R),!(v.depthTexture&&v.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");const $=n.get(v.depthTexture);$.__renderTarget=v,(!$.__webglTexture||v.depthTexture.image.width!==v.width||v.depthTexture.image.height!==v.height)&&(v.depthTexture.image.width=v.width,v.depthTexture.image.height=v.height,v.depthTexture.needsUpdate=!0),V(v.depthTexture,0);const K=$.__webglTexture,W=de(v);if(v.depthTexture.format===vs)_t(v)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,K,0,W):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,K,0);else if(v.depthTexture.format===xs)_t(v)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,K,0,W):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,K,0);else throw new Error("Unknown depthTexture format")}function Wt(R){const v=n.get(R),O=R.isWebGLCubeRenderTarget===!0;if(v.__boundDepthTexture!==R.depthTexture){const $=R.depthTexture;if(v.__depthDisposeCallback&&v.__depthDisposeCallback(),$){const K=()=>{delete v.__boundDepthTexture,delete v.__depthDisposeCallback,$.removeEventListener("dispose",K)};$.addEventListener("dispose",K),v.__depthDisposeCallback=K}v.__boundDepthTexture=$}if(R.depthTexture&&!v.__autoAllocateDepthBuffer){if(O)throw new Error("target.depthTexture not supported in Cube render targets");const $=R.texture.mipmaps;$&&$.length>0?wt(v.__webglFramebuffer[0],R):wt(v.__webglFramebuffer,R)}else if(O){v.__webglDepthbuffer=[];for(let $=0;$<6;$++)if(e.bindFramebuffer(i.FRAMEBUFFER,v.__webglFramebuffer[$]),v.__webglDepthbuffer[$]===void 0)v.__webglDepthbuffer[$]=i.createRenderbuffer(),Lt(v.__webglDepthbuffer[$],R,!1);else{const K=R.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,W=v.__webglDepthbuffer[$];i.bindRenderbuffer(i.RENDERBUFFER,W),i.framebufferRenderbuffer(i.FRAMEBUFFER,K,i.RENDERBUFFER,W)}}else{const $=R.texture.mipmaps;if($&&$.length>0?e.bindFramebuffer(i.FRAMEBUFFER,v.__webglFramebuffer[0]):e.bindFramebuffer(i.FRAMEBUFFER,v.__webglFramebuffer),v.__webglDepthbuffer===void 0)v.__webglDepthbuffer=i.createRenderbuffer(),Lt(v.__webglDepthbuffer,R,!1);else{const K=R.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,W=v.__webglDepthbuffer;i.bindRenderbuffer(i.RENDERBUFFER,W),i.framebufferRenderbuffer(i.FRAMEBUFFER,K,i.RENDERBUFFER,W)}}e.bindFramebuffer(i.FRAMEBUFFER,null)}function Ne(R,v,O){const $=n.get(R);v!==void 0&&ft($.__webglFramebuffer,R,R.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),O!==void 0&&Wt(R)}function L(R){const v=R.texture,O=n.get(R),$=n.get(v);R.addEventListener("dispose",T);const K=R.textures,W=R.isWebGLCubeRenderTarget===!0,bt=K.length>1;if(bt||($.__webglTexture===void 0&&($.__webglTexture=i.createTexture()),$.__version=v.version,r.memory.textures++),W){O.__webglFramebuffer=[];for(let nt=0;nt<6;nt++)if(v.mipmaps&&v.mipmaps.length>0){O.__webglFramebuffer[nt]=[];for(let vt=0;vt<v.mipmaps.length;vt++)O.__webglFramebuffer[nt][vt]=i.createFramebuffer()}else O.__webglFramebuffer[nt]=i.createFramebuffer()}else{if(v.mipmaps&&v.mipmaps.length>0){O.__webglFramebuffer=[];for(let nt=0;nt<v.mipmaps.length;nt++)O.__webglFramebuffer[nt]=i.createFramebuffer()}else O.__webglFramebuffer=i.createFramebuffer();if(bt)for(let nt=0,vt=K.length;nt<vt;nt++){const xt=n.get(K[nt]);xt.__webglTexture===void 0&&(xt.__webglTexture=i.createTexture(),r.memory.textures++)}if(R.samples>0&&_t(R)===!1){O.__webglMultisampledFramebuffer=i.createFramebuffer(),O.__webglColorRenderbuffer=[],e.bindFramebuffer(i.FRAMEBUFFER,O.__webglMultisampledFramebuffer);for(let nt=0;nt<K.length;nt++){const vt=K[nt];O.__webglColorRenderbuffer[nt]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,O.__webglColorRenderbuffer[nt]);const xt=a.convert(vt.format,vt.colorSpace),et=a.convert(vt.type),ct=A(vt.internalFormat,xt,et,vt.colorSpace,R.isXRRenderTarget===!0),Rt=de(R);i.renderbufferStorageMultisample(i.RENDERBUFFER,Rt,ct,R.width,R.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+nt,i.RENDERBUFFER,O.__webglColorRenderbuffer[nt])}i.bindRenderbuffer(i.RENDERBUFFER,null),R.depthBuffer&&(O.__webglDepthRenderbuffer=i.createRenderbuffer(),Lt(O.__webglDepthRenderbuffer,R,!0)),e.bindFramebuffer(i.FRAMEBUFFER,null)}}if(W){e.bindTexture(i.TEXTURE_CUBE_MAP,$.__webglTexture),Bt(i.TEXTURE_CUBE_MAP,v);for(let nt=0;nt<6;nt++)if(v.mipmaps&&v.mipmaps.length>0)for(let vt=0;vt<v.mipmaps.length;vt++)ft(O.__webglFramebuffer[nt][vt],R,v,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+nt,vt);else ft(O.__webglFramebuffer[nt],R,v,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+nt,0);m(v)&&p(i.TEXTURE_CUBE_MAP),e.unbindTexture()}else if(bt){for(let nt=0,vt=K.length;nt<vt;nt++){const xt=K[nt],et=n.get(xt);let ct=i.TEXTURE_2D;(R.isWebGL3DRenderTarget||R.isWebGLArrayRenderTarget)&&(ct=R.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),e.bindTexture(ct,et.__webglTexture),Bt(ct,xt),ft(O.__webglFramebuffer,R,xt,i.COLOR_ATTACHMENT0+nt,ct,0),m(xt)&&p(ct)}e.unbindTexture()}else{let nt=i.TEXTURE_2D;if((R.isWebGL3DRenderTarget||R.isWebGLArrayRenderTarget)&&(nt=R.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),e.bindTexture(nt,$.__webglTexture),Bt(nt,v),v.mipmaps&&v.mipmaps.length>0)for(let vt=0;vt<v.mipmaps.length;vt++)ft(O.__webglFramebuffer[vt],R,v,i.COLOR_ATTACHMENT0,nt,vt);else ft(O.__webglFramebuffer,R,v,i.COLOR_ATTACHMENT0,nt,0);m(v)&&p(nt),e.unbindTexture()}R.depthBuffer&&Wt(R)}function ue(R){const v=R.textures;for(let O=0,$=v.length;O<$;O++){const K=v[O];if(m(K)){const W=w(R),bt=n.get(K).__webglTexture;e.bindTexture(W,bt),p(W),e.unbindTexture()}}}const It=[],Ct=[];function gt(R){if(R.samples>0){if(_t(R)===!1){const v=R.textures,O=R.width,$=R.height;let K=i.COLOR_BUFFER_BIT;const W=R.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,bt=n.get(R),nt=v.length>1;if(nt)for(let xt=0;xt<v.length;xt++)e.bindFramebuffer(i.FRAMEBUFFER,bt.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+xt,i.RENDERBUFFER,null),e.bindFramebuffer(i.FRAMEBUFFER,bt.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+xt,i.TEXTURE_2D,null,0);e.bindFramebuffer(i.READ_FRAMEBUFFER,bt.__webglMultisampledFramebuffer);const vt=R.texture.mipmaps;vt&&vt.length>0?e.bindFramebuffer(i.DRAW_FRAMEBUFFER,bt.__webglFramebuffer[0]):e.bindFramebuffer(i.DRAW_FRAMEBUFFER,bt.__webglFramebuffer);for(let xt=0;xt<v.length;xt++){if(R.resolveDepthBuffer&&(R.depthBuffer&&(K|=i.DEPTH_BUFFER_BIT),R.stencilBuffer&&R.resolveStencilBuffer&&(K|=i.STENCIL_BUFFER_BIT)),nt){i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,bt.__webglColorRenderbuffer[xt]);const et=n.get(v[xt]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,et,0)}i.blitFramebuffer(0,0,O,$,0,0,O,$,K,i.NEAREST),l===!0&&(It.length=0,Ct.length=0,It.push(i.COLOR_ATTACHMENT0+xt),R.depthBuffer&&R.resolveDepthBuffer===!1&&(It.push(W),Ct.push(W),i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,Ct)),i.invalidateFramebuffer(i.READ_FRAMEBUFFER,It))}if(e.bindFramebuffer(i.READ_FRAMEBUFFER,null),e.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),nt)for(let xt=0;xt<v.length;xt++){e.bindFramebuffer(i.FRAMEBUFFER,bt.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+xt,i.RENDERBUFFER,bt.__webglColorRenderbuffer[xt]);const et=n.get(v[xt]).__webglTexture;e.bindFramebuffer(i.FRAMEBUFFER,bt.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+xt,i.TEXTURE_2D,et,0)}e.bindFramebuffer(i.DRAW_FRAMEBUFFER,bt.__webglMultisampledFramebuffer)}else if(R.depthBuffer&&R.resolveDepthBuffer===!1&&l){const v=R.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[v])}}}function de(R){return Math.min(s.maxSamples,R.samples)}function _t(R){const v=n.get(R);return R.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&v.__useRenderToTexture!==!1}function Ot(R){const v=r.render.frame;h.get(R)!==v&&(h.set(R,v),R.update())}function Ae(R,v){const O=R.colorSpace,$=R.format,K=R.type;return R.isCompressedTexture===!0||R.isVideoTexture===!0||O!==Vn&&O!==Hi&&(qt.getTransfer(O)===Qt?($!==hi||K!==xi)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",O)),v}function xe(R){return typeof HTMLImageElement<"u"&&R instanceof HTMLImageElement?(c.width=R.naturalWidth||R.width,c.height=R.naturalHeight||R.height):typeof VideoFrame<"u"&&R instanceof VideoFrame?(c.width=R.displayWidth,c.height=R.displayHeight):(c.width=R.width,c.height=R.height),c}this.allocateTextureUnit=N,this.resetTextureUnits=I,this.setTexture2D=V,this.setTexture2DArray=q,this.setTexture3D=Z,this.setTextureCube=G,this.rebindTextures=Ne,this.setupRenderTarget=L,this.updateRenderTargetMipmap=ue,this.updateMultisampleRenderTarget=gt,this.setupDepthRenderbuffer=Wt,this.setupFrameBufferTexture=ft,this.useMultisampledRTT=_t}function i0(i,t){function e(n,s=Hi){let a;const r=qt.getTransfer(s);if(n===xi)return i.UNSIGNED_BYTE;if(n===Zr)return i.UNSIGNED_SHORT_4_4_4_4;if(n===Jr)return i.UNSIGNED_SHORT_5_5_5_1;if(n===ic)return i.UNSIGNED_INT_5_9_9_9_REV;if(n===nc)return i.UNSIGNED_INT_10F_11F_11F_REV;if(n===tc)return i.BYTE;if(n===ec)return i.SHORT;if(n===gs)return i.UNSIGNED_SHORT;if(n===Kr)return i.INT;if(n===hn)return i.UNSIGNED_INT;if(n===_i)return i.FLOAT;if(n===ws)return i.HALF_FLOAT;if(n===sc)return i.ALPHA;if(n===ac)return i.RGB;if(n===hi)return i.RGBA;if(n===vs)return i.DEPTH_COMPONENT;if(n===xs)return i.DEPTH_STENCIL;if(n===Qr)return i.RED;if(n===to)return i.RED_INTEGER;if(n===rc)return i.RG;if(n===eo)return i.RG_INTEGER;if(n===io)return i.RGBA_INTEGER;if(n===ea||n===ia||n===na||n===sa)if(r===Qt)if(a=t.get("WEBGL_compressed_texture_s3tc_srgb"),a!==null){if(n===ea)return a.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===ia)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===na)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===sa)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(a=t.get("WEBGL_compressed_texture_s3tc"),a!==null){if(n===ea)return a.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===ia)return a.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===na)return a.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===sa)return a.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===gr||n===_r||n===vr||n===xr)if(a=t.get("WEBGL_compressed_texture_pvrtc"),a!==null){if(n===gr)return a.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===_r)return a.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===vr)return a.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===xr)return a.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===yr||n===br||n===Mr)if(a=t.get("WEBGL_compressed_texture_etc"),a!==null){if(n===yr||n===br)return r===Qt?a.COMPRESSED_SRGB8_ETC2:a.COMPRESSED_RGB8_ETC2;if(n===Mr)return r===Qt?a.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:a.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(n===wr||n===Sr||n===Er||n===Tr||n===Ar||n===Rr||n===Cr||n===Pr||n===Lr||n===Dr||n===Ir||n===Ur||n===kr||n===Nr)if(a=t.get("WEBGL_compressed_texture_astc"),a!==null){if(n===wr)return r===Qt?a.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:a.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===Sr)return r===Qt?a.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:a.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===Er)return r===Qt?a.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:a.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===Tr)return r===Qt?a.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:a.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===Ar)return r===Qt?a.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:a.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===Rr)return r===Qt?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:a.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===Cr)return r===Qt?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:a.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===Pr)return r===Qt?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:a.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===Lr)return r===Qt?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:a.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===Dr)return r===Qt?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:a.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===Ir)return r===Qt?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:a.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===Ur)return r===Qt?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:a.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===kr)return r===Qt?a.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:a.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===Nr)return r===Qt?a.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:a.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===Fr||n===Or||n===zr)if(a=t.get("EXT_texture_compression_bptc"),a!==null){if(n===Fr)return r===Qt?a.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:a.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===Or)return a.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===zr)return a.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===Br||n===Hr||n===Gr||n===Vr)if(a=t.get("EXT_texture_compression_rgtc"),a!==null){if(n===Br)return a.COMPRESSED_RED_RGTC1_EXT;if(n===Hr)return a.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===Gr)return a.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===Vr)return a.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===_s?i.UNSIGNED_INT_24_8:i[n]!==void 0?i[n]:null}return{convert:e}}const n0=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,s0=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`;class a0{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(t,e){if(this.texture===null){const n=new yc(t.texture);(t.depthNear!==e.depthNear||t.depthFar!==e.depthFar)&&(this.depthNear=t.depthNear,this.depthFar=t.depthFar),this.texture=n}}getMesh(t){if(this.texture!==null&&this.mesh===null){const e=t.cameras[0].viewport,n=new $i({vertexShader:n0,fragmentShader:s0,uniforms:{depthColor:{value:this.texture},depthWidth:{value:e.z},depthHeight:{value:e.w}}});this.mesh=new Mt(new Ge(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class r0 extends qn{constructor(t,e){super();const n=this;let s=null,a=1,r=null,o="local-floor",l=1,c=null,h=null,u=null,d=null,f=null,g=null;const _=typeof XRWebGLBinding<"u",m=new a0,p={},w=e.getContextAttributes();let A=null,M=null;const P=[],S=[],T=new Ut;let C=null;const x=new $e;x.viewport=new ne;const y=new $e;y.viewport=new ne;const E=[x,y],I=new Eu;let N=null,H=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(j){let J=P[j];return J===void 0&&(J=new Wa,P[j]=J),J.getTargetRaySpace()},this.getControllerGrip=function(j){let J=P[j];return J===void 0&&(J=new Wa,P[j]=J),J.getGripSpace()},this.getHand=function(j){let J=P[j];return J===void 0&&(J=new Wa,P[j]=J),J.getHandSpace()};function V(j){const J=S.indexOf(j.inputSource);if(J===-1)return;const ft=P[J];ft!==void 0&&(ft.update(j.inputSource,j.frame,c||r),ft.dispatchEvent({type:j.type,data:j.inputSource}))}function q(){s.removeEventListener("select",V),s.removeEventListener("selectstart",V),s.removeEventListener("selectend",V),s.removeEventListener("squeeze",V),s.removeEventListener("squeezestart",V),s.removeEventListener("squeezeend",V),s.removeEventListener("end",q),s.removeEventListener("inputsourceschange",Z);for(let j=0;j<P.length;j++){const J=S[j];J!==null&&(S[j]=null,P[j].disconnect(J))}N=null,H=null,m.reset();for(const j in p)delete p[j];t.setRenderTarget(A),f=null,d=null,u=null,s=null,M=null,jt.stop(),n.isPresenting=!1,t.setPixelRatio(C),t.setSize(T.width,T.height,!1),n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(j){a=j,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(j){o=j,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||r},this.setReferenceSpace=function(j){c=j},this.getBaseLayer=function(){return d!==null?d:f},this.getBinding=function(){return u===null&&_&&(u=new XRWebGLBinding(s,e)),u},this.getFrame=function(){return g},this.getSession=function(){return s},this.setSession=async function(j){if(s=j,s!==null){if(A=t.getRenderTarget(),s.addEventListener("select",V),s.addEventListener("selectstart",V),s.addEventListener("selectend",V),s.addEventListener("squeeze",V),s.addEventListener("squeezestart",V),s.addEventListener("squeezeend",V),s.addEventListener("end",q),s.addEventListener("inputsourceschange",Z),w.xrCompatible!==!0&&await e.makeXRCompatible(),C=t.getPixelRatio(),t.getSize(T),_&&"createProjectionLayer"in XRWebGLBinding.prototype){let ft=null,Lt=null,wt=null;w.depth&&(wt=w.stencil?e.DEPTH24_STENCIL8:e.DEPTH_COMPONENT24,ft=w.stencil?xs:vs,Lt=w.stencil?_s:hn);const Wt={colorFormat:e.RGBA8,depthFormat:wt,scaleFactor:a};u=this.getBinding(),d=u.createProjectionLayer(Wt),s.updateRenderState({layers:[d]}),t.setPixelRatio(1),t.setSize(d.textureWidth,d.textureHeight,!1),M=new un(d.textureWidth,d.textureHeight,{format:hi,type:xi,depthTexture:new xc(d.textureWidth,d.textureHeight,Lt,void 0,void 0,void 0,void 0,void 0,void 0,ft),stencilBuffer:w.stencil,colorSpace:t.outputColorSpace,samples:w.antialias?4:0,resolveDepthBuffer:d.ignoreDepthValues===!1,resolveStencilBuffer:d.ignoreDepthValues===!1})}else{const ft={antialias:w.antialias,alpha:!0,depth:w.depth,stencil:w.stencil,framebufferScaleFactor:a};f=new XRWebGLLayer(s,e,ft),s.updateRenderState({baseLayer:f}),t.setPixelRatio(1),t.setSize(f.framebufferWidth,f.framebufferHeight,!1),M=new un(f.framebufferWidth,f.framebufferHeight,{format:hi,type:xi,colorSpace:t.outputColorSpace,stencilBuffer:w.stencil,resolveDepthBuffer:f.ignoreDepthValues===!1,resolveStencilBuffer:f.ignoreDepthValues===!1})}M.isXRRenderTarget=!0,this.setFoveation(l),c=null,r=await s.requestReferenceSpace(o),jt.setContext(s),jt.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return m.getDepthTexture()};function Z(j){for(let J=0;J<j.removed.length;J++){const ft=j.removed[J],Lt=S.indexOf(ft);Lt>=0&&(S[Lt]=null,P[Lt].disconnect(ft))}for(let J=0;J<j.added.length;J++){const ft=j.added[J];let Lt=S.indexOf(ft);if(Lt===-1){for(let Wt=0;Wt<P.length;Wt++)if(Wt>=S.length){S.push(ft),Lt=Wt;break}else if(S[Wt]===null){S[Wt]=ft,Lt=Wt;break}if(Lt===-1)break}const wt=P[Lt];wt&&wt.connect(ft)}}const G=new D,rt=new D;function ht(j,J,ft){G.setFromMatrixPosition(J.matrixWorld),rt.setFromMatrixPosition(ft.matrixWorld);const Lt=G.distanceTo(rt),wt=J.projectionMatrix.elements,Wt=ft.projectionMatrix.elements,Ne=wt[14]/(wt[10]-1),L=wt[14]/(wt[10]+1),ue=(wt[9]+1)/wt[5],It=(wt[9]-1)/wt[5],Ct=(wt[8]-1)/wt[0],gt=(Wt[8]+1)/Wt[0],de=Ne*Ct,_t=Ne*gt,Ot=Lt/(-Ct+gt),Ae=Ot*-Ct;if(J.matrixWorld.decompose(j.position,j.quaternion,j.scale),j.translateX(Ae),j.translateZ(Ot),j.matrixWorld.compose(j.position,j.quaternion,j.scale),j.matrixWorldInverse.copy(j.matrixWorld).invert(),wt[10]===-1)j.projectionMatrix.copy(J.projectionMatrix),j.projectionMatrixInverse.copy(J.projectionMatrixInverse);else{const xe=Ne+Ot,R=L+Ot,v=de-Ae,O=_t+(Lt-Ae),$=ue*L/R*xe,K=It*L/R*xe;j.projectionMatrix.makePerspective(v,O,$,K,xe,R),j.projectionMatrixInverse.copy(j.projectionMatrix).invert()}}function St(j,J){J===null?j.matrixWorld.copy(j.matrix):j.matrixWorld.multiplyMatrices(J.matrixWorld,j.matrix),j.matrixWorldInverse.copy(j.matrixWorld).invert()}this.updateCamera=function(j){if(s===null)return;let J=j.near,ft=j.far;m.texture!==null&&(m.depthNear>0&&(J=m.depthNear),m.depthFar>0&&(ft=m.depthFar)),I.near=y.near=x.near=J,I.far=y.far=x.far=ft,(N!==I.near||H!==I.far)&&(s.updateRenderState({depthNear:I.near,depthFar:I.far}),N=I.near,H=I.far),I.layers.mask=j.layers.mask|6,x.layers.mask=I.layers.mask&3,y.layers.mask=I.layers.mask&5;const Lt=j.parent,wt=I.cameras;St(I,Lt);for(let Wt=0;Wt<wt.length;Wt++)St(wt[Wt],Lt);wt.length===2?ht(I,x,y):I.projectionMatrix.copy(x.projectionMatrix),Bt(j,I,Lt)};function Bt(j,J,ft){ft===null?j.matrix.copy(J.matrixWorld):(j.matrix.copy(ft.matrixWorld),j.matrix.invert(),j.matrix.multiply(J.matrixWorld)),j.matrix.decompose(j.position,j.quaternion,j.scale),j.updateMatrixWorld(!0),j.projectionMatrix.copy(J.projectionMatrix),j.projectionMatrixInverse.copy(J.projectionMatrixInverse),j.isPerspectiveCamera&&(j.fov=da*2*Math.atan(1/j.projectionMatrix.elements[5]),j.zoom=1)}this.getCamera=function(){return I},this.getFoveation=function(){if(!(d===null&&f===null))return l},this.setFoveation=function(j){l=j,d!==null&&(d.fixedFoveation=j),f!==null&&f.fixedFoveation!==void 0&&(f.fixedFoveation=j)},this.hasDepthSensing=function(){return m.texture!==null},this.getDepthSensingMesh=function(){return m.getMesh(I)},this.getCameraTexture=function(j){return p[j]};let re=null;function he(j,J){if(h=J.getViewerPose(c||r),g=J,h!==null){const ft=h.views;f!==null&&(t.setRenderTargetFramebuffer(M,f.framebuffer),t.setRenderTarget(M));let Lt=!1;ft.length!==I.cameras.length&&(I.cameras.length=0,Lt=!0);for(let L=0;L<ft.length;L++){const ue=ft[L];let It=null;if(f!==null)It=f.getViewport(ue);else{const gt=u.getViewSubImage(d,ue);It=gt.viewport,L===0&&(t.setRenderTargetTextures(M,gt.colorTexture,gt.depthStencilTexture),t.setRenderTarget(M))}let Ct=E[L];Ct===void 0&&(Ct=new $e,Ct.layers.enable(L),Ct.viewport=new ne,E[L]=Ct),Ct.matrix.fromArray(ue.transform.matrix),Ct.matrix.decompose(Ct.position,Ct.quaternion,Ct.scale),Ct.projectionMatrix.fromArray(ue.projectionMatrix),Ct.projectionMatrixInverse.copy(Ct.projectionMatrix).invert(),Ct.viewport.set(It.x,It.y,It.width,It.height),L===0&&(I.matrix.copy(Ct.matrix),I.matrix.decompose(I.position,I.quaternion,I.scale)),Lt===!0&&I.cameras.push(Ct)}const wt=s.enabledFeatures;if(wt&&wt.includes("depth-sensing")&&s.depthUsage=="gpu-optimized"&&_){u=n.getBinding();const L=u.getDepthInformation(ft[0]);L&&L.isValid&&L.texture&&m.init(L,s.renderState)}if(wt&&wt.includes("camera-access")&&_){t.state.unbindTexture(),u=n.getBinding();for(let L=0;L<ft.length;L++){const ue=ft[L].camera;if(ue){let It=p[ue];It||(It=new yc,p[ue]=It);const Ct=u.getCameraImage(ue);It.sourceTexture=Ct}}}}for(let ft=0;ft<P.length;ft++){const Lt=S[ft],wt=P[ft];Lt!==null&&wt!==void 0&&wt.update(Lt,J,c||r)}re&&re(j,J),J.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:J}),g=null}const jt=new wc;jt.setAnimationLoop(he),this.setAnimationLoop=function(j){re=j},this.dispose=function(){}}}const tn=new yi,o0=new se;function l0(i,t){function e(m,p){m.matrixAutoUpdate===!0&&m.updateMatrix(),p.value.copy(m.matrix)}function n(m,p){p.color.getRGB(m.fogColor.value,mc(i)),p.isFog?(m.fogNear.value=p.near,m.fogFar.value=p.far):p.isFogExp2&&(m.fogDensity.value=p.density)}function s(m,p,w,A,M){p.isMeshBasicMaterial||p.isMeshLambertMaterial?a(m,p):p.isMeshToonMaterial?(a(m,p),u(m,p)):p.isMeshPhongMaterial?(a(m,p),h(m,p)):p.isMeshStandardMaterial?(a(m,p),d(m,p),p.isMeshPhysicalMaterial&&f(m,p,M)):p.isMeshMatcapMaterial?(a(m,p),g(m,p)):p.isMeshDepthMaterial?a(m,p):p.isMeshDistanceMaterial?(a(m,p),_(m,p)):p.isMeshNormalMaterial?a(m,p):p.isLineBasicMaterial?(r(m,p),p.isLineDashedMaterial&&o(m,p)):p.isPointsMaterial?l(m,p,w,A):p.isSpriteMaterial?c(m,p):p.isShadowMaterial?(m.color.value.copy(p.color),m.opacity.value=p.opacity):p.isShaderMaterial&&(p.uniformsNeedUpdate=!1)}function a(m,p){m.opacity.value=p.opacity,p.color&&m.diffuse.value.copy(p.color),p.emissive&&m.emissive.value.copy(p.emissive).multiplyScalar(p.emissiveIntensity),p.map&&(m.map.value=p.map,e(p.map,m.mapTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,e(p.alphaMap,m.alphaMapTransform)),p.bumpMap&&(m.bumpMap.value=p.bumpMap,e(p.bumpMap,m.bumpMapTransform),m.bumpScale.value=p.bumpScale,p.side===Ve&&(m.bumpScale.value*=-1)),p.normalMap&&(m.normalMap.value=p.normalMap,e(p.normalMap,m.normalMapTransform),m.normalScale.value.copy(p.normalScale),p.side===Ve&&m.normalScale.value.negate()),p.displacementMap&&(m.displacementMap.value=p.displacementMap,e(p.displacementMap,m.displacementMapTransform),m.displacementScale.value=p.displacementScale,m.displacementBias.value=p.displacementBias),p.emissiveMap&&(m.emissiveMap.value=p.emissiveMap,e(p.emissiveMap,m.emissiveMapTransform)),p.specularMap&&(m.specularMap.value=p.specularMap,e(p.specularMap,m.specularMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest);const w=t.get(p),A=w.envMap,M=w.envMapRotation;A&&(m.envMap.value=A,tn.copy(M),tn.x*=-1,tn.y*=-1,tn.z*=-1,A.isCubeTexture&&A.isRenderTargetTexture===!1&&(tn.y*=-1,tn.z*=-1),m.envMapRotation.value.setFromMatrix4(o0.makeRotationFromEuler(tn)),m.flipEnvMap.value=A.isCubeTexture&&A.isRenderTargetTexture===!1?-1:1,m.reflectivity.value=p.reflectivity,m.ior.value=p.ior,m.refractionRatio.value=p.refractionRatio),p.lightMap&&(m.lightMap.value=p.lightMap,m.lightMapIntensity.value=p.lightMapIntensity,e(p.lightMap,m.lightMapTransform)),p.aoMap&&(m.aoMap.value=p.aoMap,m.aoMapIntensity.value=p.aoMapIntensity,e(p.aoMap,m.aoMapTransform))}function r(m,p){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,p.map&&(m.map.value=p.map,e(p.map,m.mapTransform))}function o(m,p){m.dashSize.value=p.dashSize,m.totalSize.value=p.dashSize+p.gapSize,m.scale.value=p.scale}function l(m,p,w,A){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,m.size.value=p.size*w,m.scale.value=A*.5,p.map&&(m.map.value=p.map,e(p.map,m.uvTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,e(p.alphaMap,m.alphaMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest)}function c(m,p){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,m.rotation.value=p.rotation,p.map&&(m.map.value=p.map,e(p.map,m.mapTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,e(p.alphaMap,m.alphaMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest)}function h(m,p){m.specular.value.copy(p.specular),m.shininess.value=Math.max(p.shininess,1e-4)}function u(m,p){p.gradientMap&&(m.gradientMap.value=p.gradientMap)}function d(m,p){m.metalness.value=p.metalness,p.metalnessMap&&(m.metalnessMap.value=p.metalnessMap,e(p.metalnessMap,m.metalnessMapTransform)),m.roughness.value=p.roughness,p.roughnessMap&&(m.roughnessMap.value=p.roughnessMap,e(p.roughnessMap,m.roughnessMapTransform)),p.envMap&&(m.envMapIntensity.value=p.envMapIntensity)}function f(m,p,w){m.ior.value=p.ior,p.sheen>0&&(m.sheenColor.value.copy(p.sheenColor).multiplyScalar(p.sheen),m.sheenRoughness.value=p.sheenRoughness,p.sheenColorMap&&(m.sheenColorMap.value=p.sheenColorMap,e(p.sheenColorMap,m.sheenColorMapTransform)),p.sheenRoughnessMap&&(m.sheenRoughnessMap.value=p.sheenRoughnessMap,e(p.sheenRoughnessMap,m.sheenRoughnessMapTransform))),p.clearcoat>0&&(m.clearcoat.value=p.clearcoat,m.clearcoatRoughness.value=p.clearcoatRoughness,p.clearcoatMap&&(m.clearcoatMap.value=p.clearcoatMap,e(p.clearcoatMap,m.clearcoatMapTransform)),p.clearcoatRoughnessMap&&(m.clearcoatRoughnessMap.value=p.clearcoatRoughnessMap,e(p.clearcoatRoughnessMap,m.clearcoatRoughnessMapTransform)),p.clearcoatNormalMap&&(m.clearcoatNormalMap.value=p.clearcoatNormalMap,e(p.clearcoatNormalMap,m.clearcoatNormalMapTransform),m.clearcoatNormalScale.value.copy(p.clearcoatNormalScale),p.side===Ve&&m.clearcoatNormalScale.value.negate())),p.dispersion>0&&(m.dispersion.value=p.dispersion),p.iridescence>0&&(m.iridescence.value=p.iridescence,m.iridescenceIOR.value=p.iridescenceIOR,m.iridescenceThicknessMinimum.value=p.iridescenceThicknessRange[0],m.iridescenceThicknessMaximum.value=p.iridescenceThicknessRange[1],p.iridescenceMap&&(m.iridescenceMap.value=p.iridescenceMap,e(p.iridescenceMap,m.iridescenceMapTransform)),p.iridescenceThicknessMap&&(m.iridescenceThicknessMap.value=p.iridescenceThicknessMap,e(p.iridescenceThicknessMap,m.iridescenceThicknessMapTransform))),p.transmission>0&&(m.transmission.value=p.transmission,m.transmissionSamplerMap.value=w.texture,m.transmissionSamplerSize.value.set(w.width,w.height),p.transmissionMap&&(m.transmissionMap.value=p.transmissionMap,e(p.transmissionMap,m.transmissionMapTransform)),m.thickness.value=p.thickness,p.thicknessMap&&(m.thicknessMap.value=p.thicknessMap,e(p.thicknessMap,m.thicknessMapTransform)),m.attenuationDistance.value=p.attenuationDistance,m.attenuationColor.value.copy(p.attenuationColor)),p.anisotropy>0&&(m.anisotropyVector.value.set(p.anisotropy*Math.cos(p.anisotropyRotation),p.anisotropy*Math.sin(p.anisotropyRotation)),p.anisotropyMap&&(m.anisotropyMap.value=p.anisotropyMap,e(p.anisotropyMap,m.anisotropyMapTransform))),m.specularIntensity.value=p.specularIntensity,m.specularColor.value.copy(p.specularColor),p.specularColorMap&&(m.specularColorMap.value=p.specularColorMap,e(p.specularColorMap,m.specularColorMapTransform)),p.specularIntensityMap&&(m.specularIntensityMap.value=p.specularIntensityMap,e(p.specularIntensityMap,m.specularIntensityMapTransform))}function g(m,p){p.matcap&&(m.matcap.value=p.matcap)}function _(m,p){const w=t.get(p).light;m.referencePosition.value.setFromMatrixPosition(w.matrixWorld),m.nearDistance.value=w.shadow.camera.near,m.farDistance.value=w.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:s}}function c0(i,t,e,n){let s={},a={},r=[];const o=i.getParameter(i.MAX_UNIFORM_BUFFER_BINDINGS);function l(w,A){const M=A.program;n.uniformBlockBinding(w,M)}function c(w,A){let M=s[w.id];M===void 0&&(g(w),M=h(w),s[w.id]=M,w.addEventListener("dispose",m));const P=A.program;n.updateUBOMapping(w,P);const S=t.render.frame;a[w.id]!==S&&(d(w),a[w.id]=S)}function h(w){const A=u();w.__bindingPointIndex=A;const M=i.createBuffer(),P=w.__size,S=w.usage;return i.bindBuffer(i.UNIFORM_BUFFER,M),i.bufferData(i.UNIFORM_BUFFER,P,S),i.bindBuffer(i.UNIFORM_BUFFER,null),i.bindBufferBase(i.UNIFORM_BUFFER,A,M),M}function u(){for(let w=0;w<o;w++)if(r.indexOf(w)===-1)return r.push(w),w;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function d(w){const A=s[w.id],M=w.uniforms,P=w.__cache;i.bindBuffer(i.UNIFORM_BUFFER,A);for(let S=0,T=M.length;S<T;S++){const C=Array.isArray(M[S])?M[S]:[M[S]];for(let x=0,y=C.length;x<y;x++){const E=C[x];if(f(E,S,x,P)===!0){const I=E.__offset,N=Array.isArray(E.value)?E.value:[E.value];let H=0;for(let V=0;V<N.length;V++){const q=N[V],Z=_(q);typeof q=="number"||typeof q=="boolean"?(E.__data[0]=q,i.bufferSubData(i.UNIFORM_BUFFER,I+H,E.__data)):q.isMatrix3?(E.__data[0]=q.elements[0],E.__data[1]=q.elements[1],E.__data[2]=q.elements[2],E.__data[3]=0,E.__data[4]=q.elements[3],E.__data[5]=q.elements[4],E.__data[6]=q.elements[5],E.__data[7]=0,E.__data[8]=q.elements[6],E.__data[9]=q.elements[7],E.__data[10]=q.elements[8],E.__data[11]=0):(q.toArray(E.__data,H),H+=Z.storage/Float32Array.BYTES_PER_ELEMENT)}i.bufferSubData(i.UNIFORM_BUFFER,I,E.__data)}}}i.bindBuffer(i.UNIFORM_BUFFER,null)}function f(w,A,M,P){const S=w.value,T=A+"_"+M;if(P[T]===void 0)return typeof S=="number"||typeof S=="boolean"?P[T]=S:P[T]=S.clone(),!0;{const C=P[T];if(typeof S=="number"||typeof S=="boolean"){if(C!==S)return P[T]=S,!0}else if(C.equals(S)===!1)return C.copy(S),!0}return!1}function g(w){const A=w.uniforms;let M=0;const P=16;for(let T=0,C=A.length;T<C;T++){const x=Array.isArray(A[T])?A[T]:[A[T]];for(let y=0,E=x.length;y<E;y++){const I=x[y],N=Array.isArray(I.value)?I.value:[I.value];for(let H=0,V=N.length;H<V;H++){const q=N[H],Z=_(q),G=M%P,rt=G%Z.boundary,ht=G+rt;M+=rt,ht!==0&&P-ht<Z.storage&&(M+=P-ht),I.__data=new Float32Array(Z.storage/Float32Array.BYTES_PER_ELEMENT),I.__offset=M,M+=Z.storage}}}const S=M%P;return S>0&&(M+=P-S),w.__size=M,w.__cache={},this}function _(w){const A={boundary:0,storage:0};return typeof w=="number"||typeof w=="boolean"?(A.boundary=4,A.storage=4):w.isVector2?(A.boundary=8,A.storage=8):w.isVector3||w.isColor?(A.boundary=16,A.storage=12):w.isVector4?(A.boundary=16,A.storage=16):w.isMatrix3?(A.boundary=48,A.storage=48):w.isMatrix4?(A.boundary=64,A.storage=64):w.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",w),A}function m(w){const A=w.target;A.removeEventListener("dispose",m);const M=r.indexOf(A.__bindingPointIndex);r.splice(M,1),i.deleteBuffer(s[A.id]),delete s[A.id],delete a[A.id]}function p(){for(const w in s)i.deleteBuffer(s[w]);r=[],s={},a={}}return{bind:l,update:c,dispose:p}}class h0{constructor(t={}){const{canvas:e=zh(),context:n=null,depth:s=!0,stencil:a=!1,alpha:r=!1,antialias:o=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:u=!1,reversedDepthBuffer:d=!1}=t;this.isWebGLRenderer=!0;let f;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");f=n.getContextAttributes().alpha}else f=r;const g=new Uint32Array(4),_=new Int32Array(4);let m=null,p=null;const w=[],A=[];this.domElement=e,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=Vi,this.toneMappingExposure=1,this.transmissionResolutionScale=1;const M=this;let P=!1;this._outputColorSpace=Pe;let S=0,T=0,C=null,x=-1,y=null;const E=new ne,I=new ne;let N=null;const H=new Ft(0);let V=0,q=e.width,Z=e.height,G=1,rt=null,ht=null;const St=new ne(0,0,q,Z),Bt=new ne(0,0,q,Z);let re=!1;const he=new ro;let jt=!1,j=!1;const J=new se,ft=new D,Lt=new ne,wt={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let Wt=!1;function Ne(){return C===null?G:1}let L=n;function ue(b,k){return e.getContext(b,k)}try{const b={alpha:!0,depth:s,stencil:a,antialias:o,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:h,failIfMajorPerformanceCaveat:u};if("setAttribute"in e&&e.setAttribute("data-engine",`three.js r${Yr}`),e.addEventListener("webglcontextlost",st,!1),e.addEventListener("webglcontextrestored",dt,!1),e.addEventListener("webglcontextcreationerror",Q,!1),L===null){const k="webgl2";if(L=ue(k,b),L===null)throw ue(k)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(b){throw console.error("THREE.WebGLRenderer: "+b.message),b}let It,Ct,gt,de,_t,Ot,Ae,xe,R,v,O,$,K,W,bt,nt,vt,xt,et,ct,Rt,yt,ot,kt;function U(){It=new yp(L),It.init(),yt=new i0(L,It),Ct=new fp(L,It,t,yt),gt=new t0(L,It),Ct.reversedDepthBuffer&&d&&gt.buffers.depth.setReversed(!0),de=new wp(L),_t=new Hm,Ot=new e0(L,It,gt,_t,Ct,yt,de),Ae=new mp(M),xe=new xp(M),R=new Ru(L),ot=new up(L,R),v=new bp(L,R,de,ot),O=new Ep(L,v,R,de),et=new Sp(L,Ct,Ot),nt=new pp(_t),$=new Bm(M,Ae,xe,It,Ct,ot,nt),K=new l0(M,_t),W=new Vm,bt=new Ym(It),xt=new hp(M,Ae,xe,gt,O,f,l),vt=new Jm(M,O,Ct),kt=new c0(L,de,Ct,gt),ct=new dp(L,It,de),Rt=new Mp(L,It,de),de.programs=$.programs,M.capabilities=Ct,M.extensions=It,M.properties=_t,M.renderLists=W,M.shadowMap=vt,M.state=gt,M.info=de}U();const it=new r0(M,L);this.xr=it,this.getContext=function(){return L},this.getContextAttributes=function(){return L.getContextAttributes()},this.forceContextLoss=function(){const b=It.get("WEBGL_lose_context");b&&b.loseContext()},this.forceContextRestore=function(){const b=It.get("WEBGL_lose_context");b&&b.restoreContext()},this.getPixelRatio=function(){return G},this.setPixelRatio=function(b){b!==void 0&&(G=b,this.setSize(q,Z,!1))},this.getSize=function(b){return b.set(q,Z)},this.setSize=function(b,k,z=!0){if(it.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}q=b,Z=k,e.width=Math.floor(b*G),e.height=Math.floor(k*G),z===!0&&(e.style.width=b+"px",e.style.height=k+"px"),this.setViewport(0,0,b,k)},this.getDrawingBufferSize=function(b){return b.set(q*G,Z*G).floor()},this.setDrawingBufferSize=function(b,k,z){q=b,Z=k,G=z,e.width=Math.floor(b*z),e.height=Math.floor(k*z),this.setViewport(0,0,b,k)},this.getCurrentViewport=function(b){return b.copy(E)},this.getViewport=function(b){return b.copy(St)},this.setViewport=function(b,k,z,B){b.isVector4?St.set(b.x,b.y,b.z,b.w):St.set(b,k,z,B),gt.viewport(E.copy(St).multiplyScalar(G).round())},this.getScissor=function(b){return b.copy(Bt)},this.setScissor=function(b,k,z,B){b.isVector4?Bt.set(b.x,b.y,b.z,b.w):Bt.set(b,k,z,B),gt.scissor(I.copy(Bt).multiplyScalar(G).round())},this.getScissorTest=function(){return re},this.setScissorTest=function(b){gt.setScissorTest(re=b)},this.setOpaqueSort=function(b){rt=b},this.setTransparentSort=function(b){ht=b},this.getClearColor=function(b){return b.copy(xt.getClearColor())},this.setClearColor=function(){xt.setClearColor(...arguments)},this.getClearAlpha=function(){return xt.getClearAlpha()},this.setClearAlpha=function(){xt.setClearAlpha(...arguments)},this.clear=function(b=!0,k=!0,z=!0){let B=0;if(b){let F=!1;if(C!==null){const tt=C.texture.format;F=tt===io||tt===eo||tt===to}if(F){const tt=C.texture.type,lt=tt===xi||tt===hn||tt===gs||tt===_s||tt===Zr||tt===Jr,pt=xt.getClearColor(),ut=xt.getClearAlpha(),At=pt.r,Pt=pt.g,Et=pt.b;lt?(g[0]=At,g[1]=Pt,g[2]=Et,g[3]=ut,L.clearBufferuiv(L.COLOR,0,g)):(_[0]=At,_[1]=Pt,_[2]=Et,_[3]=ut,L.clearBufferiv(L.COLOR,0,_))}else B|=L.COLOR_BUFFER_BIT}k&&(B|=L.DEPTH_BUFFER_BIT),z&&(B|=L.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),L.clear(B)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){e.removeEventListener("webglcontextlost",st,!1),e.removeEventListener("webglcontextrestored",dt,!1),e.removeEventListener("webglcontextcreationerror",Q,!1),xt.dispose(),W.dispose(),bt.dispose(),_t.dispose(),Ae.dispose(),xe.dispose(),O.dispose(),ot.dispose(),kt.dispose(),$.dispose(),it.dispose(),it.removeEventListener("sessionstart",di),it.removeEventListener("sessionend",Ao),qi.stop()};function st(b){b.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),P=!0}function dt(){console.log("THREE.WebGLRenderer: Context Restored."),P=!1;const b=de.autoReset,k=vt.enabled,z=vt.autoUpdate,B=vt.needsUpdate,F=vt.type;U(),de.autoReset=b,vt.enabled=k,vt.autoUpdate=z,vt.needsUpdate=B,vt.type=F}function Q(b){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",b.statusMessage)}function Y(b){const k=b.target;k.removeEventListener("dispose",Y),mt(k)}function mt(b){Dt(b),_t.remove(b)}function Dt(b){const k=_t.get(b).programs;k!==void 0&&(k.forEach(function(z){$.releaseProgram(z)}),b.isShaderMaterial&&$.releaseShaderCache(b))}this.renderBufferDirect=function(b,k,z,B,F,tt){k===null&&(k=wt);const lt=F.isMesh&&F.matrixWorld.determinant()<0,pt=kc(b,k,z,B,F);gt.setMaterial(B,lt);let ut=z.index,At=1;if(B.wireframe===!0){if(ut=v.getWireframeAttribute(z),ut===void 0)return;At=2}const Pt=z.drawRange,Et=z.attributes.position;let Gt=Pt.start*At,Jt=(Pt.start+Pt.count)*At;tt!==null&&(Gt=Math.max(Gt,tt.start*At),Jt=Math.min(Jt,(tt.start+tt.count)*At)),ut!==null?(Gt=Math.max(Gt,0),Jt=Math.min(Jt,ut.count)):Et!=null&&(Gt=Math.max(Gt,0),Jt=Math.min(Jt,Et.count));const _e=Jt-Gt;if(_e<0||_e===1/0)return;ot.setup(F,B,pt,z,ut);let le,ae=ct;if(ut!==null&&(le=R.get(ut),ae=Rt,ae.setIndex(le)),F.isMesh)B.wireframe===!0?(gt.setLineWidth(B.wireframeLinewidth*Ne()),ae.setMode(L.LINES)):ae.setMode(L.TRIANGLES);else if(F.isLine){let Tt=B.linewidth;Tt===void 0&&(Tt=1),gt.setLineWidth(Tt*Ne()),F.isLineSegments?ae.setMode(L.LINES):F.isLineLoop?ae.setMode(L.LINE_LOOP):ae.setMode(L.LINE_STRIP)}else F.isPoints?ae.setMode(L.POINTS):F.isSprite&&ae.setMode(L.TRIANGLES);if(F.isBatchedMesh)if(F._multiDrawInstances!==null)ys("THREE.WebGLRenderer: renderMultiDrawInstances has been deprecated and will be removed in r184. Append to renderMultiDraw arguments and use indirection."),ae.renderMultiDrawInstances(F._multiDrawStarts,F._multiDrawCounts,F._multiDrawCount,F._multiDrawInstances);else if(It.get("WEBGL_multi_draw"))ae.renderMultiDraw(F._multiDrawStarts,F._multiDrawCounts,F._multiDrawCount);else{const Tt=F._multiDrawStarts,pe=F._multiDrawCounts,$t=F._multiDrawCount,qe=ut?R.get(ut).bytesPerElement:1,fn=_t.get(B).currentProgram.getUniforms();for(let je=0;je<$t;je++)fn.setValue(L,"_gl_DrawID",je),ae.render(Tt[je]/qe,pe[je])}else if(F.isInstancedMesh)ae.renderInstances(Gt,_e,F.count);else if(z.isInstancedBufferGeometry){const Tt=z._maxInstanceCount!==void 0?z._maxInstanceCount:1/0,pe=Math.min(z.instanceCount,Tt);ae.renderInstances(Gt,_e,pe)}else ae.render(Gt,_e)};function oe(b,k,z){b.transparent===!0&&b.side===Qe&&b.forceSinglePass===!1?(b.side=Ve,b.needsUpdate=!0,As(b,k,z),b.side=Xi,b.needsUpdate=!0,As(b,k,z),b.side=Qe):As(b,k,z)}this.compile=function(b,k,z=null){z===null&&(z=b),p=bt.get(z),p.init(k),A.push(p),z.traverseVisible(function(F){F.isLight&&F.layers.test(k.layers)&&(p.pushLight(F),F.castShadow&&p.pushShadow(F))}),b!==z&&b.traverseVisible(function(F){F.isLight&&F.layers.test(k.layers)&&(p.pushLight(F),F.castShadow&&p.pushShadow(F))}),p.setupLights();const B=new Set;return b.traverse(function(F){if(!(F.isMesh||F.isPoints||F.isLine||F.isSprite))return;const tt=F.material;if(tt)if(Array.isArray(tt))for(let lt=0;lt<tt.length;lt++){const pt=tt[lt];oe(pt,z,F),B.add(pt)}else oe(tt,z,F),B.add(tt)}),p=A.pop(),B},this.compileAsync=function(b,k,z=null){const B=this.compile(b,k,z);return new Promise(F=>{function tt(){if(B.forEach(function(lt){_t.get(lt).currentProgram.isReady()&&B.delete(lt)}),B.size===0){F(b);return}setTimeout(tt,10)}It.get("KHR_parallel_shader_compile")!==null?tt():setTimeout(tt,10)})};let Yt=null;function bi(b){Yt&&Yt(b)}function di(){qi.stop()}function Ao(){qi.start()}const qi=new wc;qi.setAnimationLoop(bi),typeof self<"u"&&qi.setContext(self),this.setAnimationLoop=function(b){Yt=b,it.setAnimationLoop(b),b===null?qi.stop():qi.start()},it.addEventListener("sessionstart",di),it.addEventListener("sessionend",Ao),this.render=function(b,k){if(k!==void 0&&k.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(P===!0)return;if(b.matrixWorldAutoUpdate===!0&&b.updateMatrixWorld(),k.parent===null&&k.matrixWorldAutoUpdate===!0&&k.updateMatrixWorld(),it.enabled===!0&&it.isPresenting===!0&&(it.cameraAutoUpdate===!0&&it.updateCamera(k),k=it.getCamera()),b.isScene===!0&&b.onBeforeRender(M,b,k,C),p=bt.get(b,A.length),p.init(k),A.push(p),J.multiplyMatrices(k.projectionMatrix,k.matrixWorldInverse),he.setFromProjectionMatrix(J,vi,k.reversedDepth),j=this.localClippingEnabled,jt=nt.init(this.clippingPlanes,j),m=W.get(b,w.length),m.init(),w.push(m),it.enabled===!0&&it.isPresenting===!0){const tt=M.xr.getDepthSensingMesh();tt!==null&&va(tt,k,-1/0,M.sortObjects)}va(b,k,0,M.sortObjects),m.finish(),M.sortObjects===!0&&m.sort(rt,ht),Wt=it.enabled===!1||it.isPresenting===!1||it.hasDepthSensing()===!1,Wt&&xt.addToRenderList(m,b),this.info.render.frame++,jt===!0&&nt.beginShadows();const z=p.state.shadowsArray;vt.render(z,b,k),jt===!0&&nt.endShadows(),this.info.autoReset===!0&&this.info.reset();const B=m.opaque,F=m.transmissive;if(p.setupLights(),k.isArrayCamera){const tt=k.cameras;if(F.length>0)for(let lt=0,pt=tt.length;lt<pt;lt++){const ut=tt[lt];Co(B,F,b,ut)}Wt&&xt.render(b);for(let lt=0,pt=tt.length;lt<pt;lt++){const ut=tt[lt];Ro(m,b,ut,ut.viewport)}}else F.length>0&&Co(B,F,b,k),Wt&&xt.render(b),Ro(m,b,k);C!==null&&T===0&&(Ot.updateMultisampleRenderTarget(C),Ot.updateRenderTargetMipmap(C)),b.isScene===!0&&b.onAfterRender(M,b,k),ot.resetDefaultState(),x=-1,y=null,A.pop(),A.length>0?(p=A[A.length-1],jt===!0&&nt.setGlobalState(M.clippingPlanes,p.state.camera)):p=null,w.pop(),w.length>0?m=w[w.length-1]:m=null};function va(b,k,z,B){if(b.visible===!1)return;if(b.layers.test(k.layers)){if(b.isGroup)z=b.renderOrder;else if(b.isLOD)b.autoUpdate===!0&&b.update(k);else if(b.isLight)p.pushLight(b),b.castShadow&&p.pushShadow(b);else if(b.isSprite){if(!b.frustumCulled||he.intersectsSprite(b)){B&&Lt.setFromMatrixPosition(b.matrixWorld).applyMatrix4(J);const lt=O.update(b),pt=b.material;pt.visible&&m.push(b,lt,pt,z,Lt.z,null)}}else if((b.isMesh||b.isLine||b.isPoints)&&(!b.frustumCulled||he.intersectsObject(b))){const lt=O.update(b),pt=b.material;if(B&&(b.boundingSphere!==void 0?(b.boundingSphere===null&&b.computeBoundingSphere(),Lt.copy(b.boundingSphere.center)):(lt.boundingSphere===null&&lt.computeBoundingSphere(),Lt.copy(lt.boundingSphere.center)),Lt.applyMatrix4(b.matrixWorld).applyMatrix4(J)),Array.isArray(pt)){const ut=lt.groups;for(let At=0,Pt=ut.length;At<Pt;At++){const Et=ut[At],Gt=pt[Et.materialIndex];Gt&&Gt.visible&&m.push(b,lt,Gt,z,Lt.z,Et)}}else pt.visible&&m.push(b,lt,pt,z,Lt.z,null)}}const tt=b.children;for(let lt=0,pt=tt.length;lt<pt;lt++)va(tt[lt],k,z,B)}function Ro(b,k,z,B){const F=b.opaque,tt=b.transmissive,lt=b.transparent;p.setupLightsView(z),jt===!0&&nt.setGlobalState(M.clippingPlanes,z),B&&gt.viewport(E.copy(B)),F.length>0&&Ts(F,k,z),tt.length>0&&Ts(tt,k,z),lt.length>0&&Ts(lt,k,z),gt.buffers.depth.setTest(!0),gt.buffers.depth.setMask(!0),gt.buffers.color.setMask(!0),gt.setPolygonOffset(!1)}function Co(b,k,z,B){if((z.isScene===!0?z.overrideMaterial:null)!==null)return;p.state.transmissionRenderTarget[B.id]===void 0&&(p.state.transmissionRenderTarget[B.id]=new un(1,1,{generateMipmaps:!0,type:It.has("EXT_color_buffer_half_float")||It.has("EXT_color_buffer_float")?ws:xi,minFilter:on,samples:4,stencilBuffer:a,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:qt.workingColorSpace}));const tt=p.state.transmissionRenderTarget[B.id],lt=B.viewport||E;tt.setSize(lt.z*M.transmissionResolutionScale,lt.w*M.transmissionResolutionScale);const pt=M.getRenderTarget(),ut=M.getActiveCubeFace(),At=M.getActiveMipmapLevel();M.setRenderTarget(tt),M.getClearColor(H),V=M.getClearAlpha(),V<1&&M.setClearColor(16777215,.5),M.clear(),Wt&&xt.render(z);const Pt=M.toneMapping;M.toneMapping=Vi;const Et=B.viewport;if(B.viewport!==void 0&&(B.viewport=void 0),p.setupLightsView(B),jt===!0&&nt.setGlobalState(M.clippingPlanes,B),Ts(b,z,B),Ot.updateMultisampleRenderTarget(tt),Ot.updateRenderTargetMipmap(tt),It.has("WEBGL_multisampled_render_to_texture")===!1){let Gt=!1;for(let Jt=0,_e=k.length;Jt<_e;Jt++){const le=k[Jt],ae=le.object,Tt=le.geometry,pe=le.material,$t=le.group;if(pe.side===Qe&&ae.layers.test(B.layers)){const qe=pe.side;pe.side=Ve,pe.needsUpdate=!0,Po(ae,z,B,Tt,pe,$t),pe.side=qe,pe.needsUpdate=!0,Gt=!0}}Gt===!0&&(Ot.updateMultisampleRenderTarget(tt),Ot.updateRenderTargetMipmap(tt))}M.setRenderTarget(pt,ut,At),M.setClearColor(H,V),Et!==void 0&&(B.viewport=Et),M.toneMapping=Pt}function Ts(b,k,z){const B=k.isScene===!0?k.overrideMaterial:null;for(let F=0,tt=b.length;F<tt;F++){const lt=b[F],pt=lt.object,ut=lt.geometry,At=lt.group;let Pt=lt.material;Pt.allowOverride===!0&&B!==null&&(Pt=B),pt.layers.test(z.layers)&&Po(pt,k,z,ut,Pt,At)}}function Po(b,k,z,B,F,tt){b.onBeforeRender(M,k,z,B,F,tt),b.modelViewMatrix.multiplyMatrices(z.matrixWorldInverse,b.matrixWorld),b.normalMatrix.getNormalMatrix(b.modelViewMatrix),F.onBeforeRender(M,k,z,B,b,tt),F.transparent===!0&&F.side===Qe&&F.forceSinglePass===!1?(F.side=Ve,F.needsUpdate=!0,M.renderBufferDirect(z,k,B,F,b,tt),F.side=Xi,F.needsUpdate=!0,M.renderBufferDirect(z,k,B,F,b,tt),F.side=Qe):M.renderBufferDirect(z,k,B,F,b,tt),b.onAfterRender(M,k,z,B,F,tt)}function As(b,k,z){k.isScene!==!0&&(k=wt);const B=_t.get(b),F=p.state.lights,tt=p.state.shadowsArray,lt=F.state.version,pt=$.getParameters(b,F.state,tt,k,z),ut=$.getProgramCacheKey(pt);let At=B.programs;B.environment=b.isMeshStandardMaterial?k.environment:null,B.fog=k.fog,B.envMap=(b.isMeshStandardMaterial?xe:Ae).get(b.envMap||B.environment),B.envMapRotation=B.environment!==null&&b.envMap===null?k.environmentRotation:b.envMapRotation,At===void 0&&(b.addEventListener("dispose",Y),At=new Map,B.programs=At);let Pt=At.get(ut);if(Pt!==void 0){if(B.currentProgram===Pt&&B.lightsStateVersion===lt)return Do(b,pt),Pt}else pt.uniforms=$.getUniforms(b),b.onBeforeCompile(pt,M),Pt=$.acquireProgram(pt,ut),At.set(ut,Pt),B.uniforms=pt.uniforms;const Et=B.uniforms;return(!b.isShaderMaterial&&!b.isRawShaderMaterial||b.clipping===!0)&&(Et.clippingPlanes=nt.uniform),Do(b,pt),B.needsLights=Fc(b),B.lightsStateVersion=lt,B.needsLights&&(Et.ambientLightColor.value=F.state.ambient,Et.lightProbe.value=F.state.probe,Et.directionalLights.value=F.state.directional,Et.directionalLightShadows.value=F.state.directionalShadow,Et.spotLights.value=F.state.spot,Et.spotLightShadows.value=F.state.spotShadow,Et.rectAreaLights.value=F.state.rectArea,Et.ltc_1.value=F.state.rectAreaLTC1,Et.ltc_2.value=F.state.rectAreaLTC2,Et.pointLights.value=F.state.point,Et.pointLightShadows.value=F.state.pointShadow,Et.hemisphereLights.value=F.state.hemi,Et.directionalShadowMap.value=F.state.directionalShadowMap,Et.directionalShadowMatrix.value=F.state.directionalShadowMatrix,Et.spotShadowMap.value=F.state.spotShadowMap,Et.spotLightMatrix.value=F.state.spotLightMatrix,Et.spotLightMap.value=F.state.spotLightMap,Et.pointShadowMap.value=F.state.pointShadowMap,Et.pointShadowMatrix.value=F.state.pointShadowMatrix),B.currentProgram=Pt,B.uniformsList=null,Pt}function Lo(b){if(b.uniformsList===null){const k=b.currentProgram.getUniforms();b.uniformsList=aa.seqWithValue(k.seq,b.uniforms)}return b.uniformsList}function Do(b,k){const z=_t.get(b);z.outputColorSpace=k.outputColorSpace,z.batching=k.batching,z.batchingColor=k.batchingColor,z.instancing=k.instancing,z.instancingColor=k.instancingColor,z.instancingMorph=k.instancingMorph,z.skinning=k.skinning,z.morphTargets=k.morphTargets,z.morphNormals=k.morphNormals,z.morphColors=k.morphColors,z.morphTargetsCount=k.morphTargetsCount,z.numClippingPlanes=k.numClippingPlanes,z.numIntersection=k.numClipIntersection,z.vertexAlphas=k.vertexAlphas,z.vertexTangents=k.vertexTangents,z.toneMapping=k.toneMapping}function kc(b,k,z,B,F){k.isScene!==!0&&(k=wt),Ot.resetTextureUnits();const tt=k.fog,lt=B.isMeshStandardMaterial?k.environment:null,pt=C===null?M.outputColorSpace:C.isXRRenderTarget===!0?C.texture.colorSpace:Vn,ut=(B.isMeshStandardMaterial?xe:Ae).get(B.envMap||lt),At=B.vertexColors===!0&&!!z.attributes.color&&z.attributes.color.itemSize===4,Pt=!!z.attributes.tangent&&(!!B.normalMap||B.anisotropy>0),Et=!!z.morphAttributes.position,Gt=!!z.morphAttributes.normal,Jt=!!z.morphAttributes.color;let _e=Vi;B.toneMapped&&(C===null||C.isXRRenderTarget===!0)&&(_e=M.toneMapping);const le=z.morphAttributes.position||z.morphAttributes.normal||z.morphAttributes.color,ae=le!==void 0?le.length:0,Tt=_t.get(B),pe=p.state.lights;if(jt===!0&&(j===!0||b!==y)){const ze=b===y&&B.id===x;nt.setState(B,b,ze)}let $t=!1;B.version===Tt.__version?(Tt.needsLights&&Tt.lightsStateVersion!==pe.state.version||Tt.outputColorSpace!==pt||F.isBatchedMesh&&Tt.batching===!1||!F.isBatchedMesh&&Tt.batching===!0||F.isBatchedMesh&&Tt.batchingColor===!0&&F.colorTexture===null||F.isBatchedMesh&&Tt.batchingColor===!1&&F.colorTexture!==null||F.isInstancedMesh&&Tt.instancing===!1||!F.isInstancedMesh&&Tt.instancing===!0||F.isSkinnedMesh&&Tt.skinning===!1||!F.isSkinnedMesh&&Tt.skinning===!0||F.isInstancedMesh&&Tt.instancingColor===!0&&F.instanceColor===null||F.isInstancedMesh&&Tt.instancingColor===!1&&F.instanceColor!==null||F.isInstancedMesh&&Tt.instancingMorph===!0&&F.morphTexture===null||F.isInstancedMesh&&Tt.instancingMorph===!1&&F.morphTexture!==null||Tt.envMap!==ut||B.fog===!0&&Tt.fog!==tt||Tt.numClippingPlanes!==void 0&&(Tt.numClippingPlanes!==nt.numPlanes||Tt.numIntersection!==nt.numIntersection)||Tt.vertexAlphas!==At||Tt.vertexTangents!==Pt||Tt.morphTargets!==Et||Tt.morphNormals!==Gt||Tt.morphColors!==Jt||Tt.toneMapping!==_e||Tt.morphTargetsCount!==ae)&&($t=!0):($t=!0,Tt.__version=B.version);let qe=Tt.currentProgram;$t===!0&&(qe=As(B,k,F));let fn=!1,je=!1,Kn=!1;const me=qe.getUniforms(),ni=Tt.uniforms;if(gt.useProgram(qe.program)&&(fn=!0,je=!0,Kn=!0),B.id!==x&&(x=B.id,je=!0),fn||y!==b){gt.buffers.depth.getReversed()&&b.reversedDepth!==!0&&(b._reversedDepth=!0,b.updateProjectionMatrix()),me.setValue(L,"projectionMatrix",b.projectionMatrix),me.setValue(L,"viewMatrix",b.matrixWorldInverse);const We=me.map.cameraPosition;We!==void 0&&We.setValue(L,ft.setFromMatrixPosition(b.matrixWorld)),Ct.logarithmicDepthBuffer&&me.setValue(L,"logDepthBufFC",2/(Math.log(b.far+1)/Math.LN2)),(B.isMeshPhongMaterial||B.isMeshToonMaterial||B.isMeshLambertMaterial||B.isMeshBasicMaterial||B.isMeshStandardMaterial||B.isShaderMaterial)&&me.setValue(L,"isOrthographic",b.isOrthographicCamera===!0),y!==b&&(y=b,je=!0,Kn=!0)}if(F.isSkinnedMesh){me.setOptional(L,F,"bindMatrix"),me.setOptional(L,F,"bindMatrixInverse");const ze=F.skeleton;ze&&(ze.boneTexture===null&&ze.computeBoneTexture(),me.setValue(L,"boneTexture",ze.boneTexture,Ot))}F.isBatchedMesh&&(me.setOptional(L,F,"batchingTexture"),me.setValue(L,"batchingTexture",F._matricesTexture,Ot),me.setOptional(L,F,"batchingIdTexture"),me.setValue(L,"batchingIdTexture",F._indirectTexture,Ot),me.setOptional(L,F,"batchingColorTexture"),F._colorsTexture!==null&&me.setValue(L,"batchingColorTexture",F._colorsTexture,Ot));const si=z.morphAttributes;if((si.position!==void 0||si.normal!==void 0||si.color!==void 0)&&et.update(F,z,qe),(je||Tt.receiveShadow!==F.receiveShadow)&&(Tt.receiveShadow=F.receiveShadow,me.setValue(L,"receiveShadow",F.receiveShadow)),B.isMeshGouraudMaterial&&B.envMap!==null&&(ni.envMap.value=ut,ni.flipEnvMap.value=ut.isCubeTexture&&ut.isRenderTargetTexture===!1?-1:1),B.isMeshStandardMaterial&&B.envMap===null&&k.environment!==null&&(ni.envMapIntensity.value=k.environmentIntensity),je&&(me.setValue(L,"toneMappingExposure",M.toneMappingExposure),Tt.needsLights&&Nc(ni,Kn),tt&&B.fog===!0&&K.refreshFogUniforms(ni,tt),K.refreshMaterialUniforms(ni,B,G,Z,p.state.transmissionRenderTarget[b.id]),aa.upload(L,Lo(Tt),ni,Ot)),B.isShaderMaterial&&B.uniformsNeedUpdate===!0&&(aa.upload(L,Lo(Tt),ni,Ot),B.uniformsNeedUpdate=!1),B.isSpriteMaterial&&me.setValue(L,"center",F.center),me.setValue(L,"modelViewMatrix",F.modelViewMatrix),me.setValue(L,"normalMatrix",F.normalMatrix),me.setValue(L,"modelMatrix",F.matrixWorld),B.isShaderMaterial||B.isRawShaderMaterial){const ze=B.uniformsGroups;for(let We=0,xa=ze.length;We<xa;We++){const ji=ze[We];kt.update(ji,qe),kt.bind(ji,qe)}}return qe}function Nc(b,k){b.ambientLightColor.needsUpdate=k,b.lightProbe.needsUpdate=k,b.directionalLights.needsUpdate=k,b.directionalLightShadows.needsUpdate=k,b.pointLights.needsUpdate=k,b.pointLightShadows.needsUpdate=k,b.spotLights.needsUpdate=k,b.spotLightShadows.needsUpdate=k,b.rectAreaLights.needsUpdate=k,b.hemisphereLights.needsUpdate=k}function Fc(b){return b.isMeshLambertMaterial||b.isMeshToonMaterial||b.isMeshPhongMaterial||b.isMeshStandardMaterial||b.isShadowMaterial||b.isShaderMaterial&&b.lights===!0}this.getActiveCubeFace=function(){return S},this.getActiveMipmapLevel=function(){return T},this.getRenderTarget=function(){return C},this.setRenderTargetTextures=function(b,k,z){const B=_t.get(b);B.__autoAllocateDepthBuffer=b.resolveDepthBuffer===!1,B.__autoAllocateDepthBuffer===!1&&(B.__useRenderToTexture=!1),_t.get(b.texture).__webglTexture=k,_t.get(b.depthTexture).__webglTexture=B.__autoAllocateDepthBuffer?void 0:z,B.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(b,k){const z=_t.get(b);z.__webglFramebuffer=k,z.__useDefaultFramebuffer=k===void 0};const Oc=L.createFramebuffer();this.setRenderTarget=function(b,k=0,z=0){C=b,S=k,T=z;let B=!0,F=null,tt=!1,lt=!1;if(b){const ut=_t.get(b);if(ut.__useDefaultFramebuffer!==void 0)gt.bindFramebuffer(L.FRAMEBUFFER,null),B=!1;else if(ut.__webglFramebuffer===void 0)Ot.setupRenderTarget(b);else if(ut.__hasExternalTextures)Ot.rebindTextures(b,_t.get(b.texture).__webglTexture,_t.get(b.depthTexture).__webglTexture);else if(b.depthBuffer){const Et=b.depthTexture;if(ut.__boundDepthTexture!==Et){if(Et!==null&&_t.has(Et)&&(b.width!==Et.image.width||b.height!==Et.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");Ot.setupDepthRenderbuffer(b)}}const At=b.texture;(At.isData3DTexture||At.isDataArrayTexture||At.isCompressedArrayTexture)&&(lt=!0);const Pt=_t.get(b).__webglFramebuffer;b.isWebGLCubeRenderTarget?(Array.isArray(Pt[k])?F=Pt[k][z]:F=Pt[k],tt=!0):b.samples>0&&Ot.useMultisampledRTT(b)===!1?F=_t.get(b).__webglMultisampledFramebuffer:Array.isArray(Pt)?F=Pt[z]:F=Pt,E.copy(b.viewport),I.copy(b.scissor),N=b.scissorTest}else E.copy(St).multiplyScalar(G).floor(),I.copy(Bt).multiplyScalar(G).floor(),N=re;if(z!==0&&(F=Oc),gt.bindFramebuffer(L.FRAMEBUFFER,F)&&B&&gt.drawBuffers(b,F),gt.viewport(E),gt.scissor(I),gt.setScissorTest(N),tt){const ut=_t.get(b.texture);L.framebufferTexture2D(L.FRAMEBUFFER,L.COLOR_ATTACHMENT0,L.TEXTURE_CUBE_MAP_POSITIVE_X+k,ut.__webglTexture,z)}else if(lt){const ut=k;for(let At=0;At<b.textures.length;At++){const Pt=_t.get(b.textures[At]);L.framebufferTextureLayer(L.FRAMEBUFFER,L.COLOR_ATTACHMENT0+At,Pt.__webglTexture,z,ut)}}else if(b!==null&&z!==0){const ut=_t.get(b.texture);L.framebufferTexture2D(L.FRAMEBUFFER,L.COLOR_ATTACHMENT0,L.TEXTURE_2D,ut.__webglTexture,z)}x=-1},this.readRenderTargetPixels=function(b,k,z,B,F,tt,lt,pt=0){if(!(b&&b.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let ut=_t.get(b).__webglFramebuffer;if(b.isWebGLCubeRenderTarget&&lt!==void 0&&(ut=ut[lt]),ut){gt.bindFramebuffer(L.FRAMEBUFFER,ut);try{const At=b.textures[pt],Pt=At.format,Et=At.type;if(!Ct.textureFormatReadable(Pt)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!Ct.textureTypeReadable(Et)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}k>=0&&k<=b.width-B&&z>=0&&z<=b.height-F&&(b.textures.length>1&&L.readBuffer(L.COLOR_ATTACHMENT0+pt),L.readPixels(k,z,B,F,yt.convert(Pt),yt.convert(Et),tt))}finally{const At=C!==null?_t.get(C).__webglFramebuffer:null;gt.bindFramebuffer(L.FRAMEBUFFER,At)}}},this.readRenderTargetPixelsAsync=async function(b,k,z,B,F,tt,lt,pt=0){if(!(b&&b.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let ut=_t.get(b).__webglFramebuffer;if(b.isWebGLCubeRenderTarget&&lt!==void 0&&(ut=ut[lt]),ut)if(k>=0&&k<=b.width-B&&z>=0&&z<=b.height-F){gt.bindFramebuffer(L.FRAMEBUFFER,ut);const At=b.textures[pt],Pt=At.format,Et=At.type;if(!Ct.textureFormatReadable(Pt))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!Ct.textureTypeReadable(Et))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");const Gt=L.createBuffer();L.bindBuffer(L.PIXEL_PACK_BUFFER,Gt),L.bufferData(L.PIXEL_PACK_BUFFER,tt.byteLength,L.STREAM_READ),b.textures.length>1&&L.readBuffer(L.COLOR_ATTACHMENT0+pt),L.readPixels(k,z,B,F,yt.convert(Pt),yt.convert(Et),0);const Jt=C!==null?_t.get(C).__webglFramebuffer:null;gt.bindFramebuffer(L.FRAMEBUFFER,Jt);const _e=L.fenceSync(L.SYNC_GPU_COMMANDS_COMPLETE,0);return L.flush(),await Bh(L,_e,4),L.bindBuffer(L.PIXEL_PACK_BUFFER,Gt),L.getBufferSubData(L.PIXEL_PACK_BUFFER,0,tt),L.deleteBuffer(Gt),L.deleteSync(_e),tt}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(b,k=null,z=0){const B=Math.pow(2,-z),F=Math.floor(b.image.width*B),tt=Math.floor(b.image.height*B),lt=k!==null?k.x:0,pt=k!==null?k.y:0;Ot.setTexture2D(b,0),L.copyTexSubImage2D(L.TEXTURE_2D,z,0,0,lt,pt,F,tt),gt.unbindTexture()};const zc=L.createFramebuffer(),Bc=L.createFramebuffer();this.copyTextureToTexture=function(b,k,z=null,B=null,F=0,tt=null){tt===null&&(F!==0?(ys("WebGLRenderer: copyTextureToTexture function signature has changed to support src and dst mipmap levels."),tt=F,F=0):tt=0);let lt,pt,ut,At,Pt,Et,Gt,Jt,_e;const le=b.isCompressedTexture?b.mipmaps[tt]:b.image;if(z!==null)lt=z.max.x-z.min.x,pt=z.max.y-z.min.y,ut=z.isBox3?z.max.z-z.min.z:1,At=z.min.x,Pt=z.min.y,Et=z.isBox3?z.min.z:0;else{const si=Math.pow(2,-F);lt=Math.floor(le.width*si),pt=Math.floor(le.height*si),b.isDataArrayTexture?ut=le.depth:b.isData3DTexture?ut=Math.floor(le.depth*si):ut=1,At=0,Pt=0,Et=0}B!==null?(Gt=B.x,Jt=B.y,_e=B.z):(Gt=0,Jt=0,_e=0);const ae=yt.convert(k.format),Tt=yt.convert(k.type);let pe;k.isData3DTexture?(Ot.setTexture3D(k,0),pe=L.TEXTURE_3D):k.isDataArrayTexture||k.isCompressedArrayTexture?(Ot.setTexture2DArray(k,0),pe=L.TEXTURE_2D_ARRAY):(Ot.setTexture2D(k,0),pe=L.TEXTURE_2D),L.pixelStorei(L.UNPACK_FLIP_Y_WEBGL,k.flipY),L.pixelStorei(L.UNPACK_PREMULTIPLY_ALPHA_WEBGL,k.premultiplyAlpha),L.pixelStorei(L.UNPACK_ALIGNMENT,k.unpackAlignment);const $t=L.getParameter(L.UNPACK_ROW_LENGTH),qe=L.getParameter(L.UNPACK_IMAGE_HEIGHT),fn=L.getParameter(L.UNPACK_SKIP_PIXELS),je=L.getParameter(L.UNPACK_SKIP_ROWS),Kn=L.getParameter(L.UNPACK_SKIP_IMAGES);L.pixelStorei(L.UNPACK_ROW_LENGTH,le.width),L.pixelStorei(L.UNPACK_IMAGE_HEIGHT,le.height),L.pixelStorei(L.UNPACK_SKIP_PIXELS,At),L.pixelStorei(L.UNPACK_SKIP_ROWS,Pt),L.pixelStorei(L.UNPACK_SKIP_IMAGES,Et);const me=b.isDataArrayTexture||b.isData3DTexture,ni=k.isDataArrayTexture||k.isData3DTexture;if(b.isDepthTexture){const si=_t.get(b),ze=_t.get(k),We=_t.get(si.__renderTarget),xa=_t.get(ze.__renderTarget);gt.bindFramebuffer(L.READ_FRAMEBUFFER,We.__webglFramebuffer),gt.bindFramebuffer(L.DRAW_FRAMEBUFFER,xa.__webglFramebuffer);for(let ji=0;ji<ut;ji++)me&&(L.framebufferTextureLayer(L.READ_FRAMEBUFFER,L.COLOR_ATTACHMENT0,_t.get(b).__webglTexture,F,Et+ji),L.framebufferTextureLayer(L.DRAW_FRAMEBUFFER,L.COLOR_ATTACHMENT0,_t.get(k).__webglTexture,tt,_e+ji)),L.blitFramebuffer(At,Pt,lt,pt,Gt,Jt,lt,pt,L.DEPTH_BUFFER_BIT,L.NEAREST);gt.bindFramebuffer(L.READ_FRAMEBUFFER,null),gt.bindFramebuffer(L.DRAW_FRAMEBUFFER,null)}else if(F!==0||b.isRenderTargetTexture||_t.has(b)){const si=_t.get(b),ze=_t.get(k);gt.bindFramebuffer(L.READ_FRAMEBUFFER,zc),gt.bindFramebuffer(L.DRAW_FRAMEBUFFER,Bc);for(let We=0;We<ut;We++)me?L.framebufferTextureLayer(L.READ_FRAMEBUFFER,L.COLOR_ATTACHMENT0,si.__webglTexture,F,Et+We):L.framebufferTexture2D(L.READ_FRAMEBUFFER,L.COLOR_ATTACHMENT0,L.TEXTURE_2D,si.__webglTexture,F),ni?L.framebufferTextureLayer(L.DRAW_FRAMEBUFFER,L.COLOR_ATTACHMENT0,ze.__webglTexture,tt,_e+We):L.framebufferTexture2D(L.DRAW_FRAMEBUFFER,L.COLOR_ATTACHMENT0,L.TEXTURE_2D,ze.__webglTexture,tt),F!==0?L.blitFramebuffer(At,Pt,lt,pt,Gt,Jt,lt,pt,L.COLOR_BUFFER_BIT,L.NEAREST):ni?L.copyTexSubImage3D(pe,tt,Gt,Jt,_e+We,At,Pt,lt,pt):L.copyTexSubImage2D(pe,tt,Gt,Jt,At,Pt,lt,pt);gt.bindFramebuffer(L.READ_FRAMEBUFFER,null),gt.bindFramebuffer(L.DRAW_FRAMEBUFFER,null)}else ni?b.isDataTexture||b.isData3DTexture?L.texSubImage3D(pe,tt,Gt,Jt,_e,lt,pt,ut,ae,Tt,le.data):k.isCompressedArrayTexture?L.compressedTexSubImage3D(pe,tt,Gt,Jt,_e,lt,pt,ut,ae,le.data):L.texSubImage3D(pe,tt,Gt,Jt,_e,lt,pt,ut,ae,Tt,le):b.isDataTexture?L.texSubImage2D(L.TEXTURE_2D,tt,Gt,Jt,lt,pt,ae,Tt,le.data):b.isCompressedTexture?L.compressedTexSubImage2D(L.TEXTURE_2D,tt,Gt,Jt,le.width,le.height,ae,le.data):L.texSubImage2D(L.TEXTURE_2D,tt,Gt,Jt,lt,pt,ae,Tt,le);L.pixelStorei(L.UNPACK_ROW_LENGTH,$t),L.pixelStorei(L.UNPACK_IMAGE_HEIGHT,qe),L.pixelStorei(L.UNPACK_SKIP_PIXELS,fn),L.pixelStorei(L.UNPACK_SKIP_ROWS,je),L.pixelStorei(L.UNPACK_SKIP_IMAGES,Kn),tt===0&&k.generateMipmaps&&L.generateMipmap(pe),gt.unbindTexture()},this.initRenderTarget=function(b){_t.get(b).__webglFramebuffer===void 0&&Ot.setupRenderTarget(b)},this.initTexture=function(b){b.isCubeTexture?Ot.setTextureCube(b,0):b.isData3DTexture?Ot.setTexture3D(b,0):b.isDataArrayTexture||b.isCompressedArrayTexture?Ot.setTexture2DArray(b,0):Ot.setTexture2D(b,0),gt.unbindTexture()},this.resetState=function(){S=0,T=0,C=null,gt.reset(),ot.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return vi}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(t){this._outputColorSpace=t;const e=this.getContext();e.drawingBufferColorSpace=qt._getDrawingBufferColorSpace(t),e.unpackColorSpace=qt._getUnpackColorSpace()}}const u0=["lin","zhou","su","man","chen","apo","xu","zhong","water_gu","ore_gu","mandrill","steelbone","butcher","bride","coffin","coffin_hang","tank_body","infected","miner","nuo_mask","bride2","scare_nuo","tang","noh_gun","noh_gun_w1","noh_gun_w2","noh_gun_hit","noh_blade","noh_blade_w","noh_blade_atk","noh_dead","tsuchigumo","tsuchigumo_w","tsuchigumo_atk","tsuchigumo_dead","civ1","civ2","noh_mask"],d0=["frost_door","tank_wall","ship_wall","frost_shelf","wood_panel","carpet","wet_tile","hold_wall","sluice_wall","factory_wall","banquet_wall","village_wall","m_ch1","m_ch2","m_ch3","m_ch4","m_ch5","m_ch6","m_ch7","m_ch8","m_coffin","m_terminal","x_brick","x_plaster","x_stone","x_wood","x_iron","x_roof","x_cloth","x_concrete","x_shutter","x_window","x_door","x_poster","x_memorial"],f0=["h_pistol_b","h_bell_b","w_mg","w_cryo","w_pistol2","w_cryo2","wt_pistol_r","wt_pistol_l","wt_shotgun","wt_sword","wt_sg1","wt_sg2","wt_sw0","wt_sw1","wt_sw2"],p0=["ammo","bell","medkit","serum","x_medkit","x_ammo","x_shells"],m0=["lin","su","zhou","chen","man","apo","xu","zhong","tang"],mo=new Map,er=new Map,Gl=new Map,we=i=>`./art/${i}`;function g0(i,t){return new Promise(e=>{const n=new Image;n.onload=()=>{mo.set(i,n),e()},n.onerror=()=>{console.warn("missing art",t),e()},n.src=t})}async function _0(i){const t=[...u0.map(n=>[`sprite:${n}`,we(`sprites/${n}.webp`)]),...d0.map(n=>[`tex:${n}`,we(`tex/${n}.webp`)]),...f0.map(n=>[`hud:${n}`,we(`hud/${n}.webp`)]),...p0.map(n=>[`prop:${n}`,we(`props/${n}.webp`)]),["sky:f01",we("sky/f01.jpg")],["sky:f25",we("sky/f25.jpg")],["sky:village",we("sky/village.jpg")]];let e=0;await Promise.all(t.map(([n,s])=>g0(n,s).then(()=>i(++e/t.length))))}function Pi(i,t=1){const e=`${i}@${t}`;if(er.has(e))return er.get(e);const n=mo.get(i);if(!n)return null;const s=new De(n);return s.colorSpace=Pe,s.wrapS=s.wrapT=ms,s.repeat.set(t,t),s.anisotropy=4,s.needsUpdate=!0,er.set(e,s),s}function Fn(i){const t=Gl.get(i);if(t)return t;const e=mo.get(`sprite:${i}`);if(!e)throw new Error(`sprite ${i} not loaded`);const n=new De(e);n.colorSpace=Pe,n.anisotropy=4,n.needsUpdate=!0;const s=96,a=Math.max(8,Math.round(e.width/e.height*s)),r=document.createElement("canvas");r.width=a,r.height=s;const o=r.getContext("2d",{willReadFrequently:!0});o.drawImage(e,0,0,a,s);const l=o.getImageData(0,0,a,s).data,c=new Uint8Array(a*s);for(let u=0;u<a*s;u++)c[u]=l[u*4+3];const h={name:i,tex:n,aspect:e.width/e.height,mask:{w:a,h:s,data:c}};return Gl.set(i,h),h}function Qs(i){return we(`hud/${i}.webp`)}function ra(i){return we(`portraits/${i}.jpg`)}const Rc="mobile",Vl=Rc==="mobile",Cc=`gubian.${Rc}.save.v2`;class v0{moveX=0;moveY=0;fire=!1;sprint=!1;sensitivity=1;enabled=!1;onPointerLockLost=null;pressed=new Set;lookDX=0;lookDY=0;root;constructor(){const t=document.createElement("div");t.id="touch",t.innerHTML=`
      <div class="t-look"></div>
      <div class="t-stick"><div class="t-knob"></div></div>
      <button class="t-btn t-fire" data-hold="fire"><span>开火</span></button>
      <button class="t-btn t-use" data-act="use"><span>互动</span></button>
      <button class="t-btn t-reload" data-act="reload"><span>换弹</span></button>
      <button class="t-btn t-dash" data-act="dash"><span>闪避</span></button>
      <button class="t-btn t-weapon" data-act="nextWeapon"><span>换枪</span></button>
      <button class="t-btn t-flash" data-act="flash"><span>强光</span></button>
      <button class="t-btn t-scan" data-act="scan"><span>勘察</span></button>
      <button class="t-btn t-bell" data-act="bell"><span>铜铃</span></button>
      <button class="t-btn t-zhenyin" data-act="zhenyin"><span>镇音</span></button>
      <button class="t-btn t-heal" data-act="heal"><span>草药</span></button>
      <button class="t-btn t-map" data-act="map"><span>地图</span></button>
      <button class="t-btn t-pause" data-act="pause"><span>❚❚</span></button>`,document.body.appendChild(t),this.root=t;const e=t.querySelector(".t-stick"),n=t.querySelector(".t-knob"),s=t.querySelector(".t-look");let a=-1,r=0,o=0;const l=new Map;s.addEventListener("pointerdown",h=>{h.clientX<window.innerWidth*.42&&a===-1?(a=h.pointerId,r=h.clientX,o=h.clientY,e.style.left=`${r}px`,e.style.top=`${o}px`,e.classList.add("active")):l.set(h.pointerId,{x:h.clientX,y:h.clientY}),s.setPointerCapture(h.pointerId)}),s.addEventListener("pointermove",h=>{if(h.pointerId===a){let u=h.clientX-r,d=h.clientY-o;const f=60,g=Math.hypot(u,d);g>f&&(u*=f/g,d*=f/g),n.style.transform=`translate(${u}px, ${d}px)`,this.moveX=u/f,this.moveY=-d/f,this.sprint=g>f*1.5}this.track(h,l)});const c=h=>{h.pointerId===a&&(a=-1,this.moveX=this.moveY=0,this.sprint=!1,n.style.transform="",e.classList.remove("active")),l.delete(h.pointerId)};s.addEventListener("pointerup",c),s.addEventListener("pointercancel",c),t.querySelectorAll(".t-btn").forEach(h=>{h.addEventListener("pointerdown",d=>{d.preventDefault(),h.setPointerCapture(d.pointerId),h.classList.add("down"),h.dataset.hold==="fire"?(this.fire=!0,l.set(d.pointerId,{x:d.clientX,y:d.clientY})):h.dataset.act&&this.pressed.add(h.dataset.act)}),h.addEventListener("pointermove",d=>this.track(d,l));const u=d=>{h.classList.remove("down"),h.dataset.hold==="fire"&&(this.fire=!1),l.delete(d.pointerId)};h.addEventListener("pointerup",u),h.addEventListener("pointercancel",u)})}track(t,e){const n=e.get(t.pointerId);n&&(this.lookDX+=(t.clientX-n.x)*.0052*this.sensitivity,this.lookDY+=(t.clientY-n.y)*.0052*this.sensitivity,n.x=t.clientX,n.y=t.clientY)}lock(){}unlock(){}show(t){this.root.style.display=t?"block":"none"}setButton(t,e){const n=this.root.querySelector(`.t-${t}`);n&&(e.visible!==void 0&&(n.style.display=e.visible?"":"none"),e.cooldown!==void 0&&n.style.setProperty("--cd",`${Math.round(Math.max(0,Math.min(1,e.cooldown))*100)}%`),e.label!==void 0&&(n.querySelector("span").textContent=e.label))}consume(t){const e=this.pressed.has(t);return this.pressed.delete(t),e}clear(){this.pressed.clear(),this.lookDX=this.lookDY=0,this.fire=!1}takeLook(){const t={dx:this.lookDX,dy:this.lookDY};return this.lookDX=this.lookDY=0,t}update(){}}function x0(i){return new v0}const On=new Map;function Ue(i,t,e,n=.08){for(let s=0;s<e;s++){const a=Math.random()*255;i.fillStyle=`rgba(${a},${a},${a},${n})`,i.fillRect(Math.random()*t,Math.random()*t,1+Math.random()*3,1+Math.random()*3)}}function be(i,t,e,n){for(let s=0;s<e;s++){const a=Math.random()*t,r=Math.random()*t,o=8+Math.random()*t*.14,l=i.createRadialGradient(a,r,0,a,r,o);l.addColorStop(0,n),l.addColorStop(1,"rgba(0,0,0,0)"),i.fillStyle=l,i.fillRect(a-o,r-o,o*2,o*2)}}function y0(i,t,e,n){i.strokeStyle=n;for(let s=0;s<e;s++){let a=Math.random()*t,r=Math.random()*t;i.lineWidth=1+Math.random()*3,i.beginPath(),i.moveTo(a,r);for(let o=0;o<10;o++)a+=(Math.random()-.5)*40,r+=(Math.random()-.3)*30,i.lineTo(a,r);i.stroke()}}const Wl={deck:(i,t)=>{i.fillStyle="#3d3024",i.fillRect(0,0,t,t);for(let e=0;e<8;e++)i.fillStyle=e%2?"#463523":"#382a1e",i.fillRect(0,e*t/8,t,t/8-3),i.fillStyle="#140e08",i.fillRect(0,(e+1)*t/8-3,t,3);Ue(i,t,4e3,.06),be(i,t,5,"rgba(10,20,25,0.5)")},wallpaper:(i,t)=>{i.fillStyle="#3a2f22",i.fillRect(0,0,t,t);for(let e=0;e<t;e+=32)i.fillStyle="rgba(150,110,60,0.2)",i.fillRect(e,0,4,t);i.fillStyle="#21180f",i.fillRect(0,t*.7,t,t*.3),i.fillStyle="rgba(190,150,80,0.5)",i.fillRect(0,t*.7,t,5),Ue(i,t,4e3,.06),be(i,t,6,"rgba(0,0,0,0.45)"),be(i,t,2,"rgba(130,10,5,0.55)")},metal:(i,t)=>{i.fillStyle="#41484b",i.fillRect(0,0,t,t),i.strokeStyle="#1e2326",i.lineWidth=5,i.strokeRect(3,3,t-6,t-6),i.strokeRect(3,t/2,t-6,1),i.fillStyle="#6a7276";for(const[e,n]of[[12,12],[t-16,12],[12,t-16],[t-16,t-16]])i.beginPath(),i.arc(e+2,n+2,4,0,7),i.fill();Ue(i,t,5e3,.08),be(i,t,10,"rgba(110,55,20,0.35)")},rust:(i,t)=>{i.fillStyle="#4a3326",i.fillRect(0,0,t,t),be(i,t,30,"rgba(140,70,25,0.45)"),be(i,t,20,"rgba(20,15,10,0.5)"),i.fillStyle="rgba(0,0,0,0.5)";for(let e=0;e<t;e+=64)i.fillRect(0,e,t,4);Ue(i,t,5e3,.1)},tile:(i,t)=>{i.fillStyle="#8d9496",i.fillRect(0,0,t,t),i.strokeStyle="#3c4243",i.lineWidth=3;for(let e=0;e<=4;e++)i.beginPath(),i.moveTo(e*64,0),i.lineTo(e*64,t),i.stroke(),i.beginPath(),i.moveTo(0,e*64),i.lineTo(t,e*64),i.stroke();Ue(i,t,4e3,.08),be(i,t,6,"rgba(120,8,4,0.55)"),be(i,t,6,"rgba(0,0,0,0.4)")},frost:(i,t)=>{i.fillStyle="#9fb6c0",i.fillRect(0,0,t,t),i.strokeStyle="rgba(255,255,255,0.35)";for(let e=0;e<160;e++){const n=Math.random()*t,s=Math.random()*t,a=4+Math.random()*18,r=Math.random()*3.14;i.beginPath(),i.moveTo(n,s),i.lineTo(n+Math.cos(r)*a,s+Math.sin(r)*a),i.stroke()}Ue(i,t,3e3,.1)},ceiling:(i,t)=>{i.fillStyle="#1f1e1c",i.fillRect(0,0,t,t),i.strokeStyle="#0d0d0c",i.lineWidth=4,i.strokeRect(0,0,t,t),i.fillStyle="rgba(255,240,200,0.06)",i.fillRect(t*.4,t*.4,t*.2,t*.2),Ue(i,t,2e3,.05)},concrete:(i,t)=>{i.fillStyle="#55595a",i.fillRect(0,0,t,t),Ue(i,t,9e3,.09),be(i,t,14,"rgba(20,25,25,0.35)"),be(i,t,4,"rgba(60,80,60,0.3)"),i.fillStyle="rgba(0,0,0,0.35)",i.fillRect(0,t*.5,t,3),i.fillRect(t*.5,0,3,t)},stone:(i,t)=>{i.fillStyle="#4b4a44",i.fillRect(0,0,t,t),i.strokeStyle="#26251f",i.lineWidth=4;for(let e=0;e<t;e+=48){i.beginPath(),i.moveTo(0,e),i.lineTo(t,e),i.stroke();for(let n=e/48%2?0:40;n<t;n+=80)i.beginPath(),i.moveTo(n,e),i.lineTo(n,e+48),i.stroke()}Ue(i,t,6e3,.1),be(i,t,10,"rgba(40,70,40,0.35)")},mud:(i,t)=>{i.fillStyle="#2f2a20",i.fillRect(0,0,t,t),be(i,t,30,"rgba(60,50,30,0.5)"),be(i,t,12,"rgba(20,30,20,0.5)"),Ue(i,t,8e3,.08)},temple:(i,t)=>{i.fillStyle="#5a1712",i.fillRect(0,0,t,t),i.fillStyle="#2a0c08",i.fillRect(0,t*.82,t,t*.18),i.strokeStyle="rgba(210,160,70,0.55)",i.lineWidth=4;for(let e=16;e<t;e+=64)i.strokeRect(e,20,40,t*.7);Ue(i,t,5e3,.08),be(i,t,8,"rgba(0,0,0,0.4)")},lattice:(i,t)=>{i.fillStyle="#3a2416",i.fillRect(0,0,t,t),i.strokeStyle="#140a05",i.lineWidth=6;for(let e=0;e<=t;e+=32)i.beginPath(),i.moveTo(e,0),i.lineTo(e,t),i.stroke(),i.beginPath(),i.moveTo(0,e),i.lineTo(t,e),i.stroke();i.fillStyle="rgba(255,190,90,0.08)",i.fillRect(0,0,t,t),Ue(i,t,4e3,.07)},neon:(i,t)=>{i.fillStyle="#1b1d24",i.fillRect(0,0,t,t),Ue(i,t,6e3,.08),i.fillStyle="rgba(220,40,60,0.8)",i.fillRect(20,40,t-40,6),i.fillStyle="rgba(40,200,220,0.6)",i.fillRect(40,70,t-120,3),i.fillStyle="rgba(0,0,0,0.5)";for(let e=120;e<t;e+=40)for(let n=16;n<t;n+=56)i.fillRect(n,e,36,24);i.fillStyle="rgba(255,220,140,0.25)",i.fillRect(72,160,36,24),i.fillRect(184,200,36,24)},water:(i,t)=>{i.fillStyle="#0b1c1c",i.fillRect(0,0,t,t),be(i,t,20,"rgba(30,70,70,0.4)"),be(i,t,6,"rgba(110,10,5,0.25)"),i.strokeStyle="rgba(160,220,220,0.15)";for(let e=0;e<40;e++){const n=Math.random()*t,s=Math.random()*t;i.beginPath(),i.ellipse(n,s,20,5,0,0,7),i.stroke()}},grass:(i,t)=>{i.fillStyle="#26281b",i.fillRect(0,0,t,t),i.strokeStyle="rgba(80,90,50,0.6)";for(let e=0;e<900;e++){const n=Math.random()*t,s=Math.random()*t;i.beginPath(),i.moveTo(n,s),i.lineTo(n+(Math.random()-.5)*4,s-6-Math.random()*6),i.stroke()}be(i,t,12,"rgba(10,10,5,0.5)")},flesh:(i,t)=>{i.fillStyle="#3a0d0b",i.fillRect(0,0,t,t),be(i,t,20,"rgba(120,20,15,0.5)"),y0(i,t,40,"rgba(230,50,30,0.8)"),Ue(i,t,3e3,.1)},rail:(i,t)=>{i.fillStyle="#2b2722",i.fillRect(0,0,t,t),Ue(i,t,6e3,.1),i.fillStyle="#4a3220";for(let e=8;e<t;e+=42)i.fillRect(10,e,t-20,18);i.fillStyle="#9a9a92",i.fillRect(t*.25,0,10,t),i.fillRect(t*.72,0,10,t)},door:(i,t)=>{i.fillStyle="#4c4036",i.fillRect(0,0,t,t),i.strokeStyle="#1b140f",i.lineWidth=8,i.strokeRect(8,8,t-16,t-16),i.strokeRect(30,30,t-60,t*.35),i.strokeRect(30,t*.5,t-60,t*.4),i.fillStyle="#b89a5a",i.fillRect(t*.8,t*.47,14,30),Ue(i,t,4e3,.08),be(i,t,6,"rgba(0,0,0,0.4)")},carpet:(i,t)=>{i.fillStyle="#3d0f12",i.fillRect(0,0,t,t),i.strokeStyle="rgba(170,130,60,0.4)",i.lineWidth=3;for(let e=0;e<4;e++)for(let n=0;n<4;n++){const s=e*64+32,a=n*64+32;i.beginPath(),i.moveTo(s,a-22),i.lineTo(s+22,a),i.lineTo(s,a+22),i.lineTo(s-22,a),i.closePath(),i.stroke()}Ue(i,t,5e3,.07),be(i,t,6,"rgba(10,0,0,0.6)")}};function fi(i){if(On.has(i))return On.get(i);const t=document.createElement("canvas");t.width=t.height=256;const e=t.getContext("2d");(Wl[i]??Wl.concrete)(e,256);const n=new oo(t);return n.wrapS=n.wrapT=ms,n.colorSpace=Pe,n.anisotropy=4,On.set(i,n),n}function b0(i){return i.startsWith("tex:")?Pi(i)??fi("concrete"):fi(i.replace(/^p:/,""))}function Bi(i){const t=`icon:${i}`;if(On.has(t))return On.get(t);const e=document.createElement("canvas");e.width=e.height=128;const n=e.getContext("2d"),s=r=>{const o=n.createRadialGradient(64,70,4,64,70,60);o.addColorStop(0,r),o.addColorStop(1,"rgba(0,0,0,0)"),n.fillStyle=o,n.fillRect(0,0,128,128)};if(i.startsWith("key_")){const r=i==="key_red"?"#e0302a":i==="key_blue"?"#2f7cff":"#f0c030";s(r.replace(")","")+"66"),n.fillStyle=r,n.fillRect(34,50,60,38),n.fillStyle="#111",n.fillRect(40,58,26,6),n.fillRect(40,70,40,4),n.fillStyle="#ddd",n.fillRect(74,56,12,12)}else if(i==="ammo"||i==="mg_ammo"||i==="cryo_ammo"){s("rgba(255,200,80,0.35)"),n.fillStyle=i==="cryo_ammo"?"#2a6f80":"#3f4a2c",n.fillRect(28,66,72,40),n.fillStyle=i==="cryo_ammo"?"#7ff":"#d8b048";for(let r=0;r<5;r++)n.fillRect(34+r*13,i==="mg_ammo"?44:50,8,18);n.fillStyle="#111",n.font="bold 14px sans-serif",n.fillText(i==="mg_ammo"?"7.62":i==="cryo_ammo"?"CRYO":"9mm",40,92)}else if(i==="herb"){s("rgba(90,220,90,0.35)"),n.fillStyle="#6a4a30",n.fillRect(48,86,32,22),n.fillStyle="#3c9a3a";for(let r=0;r<6;r++)n.beginPath(),n.ellipse(64+Math.cos(r)*14,70-r*4,8,20,Math.cos(r)*.6,0,7),n.fill()}else if(i==="medkit")s("rgba(255,255,255,0.3)"),n.fillStyle="#e8e8e8",n.fillRect(30,56,68,48),n.fillStyle="#d02020",n.fillRect(58,62,12,36),n.fillRect(46,74,36,12);else if(i==="armor")s("rgba(80,160,255,0.35)"),n.fillStyle="#2b3440",n.beginPath(),n.moveTo(36,40),n.lineTo(92,40),n.lineTo(98,104),n.lineTo(30,104),n.closePath(),n.fill(),n.fillStyle="#ccd",n.font="bold 13px sans-serif",n.fillText("NBER",47,76);else if(i==="weapon_mg"||i==="weapon_cryo")s(i==="weapon_mg"?"rgba(255,170,60,0.4)":"rgba(80,240,255,0.45)"),n.fillStyle="#333",n.fillRect(14,64,100,16),n.fillRect(40,78,16,26),n.fillStyle=i==="weapon_mg"?"#a08040":"#5ff",n.fillRect(64,58,30,10);else if(i==="proj_red"||i==="proj_rock"||i==="proj_bug"||i==="proj_blue"){const r=i==="proj_red"?"255,60,30":i==="proj_blue"?"90,220,255":i==="proj_bug"?"200,40,30":"120,100,80",o=n.createRadialGradient(64,64,2,64,64,60);o.addColorStop(0,"rgba(255,240,220,1)"),o.addColorStop(.25,`rgba(${r},0.95)`),o.addColorStop(1,`rgba(${r},0)`),n.fillStyle=o,n.fillRect(0,0,128,128)}else if(i==="blood"){const r=n.createRadialGradient(64,64,4,64,64,60);r.addColorStop(0,"rgba(90,0,0,0.95)"),r.addColorStop(.6,"rgba(60,0,0,0.6)"),r.addColorStop(1,"rgba(30,0,0,0)"),n.fillStyle=r,n.fillRect(0,0,128,128)}else if(i==="shadow"){const r=n.createRadialGradient(64,64,4,64,64,62);r.addColorStop(0,"rgba(0,0,0,0.7)"),r.addColorStop(1,"rgba(0,0,0,0)"),n.fillStyle=r,n.fillRect(0,0,128,128)}else if(i==="warn")n.strokeStyle="rgba(255,40,20,0.9)",n.lineWidth=6,n.beginPath(),n.arc(64,64,56,0,7),n.stroke(),n.fillStyle="rgba(255,40,20,0.25)",n.beginPath(),n.arc(64,64,56,0,7),n.fill();else if(i==="mask")s("rgba(255,200,120,0.35)"),n.fillStyle="#c8a070",n.beginPath(),n.ellipse(64,64,34,44,0,0,7),n.fill(),n.fillStyle="#5a1a10",n.beginPath(),n.ellipse(50,56,8,5,0,0,7),n.ellipse(78,56,8,5,0,0,7),n.fill(),n.fillStyle="#a02010",n.fillRect(52,84,24,6);else if(i==="serum")s("rgba(255,40,40,0.5)"),n.fillStyle="#ddd",n.fillRect(56,30,16,10),n.fillStyle="#c01818",n.fillRect(52,40,24,56);else if(i==="doc"){s("rgba(255,230,160,0.35)"),n.fillStyle="#d8cfb0",n.fillRect(36,36,56,72),n.fillStyle="#555";for(let r=48;r<100;r+=9)n.fillRect(42,r,44,3)}else s("rgba(255,255,255,0.4)");const a=new oo(e);return a.colorSpace=Pe,On.set(t,a),a}function M0(i,t=!1){const e=i[0].index!==null,n=new Set(Object.keys(i[0].attributes)),s=new Set(Object.keys(i[0].morphAttributes)),a={},r={},o=i[0].morphTargetsRelative,l=new ii;let c=0;for(let h=0;h<i.length;++h){const u=i[h];let d=0;if(e!==(u.index!==null))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". All geometries must have compatible attributes; make sure index attribute exists among all geometries, or in none of them."),null;for(const f in u.attributes){if(!n.has(f))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+'. All geometries must have compatible attributes; make sure "'+f+'" attribute exists among all geometries, or in none of them.'),null;a[f]===void 0&&(a[f]=[]),a[f].push(u.attributes[f]),d++}if(d!==n.size)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". Make sure all geometries have the same number of attributes."),null;if(o!==u.morphTargetsRelative)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". .morphTargetsRelative must be consistent throughout all geometries."),null;for(const f in u.morphAttributes){if(!s.has(f))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+".  .morphAttributes must be consistent throughout all geometries."),null;r[f]===void 0&&(r[f]=[]),r[f].push(u.morphAttributes[f])}if(t){let f;if(e)f=u.index.count;else if(u.attributes.position!==void 0)f=u.attributes.position.count;else return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". The geometry must have either an index or a position attribute"),null;l.addGroup(c,f,h),c+=f}}if(e){let h=0;const u=[];for(let d=0;d<i.length;++d){const f=i[d].index;for(let g=0;g<f.count;++g)u.push(f.getX(g)+h);h+=i[d].attributes.position.count}l.setIndex(u)}for(const h in a){const u=Xl(a[h]);if(!u)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+h+" attribute."),null;l.setAttribute(h,u)}for(const h in r){const u=r[h][0].length;if(u===0)break;l.morphAttributes=l.morphAttributes||{},l.morphAttributes[h]=[];for(let d=0;d<u;++d){const f=[];for(let _=0;_<r[h].length;++_)f.push(r[h][_][d]);const g=Xl(f);if(!g)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+h+" morphAttribute."),null;l.morphAttributes[h].push(g)}}return l}function Xl(i){let t,e,n,s=-1,a=0;for(let c=0;c<i.length;++c){const h=i[c];if(t===void 0&&(t=h.array.constructor),t!==h.array.constructor)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.array must be of consistent array types across matching attributes."),null;if(e===void 0&&(e=h.itemSize),e!==h.itemSize)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.itemSize must be consistent across matching attributes."),null;if(n===void 0&&(n=h.normalized),n!==h.normalized)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.normalized must be consistent across matching attributes."),null;if(s===-1&&(s=h.gpuType),s!==h.gpuType)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.gpuType must be consistent across matching attributes."),null;a+=h.count*e}const r=new t(a),o=new ei(r,e,n);let l=0;for(let c=0;c<i.length;++c){const h=i[c];if(h.isInterleavedBufferAttribute){const u=l/e;for(let d=0,f=h.count;d<f;d++)for(let g=0;g<e;g++){const _=h.getComponent(d,g);o.setComponent(d+u,g,_)}}else r.set(h.array,l);l+=h.count*e}return s!==void 0&&(o.gpuType=s),o}const Xt=3,ge=3.6;let Di=[],Le=0,Ht=0;const go=new Set(["#","%","&","|","$"]),w0=new Set(["R","T","P","c","p","b","k","x","t","m","d","o","w","h"]),S0={T:1.3,P:.55,c:1,p:.55,b:.85,k:.9,x:1.1,t:.45,m:1.1,d:1.1,o:.9,w:.8,h:1.5},Xn=new Set,_o=new Set;function E0(i){const t=Math.max(...i.map(e=>e.length));Di=i.map(e=>e.padEnd(t,"#")),Le=Di.length,Ht=t,Xn.clear(),_o.clear()}function ke(i,t){return t<0||t>=Le||i<0||i>=Ht?"#":Di[t][i]}const cn=i=>i>="1"&&i<="9",$l=i=>go.has(i);function T0(i,t){t?Xn.add(i):Xn.delete(i)}const oa=i=>Xn.has(i);function A0(i,t){_o.add(t*Ht+i)}const Pc=(i,t)=>_o.has(t*Ht+i);function Ri(i,t){const e=ke(i,t);return e==="$"?!Pc(i,t):go.has(e)||w0.has(e)?!0:cn(e)?!Xn.has(e):!1}function R0(i,t){const e=ke(i,t);return e==="$"?!Pc(i,t):go.has(e)||e==="P"||e==="p"||e==="k"||e==="h"||e==="o"?!0:cn(e)?!Xn.has(e):!1}const ql=(i,t)=>{const e=ke(i,t);return e===","||e==="R"||e==="t"||e==="h"};function ve(i,t){return{x:(i+.5)*Xt,z:(t+.5)*Xt}}function Ze(i,t){return{col:Math.floor(i/Xt),row:Math.floor(t/Xt)}}function C0(i){for(let t=0;t<Le;t++){const e=Di[t].indexOf(i);if(e>=0)return{col:e,row:t}}return null}function bs(i,t){const{col:e,row:n}=Ze(i.x,i.z);for(let s=n-1;s<=n+1;s++)for(let a=e-1;a<=e+1;a++){if(!Ri(a,s))continue;const r=Xt/2-(S0[ke(a,s)]??Xt/2),o=a*Xt+r,l=(a+1)*Xt-r,c=s*Xt+r,h=(s+1)*Xt-r,u=Math.max(o,Math.min(i.x,l)),d=Math.max(c,Math.min(i.z,h)),f=i.x-u,g=i.z-d,_=f*f+g*g;if(!(_>=t*t))if(_>1e-8){const m=Math.sqrt(_);i.x+=f/m*(t-m),i.z+=g/m*(t-m)}else{const m=i.x-o,p=l-i.x,w=i.z-c,A=h-i.z,M=Math.min(m,p,w,A);M===m?i.x=o-t:M===p?i.x=l+t:M===w?i.z=c-t:i.z=h+t}}}class P0{dist=new Int16Array(0);sc=-1;sr=-1;dirty=!0;invalidate(){this.dirty=!0}update(t,e){if(this.dist.length!==Le*Ht&&(this.dist=new Int16Array(Le*Ht),this.dirty=!0),!this.dirty&&t===this.sc&&e===this.sr||(this.dirty=!1,this.sc=t,this.sr=e,this.dist.fill(-1),Ri(t,e)))return;const n=[e*Ht+t];this.dist[n[0]]=0;for(let s=0;s<n.length;s++){const a=n[s],r=a/Ht|0,o=a%Ht,l=this.dist[a]+1;o>0&&this.dist[a-1]===-1&&!Ri(o-1,r)&&(this.dist[a-1]=l,n.push(a-1)),o<Ht-1&&this.dist[a+1]===-1&&!Ri(o+1,r)&&(this.dist[a+1]=l,n.push(a+1)),r>0&&this.dist[a-Ht]===-1&&!Ri(o,r-1)&&(this.dist[a-Ht]=l,n.push(a-Ht)),r<Le-1&&this.dist[a+Ht]===-1&&!Ri(o,r+1)&&(this.dist[a+Ht]=l,n.push(a+Ht))}}distAt(t,e){return e<0||e>=Le||t<0||t>=Ht?-1:this.dist[e*Ht+t]}next(t,e){const{col:n,row:s}=Ze(t,e),a=this.distAt(n,s);if(a<=0)return null;let r=a,o=n,l=s;for(const[c,h]of[[1,0],[-1,0],[0,1],[0,-1]]){const u=this.distAt(n+c,s+h);u>=0&&u<r&&(r=u,o=n+c,l=s+h)}return o===n&&l===s?null:ve(o,l)}}function $n(i,t,e,n){const s=e-i,a=n-t,r=Math.ceil(Math.hypot(s,a)/(Xt*.2));for(let o=1;o<r;o++){const l=o/r,{col:c,row:h}=Ze(i+s*l,t+a*l);if(R0(c,h))return!1}return!0}const ir={red:16722464,blue:3112191,yellow:16760880};class L0{constructor(t,e){this.data=t,this.build();for(let n=0;n<e;n++){const s=new Mc(16777215,0,10,1.2);this.pool.push(s),this.group.add(s)}}data;group=new Ci;colliders=[];doors=new Map;secrets=new Map;pipes=[];anchors=[];pool=[];sky=null;exitMats=[];waterMat=null;time=0;animated=[];mat(t,e=16777215,n=.85,s=.05){return new ce({map:t,color:e,roughness:n,metalness:s})}build(){const t=this.data.theme,e=t.wallTint??16777215,n=new Map,s=(S,T=16777215,C=.85,x=.05)=>{const y=`${S}|${T}|${C}`;return n.has(y)||n.set(y,this.mat(b0(S),T,C,x)),n.get(y)},a=this.mat(Pi("tex:tank_wall")??fi("metal"),16777215,.3,.2);a.emissive=new Ft(4198416),a.emissiveMap=a.map;const r=(S,T)=>t.zones?.find(C=>S>=C.rect[0]&&S<=C.rect[2]&&T>=C.rect[1]&&T<=C.rect[3]),o=(S,T,C)=>{if(S==="|")return"tank";if(S==="&")return this.data.mural;if(S==="%")return t.wall2;for(const[x,y]of[[1,0],[-1,0],[0,1],[0,-1]]){const E=r(T+x,C+y);if(E?.wall&&!l(ke(T+x,C+y)))return E.wall}return r(T,C)?.wall??t.wall},l=S=>S==="#"||S==="%"||S==="&"||S==="|",c=S=>S==="tank"?a:S===this.data.mural?s(S,16777215,.6):s(S,e);this.waterMat=new ce({map:fi("water"),color:8956586,roughness:.1,metalness:.5});const h=new fe(Xt,ge,Xt),u=new Ge(Xt,Xt);u.rotateX(-Math.PI/2);const d=new Map,f=new Map,g=new Map,_=(S,T,C)=>{S.has(T)||S.set(T,[]),S.get(T).push(C)},m=[],p=[];for(let S=0;S<Le;S++)for(let T=0;T<Ht;T++){const C=Di[S][T],x=r(T,S);if(l(C)){let I=!1,N=!1;for(const[H,V]of[[1,0],[-1,0],[0,1],[0,-1]]){const q=ke(T+H,S+V);l(q)||(I=!0),ql(T+H,S+V)&&(N=!0)}I&&_(d,o(C,T,S),[T,S,N?2:1]);continue}if(C==="$"){const I=new Mt(h,c(o("#",T,S))),{x:N,z:H}=ve(T,S);I.position.set(N,ge/2,H),I.userData.dynamic=!0,I.material=I.material.clone(),this.group.add(I),this.colliders.push(I),this.secrets.set(S*Ht+T,I),_(f,x?.floor??t.floor,[T,S]),_(g,x?.ceiling??t.ceiling,[T,S]);continue}const y=C===","||C==="R"||C==="t"||C==="h";C==="~"&&m.push([T,S]),C==="X"&&p.push([T,S]);const E=C==="="?"p:rail":C==="~"?"~":y?x?.floor??t.floorOut:x?.floor??t.floor;_(f,E,[T,S]),ql(T,S)||_(g,x?.ceiling??t.ceiling,[T,S])}const w=new se;for(const[S,T]of d){const C=new rs(h,c(S),T.length);T.forEach(([x,y,E],I)=>{const{x:N,z:H}=ve(x,y);w.makeScale(1,E,1).setPosition(N,ge*E/2,H),C.setMatrixAt(I,w)}),C.castShadow=C.receiveShadow=!0,this.group.add(C),this.colliders.push(C)}for(const[S,T]of f){const C=S==="~"?this.waterMat:s(S,16777215,S==="p:rail"?.6:.75,S==="p:rail"?.3:.05),x=new rs(u,C,T.length);T.forEach(([y,E],I)=>{const{x:N,z:H}=ve(y,E);w.makeTranslation(N,S==="~"?.02:0,H),x.setMatrixAt(I,w)}),x.receiveShadow=!0,this.group.add(x),this.colliders.push(x)}const A=u.clone();A.rotateX(Math.PI);for(const[S,T]of g){const C=new rs(A,s(S,10066329,1),T.length);T.forEach(([x,y],E)=>{const{x:I,z:N}=ve(x,y);w.makeTranslation(I,ge,N),C.setMatrixAt(E,w)}),this.group.add(C),this.colliders.push(C)}const M=m,P=p;if(M.length){const S=new ce({color:1785920,transparent:!0,opacity:.45,roughness:.05,metalness:.6,depthWrite:!1}),T=new rs(u,S,M.length);M.forEach(([C,x],y)=>{const{x:E,z:I}=ve(C,x);w.makeTranslation(E,.75,I),T.setMatrixAt(y,w)}),T.userData.dynamic=!0,this.group.add(T)}for(const[S,T]of P){const{x:C,z:x}=ve(S,T),y=new ui({color:3211120,transparent:!0,opacity:.35,depthWrite:!1}),E=new Mt(new ho(.6,1.3,32),y);E.rotation.x=-Math.PI/2,E.position.set(C,.03,x),E.userData.dynamic=!0,this.exitMats.push(y),this.group.add(E);const I=this.textSprite("出口 EXIT","#40ff80");I.position.set(C,2.6,x),I.userData.dynamic=!0,this.group.add(I)}if(t.sky){const S=Pi(t.sky);if(S){const T=new Mt(new Xe(160,160,120,32,1,!0),new ui({map:S,side:Ve,fog:!1,color:12570591}));T.position.set(Ht*Xt/2,30,Le*Xt/2),T.userData.dynamic=!0,this.sky=T,this.group.add(T)}}if(t.water){const S=new Mt(new Ge(800,800),new ce({color:397326,roughness:.12,metalness:.7}));S.rotation.x=-Math.PI/2,S.position.set(Ht*Xt/2,-3,Le*Xt/2),S.userData.dynamic=!0,this.group.add(S)}this.buildDoors(),this.buildFurniture();for(const S of this.data.lights){const{x:T,z:C}=ve(S.at[0],S.at[1]);this.anchors.push({pos:new D(T,S.y??ge-.4,C),color:S.color,intensity:S.intensity,distance:14,flicker:S.flicker??0,phase:Math.random()*100})}this.mergeStatic()}textSprite(t,e){const n=document.createElement("canvas");n.width=256,n.height=64;const s=n.getContext("2d");s.fillStyle="rgba(0,0,0,0.6)",s.fillRect(0,0,256,64),s.strokeStyle=e,s.lineWidth=3,s.strokeRect(2,2,252,60),s.fillStyle=e,s.font="bold 30px sans-serif",s.textAlign="center",s.fillText(t,128,43);const a=new oo(n);a.colorSpace=Pe;const r=new cs(new In({map:a,fog:!1}));return r.scale.set(2,.5,1),r}buildDoors(){const t=fi("door");for(let e=0;e<Le;e++)for(let n=0;n<Ht;n++){const s=Di[e][n];if(!cn(s))continue;const a=this.data.doors.find(f=>f.id===s)??{id:s},r=f=>f==="#"||f==="%"||f==="&"||f==="|"||f==="$",l=r(ke(n-1,e))||r(ke(n+1,e))?new fe(Xt,ge,.3):new fe(.3,ge,Xt),c=new ce({map:t,roughness:.6,metalness:.4});a.key?(c.emissive=new Ft(ir[a.key]),c.emissiveIntensity=.25,c.color=new Ft(ir[a.key]).lerp(new Ft(16777215),.6)):a.flag&&(c.color=new Ft(9080726));const h=new Mt(l,c),{x:u,z:d}=ve(n,e);if(h.position.set(u,ge/2,d),h.castShadow=!0,h.userData.dynamic=!0,h.userData.door=s,this.group.add(h),this.colliders.push(h),a.key||a.label){const f=this.textSprite(a.label??{red:"红卡",blue:"蓝卡",yellow:"黄卡"}[a.key],a.key?`#${ir[a.key].toString(16).padStart(6,"0")}`:"#ddd");f.position.set(u,ge-.5,d),f.userData.dynamic=!0,h.add(f),f.position.set(0,ge/2-.5,0)}this.doors.set(s,{def:a,mesh:h,col:n,row:e,open:!1,t:0})}}setDoor(t,e){const n=this.doors.get(t);n&&(n.open=e,T0(t,e))}openSecretAt(t,e){const n=e*Ht+t,s=this.secrets.get(n);return s?(A0(t,e),s.userData.opening=!0,!0):!1}add(t,e=!0){return t.castShadow=!0,t.receiveShadow=!0,this.group.add(t),e&&this.colliders.push(t),t}buildFurniture(){const t=new ce({color:14209732,roughness:.95}),e=new ce({map:Pi("tex:wood_panel")??fi("lattice"),color:9071178,roughness:.7}),n=new ce({color:9278615,roughness:.3,metalness:.9}),s=new ce({color:5985360,roughness:.35}),a=new ce({map:fi("frost"),color:12572384,roughness:.4,metalness:.6}),r=new ce({map:fi("rust"),color:9075296,roughness:.9}),o=new ce({color:10132114,roughness:.4,metalness:.8}),l=new ce({color:8437936,transparent:!0,opacity:.25,roughness:.05,metalness:.3,depthWrite:!1}),c=new ce({color:1840914,roughness:1}),h=new ce({map:Pi("tex:village_wall")??fi("stone"),color:11184810,roughness:.9}),u=new ce({color:2236444,roughness:.9}),d=(()=>{try{return Fn("tank_body").tex}catch{return null}})();for(let f=0;f<Le;f++)for(let g=0;g<Ht;g++){const _=Di[f][g],{x:m,z:p}=ve(g,f);if(_==="T"){this.add(new Mt(new fe(2.6,.08,2.6),t)).position.set(m,.78,p),this.add(new Mt(new fe(2.5,.7,2.5),t)).position.set(m,.4,p);for(let w=0;w<6;w++)this.add(new Mt(new Xe(.16,.16,.02,10),n),!1).position.set(m+(Math.random()-.5)*2,.83,p+(Math.random()-.5)*2)}else if(_==="P")this.add(new Mt(new Xe(.5,.55,ge,12),s)).position.set(m,ge/2,p);else if(_==="c")this.add(new Mt(new fe(2,.95,2),n)).position.set(m,.475,p);else if(_==="p"){const w=this.add(new Mt(new Xe(.45,.45,ge,14),a));w.position.set(m,ge/2,p),w.userData.pipe=!0,w.userData.dynamic=!0,this.add(new Mt(new Ge(.5,.3),new ce({color:16763904,emissive:4465152})),!1).position.set(m,1.5,p+.47),this.pipes.push({col:g,row:f,mesh:w,burst:!1})}else if(_==="b")for(let w=0;w<3;w++){const A=.8+Math.random()*.5,M=this.add(new Mt(new fe(A,A,A),r));M.position.set(m+(Math.random()-.5)*.6,A/2+(w===2?.9:0),p+(Math.random()-.5)*.6),M.rotation.y=Math.random()}else if(_==="k"){this.add(new Mt(new Xe(.85,.85,.3,16),n)).position.set(m,.15,p),this.add(new Mt(new Xe(.85,.85,.3,16),n)).position.set(m,ge-.6,p);const w=new Mt(new Xe(.8,.8,ge-.9,16),new ce({color:4245664,emissive:801322,transparent:!0,opacity:.35,depthWrite:!1}));if(w.position.set(m,(ge-.6)/2+.15,p),this.add(w,!1),d){const M=new Mt(new Ge(.9,2.4),new ce({map:d,transparent:!0,alphaTest:.4,emissive:4198416,side:Qe}));M.position.set(m,1.45,p),M.userData.dynamic=!0,M.userData.billboard=!0,this.group.add(M),this.animated.push({obj:M,fn:P=>{M.position.y=1.45+Math.sin(P*.7+m)*.05}})}this.add(new Mt(new Xe(.88,.88,ge-.9,16,1,!0),l),!0).position.set(m,(ge-.6)/2+.15,p)}else if(_==="x"){this.add(new Mt(new fe(2,1,1.2),new ce({map:fi("temple"),roughness:.8}))).position.set(m,.5,p);for(let w=0;w<5;w++)this.add(new Mt(new Xe(.04,.04,.25,6),new ce({color:15658717,emissive:16755264,emissiveIntensity:.6})),!1).position.set(m-.8+w*.4,1.13,p+(Math.random()-.5)*.6)}else if(_==="t"){const w=this.add(new Mt(new Xe(.18,.35,5,7),c));w.position.set(m,2.5,p),w.rotation.z=(Math.random()-.5)*.2;for(let A=0;A<5;A++){const M=this.add(new Mt(new Xe(.03,.09,2.2,5),c),!1);M.position.set(m+(Math.random()-.5)*1.2,3.6+Math.random()*1.2,p+(Math.random()-.5)*1.2),M.rotation.set(Math.random()-.5,Math.random()*3,(Math.random()-.5)*1.8)}}else if(_==="m")this.add(new Mt(new fe(1.8,1.1,2.4),r)).position.set(m,.75,p);else if(_==="d")this.add(new Mt(new fe(2,.5,2.2),e)).position.set(m,.25,p),this.add(new Mt(new fe(1.9,.12,2.1),t),!1).position.set(m,.56,p);else if(_==="o")this.add(new Mt(new fe(1.6,2.4,1.6),e)).position.set(m,1.2,p);else if(_==="w"){this.add(new Mt(new fe(1.2,1,.6),e)).position.set(m,.5,p);const w=new Ci;w.add(new Mt(new uo(.45,.04,6,20),e));for(let A=0;A<4;A++){const M=new Mt(new fe(1.1,.04,.04),e);M.rotation.z=A*Math.PI/4,w.add(M)}w.position.set(m,1.35,p-.35),w.userData.dynamic=!0,this.group.add(w),this.animated.push({obj:w,fn:()=>{w.rotation.z+=.01}})}else if(_==="h"){this.add(new Mt(new fe(3,3.4,3),h)).position.set(m,1.7,p);const w=this.add(new Mt(new co(2.4,1.4,4),u),!1);w.position.set(m,4.1,p),w.rotation.y=Math.PI/4}else if(_==="R")for(const[w,A]of[[1,0],[-1,0],[0,1],[0,-1]]){const M=ke(g+w,f+A);if(!(M==="R"||M==="#"||M==="%"))for(const P of[.5,1.05])this.add(new Mt(new fe(w?.06:Xt,.06,w?Xt:.06),o),!1).position.set(m+w*(Xt/2-.05),P,p+A*(Xt/2-.05))}}}mergeStatic(){this.group.updateMatrixWorld(!0);const t=new Set(this.colliders),e=new Map,n=[],s=r=>{if(!r.userData.dynamic){if(r instanceof Mt&&!(r instanceof rs)&&!Array.isArray(r.material)){const o=t.has(r),l=`${r.material.uuid}|${o}`;let c=e.get(l);c||e.set(l,c={mat:r.material,geos:[],collide:o});const h=r.geometry.index?r.geometry.toNonIndexed():r.geometry.clone();h.applyMatrix4(r.matrixWorld);for(const u of Object.keys(h.attributes))["position","normal","uv"].includes(u)||h.deleteAttribute(u);c.geos.push(h),n.push(r)}for(const o of[...r.children])s(o)}};for(const r of[...this.group.children])s(r);for(const r of n)r.removeFromParent();const a=new Set(n);this.colliders=this.colliders.filter(r=>!a.has(r));for(const r of e.values()){const o=M0(r.geos,!1);if(!o)continue;const l=new Mt(o,r.mat);l.castShadow=!0,l.receiveShadow=!0,this.group.add(l),r.collide&&this.colliders.push(l)}}update(t,e,n){this.time+=t;const s=this.anchors.map(a=>({a,d:a.pos.distanceToSquared(e)})).sort((a,r)=>a.d-r.d);this.pool.forEach((a,r)=>{const o=s[r];if(!o){a.intensity=0;return}const l=o.a;a.position.copy(l.pos),a.color.setHex(l.color),a.distance=l.distance;let c=1;if(l.flicker>=2)c=Math.sin(this.time*2+l.phase)>0?1:.05;else if(l.flicker>0){const h=this.time*8+l.phase;Math.sin(h)*Math.sin(h*2.31)*Math.sin(h*.37)>.6-l.flicker*.4&&(c=.15)}a.intensity=l.intensity*c*3});for(const a of this.doors.values()){const r=a.open?1:0;a.t!==r&&(a.t=Math.max(0,Math.min(1,a.t+Math.sign(r-a.t)*t*1.2)),a.mesh.position.y=ge/2+a.t*(ge-.25))}for(const a of this.secrets.values())a.userData.opening&&a.position.y<ge*1.5&&(a.position.y+=t*2.5);for(const a of this.animated)a.fn(this.time),a.obj.userData.billboard&&(a.obj.rotation.y=Math.atan2(n.x-a.obj.position.x,n.z-a.obj.position.z));for(const a of this.exitMats)a.opacity=.25+Math.sin(this.time*4)*.15;this.waterMat?.map&&this.waterMat.map.offset.set(this.time*.02,this.time*.013),this.sky&&this.sky.position.set(n.x,30,n.z)}dispose(){this.group.traverse(t=>{t instanceof Mt&&t.geometry.dispose()})}}const D0={guest:{name:"宾客蛊化者",sprites:["infected"],h:1.82,hp:70,speed:2,dmg:10,reach:1.5,windup:.5,cd:1.1,headFrac:.14,headMult:3,armor:1,bright:1.15,radius:.4,score:100},gu:{name:"蛊化者",sprites:["infected","infected","water_gu"],h:1.9,hp:90,speed:2.3,dmg:12,reach:1.5,windup:.5,cd:1.1,headFrac:.15,headMult:3,armor:1,bright:1.3,radius:.4,score:100},water:{name:"水蛊",sprites:["water_gu"],h:1.8,hp:80,speed:3,dmg:10,reach:1.6,windup:.4,cd:1,headFrac:.15,headMult:3,armor:1,tint:10479871,bright:1.2,radius:.4,score:120},ore:{name:"矿蛊",sprites:["miner"],h:2,hp:160,speed:1.9,dmg:18,reach:1.6,windup:.6,cd:1.3,headFrac:.14,headMult:1.5,armor:.08,bright:1.3,radius:.5,score:250},nuo:{name:"傩面者",sprites:["nuo_mask"],h:1.85,hp:80,speed:1.2,dmg:14,reach:1.5,windup:.4,cd:.9,headFrac:.18,headMult:3,armor:1,bright:1.3,radius:.4,passive:!0,score:150},cultist:{name:"无名会武装",sprites:["zhong"],h:1.8,hp:60,speed:2.4,dmg:8,reach:1.4,windup:.4,cd:1,headFrac:.14,headMult:3,armor:1,tint:11563120,bright:1.1,radius:.35,ranged:{proj:"proj_red",dmg:8,speed:16,cd:1.6,range:20,keep:7},score:150},guard:{name:"百慧保安",sprites:["zhong"],h:1.8,hp:60,speed:2.4,dmg:8,reach:1.4,windup:.4,cd:1,headFrac:.14,headMult:3,armor:1,tint:9083562,bright:.9,radius:.35,ranged:{proj:"proj_red",dmg:7,speed:16,cd:1.8,range:18,keep:6},score:120},butcher:{name:"屠夫 · 蛊化厨师",sprites:["butcher"],h:2.9,hp:1200,speed:2.4,dmg:26,reach:2.4,windup:.8,cd:1.4,headFrac:.14,headMult:1,armor:.2,weak:[[.35,.45,.75,.75]],weakMult:1.2,bright:1.25,radius:.85,boss:!0,charge:!0,score:3e3},bride:{name:"腐妆新娘",sprites:["bride2"],h:2.9,hp:1100,speed:2.6,dmg:22,reach:2.6,windup:.9,cd:1.3,headFrac:.15,headMult:1,armor:.15,weak:[[.42,.66,.62,.8]],weakMult:3,bright:1.2,radius:.7,boss:!0,ranged:{proj:"proj_bug",dmg:10,speed:9,cd:2.6,range:25},score:3500},mandrill:{name:"山魈",sprites:["mandrill"],h:3.1,hp:1400,speed:3.2,dmg:28,reach:2.6,windup:.7,cd:1.3,headFrac:.15,headMult:1,armor:.3,weak:[[.15,0,.85,.16]],weakMult:2.5,bright:1.25,radius:.9,boss:!0,charge:!0,ranged:{proj:"proj_rock",dmg:18,speed:13,cd:3.2,range:30},score:4e3},steelbone:{name:"钢骨",sprites:["steelbone"],h:2.9,hp:1500,speed:2.2,dmg:30,reach:2.6,windup:.9,cd:1.6,headFrac:.12,headMult:1,armor:.1,weak:[[.3,.42,.6,.72]],weakMult:2.5,bright:1.25,radius:1,boss:!0,charge:!0,score:4500},xu:{name:"异化许怀远",sprites:["xu"],h:2.3,hp:1300,speed:2.8,dmg:20,reach:2.2,windup:.6,cd:1.1,headFrac:.15,headMult:1.5,armor:.35,weak:[[.55,.45,.95,.85]],weakMult:2.2,bright:1.2,radius:.6,boss:!0,ranged:{proj:"proj_red",dmg:12,speed:18,cd:1.4,range:26,keep:6},score:5e3},mother:{name:"蛊母 · 苏明远",sprites:["coffin"],h:3.6,hp:2200,speed:0,dmg:20,reach:4.5,windup:1,cd:2.2,headFrac:0,headMult:1,armor:.05,weak:[[.35,.35,.65,.7]],weakMult:4,bright:1.3,radius:2.4,boss:!0,ranged:{proj:"proj_bug",dmg:12,speed:10,cd:2,range:30},score:8e3},noh_gun:{name:"能面众枪手",sprites:["noh_gun"],h:1.8,hp:55,speed:2.3,dmg:8,reach:1.4,windup:.4,cd:1,headFrac:.15,headMult:3,armor:1,bright:1.5,radius:.35,human:!0,ranged:{proj:"proj_red",dmg:9,speed:18,cd:1.5,range:22,keep:7},anim:{walk:["noh_gun_w1","noh_gun_w2"],hurt:"noh_gun_hit",dead:"noh_dead"},score:150},noh_blade:{name:"能面众剑手",sprites:["noh_blade"],h:1.8,hp:75,speed:3,dmg:14,reach:1.7,windup:.45,cd:1,headFrac:.15,headMult:3,armor:1,bright:1.5,radius:.38,human:!0,anim:{walk:["noh_blade_w","noh_blade"],attack:"noh_blade_atk",dead:"noh_dead"},score:150},dannu:{name:"丹奴",sprites:["water_gu"],h:1.85,hp:90,speed:1.5,dmg:16,reach:1.5,windup:.6,cd:1.3,headFrac:.16,headMult:4,armor:.5,tint:15119528,bright:1.15,radius:.4,revive:3.2,score:150},tsuchigumo:{name:"能面众 · 土蜘蛛",sprites:["tsuchigumo"],h:2.3,hp:1500,speed:2.7,dmg:20,reach:2.3,windup:.6,cd:1.2,headFrac:.13,headMult:2,armor:.45,bright:1.7,radius:.7,boss:!0,human:!0,charge:!0,anim:{walk:["tsuchigumo_w","tsuchigumo"],attack:"tsuchigumo_atk",dead:"tsuchigumo_dead"},score:4e3},specimen:{name:"棺中之物 · 丹字班试验体",sprites:["mandrill"],h:3,hp:1800,speed:1.4,dmg:26,reach:2.6,windup:.9,cd:1.6,headFrac:.15,headMult:1,armor:.25,weak:[[.15,0,.85,.16]],weakMult:2.5,tint:14203056,bright:1.1,radius:.9,boss:!0,ranged:{proj:"proj_bug",dmg:10,speed:9,cd:2.8,range:24},score:6e3},anchor:{name:"菌丝锚点",sprites:["coffin"],h:2.2,hp:260,speed:0,dmg:0,reach:0,windup:1,cd:9,headFrac:0,headMult:1,armor:1,tint:16736352,bright:1.6,radius:.8,score:300}},I0=(()=>{const i=new Ge(1,1);return i.translate(0,.5,0),i})();class U0{kind;group=new Ci;mesh;mat;shadow;info;pos;spawn;yaw=0;hp;maxHp;state;stateT=0;speed;height;tag="";justDied=!1;invulnerable=!1;vulnerable=!1;weakVisible=!1;enraged=!1;frozenT=0;freezeBuild=0;charmT=0;behavior=null;interrupt=null;killCounted=!1;justHurt=!1;reviveAt=0;baseSprite="";curSprite="";onDamaged=null;walkT=Math.random()*10;attackCd=0;rangedCd=2+Math.random()*2;chargeCd=5;chargeDir=new D;flashT=0;groanT=2+Math.random()*5;deathT=0;flip=1;lastX=0;awakeRadius=14;stuck=0;slot=Math.random()*Math.PI*2;strafeDir=Math.random()<.5?-1:1;strafeT=0;lungeCd=1+Math.random()*2;lungeT=0;dodgeCd=0;dodgeT=0;unstickT=0;alertTo=null;constructor(t,e,n,s,a="idle",r=1){this.kind=D0[t];const o=this.kind;this.baseSprite=this.curSprite=o.sprites[Math.random()*o.sprites.length|0],this.info=Fn(this.baseSprite),this.height=o.h*r*(o.boss?1:.94+Math.random()*.12),this.maxHp=this.hp=o.hp,this.speed=o.speed*(o.boss?1.1:(.85+Math.random()*.3)*1.22),this.state=a,this.pos=new D(e,0,n),this.spawn=this.pos.clone(),this.yaw=s,this.mat=new ce({map:this.info.tex,alphaTest:.45,side:Qe,roughness:.85,metalness:0,emissive:0});const l=o.bright??1,c=new Ft(o.tint??16777215);this.mat.color.setRGB(c.r*l,c.g*l,c.b*l),this.mesh=new Mt(I0,this.mat),this.mesh.scale.set(this.height*this.info.aspect,this.height,1),this.mesh.userData.enemy=this,this.group.add(this.mesh),this.shadow=new Mt(new Ge(1,1),new ui({map:Bi("shadow"),transparent:!0,depthWrite:!1})),this.shadow.rotation.x=-Math.PI/2,this.shadow.position.y=.02,this.shadow.scale.set(this.height*.5,this.height*.3,1),this.group.add(this.shadow),this.group.position.copy(this.pos),this.lastX=e}get alive(){return this.state!=="dead"}get name(){return this.kind.name}setSprite(t){this.info=Fn(t),this.mat.map=this.info.tex,this.mat.needsUpdate=!0,this.mesh.scale.set(this.height*this.info.aspect*Math.sign(this.mesh.scale.x||1),this.height,1)}center(){return new D(this.pos.x,this.height*.6,this.pos.z)}headPos(){return new D(this.pos.x,this.height*(1-this.kind.headFrac/2),this.pos.z)}hitTest(t,e){if(!this.alive)return null;this.mesh.updateMatrixWorld();const n=this.mesh.matrixWorld.clone().invert(),s=t.clone().applyMatrix4(n),r=t.clone().add(e).applyMatrix4(n).sub(s);if(Math.abs(r.z)<1e-6)return null;const o=-s.z/r.z;if(o<=0)return null;const l=s.x+r.x*o,c=s.y+r.y*o,h=l+.5,u=c;if(h<0||h>1||u<0||u>1)return null;const d=this.info.mask,f=Math.min(d.w-1,Math.floor(h*d.w)),g=Math.min(d.h-1,Math.floor((1-u)*d.h));let _=!1;for(let w=-1;w<=1&&!_;w++)for(let A=-1;A<=1&&!_;A++){const M=f+A,P=g+w;M>=0&&P>=0&&M<d.w&&P<d.h&&d.data[P*d.w+M]>90&&(_=!0)}if(!_)return null;let m="body";const p=this.mesh.scale.x<0?1-h:h;return this.kind.weak?.some(([w,A,M,P])=>p>=w&&p<=M&&u>=A&&u<=P)?m="weak":u>1-this.kind.headFrac&&(m="head"),{dist:o,part:m,point:t.clone().addScaledVector(e,o)}}alert(t,e){!this.alive||this.kind.passive&&!this.enraged||((this.state==="dormant"||this.state==="idle")&&this.awaken(),this.alertTo={x:t,z:e})}awaken(){(this.state==="dormant"||this.state==="idle")&&(this.state="awaken",this.stateT=0,X.groan({x:this.pos.x,y:1.6,z:this.pos.z},this.kind.boss?.5:1,.7))}damage(t,e,n={}){if(!this.alive||this.invulnerable)return 0;const s=this.kind;let a=e==="head"?s.headMult:e==="weak"?s.weakMult??2:1,r=s.armor;(this.vulnerable||this.state==="frozen"||n.electric&&s.name==="矿蛊"||this.state==="stunned"&&s.boss)&&(r=Math.max(r,s.boss?.8:1)),s.name==="矿蛊"&&(n.cryo||n.electric)&&(r=1.2),e!=="weak"?a*=r:s.boss&&!this.weakVisible&&!this.vulnerable&&this.state!=="stunned"&&this.state!=="frozen"&&(a*=.5);const o=t*a;return this.hp-=o,this.flashT=.09,X.hitFlesh({x:this.pos.x,y:1.4,z:this.pos.z}),this.kind.passive&&!this.enraged&&(this.enraged=!0,this.speed=3.6,X.roar({x:this.pos.x,y:1.6,z:this.pos.z})),(this.state==="dormant"||this.state==="idle")&&this.awaken(),this.justHurt=!0,!s.boss&&this.state==="chase"&&Math.random()<.15&&(this.state="stunned",this.stateT=.3),n.cryo&&(this.freezeBuild+=s.boss?.2:.45,this.freezeBuild>=1&&(this.freeze(s.boss?2.5:4),this.freezeBuild=0)),this.onDamaged?.(this,o,e),this.hp<=0&&(this.reviveAt=s.revive&&!(e==="head"||n.melee||n.fire)?s.revive:0,this.die()),o}finish(){this.reviveAt=0}get downed(){return this.state==="dead"&&this.reviveAt>0}freeze(t){this.alive&&(this.state="frozen",this.frozenT=t)}die(){this.state!=="dead"&&(this.state="dead",this.deathT=0,this.justDied=!0,this.mat.transparent=!0,X.groan({x:this.pos.x,y:1.2,z:this.pos.z},this.kind.boss?.4:.8,.6))}stun(t){!this.alive||this.state==="dormant"||this.state==="frozen"||(this.state="stunned",this.stateT=t)}flee(t){!this.alive||this.kind.boss||this.state==="dormant"||(this.state="flee",this.stateT=t)}reset(){this.alive&&(this.pos.copy(this.spawn),this.hp=this.maxHp,this.state!=="dormant"&&(this.state="idle"),this.enraged=!1,this.frozenT=0)}update(t,e){const n=this.kind;if(this.group.rotation.y=Math.atan2(e.camPos.x-this.pos.x,e.camPos.z-this.pos.z),this.flashT-=t,this.flashT>0?this.mat.emissive.setRGB(.7,.1,.05):this.state==="frozen"?this.mat.emissive.setRGB(.15,.35,.5):e.scanning?this.mat.emissive.setRGB(n.boss?.45:.3,.04,.02):this.charmT>0?this.mat.emissive.setRGB(.25,.2,.02):this.mat.emissive.setRGB(0,0,0),this.state==="dead"){if(this.deathT+=t,this.reviveAt>0){this.mesh.rotation.x=-1.35+Math.max(0,this.deathT-this.reviveAt+.8)*1.6,this.mesh.position.y=0,this.mat.opacity=1,this.group.position.set(this.pos.x,0,this.pos.z),this.deathT>this.reviveAt&&(this.reviveAt=0,this.state="awaken",this.stateT=.4,this.hp=this.maxHp*.5,this.mat.transparent=!1,this.mesh.rotation.x=0,this.shadow.visible=!0,X.roar({x:this.pos.x,y:1.6,z:this.pos.z}));return}if(this.kind.anim?.dead){this.useSprite(this.kind.anim.dead),this.mesh.rotation.set(0,0,0),this.mesh.scale.set(this.height*.9*this.info.aspect*.42,this.height*.42,1),this.mesh.position.set(0,0,0),this.deathT>6&&(this.mat.opacity=Math.max(0,1-(this.deathT-6)*.5)),this.shadow.visible=!1,this.group.position.set(this.pos.x,0,this.pos.z);return}const h=Math.min(1,this.deathT*1.6);this.mesh.rotation.x=-h*1.35,this.mesh.position.y=-h*.1,this.deathT>3&&(this.mat.opacity=Math.max(0,1-(this.deathT-3)*.5)),this.shadow.visible=!1,this.group.position.set(this.pos.x,0,this.pos.z);return}const s=e.playerPos,a=s.x-this.pos.x,r=s.z-this.pos.z,o=Math.hypot(a,r);this.attackCd-=t,this.rangedCd-=t,this.stateT-=t,this.charmT>0&&(this.charmT-=t),e.isElectrified(this.pos.x,this.pos.z)&&this.state!=="stunned"&&(this.damage(n.boss?15:60*t+2,"body",{electric:!0}),this.stun(n.boss?1.5:2.5));let l=0,c=null;if(!(this.behavior&&this.behavior(this,t)))switch(this.state){case"dormant":o<1.8&&this.awaken();break;case"idle":o<this.awakeRadius&&$n(this.pos.x,this.pos.z,s.x,s.z)&&this.awaken();break;case"awaken":this.stateT+=t*2,this.stateT>1.1&&(this.state="chase",this.stateT=0);break;case"frozen":this.frozenT-=t,this.frozenT<=0&&(this.state="chase");break;case"stunned":this.stateT<=0&&(this.state="chase");break;case"flee":c={x:this.pos.x-a,z:this.pos.z-r},l=this.speed,this.stateT<=0&&(this.state="chase");break;case"chase":{if(n.passive&&!this.enraged){this.walkT+=t*.3,c={x:this.spawn.x+Math.sin(this.walkT)*2,z:this.spawn.z+Math.cos(this.walkT*.7)*2},l=this.speed*.5;break}const h=$n(this.pos.x,this.pos.z,s.x,s.z);h&&(this.alertTo=null);const u=!n.boss&&n.speed>0;if(this.lungeCd-=t,this.dodgeCd-=t,this.strafeT-=t,this.strafeT<=0&&(this.strafeT=1.2+Math.random()*1.6,Math.random()<.6&&(this.strafeDir*=-1)),u&&n.human&&this.dodgeCd<=0&&e.aimingAt(this)&&Math.random()<.45&&(this.dodgeCd=2.2,this.dodgeT=.32),this.dodgeT>0){this.dodgeT-=t;const m=o||1;c={x:this.pos.x+-r/m*this.strafeDir*3,z:this.pos.z+a/m*this.strafeDir*3},l=this.speed*2.6;break}if(this.lungeT>0){this.lungeT-=t,c={x:s.x,z:s.z},l=this.speed*2.7,o<n.reach&&this.attackCd<=0&&(this.state="attack",this.stateT=n.windup*.5,this.lungeT=0);break}if(u&&!n.ranged&&h&&this.lungeCd<=0&&o>n.reach&&o<4.5){this.lungeT=.45,this.lungeCd=3+Math.random()*2,X.groan({x:this.pos.x,y:1.6,z:this.pos.z},1.2,.9);break}if(this.unstickT>0){this.unstickT-=t;const m=o||1;c={x:this.pos.x+-r/m*this.strafeDir*2+a/m,z:this.pos.z+a/m*this.strafeDir*2+r/m},l=this.speed;break}if(this.stuck>.7&&(this.stuck=0,this.unstickT=.6,this.strafeDir*=-1),o<n.reach&&this.attackCd<=0&&n.dmg>0){this.state="attack",this.stateT=n.windup;break}if(n.charge&&(this.chargeCd-=t,this.chargeCd<=0&&o>5&&o<24&&h)){this.state="windup",this.stateT=1,X.roar({x:this.pos.x,y:2,z:this.pos.z});break}if(n.ranged&&this.rangedCd<=0&&h&&o<n.ranged.range&&o>2.5){this.rangedCd=n.ranged.cd*(.8+Math.random()*.5);const m=new D(this.pos.x,this.height*.65,this.pos.z),p=o/n.ranged.speed*(.5+Math.random()*.5);e.spawnProjectile(m,new D(s.x+e.playerVel.x*p,1.2,s.z+e.playerVel.z*p),n.ranged.proj,n.ranged.dmg,n.ranged.speed,this),this.flashT=.05}const d=n.ranged?.keep??0,f=o||1,g=-r/f,_=a/f;if(d&&h&&o<d)c={x:this.pos.x-a+g*this.strafeDir*3,z:this.pos.z-r+_*this.strafeDir*3},l=this.speed*.8;else if(u&&n.ranged&&h&&o<n.ranged.range*.85)c={x:this.pos.x+g*this.strafeDir*2+(o>d+4?a/f:0),z:this.pos.z+_*this.strafeDir*2+(o>d+4?r/f:0)},l=this.speed*.65;else if(o>n.reach*.8&&n.speed>0)if(l=this.speed,!h&&this.alertTo&&Math.hypot(this.alertTo.x-this.pos.x,this.alertTo.z-this.pos.z)>1.5)c=e.flow.next(this.pos.x,this.pos.z)??this.alertTo;else if(o<6&&h){const m=u?1.4:0;c={x:s.x+Math.cos(this.slot)*m,z:s.z+Math.sin(this.slot)*m}}else if(u&&h&&o<16){const m=Math.sin(this.walkT*.9+this.slot)*2.2;c={x:s.x+g*m,z:s.z+_*m}}else c=e.flow.next(this.pos.x,this.pos.z)??{x:s.x,z:s.z};break}case"attack":this.stateT<=0&&(o<n.reach+.4&&e.damagePlayer(n.dmg,this.pos,n.name),this.state="chase",this.attackCd=n.cd);break;case"windup":this.stateT<=0&&(this.state="charge",this.stateT=2,this.chargeDir.set(a,0,r).normalize());break;case"charge":{const h=this.pos.clone();if(this.pos.addScaledVector(this.chargeDir,11*t),bs(this.pos,n.radius),o<n.radius+1){e.damagePlayer(n.dmg+8,this.pos,n.name),this.state="chase",this.chargeCd=7;break}if(e.onChargeHit(this)){this.chargeCd=8;break}(h.distanceTo(this.pos)<11*t*.4||this.stateT<=0)&&(this.state="stunned",this.stateT=1.6,this.chargeCd=7,X.impact());break}}if(c&&l>0){const h=c.x-this.pos.x,u=c.z-this.pos.z,d=Math.hypot(h,u)||1,f=this.pos.clone();this.pos.x+=h/d*l*t,this.pos.z+=u/d*l*t,bs(this.pos,n.radius),f.distanceTo(this.pos)<l*t*.2?this.stuck+=t:this.stuck=0}this.animate(t,l,e),this.groanT-=t,this.groanT<=0&&o<22&&this.state!=="dormant"&&!(n.passive&&!this.enraged)&&(this.groanT=3+Math.random()*6,X.groan({x:this.pos.x,y:1.6,z:this.pos.z},n.boss?.55:.9+Math.random()*.3,n.boss?.8:.4)),this.group.position.set(this.pos.x,0,this.pos.z)}useSprite(t){t!==this.curSprite&&(this.curSprite=t,this.info=Fn(t),this.mat.map=this.info.tex,this.mat.needsUpdate=!0)}animate(t,e,n){const s=this.kind;if(s.anim){let f=this.baseSprite;this.state==="attack"||this.state==="windup"||this.state==="charge"?f=s.anim.attack??f:this.flashT>0&&s.anim.hurt||this.state==="stunned"&&s.anim.hurt?f=s.anim.hurt:e>0&&s.anim.walk&&(f=s.anim.walk[Math.floor(this.walkT*1.2)%s.anim.walk.length]),this.useSprite(f)}const a=Math.cos(this.group.rotation.y);-Math.sin(this.group.rotation.y);const r=this.pos.x-this.lastX;this.lastX=this.pos.x,Math.abs(r*a)>.001&&(this.flip=r*a<0?-1:1);let l=this.height*this.info.aspect*this.flip,c=this.height,h=0,u=0,d=0;if(this.state!=="frozen")if(this.state==="dormant")c*=1+Math.sin(this.walkT)*.005,this.walkT+=t;else{this.walkT+=t*(e>0?2+e*2.2:1.2);const f=Math.sin(this.walkT);if(u=e>0?Math.abs(f)*.05*this.height:0,h=f*(e>0?.05:.02),c*=1+Math.cos(this.walkT*2)*(e>0?.02:.01),this.state==="attack"){const g=1-Math.max(0,this.stateT)/s.windup;d=Math.sin(g*Math.PI)*.5,c*=1+Math.sin(g*Math.PI)*.06,h=-.08}else this.state==="windup"?(c*=1.06,h=Math.sin(this.walkT*8)*.04):this.state==="charge"?(h=.15,d=.3):this.state==="stunned"?h=Math.sin(this.walkT*7)*.12:this.state==="awaken"&&(h=Math.sin(this.walkT*9)*.08)}this.mesh.scale.set(l,c,1),this.mesh.rotation.set(0,0,h),this.mesh.position.set(0,u,d)}cell(){return Ze(this.pos.x,this.pos.z)}}const k0=(()=>{const i=new Ge(1,1);return i.translate(0,.5,0),i})(),N0={lin:1.8,zhou:1.78,su:1.68,man:1.25,chen:1.75,apo:1.5,xu:1.8,zhong:1.72,tang:1.8,civ1:1.15,civ2:1.15};class F0{constructor(t,e,n){this.id=t,this.info=Fn(t),this.h=N0[t]??1.75,this.pos=new D(e,0,n),this.mat=new ce({map:this.info.tex,alphaTest:.45,side:Qe,roughness:.85}),this.mat.color.setScalar(t==="su"?1.05:1.25),this.mesh=new Mt(k0,this.mat),this.mesh.scale.set(this.h*this.info.aspect,this.h,1),this.group.add(this.mesh);const s=new Mt(new Ge(1,1),new ui({map:Bi("shadow"),transparent:!0,depthWrite:!1}));s.rotation.x=-Math.PI/2,s.position.y=.02,s.scale.set(this.h*.45,this.h*.28,1),this.group.add(s),this.group.position.copy(this.pos)}id;group=new Ci;mesh;info;pos;following=!1;followDist=2.4;ringT=0;walkT=Math.random()*5;h;mat;update(t,e,n,s,a){const r=a??e,o=r.x-this.pos.x,l=r.z-this.pos.z,c=Math.hypot(o,l);let h=0;if(this.following){if(c>16&&!$n(this.pos.x,this.pos.z,e.x,e.z)){const d=s.next(e.x,e.z);this.pos.set(d?d.x:e.x,0,d?d.z:e.z)}else if(c>this.followDist){h=Math.min(6.5,2+(c-this.followDist)*1.6);let d={x:r.x,z:r.z};$n(this.pos.x,this.pos.z,r.x,r.z)||(d=s.next(this.pos.x,this.pos.z)??d);const f=d.x-this.pos.x,g=d.z-this.pos.z,_=Math.hypot(f,g)||1;this.pos.x+=f/_*h*t,this.pos.z+=g/_*h*t,bs(this.pos,.3)}}this.walkT+=t*(h>0?2+h*2:1);const u=Math.sin(this.walkT);this.group.rotation.y=Math.atan2(n.x-this.pos.x,n.z-this.pos.z),this.mesh.position.y=h>0?Math.abs(u)*.06:0,this.mesh.rotation.z=h>0?u*.04:Math.sin(this.walkT*.5)*.01,this.ringT>0?(this.ringT-=t,this.mesh.rotation.z=Math.sin(this.ringT*40)*.08,this.mat.emissive.setRGB(.3,.22,.05)):this.mat.emissive.setRGB(0,0,0),this.group.position.copy(this.pos)}}const la={pistol:{id:"pistol",name:"制式手枪",img:"w_pistol2",dmg:24,rate:.32,mag:12,auto:!1,spread:.012,ammo:"ammo",reload:1.5,w:.3,right:.2,bottom:-.08,muzzle:[.2,.08],slot:1},mg:{id:"mg",name:"老周的重机枪",img:"w_mg",dmg:15,rate:.09,mag:60,auto:!0,spread:.035,ammo:"mg_ammo",reload:2.6,w:.46,right:.18,bottom:-.06,muzzle:[.12,.2],slot:2},cryo:{id:"cryo",name:"苏晚的冷凝枪",img:"w_cryo2",dmg:14,rate:.55,mag:6,auto:!1,spread:.01,ammo:"cryo_ammo",reload:2,w:.48,right:.1,bottom:-.1,muzzle:[.04,.06],slot:3}},O0={pistol:{id:"pistol",name:"二代双枪",img:"wt_pistol_r",dual:"wt_pistol_l",dmg:22,rate:.2,mag:16,auto:!1,spread:.014,ammo:"ammo",reload:1.7,w:.24,right:.12,bottom:-.1,muzzle:[.3,.06],slot:1},mg:{id:"mg",name:"短管霰弹枪",img:"wt_shotgun",frames:["wt_sg1","wt_sg2"],pellets:8,dmg:13,rate:.85,mag:6,auto:!1,spread:.07,ammo:"mg_ammo",reload:2.4,w:.38,right:.1,bottom:-.15,muzzle:[.08,.05],slot:2},cryo:{id:"cryo",name:"赤霄",img:"wt_sword",frames:["wt_sw0","wt_sw1","wt_sw2"],melee:!0,dmg:75,rate:.55,mag:1,auto:!0,spread:0,ammo:"cryo_ammo",reload:0,w:.34,right:.06,bottom:-.12,muzzle:[.1,.1],slot:3}},Ce={pistol:{...la.pistol},mg:{...la.mg},cryo:{...la.cryo}};let zi="default";function z0(i){zi=i;const t=i==="tang"?O0:la;for(const e of Object.keys(Ce)){for(const n of Object.keys(Ce[e]))delete Ce[e][n];Object.assign(Ce[e],t[e])}}class B0{el=document.getElementById("weapon");img=document.createElement("img");img2=document.createElement("img");flash=document.createElement("div");bell=document.createElement("img");def=Ce.pistol;bobT=0;recoil=0;lower=0;swapTo=null;flashT=0;bellT=0;frameT=-1;side=0;recoil2=0;reloading=0;constructor(){this.img.className="wpn",this.img2.className="wpn left",this.flash.className="muzzle",this.bell.className="bell-hand",this.bell.src=Qs("h_bell_b"),this.el.append(this.bell,this.img2,this.img,this.flash),this.set(Ce.pistol)}set(t){this.def={...t},this.frameT=-1,this.img.src=Qs(t.img),this.img.style.width=`${t.w*100}vw`,t.id==="pistol"?this.img.style.maxWidth=t.dual?"46vh":"58vh":this.img.style.maxWidth="90vh",this.img2.style.display=t.dual?"":"none",t.dual&&(this.img2.src=Qs(t.dual),this.img2.style.width=this.img.style.width,this.img2.style.maxWidth=this.img.style.maxWidth)}refresh(t){this.swapTo=null,this.set(t)}swap(t){t.id===this.def.id&&!this.swapTo||(this.swapTo=t)}kick(){this.def.dual?(this.side^=1,this.side?this.recoil2=1:this.recoil=1):this.recoil=1,this.def.melee||(this.flashT=.06),this.def.frames&&(this.frameT=0)}showBell(){this.bellT=1.4}get busy(){return this.lower>.05||this.swapTo!==null}update(t,e,n){this.el.style.display=n?"block":"none",this.swapTo?(this.lower=Math.min(1,this.lower+t*4),this.lower>=1&&(this.set(this.swapTo),this.swapTo=null,X.reload())):this.lower=Math.max(0,this.lower-t*4);const s=this.reloading>0?Math.sin(Math.min(1,this.reloading/this.def.reload)*Math.PI):0;this.bobT+=t*(1.5+e*5.5);const a=Math.sin(this.bobT)*(.6+e*1.4),r=Math.abs(Math.cos(this.bobT))*(.6+e*1.8);this.recoil=Math.max(0,this.recoil-t*9),this.recoil2=Math.max(0,this.recoil2-t*9);const o=this.def;if(o.frames&&this.frameT>=0){this.frameT+=t;const d=Math.min(o.rate,.6),f=Math.floor(this.frameT/d*o.frames.length),g=f<o.frames.length?o.frames[f]:o.img;this.img.src.endsWith(`/${g}.webp`)||(this.img.src=Qs(g)),f>=o.frames.length&&(this.frameT=-1)}const l=o.melee&&this.frameT>=0,c=this.lower*40+s*22+(l?0:this.recoil*3),h=(l?0:this.recoil*-4)+s*18;if(this.img.style.right=`${o.right*100+a*.3-(l?6:0)}vw`,this.img.style.bottom=`calc(${o.bottom*100-r*.4-c}vh)`,this.img.style.transform=`rotate(${h}deg) scale(${1+this.recoil*.03})`,o.dual){const d=this.lower*40+s*22+this.recoil2*3;this.img2.style.left=`${o.right*100-a*.3}vw`,this.img2.style.right="auto",this.img2.style.bottom=`calc(${o.bottom*100-r*.4-d}vh)`,this.img2.style.transform=`rotate(${this.recoil2*4-s*18}deg) scale(${1+this.recoil2*.03})`}if(this.flashT-=t,this.flash.style.opacity=this.flashT>0?"1":"0",this.flashT>0){const d=o.dual&&this.side===1,f=(d?this.img2:this.img).getBoundingClientRect();this.flash.style.left=`${d?f.right-f.width*o.muzzle[0]:f.left+f.width*o.muzzle[0]}px`,this.flash.style.top=`${f.top+f.height*o.muzzle[1]}px`,this.flash.style.transform=`translate(-50%,-50%) rotate(${Math.random()*360}deg) scale(${.8+Math.random()*.6})`,this.flash.classList.toggle("cryo",o.id==="cryo")}this.bellT=Math.max(0,this.bellT-t);const u=this.bellT>0?Math.min(1,this.bellT*3,(1.4-this.bellT)*6):0;this.bell.style.opacity=String(u),this.bell.style.transform=`translateY(${(1-u)*30}vh) rotate(${Math.sin(this.bellT*30)*8*u}deg)`}}const H0={林骁:{p:"lin",c:"#9fc6ff"},苏晚:{p:"su",c:"#ffb3c4"},陈砚:{p:"chen",c:"#9dffb8"},老周:{p:"zhou",c:"#ffd27a"},小满:{p:"man",c:"#ffe08a"},阿婆:{p:"apo",c:"#e6c9a0"},许怀远:{p:"xu",c:"#c0c8ff"},钟曼:{p:"zhong",c:"#ff9a9a"},方鹤年:{c:"#d8d0b8"},苏明远:{c:"#ff8a7a"},广播:{c:"#ff6a5a"},蛊母:{c:"#ff5040"},新娘:{c:"#ff6a8a"},技术员:{c:"#cccccc"},唐武男:{p:"tang",c:"#ff7a5a"},土蜘蛛:{c:"#b0b8c8"},傩戏班姑娘:{c:"#e6c9a0"},船长:{c:"#d8d0b8"},押运员:{c:"#cccccc"},能面众:{c:"#e8e8e8"}},Zt=(i,t,e,n="")=>{const s=document.createElement(i);return s.className=t,n&&(s.innerHTML=n),e.appendChild(s),s};class G0{root=document.getElementById("hud");bar;face;hpEl;armorEl;ammoEl;armsEl;keysEl;tableEl;abilEl;staminaEl;oxyEl;objective;subtitle;prompt;hint;msg;crosshair;hitmarker;vignette;scanTint;frost;water;letterbox;fade;caption;boss;bossFill;doc;scare;scareImg;flashW;mapCanvas;hitT=0;dmgK=0;hintT=0;msgT=0;faceT=0;faceLook=0;scareT=0;docResolve=null;onDocOpen=null;onDocClose=null;explored=new Uint8Array(0);constructor(){const t=this.root;t.classList.add("mobile"),this.vignette=Zt("div","h-vignette",document.body),this.scanTint=Zt("div","h-scan",document.body),this.frost=Zt("div","h-frost",document.body),this.water=Zt("div","h-water",document.body),this.flashW=Zt("div","h-flashw",document.body),this.objective=Zt("div","h-objective",t),this.crosshair=Zt("div","h-cross",t,"<i></i><i></i><i></i><i></i>"),this.hitmarker=Zt("div","h-hit",t),this.prompt=Zt("div","h-prompt",t),this.hint=Zt("div","h-hint",t),this.msg=Zt("div","h-msg",t),this.boss=Zt("div","h-boss",t,'<span></span><div class="bar"><div></div></div>'),this.bossFill=this.boss.querySelector(".bar div"),this.subtitle=Zt("div","h-sub",document.body),this.letterbox=Zt("div","h-letterbox",document.body,"<div></div><div></div>"),this.fade=Zt("div","h-fade",document.body),this.caption=Zt("div","h-caption",document.body),this.doc=Zt("div","h-doc",document.body),this.scare=Zt("div","h-scare",document.body),this.scareImg=document.createElement("img"),this.scare.appendChild(this.scareImg),this.mapCanvas=document.createElement("canvas"),this.mapCanvas.className="h-map",this.mapCanvas.addEventListener("pointerdown",n=>{n.preventDefault(),this.mapTap=!0}),document.body.appendChild(this.mapCanvas),this.oxyEl=Zt("div","h-oxy",t,"<span>氧气</span><div><i></i></div>"),this.bar=Zt("div","h-bar",t),this.ammoEl=Zt("div","b-ammo",this.bar),this.hpEl=Zt("div","b-hp",this.bar),this.armsEl=Zt("div","b-arms",this.bar);const e=Zt("div","b-face",this.bar);this.face=document.createElement("img"),e.appendChild(this.face),this.armorEl=Zt("div","b-armor",this.bar),this.keysEl=Zt("div","b-keys",this.bar),this.tableEl=Zt("div","b-table",this.bar),this.abilEl=Zt("div","h-abil",t),this.staminaEl=Zt("div","h-stamina",t,"<i></i>"),this.doc.addEventListener("click",()=>this.closeDocument()),window.addEventListener("keydown",n=>{this.docResolve&&["KeyE","Space","Enter","Escape"].includes(n.code)&&(n.stopPropagation(),this.closeDocument())},!0);for(const n of m0)new Image().src=ra(n)}show(t){this.root.style.display=t?"block":"none"}reset(){this.hint.classList.remove("on"),this.msg.classList.remove("on"),this.subtitle.classList.remove("on"),this.hintT=this.msgT=0,this.setPrompt(null),this.setCaption(""),this.setLetterbox(!1),this.setScan(!1)}setFace(t){this.face.src=ra(t)}set(t){const e=Math.max(0,Math.round(t.hp));this.hpEl.innerHTML=`<b>${e}%</b><small>生命</small>`,this.hpEl.classList.toggle("low",e<30),this.armorEl.innerHTML=`<b>${Math.round(t.armor)}%</b><small>护甲</small>`,this.ammoEl.innerHTML=t.reloading?'<b class="dim">··</b><small>换弹中</small>':`<b>${t.ammo}</b><small>${t.ammoName}</small>`,this.armsEl.innerHTML=`<small>武器</small><div>${t.weapons.map(a=>`<span class="${a.owned?"own":""} ${a.active?"act":""}">${a.slot}</span>`).join("")}</div>`,this.keysEl.innerHTML=["red","blue","yellow"].map(a=>`<i class="k-${a} ${t.keys.includes(a)?"has":""}"></i>`).join("")+`<span class="herb">草药×${t.herbs}</span>`;const n=t.reserveNames??["手枪弹","机枪弹","冷凝弹"];this.tableEl.innerHTML=`<div>${n[0]} <b>${t.reserve.ammo}</b></div><div>${n[1]} <b>${t.reserve.mg_ammo}</b></div>`+(n[2]?`<div>${n[2]} <b>${t.reserve.cryo_ammo}</b></div>`:"<div>赤霄 <b>∞</b></div>"),this.staminaEl.firstChild.style.width=`${t.stamina*100}%`,this.staminaEl.style.opacity=t.stamina<.98?"1":"0",this.oxyEl.style.display=t.oxygen===null?"none":"flex",t.oxygen!==null&&(this.oxyEl.querySelector("i").style.width=`${t.oxygen}%`);const s=1-e/100;this.face.style.filter=`sepia(${s*.6}) saturate(${1+s*2}) hue-rotate(${-s*25}deg) brightness(${1-s*.3})`}setObjective(t){this.objective.innerHTML=t?`<span class="tag">目标</span>${t}`:"",this.objective.classList.remove("flash"),this.objective.offsetWidth,this.objective.classList.add("flash")}say(t,e){if(!e){this.subtitle.classList.remove("on");return}const n=t.replace(/[（(].*$/,""),s=H0[n],a=s?.p?`<img src="${ra(s.p)}">`:n?`<div class="noface">${n.slice(0,1)}</div>`:"";this.subtitle.innerHTML=`${a}<div class="txt">${t?`<span style="color:${s?.c??"#ddd"}">${t}</span>`:""}<p>${e}</p></div>`,this.subtitle.classList.toggle("narr",!t),this.subtitle.classList.add("on")}setPrompt(t){this.prompt.textContent=t??"",this.prompt.style.opacity=t?"1":"0"}showHint(t,e=5){this.hint.innerHTML=t,this.hint.classList.add("on"),this.hintT=e}message(t,e=2.5){this.msg.textContent=t,this.msg.classList.add("on"),this.msgT=e}hit(t,e){this.hitmarker.className=`h-hit ${t?"kill":e?"weak":""}`,this.hitmarker.style.opacity="1",this.hitT=.15}damage(t=0){this.dmgK=1,this.faceT=.4,this.faceLook=t}setCrosshair(t,e){this.crosshair.style.setProperty("--s",`${6+t*26}px`),this.crosshair.style.opacity=e?"1":"0"}setLetterbox(t){this.letterbox.classList.toggle("on",t),document.body.classList.toggle("cutscene",t)}setFade(t,e=1200){this.fade.style.transition=`opacity ${e}ms`,this.fade.style.opacity=String(t)}setCaption(t){this.caption.innerHTML=t,this.caption.classList.toggle("on",!!t)}setScan(t){this.scanTint.classList.toggle("on",t)}setFrost(t){this.frost.style.opacity=String(t)}setWater(t){this.water.classList.toggle("on",t)}whiteFlash(){this.flashW.style.transition="none",this.flashW.style.opacity="0.85",requestAnimationFrame(()=>{this.flashW.style.transition="opacity 0.6s",this.flashW.style.opacity="0"})}setBoss(t,e=1){this.boss.style.display=t?"block":"none",t&&(this.boss.querySelector("span").textContent=t,this.bossFill.style.width=`${Math.max(0,e)*100}%`)}jumpscare(t){this.scareImg.src=we(`sprites/${t}.webp`),this.scare.classList.remove("go"),this.scare.offsetWidth,this.scare.classList.add("go"),this.scareT=.9}get scaring(){return this.scareT>0}showDocument(t,e){this.doc.innerHTML=`<div class="paper"><h3>${t}</h3>${e}<p class="close">（点击关闭）</p></div>`,this.doc.classList.add("on");const n=new Promise(s=>this.docResolve=s);return this.onDocOpen?.(),n}closeDocument(){if(!this.docResolve)return;this.doc.classList.remove("on");const t=this.docResolve;this.docResolve=null,this.onDocClose?.(),t()}get documentOpen(){return!!this.docResolve}resetExplored(){this.explored=new Uint8Array(Le*Ht)}mapTap=!1;mapTapped(){const t=this.mapTap;return this.mapTap=!1,t}markExplored(t,e){const n=Math.floor(t/Xt),s=Math.floor(e/Xt);for(let a=s-3;a<=s+3;a++)for(let r=n-3;r<=n+3;r++)a>=0&&r>=0&&a<Le&&r<Ht&&(this.explored[a*Ht+r]=1)}drawMap(t,e,n,s,a){if(this.mapCanvas.style.display=t?"block":"none",!t)return;const r=this.mapCanvas,o=r.width=Math.min(window.innerWidth*.9,900),l=r.height=Math.min(window.innerHeight*.8,640),c=r.getContext("2d"),h=Math.min(o/Ht,l/Le),u=(o-Ht*h)/2,d=(l-Le*h)/2;c.fillStyle="rgba(0,0,0,0.82)",c.fillRect(0,0,o,l);for(let _=0;_<Le;_++)for(let m=0;m<Ht;m++){if(!this.explored[_*Ht+m])continue;const p=Di[_][m],w=u+m*h,A=d+_*h;if($l(p)){let M=!1;for(const[P,S]of[[1,0],[-1,0],[0,1],[0,-1]])$l(ke(m+P,_+S))||(M=!0);M&&(c.fillStyle="#b8322a",c.fillRect(w,A,h,h))}else cn(p)?(c.fillStyle=oa(p)?"#2a6":"#e8c040",c.fillRect(w,A,h,h)):p==="X"?(c.fillStyle="#3f8",c.fillRect(w,A,h,h)):(c.fillStyle="#2a2a2a",c.fillRect(w+.5,A+.5,h-1,h-1))}for(const _ of a)c.fillStyle="#3f8",c.beginPath(),c.arc(u+_.x/Xt*h,d+_.z/Xt*h,h*.5,0,7),c.fill();const f=u+e/Xt*h,g=d+n/Xt*h;c.save(),c.translate(f,g),c.rotate(-s),c.fillStyle="#fff",c.beginPath(),c.moveTo(0,-h*.9),c.lineTo(h*.5,h*.5),c.lineTo(-h*.5,h*.5),c.fill(),c.restore(),c.fillStyle="#ddd",c.font="14px sans-serif",c.fillText("点地图或「地图」按钮关闭 · 推摇杆也会关闭",12,l-12)}update(t,e){this.hitT>0&&(this.hitT-=t,this.hitT<=0&&(this.hitmarker.style.opacity="0")),this.dmgK=Math.max(0,this.dmgK-t*1.4);const n=e<35?(35-e)/35:0;this.vignette.style.opacity=String(Math.min(1,this.dmgK*.85+n*(.55+Math.sin(performance.now()*.006)*.15))),this.hintT>0&&(this.hintT-=t,this.hintT<=0&&this.hint.classList.remove("on")),this.msgT>0&&(this.msgT-=t,this.msgT<=0&&this.msg.classList.remove("on")),this.scareT=Math.max(0,this.scareT-t),this.faceT=Math.max(0,this.faceT-t),this.faceT<=0&&Math.random()<t*.5&&(this.faceLook=(Math.random()-.5)*2);const s=this.faceT>0?(Math.random()-.5)*6:0;this.face.style.transform=`translate(${this.faceLook*3+s}px, ${s*.5}px) scale(1.08)`}}const V0={林骁:"lin",苏晚:"su",陈砚:"chen",老周:"zhou",小满:"man",阿婆:"apo",许怀远:"xu",钟曼:"zhong",唐武男:"tang"};function W0(i){return i.startsWith("tex:")?we(`tex/${i.slice(4)}.webp`):we(`cine/${i}.jpg`)}class X0{root=document.getElementById("cine");stage;sub;skipBtn;advance=null;skipped=!1;playing=!1;constructor(){this.root.innerHTML=`<div class="c-stage"></div><div class="c-bars"><i></i><i></i></div><div class="c-sub"></div>
      <button class="c-skip">跳过 ▶▶</button><div class="c-tip">点击屏幕继续</div>`,this.stage=this.root.querySelector(".c-stage"),this.sub=this.root.querySelector(".c-sub"),this.skipBtn=this.root.querySelector(".c-skip"),this.skipBtn.addEventListener("click",t=>{t.stopPropagation(),this.skip()}),this.root.addEventListener("click",()=>this.advance?.()),window.addEventListener("keydown",t=>{this.playing&&(t.code==="Escape"?this.skip():(t.code==="Space"||t.code==="Enter"||t.code==="KeyE")&&this.advance?.())})}skip(){this.skipped=!0,this.advance?.()}wait(t){return new Promise(e=>{const n=setTimeout(()=>{this.advance=null,e()},t);this.advance=()=>{clearTimeout(n),this.advance=null,e()}})}say(t,e){if(!e){this.sub.classList.remove("on");return}const n=t.replace(/[（(].*$/,""),s=V0[n];this.sub.innerHTML=`${s?`<img src="${ra(s)}">`:""}<div>${t?`<b>${t}</b>`:""}<p>${e}</p></div>`,this.sub.classList.toggle("narr",!t),this.sub.classList.add("on")}async play(t){this.playing=!0,this.skipped=!1,this.root.classList.add("on");for(const e of t){if(this.skipped)break;await this.shot(e)}this.sub.classList.remove("on"),this.stage.innerHTML="",this.root.classList.remove("on"),this.playing=!1}async shot(t){this.stage.innerHTML="",this.sub.classList.remove("on");const e=document.createElement("div");e.className="c-layer",this.stage.appendChild(e);let n=null;const s=t.lines??[],a=s.reduce((o,l)=>o+(l[2]??1.6+l[1].length*.13),0),r=Math.max(t.dur??3.5,a+.6);if(t.video){n=document.createElement("video"),n.src=we(`cine/${t.video}.mp4`),n.muted=!1,n.playsInline=!0,n.className="c-video",e.appendChild(n);try{n.currentTime=t.from??0,await n.play()}catch{n.muted=!0;try{await n.play()}catch{}}}else if(t.img){const o=document.createElement("div");o.className="c-img",o.style.backgroundImage=`url(${W0(t.img)})`;const l=t.kb??"in",c={in:"scale(1.02)",out:"scale(1.18)",left:"scale(1.15) translateX(4%)",right:"scale(1.15) translateX(-4%)",up:"scale(1.15) translateY(4%)"}[l],h={in:"scale(1.16)",out:"scale(1.02)",left:"scale(1.15) translateX(-4%)",right:"scale(1.15) translateX(4%)",up:"scale(1.15) translateY(-4%)"}[l];o.animate([{transform:c},{transform:h}],{duration:r*1e3+600,easing:"ease-in-out",fill:"forwards"}),o.animate([{opacity:0},{opacity:1}],{duration:600,fill:"forwards"}),t.dark&&(o.style.filter="brightness(0.55) saturate(0.8)"),e.appendChild(o)}else e.style.background="#000";if(t.tint){const o=document.createElement("div");o.className="c-tint",o.style.background=t.tint,e.appendChild(o)}for(const[o,l]of(t.chars??[]).entries()){const c=document.createElement("img");c.className=`c-char ${l.side}`,c.src=we(`sprites/${l.id}.webp`),c.style.animationDelay=`${.2+o*.25}s`,e.appendChild(c)}if(t.title){const o=document.createElement("div");o.className="c-title",o.innerHTML=`<small>${t.title[0]}</small><h2>${t.title[1]}</h2>`,e.appendChild(o)}if(t.caption){const o=document.createElement("div");o.className="c-caption",o.innerHTML=t.caption,e.appendChild(o)}if(t.shake&&this.stage.animate([{transform:"translate(0,0)"},{transform:"translate(-10px,6px)"},{transform:"translate(8px,-6px)"},{transform:"translate(-4px,3px)"},{transform:"translate(0,0)"}],{duration:500,iterations:2}),t.sfx){const o=t.sfx;o==="bell"?X.bellRing():o==="impact"?X.impact():o==="scream"?X.scream():o==="radio"?X.radio():o==="explosion"?X.explosion():o==="stinger"?X.stinger():o==="whisper"?X.whisper():o==="gunshot"?X.gunshot():o==="roar"&&X.roar({x:0,y:0,z:0})}if(t.scare){const o=document.createElement("img");o.className="c-scare",o.src=we(`sprites/${t.scare}.webp`),e.appendChild(o),X.scream()}if(n){const o=t.to??999;let l=0;await new Promise(c=>{const h=()=>{if(this.skipped||!n||n.ended||n.currentTime>=o||n.error){c();return}const u=n.currentTime-(t.from??0);let d=0;for(let f=0;f<s.length;f++){const g=s[f][2]??2.5;u>=d&&u<d+g&&l!==f+1&&(l=f+1,this.say(s[f][0],s[f][1])),d+=g}u>d&&s.length&&this.sub.classList.remove("on"),requestAnimationFrame(h)};this.advance=()=>this.skip(),h()}),this.advance=null,n.pause();return}if(!s.length){await this.wait(r*1e3);return}await this.wait(400);for(const[o,l,c]of s){if(this.skipped)return;this.say(o,l),await this.wait((c??1.6+l.length*.13)*1e3)}}}const ls=()=>window.__autoMG===!0;class $0{root=document.getElementById("mg");active=!1;easy=!1;onOpen=null;onClose=null;open(t){return this.root.innerHTML=`<div class="mg-box">${t}</div>`,this.root.classList.add("on"),this.active=!0,this.onOpen?.(),this.root.querySelector(".mg-box")}close(){this.root.classList.remove("on"),this.root.innerHTML="",this.active=!1,this.onClose?.()}choice(t,e){const n=this.open(`<h3>${t}</h3>${e.map((s,a)=>`<button class="mg-opt" data-i="${a}">${s}</button>`).join("")}`);return ls()?(this.close(),Promise.resolve(1)):new Promise(s=>{n.querySelectorAll(".mg-opt").forEach(a=>a.addEventListener("click",()=>{X.pickup(),this.close(),s(Number(a.dataset.i))}))})}hack(t,e=4,n=30){const s=["◆","●","▲","■","★","✚","◐","☰"].slice(0,e),a=[...s,...s].sort(()=>Math.random()-.5),r=this.open(`<h3>${t}</h3><p class="mg-tip">依次点击两个相同的节点完成连线</p>
      <div class="mg-grid">${a.map((o,l)=>`<button class="mg-node" data-i="${l}">${o}</button>`).join("")}</div>
      <div class="mg-timer"><i></i></div>`);return ls()?(this.close(),Promise.resolve(!0)):new Promise(o=>{let l=null,c=0;const h=performance.now(),u=r.querySelector(".mg-timer i"),d=n*(this.easy?1.6:1)*1e3,f=setInterval(()=>{const g=1-(performance.now()-h)/d;u.style.width=`${Math.max(0,g)*100}%`,g<=0&&(clearInterval(f),this.close(),X.dryFire(),o(!1))},50);r.querySelectorAll(".mg-node").forEach(g=>g.addEventListener("click",()=>{if(!(g.classList.contains("ok")||g===l)){if(X.scan(),!l){l=g,g.classList.add("sel");return}l.textContent===g.textContent?(l.classList.add("ok"),g.classList.add("ok"),l.classList.remove("sel"),c++,c===e&&(clearInterval(f),setTimeout(()=>{this.close(),o(!0)},300))):(l.classList.remove("sel"),g.classList.add("bad"),setTimeout(()=>g.classList.remove("bad"),300)),l=null}}))})}rhythm(t,e){const n=this.open(`<h3>${t}</h3>
      <p class="mg-tip">按住/轻点下方按钮：<b>长</b>＝按住到条满，<b>短</b>＝轻点</p>
      <div class="mg-beats">${e.map(s=>`<span class="${s}">${s==="L"?"长":"短"}</span>`).join("")}</div>
      <div class="mg-hold"><i></i></div>
      <button class="mg-press">敲 击</button>`);return ls()?(this.close(),Promise.resolve(!0)):new Promise(s=>{let a=0,r=0,o=!1,l=0;const c=[...n.querySelectorAll(".mg-beats span")],h=n.querySelector(".mg-hold i"),u=this.easy?.45:.6,d=this.easy?.45:.32;c[0].classList.add("cur");const f=()=>{o||(o=!0,r=performance.now(),X.bell(void 0,.3))},g=()=>{if(!o)return;o=!1;const M=(performance.now()-r)/1e3,P=e[a];if(P==="L"?M>=u:M<=d){if(c[a].classList.add("ok"),c[a].classList.remove("cur"),X.bell(void 0,P==="L"?.7:.45),a++,a>=e.length){A(),setTimeout(()=>{this.close(),s(!0)},500);return}c[a].classList.add("cur")}else X.dryFire(),c.forEach(T=>T.classList.remove("ok","cur")),a=0,c[0].classList.add("cur"),n.classList.add("shake"),setTimeout(()=>n.classList.remove("shake"),300)},_=()=>{h.style.width=o?`${Math.min(1,(performance.now()-r)/1e3/u)*100}%`:"0%",l=requestAnimationFrame(_)};_();const m=n.querySelector(".mg-press");m.addEventListener("pointerdown",M=>{M.preventDefault(),f()}),m.addEventListener("pointerup",g),m.addEventListener("pointerleave",g);const p=M=>{M.code==="Space"&&!M.repeat&&(M.preventDefault(),f())},w=M=>{M.code==="Space"&&g()};window.addEventListener("keydown",p),window.addEventListener("keyup",w);const A=()=>{cancelAnimationFrame(l),window.removeEventListener("keydown",p),window.removeEventListener("keyup",w)}})}masks(t,e,n,s){const a=this.open(`<h3>${t}</h3><p class="mg-tip">${s}</p>
      <div class="mg-masks">${e.map(r=>`<button class="mg-mask" data-m="${r}"><i></i>${r}</button>`).join("")}</div><div class="mg-seq"></div>`);return ls()?(this.close(),Promise.resolve(!0)):new Promise(r=>{let o=0;const l=a.querySelector(".mg-seq");a.querySelectorAll(".mg-mask").forEach(c=>c.addEventListener("click",()=>{c.dataset.m===n[o]?(c.classList.add("ok"),X.bell(void 0,.4),o++,l.textContent=n.slice(0,o).join(" → "),o===n.length&&setTimeout(()=>{this.close(),r(!0)},600)):(X.stinger(),a.querySelectorAll(".mg-mask").forEach(h=>h.classList.remove("ok")),o=0,l.textContent="顺序错误，机关复位……")}))})}mash(t,e=10,n=3.5){const s=this.open(`<h3 class="red">${t}</h3><div class="mg-timer"><i></i></div><div class="mg-meter"><i></i></div>
      <button class="mg-press big">连 点！</button>`);if(ls())return this.close(),Promise.resolve(!0);const a=this.easy?Math.ceil(e*.6):e;return new Promise(r=>{let o=0;const l=performance.now(),c=s.querySelector(".mg-timer i"),h=s.querySelector(".mg-meter i"),u=()=>{o++,h.style.width=`${Math.min(1,o/a)*100}%`,X.hitFlesh(),o>=a&&_(!0)},d=m=>{(m.code==="Space"||m.code==="KeyE")&&!m.repeat&&(m.preventDefault(),u())};window.addEventListener("keydown",d),s.querySelector(".mg-press").addEventListener("pointerdown",m=>{m.preventDefault(),u()});const f=setInterval(()=>{const m=1-(performance.now()-l)/(n*1e3);c.style.width=`${Math.max(0,m)*100}%`,m<=0&&_(!1)},40);let g=!1;const _=m=>{g||(g=!0,clearInterval(f),window.removeEventListener("keydown",d),this.close(),r(m))}})}}const nr=1.62;class q0{constructor(t,e){this.settings=e;const n=e.quality;this.renderer=new h0({canvas:t,antialias:n!=="low",powerPreference:"high-performance"}),this.renderer.setPixelRatio(this.pixelRatio()),this.renderer.setSize(window.innerWidth,window.innerHeight),this.renderer.outputColorSpace=Pe,this.renderer.toneMapping=Jl,this.renderer.toneMappingExposure=1.35,this.renderer.shadowMap.enabled=n==="high",this.renderer.shadowMap.type=Kl,this.camera=new $e(70,window.innerWidth/window.innerHeight,.05,220),this.camera.rotation.order="YXZ",this.scene.add(this.camera,this.world),this.scene.background=new Ft(263687),this.scene.fog=new ao(263687,.06),this.hemi=new yu(5334650,2759184,.7),this.scene.add(this.hemi),this.flashlight=new Mu(16773852,70,30,.48,.5,1.3),this.flashlight.position.set(.25,-.2,0),this.flashlight.target.position.set(0,0,-1),this.flashlight.castShadow=n==="high",this.flashlight.shadow.mapSize.set(1024,1024),this.camera.add(this.flashlight,this.flashlight.target),this.mg.easy=e.easyQte,this.input=x0(),this.input.sensitivity=e.sensitivity,this.input.onPointerLockLost=()=>{this.state==="playing"&&!this.hud.documentOpen&&!this.mg.active&&this.pause()},this.hud.onDocOpen=()=>this.input.unlock(),this.mg.onOpen=()=>this.input.unlock(),this.mg.onClose=()=>{this.input.clear(),this.state==="playing"&&this.input.lock()},this.hud.onDocClose=()=>{this.input.clear(),this.state==="playing"&&this.input.lock()},window.addEventListener("resize",()=>this.resize()),this.hud.show(!1),this.input.show(!1),this.weapon.update(0,0,!1)}settings;renderer;scene=new uu;camera;input;hud=new G0;weapon=new B0;cineP=new X0;mg=new $0;flow=new P0;level=null;chapter=null;enemies=[];npcs=new Map;interactables=[];pickups=[];projectiles=[];particles=[];decals=[];props=[];waiters=[];flashlight;hemi;raycaster=new Tu;world=new Ci;state="menu";time=0;playerPos=new D;camPos=new D;yaw=0;pitch=0;hp=100;armor=0;herbs=1;stamina=1;oxygen=100;keys=new Set;owned=new Set(["pistol"]);current="pistol";mags={pistol:12,mg:60,cryo:6};reserve={ammo:24,mg_ammo:0,cryo_ammo:0};face="lin";flags=new Set;choices={};exitEnabled=!0;cutscene=!1;frozen=!1;lookTarget=null;scanning=!1;scanUnlocked=!1;flashUnlocked=!0;bellUnlocked=!1;bellOwn=!1;zhenyinUnlocked=!1;scanCd=0;scanT=0;flashCd=0;bellCd=0;zhenyinCd=0;healCd=0;dashT=0;dashCd=0;dashDir=new D;fireCd=0;triggerHeld=!1;shake=0;stepDist=0;bobT=0;vel=new D;lastShotT=-99;get playerVel(){return this.vel}aimingAt(t){if(this.time-this.lastShotT>.35)return!1;const e=new D(0,0,-1).applyQuaternion(this.camera.quaternion),n=t.center().sub(this.camPos).normalize();return e.angleTo(n)<.07}noise(t){for(const e of this.enemies){if(!e.alive)continue;Math.hypot(e.pos.x-this.playerPos.x,e.pos.z-this.playerPos.z)<(e.state==="dormant"?t*.4:t)&&e.alert(this.playerPos.x,this.playerPos.z)}}flashBurst=0;menuT=0;scareCd=15;mapOpen=!1;mapArm=!1;electrified=new Map;exitPads=[];exitResolve=null;checkpoint={x:0,z:0,yaw:0,hp:100};stats=this.freshStats();totalTime=0;boss=null;bossName="";onScan=null;onKill=null;onShot=null;onStateChange=null;water=!1;flashlightWeak=!1;freshStats(){return{kills:0,totalKills:0,items:0,totalItems:0,secrets:0,totalSecrets:0,time:0,par:600,headshots:0,shots:0,hits:0}}pixelRatio(){const t=window.devicePixelRatio||1,e=this.settings.quality;return e==="low"?Math.min(t,2)*.55:e==="mid"?Math.min(t,1.5)*.85:Math.min(t,2)}applySettings(){this.renderer.setPixelRatio(this.pixelRatio()),this.input.sensitivity=this.settings.sensitivity,X.setVolume(this.settings.volume),this.mg.easy=this.settings.easyQte,document.documentElement.style.setProperty("--sub-size",`${this.settings.subtitleSize}`)}resize(){this.renderer.setSize(window.innerWidth,window.innerHeight),this.camera.aspect=window.innerWidth/window.innerHeight,this.camera.updateProjectionMatrix()}setState(t){this.state=t;const e=t==="playing";this.hud.show(t==="playing"||t==="paused"||t==="dead"),this.input.enabled=e,this.input.show(e&&!this.cutscene),e?this.input.lock():this.input.unlock(),this.onStateChange?.(t)}pause(){this.mapOpen=!1,this.state==="playing"&&this.setState("paused")}resume(){this.state==="paused"&&(this.input.clear(),this.setState("playing"))}loadChapter(t){this.clearWorld(),this.chapter=t,E0(t.map),this.level=new L0(t,this.settings.quality==="high"?6:this.settings.quality==="mid"?4:3),this.world.add(this.level.group);const e=t.theme;this.scene.fog.color.setHex(e.fog),this.scene.fog.density=e.fogDensity,this.scene.background.setHex(e.fog),this.hemi.color.setHex(e.hemi[0]),this.hemi.groundColor.setHex(e.hemi[1]),this.hemi.intensity=e.hemi[2],this.flow.invalidate(),this.hud.resetExplored();const n=C0("@")??{col:t.marks.start?.[0]??1,row:t.marks.start?.[1]??1},s=ve(n.col,n.row);this.setPlayer(s.x,s.z,t.marks.startYaw?t.marks.startYaw[0]*Math.PI/2:0),this.exitPads=[];for(let a=0;a<Le;a++)for(let r=0;r<Ht;r++)Di[a][r]==="X"&&this.exitPads.push(ve(r,a));this.stats=this.freshStats(),this.stats.par=t.par,this.stats.totalSecrets=this.level.secrets.size;for(const a of t.items)this.addPickup(a.type,a.at[0],a.at[1]);this.keys.clear(),this.flags.clear(),this.exitEnabled=!1,this.face=t.pov,this.hud.setFace(this.face),z0(t.pov==="tang"?"tang":"default"),this.weapon.refresh(Ce[this.current]),this.bellOwn=!1,this.scanUnlocked=this.flashUnlocked=!0,this.bellUnlocked=this.zhenyinUnlocked=!1,this.scanCd=this.flashCd=this.bellCd=this.zhenyinCd=0,this.oxygen=100,this.flashlightWeak=!1,this.boss=null,this.hud.setBoss(null),this.hud.setObjective(""),this.hud.reset(),this.scanning=!1,this.scanT=0,this.cutscene=!1,this.frozen=!1,this.mapOpen=!1,this.onShot=null,this.onScan=null,this.saveCheckpoint()}clearWorld(){this.level&&(this.world.remove(this.level.group),this.level.dispose(),this.level=null);for(const t of this.enemies)this.world.remove(t.group);for(const t of this.npcs.values())this.world.remove(t.group);for(const t of this.interactables)t.icon&&this.world.remove(t.icon);for(const t of this.pickups)this.world.remove(t.sprite);for(const t of this.projectiles)this.world.remove(t.sprite),t.warn&&this.world.remove(t.warn);for(const t of this.particles)this.world.remove(t.mesh);for(const t of this.decals)this.world.remove(t);for(const t of this.props)this.world.remove(t);this.props=[],this.enemies=[],this.npcs.clear(),this.interactables=[],this.pickups=[],this.projectiles=[],this.particles=[],this.decals=[],this.waiters=[],this.electrified.clear(),this.exitResolve=null}until(t){return t()?Promise.resolve():new Promise(e=>this.waiters.push({cond:t,resolve:e}))}wait(t){const e=this.time+t;return this.until(()=>this.time>=e)}async say(t,e,n){/陈砚|广播|许怀远（电话|许怀远（耳麦/.test(t)&&X.radio(),this.hud.say(t,e),await this.wait(n??1.5+e.length*.12),this.hud.say("","")}sayAsync(t){(async()=>{for(const[e,n]of t)await this.say(e,n)})()}objective(t){this.hud.setObjective(t)}hint(t,e,n=7){this.hud.showHint(e,n)}setCutscene(t){this.cutscene=t,this.frozen=t,this.hud.setLetterbox(t),this.input.show(!t&&this.state==="playing"),t||(this.lookTarget=null)}async cine(t){const e=this.state;this.mapOpen=!1,this.setState("cine"),X.setAmbientLevel(.2),await this.cineP.play(t),X.setAmbientLevel(.55),this.input.clear(),(e==="playing"||e==="cine")&&this.setState("playing")}at(t,e=0){const n=this.chapter.marks[t];if(!n)throw new Error(`mark ${t} missing`);const{x:s,z:a}=ve(n[0],n[1]);return new D(s,e,a)}near(t,e){const n=this.at(t);return Math.hypot(n.x-this.playerPos.x,n.z-this.playerPos.z)<e}inRect(t,e,n,s){const{col:a,row:r}=Ze(this.playerPos.x,this.playerPos.z);return a>=t&&a<=n&&r>=e&&r<=s}setPlayer(t,e,n){this.playerPos.set(t,0,e),this.yaw=n,this.pitch=0,this.vel.set(0,0,0)}saveCheckpoint(){this.checkpoint={x:this.playerPos.x,z:this.playerPos.z,yaw:this.yaw,hp:Math.max(this.hp,60)}}respawn(){const t=this.checkpoint;this.setPlayer(t.x,t.z,t.yaw),this.hp=Math.max(t.hp,75),this.oxygen=100,this.reserve.ammo=Math.max(this.reserve.ammo,24),this.owned.has("mg")&&(this.reserve.mg_ammo=Math.max(this.reserve.mg_ammo,zi==="tang"?12:60)),this.owned.has("cryo")&&(this.reserve.cryo_ammo=Math.max(this.reserve.cryo_ammo,12)),this.weapon.reloading=0;for(const e of this.enemies)e.reset();for(const e of this.projectiles)this.world.remove(e.sprite),e.warn&&this.world.remove(e.warn);this.projectiles=[];for(const e of this.npcs.values())e.following&&e.pos.set(t.x,0,t.z+1);this.flow.invalidate(),this.hud.setFade(0,600),this.setState("playing")}spawn(t,e,n={}){const[s,a]=typeof e=="string"?this.chapter.marks[e]:e,{x:r,z:o}=ve(s,a),l=new U0(t,r+(n.ox??0),o+(n.oz??0),0,n.state??"idle",n.scale??1);return l.tag=n.tag??"",this.enemies.push(l),this.world.add(l.group),t!=="anchor"&&this.stats.totalKills++,l}npc(t,e,n=!1){const[s,a]=typeof e=="string"?this.chapter.marks[e]:e,{x:r,z:o}=ve(s,a),l=new F0(t,r,o);return l.following=n,t==="man"&&(l.followDist=1.6),this.npcs.set(t,l),this.world.add(l.group),l}prop(t,e,n,s=0,a=0){const[r,o]=typeof e=="string"?this.chapter.marks[e]:e,{x:l,z:c}=ve(r,o),h=Fn(t),u=new Ge(1,1);u.translate(0,.5,0);const d=new Mt(u,new ce({map:h.tex,alphaTest:.4,side:Qe,emissive:a,roughness:.8}));return d.scale.set(n*h.aspect,n,1),d.position.set(l,s,c),this.world.add(d),this.props.push(d),d}addObject(t){this.world.add(t)}removeObject(t){this.world.remove(t)}removeProp(t){this.world.remove(t),this.props=this.props.filter(e=>e!==t)}removeNpc(t){const e=this.npcs.get(t);e&&(this.world.remove(e.group),this.npcs.delete(t))}openDoor(t,e=!0){this.level?.setDoor(t,e),this.flow.invalidate(),X.door()}setFlag(t){this.flags.add(t);for(const e of this.level?.doors.values()??[])e.def.flag===t&&!e.open&&this.openDoor(e.def.id)}giveKey(t){this.keys.add(t),X.pickup()}giveWeapon(t,e=0){this.owned.has(t)||(this.mags[t]=Ce[t].mag),this.owned.add(t),this.reserve[Ce[t].ammo]+=e,this.switchWeapon(t)}setLoadout(t,e){this.owned=new Set(t),this.current=t[0],this.weapon.swap(Ce[t[0]]);for(const n of t)this.mags[n]=Ce[n].mag;Object.assign(this.reserve,{ammo:0,mg_ammo:0,cryo_ammo:0},e)}switchWeapon(t){!this.owned.has(t)||this.current===t||(this.current=t,this.weapon.reloading=0,this.weapon.swap(Ce[t]))}addInteract(t,e,n,s,a,r=0,o=0){const[l,c]=typeof e=="string"?this.chapter.marks[e]:e,{x:h,z:u}=ve(l,c),d={id:t,pos:new D(h+r,0,u+o),label:n,active:!0,onUse:s};if(a){const f=new cs(new In({map:(a==="serum"?Pi("prop:serum"):null)??Bi(a),depthWrite:!1}));f.scale.set(.8,.8,1),f.position.set(h+r,.9,u+o),this.world.add(f),d.icon=f}return this.interactables=this.interactables.filter(f=>f.id!==t),this.interactables.push(d),d}removeInteract(t){const e=this.interactables.find(n=>n.id===t);e&&(e.active=!1,e.icon&&this.world.remove(e.icon))}async cooldown(t,e,n,s,a=0,r=0){const o=this.chapter,l=this.time+s;for(;this.time<l&&this.chapter===o;){const c=Math.ceil(l-this.time);this.addInteract(t,e,`${n}（${c} 秒）`,()=>this.hud.message(`${n}，还要 ${c} 秒`),void 0,a,r),await this.wait(Math.min(1,l-this.time))}this.chapter===o&&this.removeInteract(t)}interact(t,e,n,s,a=0,r=0){let o=!1;return this.addInteract(t,e,n,()=>{o=!0,this.removeInteract(t)},s,a,r),this.until(()=>o)}addPickup(t,e,n,s=0,a=0,r=0){const{x:o,z:l}=ve(e,n),c=zi==="tang",h=t==="medkit"?c?"prop:x_medkit":"prop:medkit":t==="mg_ammo"&&c?"prop:x_shells":t.endsWith("ammo")?c?"prop:x_ammo":"prop:ammo":null,u=h?Pi(h):null,d=new cs(new In({map:u??Bi(t),depthWrite:!1,color:c?16777215:t==="cryo_ammo"?2559:t==="mg_ammo"?16765072:16777215})),f=t.startsWith("weapon")||t.startsWith("key")||!!u;d.scale.set(f?.9:.7,f?.9:.7,1),d.position.set(o+a,.45,l+r),this.world.add(d);const g=!t.startsWith("key")&&s===0;g&&this.stats.totalItems++,this.pickups.push({type:t,sprite:d,taken:!1,counted:g,respawn:s,timer:0})}reachExit(){return this.exitEnabled=!0,new Promise(t=>this.exitResolve=t)}electrify(t,e){for(const[n,s]of t)this.electrified.set(s*Ht+n,this.time+e);X.explosion()}isElectrified(t,e){if(!this.electrified.size)return!1;const{col:n,row:s}=Ze(t,e),a=this.electrified.get(s*Ht+n);return a!==void 0&&a>this.time}jumpscare(t,e=0){this.hud.jumpscare(t),X.scream(),this.shake=Math.max(this.shake,.9),e&&this.damagePlayer(e,this.playerPos.clone().add(new D(.1,0,.1)),"scare"),this.scareCd=25}shakeCamera(t){this.shake=Math.max(this.shake,t)}damagePlayer(t,e,n){if(this.state!=="playing"||this.cutscene||this.dashT>0)return;const s=Math.min(this.armor,t/3);this.armor-=s,this.hp-=t-s;const a=e.x-this.playerPos.x,r=e.z-this.playerPos.z,o=Math.cos(this.yaw)*a-Math.sin(this.yaw)*r;this.hud.damage(Math.sign(o)),this.shake=Math.max(this.shake,.35),X.playerHurt();const l=Math.hypot(a,r)||1;if(this.vel.x-=a/l*4,this.vel.z-=r/l*4,n&&n!=="scare"&&this.scareCd<=0&&Math.random()<.35){const c=this.enemies.find(h=>h.kind.name===n&&h.alive);c&&!c.kind.boss&&(this.hud.jumpscare(c.info.name),X.scream(),this.scareCd=30)}this.hp<=0&&(this.hp=0,this.hud.setFade(.85,1500),this.setState("dead"))}spawnProjectile(t,e,n,s,a,r){const o=new cs(new In({map:Bi(n),blending:ca,depthWrite:!1}));o.scale.setScalar(n==="proj_rock"?1.1:.6),o.position.copy(t),this.world.add(o);const l=e.clone().sub(t).normalize().multiplyScalar(a);this.projectiles.push({sprite:o,vel:l,dmg:s,life:4,owner:r})}rainOn(t,e,n="proj_bug",s=12){const a=new Mt(new Ge(2.4,2.4),new ui({map:Bi("warn"),transparent:!0,depthWrite:!1}));a.rotation.x=-Math.PI/2,a.position.set(t,.04,e),this.world.add(a);const r=new cs(new In({map:Bi(n),blending:ca,depthWrite:!1}));r.scale.setScalar(.8),r.position.set(t,ge+3,e),this.world.add(r),this.projectiles.push({sprite:r,vel:new D(0,-4,0),dmg:s,life:3,owner:null,falling:!0,warn:a})}onChargeHit(t){for(const e of this.level?.pipes??[]){if(e.burst)continue;const{x:n,z:s}=ve(e.col,e.row);if(Math.hypot(t.pos.x-n,t.pos.z-s)<2.2)return this.burstPipe(e),!0}return!1}burstPipe(t){if(t.burst)return;t.burst=!0;const{x:e,z:n}=ve(t.col,t.row);X.explosion({x:e,y:1.5,z:n}),this.shake=Math.max(this.shake,.6),t.mesh.material=t.mesh.material.clone(),t.mesh.material.color.setHex(4212815);for(let s=0;s<40;s++)this.particle(new D(e,1+Math.random()*2,n),15267071,new D((Math.random()-.5)*6,Math.random()*2,(Math.random()-.5)*6),1.4,-.4,.3);for(const s of this.enemies)s.alive&&Math.hypot(s.pos.x-e,s.pos.z-n)<5&&(s.vulnerable=!0,s.damage(s.kind.boss?60:120,"weak"),s.freeze(s.kind.boss?5:4),setTimeout(()=>s.vulnerable=!1,5e3));Math.hypot(this.playerPos.x-e,this.playerPos.z-n)<3&&this.damagePlayer(12,new D(e,0,n))}particleGeo=new fe(1,1,1);particle(t,e,n,s,a=-9,r=.05){this.particles.length>200&&this.world.remove(this.particles.shift().mesh);const o=new Mt(this.particleGeo,new ui({color:e,transparent:!0,depthWrite:!1}));o.scale.setScalar(r),o.position.copy(t),this.world.add(o),this.particles.push({mesh:o,vel:n,life:s,gravity:a})}decal(t,e,n=!1,s=.08){const a=n?new ui({map:Bi("blood"),transparent:!0,depthWrite:!1}):new ui({color:526344,depthWrite:!1}),r=new Mt(n?new Ge(s,s):new lo(s/2,6),a);r.position.copy(t).addScaledVector(e,.012),r.lookAt(t.clone().add(e)),this.world.add(r),this.decals.push(r),this.decals.length>60&&this.world.remove(this.decals.shift())}fire(){const t=Ce[this.current];if(!(this.fireCd>0||this.weapon.busy||this.weapon.reloading>0)&&!(!t.auto&&this.triggerHeld)){if(this.triggerHeld=!0,t.melee){this.slash(t);return}if(this.mags[this.current]<=0){X.dryFire(),this.fireCd=.3,this.startReload();return}this.mags[this.current]--,this.fireCd=t.rate,this.lastShotT=this.time,this.noise(t.pellets?24:20),this.weapon.kick(),this.stats.shots++,t.id==="cryo"?X.sample("cryo_blast",.7)||X.flash():t.pellets?(X.sample("pistol_shot",1,.6)||X.gunshot(),X.explosion(),setTimeout(()=>X.reload(),380)):X.sample("pistol_shot",t.id==="mg"?.5:.8,t.id==="mg"?.85:1)||X.gunshot(),this.onShot?.(),this.pitch+=t.pellets?.03:t.id==="mg"?.006:.014,this.yaw+=(Math.random()-.5)*(t.id==="mg"?.01:.004),this.flashBurst=Math.max(this.flashBurst,t.pellets?.1:.05),t.pellets&&(this.shake=Math.max(this.shake,.25));for(let e=0;e<(t.pellets??1);e++)this.shootRay(t,e>0)}}shootRay(t,e){const n=Math.min(1,this.vel.length()/3),s=t.spread*(1+n),a=this.camera.getWorldPosition(new D),r=new D((Math.random()-.5)*s*2,(Math.random()-.5)*s*2,-1).normalize().applyQuaternion(this.camera.quaternion);if(this.settings.aimAssist&&!t.pellets){let c=.09,h=null;for(const u of this.enemies){if(!u.alive||u.state==="dormant"||u.kind.passive&&!u.enraged)continue;const d=u.center().sub(a);if(d.length()>30)continue;d.normalize();const f=d.angleTo(r);f<c&&$n(a.x,a.z,u.pos.x,u.pos.z)&&(c=f,h=d)}h&&r.lerp(h,.75).normalize()}let o=null;for(const c of this.enemies){const h=c.hitTest(a,r);h&&(!o||h.dist<o.dist)&&(o={e:c,...h})}this.raycaster.set(a,r),this.raycaster.far=90;const l=this.raycaster.intersectObjects(this.level?.colliders??[],!1)[0];if(o&&(!l||o.dist<l.distance)){const c=o.e,h=t.id==="cryo";c.damage(t.dmg,o.part,{cryo:h}),e||this.stats.hits++,o.part==="head"&&!e&&this.stats.headshots++,this.hud.hit(!c.alive,o.part!=="body");const u=r.clone().negate();for(let d=0;d<(e?3:o.part==="head"?14:8);d++)this.particle(o.point,h?12580607:d%3?7997957:13641744,new D((Math.random()-.5)*3,Math.random()*3,(Math.random()-.5)*3).addScaledVector(u,2),.6);if(h)for(const d of this.enemies)d!==c&&d.alive&&d.pos.distanceTo(c.pos)<2.5&&d.damage(t.dmg*.5,"body",{cryo:!0})}else if(l){if(l.object.userData.pipe){const u=this.level.pipes.find(d=>d.mesh===l.object);u&&this.burstPipe(u)}const h=l.face?l.face.normal.clone().transformDirection(l.object.matrixWorld):r.clone().negate();(!e||Math.random()<.4)&&this.decal(l.point,h);for(let u=0;u<(e?2:5);u++)this.particle(l.point.clone().addScaledVector(h,.03),t.id==="cryo"?2559:16760928,h.clone().multiplyScalar(2).add(new D((Math.random()-.5)*3,Math.random()*2,(Math.random()-.5)*3)),.25,-6,.025)}}slash(t){this.fireCd=t.rate,this.lastShotT=this.time,this.noise(6),this.weapon.kick(),this.stats.shots++;const e=X;e.noise(.18,e.out(),"bandpass",2600,.35,1.2,.01),e.tone("sine",900,300,.15,.06,e.out());const n=new D(-Math.sin(this.yaw),0,-Math.cos(this.yaw));let s=0;setTimeout(()=>{for(const a of this.enemies){const r=new D(a.pos.x-this.playerPos.x,0,a.pos.z-this.playerPos.z),o=r.length()-a.kind.radius;if(a.downed&&o<2.2){a.finish(),this.hud.message("赤霄斩首——它不会再爬起来了");for(let c=0;c<12;c++)this.particle(a.pos.clone().setY(.3),7997957,new D((Math.random()-.5)*3,Math.random()*3,(Math.random()-.5)*3),.6);s++;continue}if(!a.alive||a.state==="dormant"&&a.kind.passive||o>2.4||r.normalize().dot(n)<.45)continue;a.damage(t.dmg,"body",{melee:!0}),a.kind.boss&&a.interrupt?.(),s++;const l=a.center();for(let c=0;c<10;c++)this.particle(l,c%3?7997957:13641744,new D((Math.random()-.5)*4,Math.random()*3,(Math.random()-.5)*4),.6);this.hud.hit(!a.alive,!1)}s&&(this.stats.hits++,e.hitFlesh(),this.shake=Math.max(this.shake,.2)),this.onSlash?.(this.playerPos,n)},120)}onBell=null;fireBurst(t,e,n=4){const s=new D(t,.4,e);X.explosion(s),this.shake=Math.max(this.shake,.5),this.flashBurst=Math.max(this.flashBurst,.3);for(let a=0;a<40;a++)this.particle(s.clone().add(new D((Math.random()-.5)*n,Math.random()*.6,(Math.random()-.5)*n)),a%3?16744480:16765024,new D((Math.random()-.5)*2,2+Math.random()*3,(Math.random()-.5)*2),.9,2,.08);for(const a of this.enemies)Math.hypot(a.pos.x-t,a.pos.z-e)>n||(a.downed?a.finish():a.alive&&a.damage(a.kind.boss?120:140,"body",{fire:!0}));Math.hypot(this.playerPos.x-t,this.playerPos.z-e)<n*.6&&this.damagePlayer(15,s)}onSlash=null;startReload(){const t=Ce[this.current];t.melee||this.weapon.reloading>0||this.mags[this.current]>=t.mag||this.reserve[t.ammo]<=0||(this.weapon.reloading=t.reload,X.reload())}useScan(){if(!(!this.scanUnlocked||this.scanCd>0)){this.scanT=6,this.scanCd=12,this.scanning=!0,this.hud.setScan(!0),X.sample("scanner_pulse",.6)||X.scan();for(const t of this.enemies)t.kind.boss&&(t.weakVisible=!0);for(const t of this.level?.secrets.values()??[])t.position.distanceTo(this.playerPos)<15&&t.material.emissive?.setHex(3346688);this.onScan?.()}}useFlash(){if(!this.flashUnlocked||this.flashCd>0)return;this.flashCd=8,this.flashBurst=.6,this.hud.whiteFlash(),X.flash();const t=new D(-Math.sin(this.yaw),0,-Math.cos(this.yaw));for(const e of this.enemies){if(!e.alive||e.state==="dormant")continue;const n=new D(e.pos.x-this.playerPos.x,0,e.pos.z-this.playerPos.z),s=n.length();s>13||n.normalize().dot(t)<.8&&s>2||$n(this.playerPos.x,this.playerPos.z,e.pos.x,e.pos.z)&&e.stun(e.kind.boss?1:3.2)}}useBell(){const t=this.npcs.get("man");if(!(!this.bellUnlocked||this.bellCd>0)){if(this.bellOwn){this.bellCd=12,this.weapon.showBell(),X.sample("bronze_bell_long",.8)||X.bellRing();for(const e of this.enemies)!e.alive||e.kind.human||Math.hypot(e.pos.x-this.playerPos.x,e.pos.z-this.playerPos.z)<6.5&&e.stun(e.kind.boss?1.5:2.5);this.onBell?.();return}this.bellCd=60,t&&(t.ringT=1.2),this.weapon.showBell(),X.sample("bronze_bell_long",.8)||X.bellRing();for(const e of this.enemies)e.alive&&Math.hypot(e.pos.x-this.playerPos.x,e.pos.z-this.playerPos.z)<16&&(this.flags.has("bellCharm")&&e.kind.name!=="无名会武装"?e.charmT=8:e.kind.boss?e.stun(2):e.flee(6))}}useZhenyin(){if(!this.zhenyinUnlocked||this.zhenyinCd>0)return;this.zhenyinCd=25,this.weapon.showBell(),[0,520,1040,1420,1640].forEach((e,n)=>setTimeout(()=>X.sample(n<3?"bronze_bell_long":"bronze_bell_short",.6)||X.bell(void 0,.5),e));for(const e of this.enemies)e.alive&&Math.hypot(e.pos.x-this.playerPos.x,e.pos.z-this.playerPos.z)<13&&e.stun(e.kind.boss?1.5:4)}useHerb(){this.herbs<=0||this.hp>=100||this.healCd>0||(this.herbs--,this.hp=Math.min(100,this.hp+40),this.healCd=1,X.pickup(),this.hud.message("使用草药：生命 +40"))}tryUse(){const t=-Math.sin(this.yaw),e=-Math.cos(this.yaw);for(const n of this.enemies){if(!n.alive||n.state!=="idle"&&n.state!=="dormant"||!n.kind.ranged||n.kind.boss)continue;const s=n.pos.x-this.playerPos.x,a=n.pos.z-this.playerPos.z,r=Math.hypot(s,a);if(r<1.8&&(s*t+a*e)/r>.6)return n.damage(9999,"head"),X.hitFlesh(),this.hud.message("无声击倒"),!0}for(const n of[.9,1.8,2.6]){const{col:s,row:a}=Ze(this.playerPos.x+t*n,this.playerPos.z+e*n),r=ke(s,a);if(cn(r)&&!oa(r)){const l=this.level.doors.get(r).def;return l.key&&!this.keys.has(l.key)?(this.hud.message(`需要${{red:"红色",blue:"蓝色",yellow:"黄色"}[l.key]}钥匙卡`),X.dryFire()):l.flag&&!this.flags.has(l.flag)?(this.hud.message(l.label?`${l.label}：被封锁`:"门被锁住了"),X.dryFire()):this.openDoor(r),!0}if(r==="$"&&this.level.openSecretAt(s,a))return this.stats.secrets++,this.flow.invalidate(),X.door(),this.hud.message("发现隐藏区域！"),!0;if(Ri(s,a))break}return!1}start(){let t=performance.now();const e=n=>{const s=Math.min(.05,(n-t)/1e3);t=n,this.frame(s),requestAnimationFrame(e)};requestAnimationFrame(e)}frame(t){if(this.state==="menu"||this.state==="inter"){this.menuT+=t,this.level?(this.camera.position.set(this.playerPos.x+Math.sin(this.menuT*.1)*2,1.8,this.playerPos.z+Math.cos(this.menuT*.1)*2),this.camera.rotation.set(0,this.menuT*.05,0),this.level.update(t,this.camera.position,this.camera.position),this.renderer.render(this.scene,this.camera)):(this.renderer.setClearColor(0),this.renderer.clear()),this.weapon.update(t,0,!1);return}if(this.state==="cine"){this.weapon.update(t,0,!1);return}if(this.state==="playing"){this.input.update(),this.input.consume("pause")&&!this.hud.documentOpen&&!this.mg.active&&(this.mapOpen?this.mapOpen=!1:this.pause()),this.mg.active||this.hud.documentOpen?this.input.takeLook():(this.time+=t,this.stats.time+=t,this.totalTime+=t,this.updatePlayer(t),this.updateWorld(t));for(let e=this.waiters.length-1;e>=0;e--){const n=this.waiters[e];n.cond()&&(this.waiters.splice(e,1),n.resolve())}}else this.state==="dead"&&this.updateWorld(t*.25);this.syncCamera(t),this.renderer.render(this.scene,this.camera)}updatePlayer(t){const e=this.input,n=!this.cutscene,s=e.takeLook();if(n)this.yaw-=s.dx,this.pitch=Math.max(-1.3,Math.min(1.3,this.pitch-s.dy));else if(this.lookTarget){const E=this.lookTarget.x-this.playerPos.x,I=this.lookTarget.z-this.playerPos.z;let N=Math.atan2(-E,-I)-this.yaw;for(;N>Math.PI;)N-=Math.PI*2;for(;N<-Math.PI;)N+=Math.PI*2;this.yaw+=N*Math.min(1,t*2.5),this.pitch+=(Math.atan2(this.lookTarget.y-nr,Math.hypot(E,I))-this.pitch)*Math.min(1,t*2.5)}let a=n?e.moveX:0,r=n?e.moveY:0;const o=Math.hypot(a,r);o>1&&(a/=o,r/=o);const{col:l,row:c}=Ze(this.playerPos.x,this.playerPos.z);this.water=ke(l,c)==="~";const h=e.sprint&&r>.3&&this.stamina>.05&&!this.water,u=zi==="tang"?4.4:3.8;let d=(r<-.1?u*.75:u)*(h?1.6:1);this.water&&(d*=.6),h?this.stamina=Math.max(0,this.stamina-t*.16):this.stamina=Math.min(1,this.stamina+t*.18);const f=Math.sin(this.yaw),g=Math.cos(this.yaw);let _=(a*g-r*f)*d,m=(-a*f-r*g)*d;n&&e.consume("dash")&&this.dashCd<=0&&this.stamina>.3&&(this.dashT=.28,this.dashCd=1.2,this.stamina-=.3,o>.1?this.dashDir.set(_,0,m).normalize():this.dashDir.set(-a||f,0,g),X.step(!1)),this.dashT>0&&(this.dashT-=t,_=this.dashDir.x*9,m=this.dashDir.z*9),this.dashCd-=t;const p=Math.min(1,t*8);this.vel.x+=(_-this.vel.x)*p,this.vel.z+=(m-this.vel.z)*p;const w=this.playerPos.clone();this.playerPos.x+=this.vel.x*t,this.playerPos.z+=this.vel.z*t,bs(this.playerPos,.38);{const E=Ze(this.playerPos.x+this.vel.x*.25,this.playerPos.z+this.vel.z*.25),I=ke(E.col,E.row);if(cn(I)&&!oa(I)){const N=this.level.doors.get(I);N&&!N.def.key&&!N.def.flag&&this.openDoor(I)}}const A=w.distanceTo(this.playerPos);this.stepDist+=A,this.bobT+=A*2.2,this.stepDist>(h?1.9:1.6)&&(this.stepDist=0,X.step(ke(l,c)===","||this.water));const M=Ce[this.current];if(this.fireCd-=t,e.fire||(this.triggerHeld=!1),n){const E=Math.hypot(e.moveX,e.moveY)>.5;if(e.consume("map")&&(this.mapOpen=!this.mapOpen,this.mapArm=!1),this.mapOpen&&(E||(this.mapArm=!0),(e.fire&&!this.triggerHeld||this.hud.mapTapped()||this.mapArm&&E)&&(this.mapOpen=!1,this.triggerHeld=!0)),e.fire&&!this.mapOpen&&this.fire(),e.consume("reload")&&this.startReload(),e.consume("scan")&&this.useScan(),e.consume("flash")&&this.useFlash(),e.consume("bell")&&this.useBell(),e.consume("zhenyin")&&this.useZhenyin(),e.consume("heal")&&this.useHerb(),e.consume("weapon1")&&this.switchWeapon("pistol"),e.consume("weapon2")&&this.switchWeapon("mg"),e.consume("weapon3")&&this.switchWeapon("cryo"),e.consume("nextWeapon")){const I=["pistol","mg","cryo"].filter(N=>this.owned.has(N));this.switchWeapon(I[(I.indexOf(this.current)+1)%I.length])}this.mags[this.current]===0&&this.reserve[M.ammo]>0&&!e.fire&&this.startReload()}else{for(const E of["reload","scan","flash","bell","zhenyin","heal","weapon1","weapon2","weapon3","nextWeapon","map"])e.consume(E);this.mapOpen=!1}if(this.weapon.reloading>0&&(this.weapon.reloading-=t,this.weapon.reloading<=0)){const E=M.mag-this.mags[this.current],I=Math.min(E,this.reserve[M.ammo]);this.mags[this.current]+=I,this.reserve[M.ammo]-=I}let P=null,S=2.4;const T=new D(-f,0,-g);if(n)for(const E of this.interactables){if(!E.active)continue;const I=new D(E.pos.x-this.playerPos.x,0,E.pos.z-this.playerPos.z),N=I.length();N>S||N>.7&&I.normalize().dot(T)<.3||(P=E,S=N)}let C=null;if(!P&&n)for(const E of[.9,1.8]){const I=Ze(this.playerPos.x+T.x*E,this.playerPos.z+T.z*E),N=ke(I.col,I.row);if(cn(N)&&!oa(N)){C="开门";break}if(Ri(I.col,I.row))break}const x=P?P.label:C;this.hud.setPrompt(x?`【互动】 ${x}`:null),this.input.setButton("use",{visible:!!x||!0}),e.consume("use")&&n&&(P?(X.pickup(),P.onUse()):this.tryUse());for(const E of this.pickups){if(E.taken){E.respawn>0&&(E.timer-=t,E.timer<=0&&(E.taken=!1,E.sprite.visible=!0));continue}E.sprite.position.y=.45+Math.sin(this.time*2.5+E.sprite.position.x)*.06,!(Math.hypot(E.sprite.position.x-this.playerPos.x,E.sprite.position.z-this.playerPos.z)>1.1)&&this.takePickup(E.type)&&(E.taken=!0,E.sprite.visible=!1,E.timer=E.respawn,E.counted&&(this.stats.items++,E.counted=!1),X.pickup())}if(this.exitPads.some(E=>Math.hypot(E.x-this.playerPos.x,E.z-this.playerPos.z)<1.2))if(this.exitResolve){const E=this.exitResolve;this.exitResolve=null,X.door(),E()}else this.exitEnabled||this.hud.message("还有未完成的目标");if(this.scanCd=Math.max(0,this.scanCd-t),this.flashCd=Math.max(0,this.flashCd-t),this.bellCd=Math.max(0,this.bellCd-t),this.zhenyinCd=Math.max(0,this.zhenyinCd-t),this.healCd=Math.max(0,this.healCd-t),this.scareCd-=t,this.scanT>0&&(this.scanT-=t,this.scanT<=0)){this.scanning=!1,this.hud.setScan(!1);for(const E of this.enemies)E.weakVisible=!1}this.water?(this.oxygen=Math.max(0,this.oxygen-t*4.5),this.oxygen<=0&&(this.hp-=t*8,this.hud.damage(),this.hp<=0&&(this.hp=0,this.setState("dead")))):this.oxygen=Math.min(100,this.oxygen+t*25),this.hud.setWater(this.water);const y=!!this.npcs.get("man")?.following;this.hud.set({hp:this.hp,armor:this.armor,ammo:M.melee?"—":this.mags[this.current],ammoName:M.name,reserve:this.reserve,reserveNames:zi==="tang"?["手枪弹","霰弹",null]:void 0,weapons:["pistol","mg","cryo"].map(E=>({slot:Ce[E].slot,name:Ce[E].name,owned:this.owned.has(E),active:this.current===E})),keys:[...this.keys],herbs:this.herbs,stamina:this.stamina,oxygen:this.oxygen<99.5||this.water?this.oxygen:null,reloading:this.weapon.reloading>0,abilities:[{key:"F",name:"强光",cd:this.flashCd,max:8,on:this.flashUnlocked},{key:"C",name:"勘察镜",cd:this.scanCd,max:12,on:this.scanUnlocked},{key:"Q",name:"铜铃",cd:this.bellCd,max:this.bellOwn?12:60,on:this.bellUnlocked&&(y||this.bellOwn)},{key:"Z",name:"镇音",cd:this.zhenyinCd,max:25,on:this.zhenyinUnlocked},{key:"Space",name:"闪避",cd:Math.max(0,this.dashCd),max:1.2,on:!0}]}),this.input.setButton("scan",{visible:this.scanUnlocked,cooldown:this.scanCd/12}),this.input.setButton("flash",{visible:this.flashUnlocked,cooldown:this.flashCd/8}),this.input.setButton("bell",{visible:this.bellUnlocked&&(y||this.bellOwn),cooldown:this.bellCd/(this.bellOwn?12:60)}),this.input.setButton("zhenyin",{visible:this.zhenyinUnlocked,cooldown:this.zhenyinCd/25}),this.input.setButton("weapon",{visible:this.owned.size>1}),this.input.setButton("dash",{cooldown:Math.max(0,this.dashCd)/1.2}),this.hud.setCrosshair(Math.min(1,this.vel.length()/3),!this.cutscene),this.hud.update(t,this.hp),X.heartbeat(t,this.hp<35?(35-this.hp)/35:0),this.boss&&this.hud.setBoss(this.boss.alive?this.bossName||this.boss.name:null,this.boss.hp/this.boss.maxHp),this.hud.markExplored(this.playerPos.x,this.playerPos.z),this.hud.drawMap(this.mapOpen,this.playerPos.x,this.playerPos.z,this.yaw,this.exitEnabled?this.exitPads:[])}takePickup(t){const e=n=>this.hud.message(n);switch(t){case"ammo":return this.reserve.ammo+=12,e("拾取 手枪弹 ×12"),!0;case"mg_ammo":return zi==="tang"?(this.reserve.mg_ammo+=8,e("拾取 霰弹 ×8"),!0):(this.reserve.mg_ammo+=50,e("拾取 机枪弹 ×50"),!0);case"cryo_ammo":return this.reserve.cryo_ammo+=6,e("拾取 冷凝弹 ×6"),!0;case"herb":return this.herbs++,e("拾取 草药"),!0;case"medkit":return this.hp>=100?!1:(this.hp=Math.min(100,this.hp+25),e("急救包：生命 +25"),!0);case"armor":return this.armor>=100?!1:(this.armor=Math.min(100,this.armor+50),e(zi==="tang"?"牛皮护甲：护甲 +50":"NBER 防弹背心：护甲 +50"),!0);case"key_red":return this.keys.add("red"),e("获得 红色钥匙卡"),!0;case"key_blue":return this.keys.add("blue"),e("获得 蓝色钥匙卡"),!0;case"key_yellow":return this.keys.add("yellow"),e("获得 黄色钥匙卡"),!0;case"weapon_mg":return zi==="tang"?(this.giveWeapon("mg",8),e("缴获 短管霰弹枪"),!0):(this.giveWeapon("mg",60),e("获得 重机枪"),!0);case"weapon_cryo":return this.giveWeapon("cryo",12),e("获得 冷凝枪"),!0}return!1}updateWorld(t){const{col:e,row:n}=Ze(this.playerPos.x,this.playerPos.z);if(this.flow.update(e,n),this.frozen)for(const a of this.enemies)a.group.rotation.y=Math.atan2(this.camPos.x-a.pos.x,this.camPos.z-a.pos.z);else{for(const a of this.enemies){if(!a.alive&&!a.justDied&&a.mat.opacity<=0){a.group.visible=!1;continue}if(!(a.alive&&Math.abs(a.pos.x-this.playerPos.x)+Math.abs(a.pos.z-this.playerPos.z)>55)){if(a.charmT>0){const r=this.enemies.find(o=>o.alive&&o.kind.name==="无名会武装"&&o.pos.distanceTo(a.pos)<14);if(r){const o=r.pos.x-a.pos.x,l=r.pos.z-a.pos.z,c=Math.hypot(o,l);c>1.3?(a.pos.x+=o/c*a.speed*t,a.pos.z+=l/c*a.speed*t,bs(a.pos,a.kind.radius)):Math.random()<t*1.5&&r.damage(30,"body"),a.group.position.set(a.pos.x,0,a.pos.z),a.group.rotation.y=Math.atan2(this.camPos.x-a.pos.x,this.camPos.z-a.pos.z),a.charmT-=t;continue}}if(a.update(t,this),a.justHurt){a.justHurt=!1;for(const r of this.enemies)r!==a&&r.alive&&r.pos.distanceTo(a.pos)<9&&r.alert(this.playerPos.x,this.playerPos.z)}if(a.justDied){a.justDied=!1,a.kind.name!=="菌丝锚点"&&!a.killCounted&&this.stats.kills++,a.killCounted=!0;const r=this.camPos.x-a.pos.x,o=this.camPos.z-a.pos.z,l=Math.hypot(r,o)||1,c=new D(a.pos.x-r/l*.6,.02,a.pos.z-o/l*.6);this.decal(c,new D(0,1,0),!0,a.height*.9),!a.kind.boss&&Math.random()<.3&&this.dropLoot(a.pos),this.onKill?.(a)}}}for(let a=0;a<this.enemies.length;a++){const r=this.enemies[a];if(!(!r.alive||r.kind.speed===0))for(let o=a+1;o<this.enemies.length;o++){const l=this.enemies[o];if(!l.alive||l.kind.speed===0)continue;const c=l.pos.x-r.pos.x,h=l.pos.z-r.pos.z,u=r.kind.radius+l.kind.radius,d=c*c+h*h;if(d<u*u&&d>1e-6){const f=Math.sqrt(d),g=(u-f)/2;r.pos.x-=c/f*g,r.pos.z-=h/f*g,l.pos.x+=c/f*g,l.pos.z+=h/f*g}}}this.updateProjectiles(t)}for(const a of this.props)a.rotation.y=Math.atan2(this.camPos.x-a.position.x,this.camPos.z-a.position.z);const s=this.npcs.get("su");for(const a of this.npcs.values())a.update(t,this.playerPos,this.camPos,this.flow,a.id==="man"&&s?.following?s.pos:void 0);for(let a=this.particles.length-1;a>=0;a--){const r=this.particles[a];if(r.life-=t,r.life<=0){this.world.remove(r.mesh),r.mesh.material.dispose(),this.particles.splice(a,1);continue}r.vel.y+=r.gravity*t,r.mesh.position.addScaledVector(r.vel,t),r.mesh.position.y<.01&&(r.mesh.position.y=.01,r.vel.set(0,0,0)),r.mesh.material.opacity=Math.min(.9,r.life*2)}if(this.electrified.size&&Math.random()<.6)for(const[a,r]of this.electrified){if(r<this.time){this.electrified.delete(a);continue}if(Math.random()<.15){const{x:o,z:l}=ve(a%Ht,Math.floor(a/Ht));this.particle(new D(o+(Math.random()-.5)*2,.1,l+(Math.random()-.5)*2),10479871,new D((Math.random()-.5)*2,2+Math.random()*2,(Math.random()-.5)*2),.3,-8,.04)}}this.level?.update(t,this.playerPos,this.camPos)}dropLoot(t){const e=["ammo","ammo","herb","medkit"];this.owned.has("mg")&&e.push("mg_ammo"),this.owned.has("cryo")&&!Ce.cryo.melee&&e.push("cryo_ammo");const n=e[Math.random()*e.length|0],{col:s,row:a}=Ze(t.x,t.z),r=ve(s,a);this.addPickup(n,s,a,0,t.x-r.x,t.z-r.z),this.stats.totalItems--,this.pickups[this.pickups.length-1].counted=!1}updateProjectiles(t){for(let e=this.projectiles.length-1;e>=0;e--){const n=this.projectiles[e];n.life-=t,n.falling&&(n.vel.y-=14*t),n.sprite.position.addScaledVector(n.vel,t);const s=n.sprite.position;let a=n.life<=0;const{col:r,row:o}=Ze(s.x,s.z);if(!n.falling&&(Ri(r,o)&&ke(r,o)!=="b"&&ke(r,o)!=="T"||s.y<0)&&(a=!0),n.falling&&s.y<=.3){a=!0,Math.hypot(s.x-this.playerPos.x,s.z-this.playerPos.z)<1.3&&this.damagePlayer(n.dmg,s.clone());for(let l=0;l<8;l++)this.particle(s.clone(),9441288,new D((Math.random()-.5)*4,Math.random()*3,(Math.random()-.5)*4),.5)}!n.falling&&!a&&Math.hypot(s.x-this.playerPos.x,s.z-this.playerPos.z)<.6&&s.y<2.1&&(this.damagePlayer(n.dmg,n.owner?.pos??s.clone()),a=!0),a&&(this.world.remove(n.sprite),n.warn&&this.world.remove(n.warn),this.projectiles.splice(e,1))}}syncCamera(t){this.shake=Math.max(0,this.shake-t*1.4);const e=Math.sin(this.bobT)*.04,n=this.shake*this.shake,s=this.water?1.25:nr;this.camera.position.set(this.playerPos.x+(Math.random()-.5)*n*.3,s+e+(Math.random()-.5)*n*.3,this.playerPos.z+(Math.random()-.5)*n*.3),this.camPos.copy(this.camera.position),this.camera.rotation.set(this.pitch,this.yaw,Math.sin(this.bobT*.5)*.006+(this.dashT>0?.05:0)),this.flashBurst=Math.max(0,this.flashBurst-t);const a=this.flashlightWeak?32:70;this.flashlight.intensity=this.flashBurst>0?a+this.flashBurst*500:a,this.flashlight.angle=this.flashBurst>.1?.7:.48,X.setListener(this.playerPos.x,nr,this.playerPos.z,-Math.sin(this.yaw),-Math.cos(this.yaw));const r=Math.min(1,this.vel.length()/3);this.weapon.update(t,r,(this.state==="playing"||this.state==="dead")&&!this.cutscene&&!this.mapOpen)}}const j0={id:1,title:"云梦号",place:"长江丰都段 · 豪华游轮",pov:"lin",mural:"tex:m_ch1",par:900,map:["RRRRRRRRRRRRRRRRRRRR%%%%%%%%%%","R,,,,,,,,,,,,,,,,,,R%%%%%%%%%%","R,,@,,,,,,,,,,,,,,,R%%%%%%%%%%","R,,,,,,,,,,,,,,,,,,R%%%%%%%%%%","R,,,,,,,,,,,,,,,,,,R%%%%%%%%%%","%%%%%%%%%1%%%%%%%%%%%%%%%%%%%%","#..................#..#......#","#..T..T..P..T..T...#..#.....d#","#..T..T.....T..T...#..3......#","#..................#..#......#","#..P...........P...2..########","#..................#..#......#","#..T..T.....T..T...#..4.....d#","#..T..T..P..T..T...#..#......#","#..................#..#......#","####################..########","#......#...........#..#.....d#","#..w...#..c..c..c..#..5......#","#......#...........6..#......#","#X.....#..c..c..c..#..#.....o#","#......#...........#..########","###8#########7################","#..................#..########","#..p....b.....p....$..########","#..................#..########","#..p.....b....p....###########","#..................###########","##############################"],doors:[{id:"1",flag:"phone",trigger:"phone",label:"主舱门"},{id:"2",flag:"hall",trigger:"aw3",label:"客房走廊"},{id:"3"},{id:"4"},{id:"5",flag:"cabin",trigger:"list",label:"客房"},{id:"6",key:"red"},{id:"7"},{id:"8",flag:"butcher",trigger:"butcher",label:"驾驶舱"}],marks:{startYaw:[-1,0],phone:[12,3],hall:[9,6],aw1:[8,9],aw2:[12,11],aw3:[5,11],list:[24,11],card:[25,13],wardrobe:[27,19],man:[27,19],corridor:[20,9],kitchen:[13,17],coldDoor:[13,20],cold:[13,22],butcher:[9,25],zhou:[3,20],bridge:[3,18],exit:[1,19],wave1:[20,6],wave2:[21,7],wave3:[20,9],wave4:[21,11],cabinGu:[26,6],corrGu1:[21,14],corrGu2:[20,19],cook1:[11,16],cook2:[16,19],cook3:[9,18],ammoA:[6,22],ammoB:[12,26],herbC:[1,26]},items:[{type:"ammo",at:[7,3]},{type:"herb",at:[17,6]},{type:"ammo",at:[1,14]},{type:"armor",at:[18,14]},{type:"ammo",at:[21,11]},{type:"ammo",at:[27,9]},{type:"herb",at:[24,6]},{type:"medkit",at:[27,14]},{type:"key_red",at:[25,13]},{type:"ammo",at:[24,16]},{type:"herb",at:[8,20]},{type:"ammo",at:[18,16]},{type:"armor",at:[20,23],secret:!0},{type:"ammo",at:[21,22],secret:!0},{type:"medkit",at:[21,24],secret:!0}],lights:[{at:[1,1],color:16718352,intensity:6,flicker:2,y:3.5},{at:[9,6],color:16756832,intensity:4,flicker:.5},{at:[9,10],color:16767392,intensity:8,flicker:.8,y:2.3},{at:[20,7],color:16769200,intensity:4,flicker:1},{at:[21,13],color:16769200,intensity:3,flicker:.3},{at:[20,19],color:16769200,intensity:3,flicker:1},{at:[25,7],color:16760960,intensity:3,flicker:.1},{at:[26,12],color:16760960,intensity:3,flicker:.4},{at:[26,18],color:16756848,intensity:3,flicker:.2},{at:[13,18],color:13693183,intensity:5,flicker:.9},{at:[9,22],color:8962303,intensity:6,flicker:.2},{at:[9,26],color:16719888,intensity:4,flicker:.6},{at:[3,17],color:3211136,intensity:3,y:1.6}],theme:{wall:"tex:wood_panel",wall2:"tex:ship_wall",mural:"tex:m_ch1",floor:"tex:carpet",floorOut:"p:deck",ceiling:"p:ceiling",fog:329738,fogDensity:.055,hemi:[5334650,2759184,.55],sky:"sky:f01",water:!0,zones:[{rect:[8,16,18,20],wall:"p:metal",floor:"p:tile"},{rect:[1,16,6,20],wall:"p:metal",floor:"p:metal"},{rect:[1,22,22,26],wall:"tex:frost_door",floor:"p:frost"}]},route:["phone","hall","aw3","corridor","list","card","wardrobe","kitchen","cold","butcher","exit"]},Y0={id:2,title:"回溯·七二一",place:"巫山深处 · 废弃地下军工厂（三个月前）",pov:"zhou",mural:"tex:m_ch2",par:900,map:["####################################","#,,ttt,,,,,,,,,t,=,,,,,,t,t,,,,,,,,#","#,,,,t,,,,,,,,,,,=,,,t,,,,,t,,,,,t,#","#,@,,,,,tt,,,,,,,=,,,,,,,,,,,,,,,,,#","#,,,,,t,,,,,,,,,,=,,,,,,,,,,t,,,,,,#","#,,,,,,,,,,,,,,,,=,,,,,,,,,,,,,,,,,#","#%%%%%%%%%%%%%%%%1%%%%%%%%%%%%%%%%%#","#................=.........#...c...#","#...b............=....c....#.......#","#........c.......=.........2.......#","#.......P....P...=...P.....#.....c.#","#................=.........#.......#","#...m.......b....=....b....###$#####","#................=.........#.......#","#####3##############################","#...k.k.k.k.k.k.k.k.k.k.k..#########","#..........................#########","#..........................#########","#..........................#########","#...k.k.k.k.k.k.k.k.k.k.k..#########","#############4######################","#.......m..........m......m....#..b#","#==============================5...#","#==============================#...#","#X.............................#...#","####################################"],doors:[{id:"1",label:"七二一厂"},{id:"2"},{id:"3",flag:"hack",trigger:"terminal",label:"下层铁门"},{id:"4",key:"yellow",label:"铜锁铁门"},{id:"5"}],marks:{startYaw:[2,0],chen:[3,2],gate:[17,7],guard1:[6,9],guard2:[20,11],guard3:[24,8],guard4:[11,12],terminal:[32,9],b1:[5,16],log1:[6,17],log2:[12,16],log3:[18,18],log4:[24,17],tank:[11,15],b1gu1:[15,17],b1gu2:[22,16],b2:[13,21],power:[2,21],ore1:[20,22],ore2:[27,23],archive:[33,22],horde1:[28,22],horde2:[29,23],horde3:[25,21],horde4:[24,24],exit:[1,24]},items:[{type:"ammo",at:[3,4]},{type:"mg_ammo",at:[30,2]},{type:"herb",at:[2,12]},{type:"ammo",at:[25,7]},{type:"armor",at:[33,8]},{type:"mg_ammo",at:[29,13],secret:!0},{type:"medkit",at:[33,13],secret:!0},{type:"herb",at:[2,17]},{type:"ammo",at:[20,17]},{type:"key_yellow",at:[25,17]},{type:"mg_ammo",at:[5,24]},{type:"medkit",at:[16,21]},{type:"ammo",at:[33,24]}],lights:[{at:[9,3],color:14213328,intensity:3,flicker:0},{at:[17,7],color:16773328,intensity:4,flicker:.2},{at:[8,11],color:16769200,intensity:4,flicker:.6},{at:[22,9],color:16769200,intensity:3,flicker:.3},{at:[31,9],color:6356880,intensity:4,flicker:.1},{at:[6,17],color:16724e3,intensity:4,flicker:.4},{at:[14,17],color:16724e3,intensity:4,flicker:.5},{at:[22,17],color:16724e3,intensity:4,flicker:.2},{at:[5,22],color:16760944,intensity:3,flicker:1},{at:[17,23],color:16760944,intensity:3,flicker:.6},{at:[27,22],color:16760944,intensity:3,flicker:.3},{at:[33,22],color:16719888,intensity:4,flicker:2}],theme:{wall:"tex:factory_wall",wall2:"p:stone",mural:"tex:m_ch2",floor:"p:concrete",floorOut:"p:grass",ceiling:"p:ceiling",fog:724748,fogDensity:.05,hemi:[9083530,2761752,.7],sky:"sky:village",zones:[{rect:[1,1,34,5],wall:"p:stone"},{rect:[1,15,26,19],wall:"p:metal",floor:"tex:wet_tile"},{rect:[1,21,34,24],wall:"p:rust",floor:"p:mud"}]},route:["gate","terminal","b1","log4","b2","power","archive","exit"]},K0={id:3,title:"船舱深处",place:"云梦号底舱 · 淹没的轮机舱与货舱",pov:"lin",mural:"tex:m_ch3",par:900,map:["####################################","#....................#....d#########","#.@..................1.....#########","#....................#.....#########","##########2###########..b..#########","#..........................#########","#...p..........p...........#...#####","#........p..........p......$...#####","#..........................#...#####","#~~~~~~~~~~~~~~~~~~~~.~~~~~#########","#~~~~~..~~~~~~~~~~~~~~~~~~~#########","#~~~~~~~~~~~~~~..~~~~~~~~~~#########","#~~~~~~~~~~p~~~~~~~~~~~~~~~#########","#~~~~~~~~~~~~~~~~~~p~~~~~~~#########","#~~~~~~~~~~~~~~~~~~~~~~~~~~#########","#############3######################","#&.........................#########","#&...........b.............#########","#&..b.................b....#.......#","#&.........................#.......#","#&.......b.......b.........4.....X.#","#&.........................#.......#","#&.........................#.......#","#&..b.................b....#########","#&...........b.............#########","#&.........................#########","####################################"],doors:[{id:"1"},{id:"2"},{id:"3",flag:"switch",trigger:"switch",label:"货舱"},{id:"4",flag:"bride",trigger:"coffin",label:"货舱出口"}],marks:{startYaw:[-1,0],su:[3,1],man:[3,3],zhou:[24,2],engine:[10,6],switch:[24,13],air1:[6,10],air2:[15,11],air3:[21,9],wg1:[12,11],wg2:[18,12],wg3:[8,13],wg4:[22,11],hold:[13,16],coffin:[13,20],crane:[13,21],screen:[2,20],bride:[13,22],exitHall:[30,20],exit:[33,20]},items:[{type:"ammo",at:[5,2]},{type:"herb",at:[18,1]},{type:"mg_ammo",at:[25,3]},{type:"ammo",at:[23,1]},{type:"medkit",at:[2,6]},{type:"ammo",at:[24,6]},{type:"armor",at:[29,7],secret:!0},{type:"ammo",at:[30,6],secret:!0},{type:"herb",at:[6,10]},{type:"ammo",at:[3,17]},{type:"herb",at:[25,25]},{type:"ammo",at:[25,16]},{type:"medkit",at:[3,25]}],lights:[{at:[5,2],color:16765088,intensity:3,flicker:1},{at:[15,2],color:16765088,intensity:3,flicker:.5},{at:[24,2],color:16769184,intensity:4,flicker:.1},{at:[10,6],color:13691135,intensity:4,flicker:.8},{at:[20,8],color:13691135,intensity:3,flicker:.4},{at:[24,13],color:4259744,intensity:4,flicker:.1,y:1},{at:[13,20],color:16722464,intensity:6,flicker:.3,y:3},{at:[5,18],color:16728096,intensity:3,flicker:.6},{at:[22,23],color:16728096,intensity:3,flicker:.4},{at:[31,20],color:16769200,intensity:3,flicker:.5}],theme:{wall:"tex:hold_wall",wall2:"p:metal",mural:"tex:m_ch3",floor:"p:metal",floorOut:"p:deck",ceiling:"p:ceiling",fog:395788,fogDensity:.06,hemi:[4216426,1708048,.6],zones:[{rect:[1,5,26,14],wall:"p:rust"},{rect:[22,1,26,4],wall:"tex:wood_panel",floor:"tex:carpet"}]},route:["engine","switch","hold","coffin","exitHall","exit"]},Z0={id:4,title:"巫山·雾锁",place:"巫山江滩 · 千年傩村与后山悬崖",pov:"lin",mural:"tex:m_ch4",par:1e3,map:["####################################","#,,,,,,t,,,,t,,,,,,,,,,,,,,,,,,,,,,#","#,@,t,,,,,,,t,,,,,,,t,,,,,,,,,,,,,,#","#,,,,,t,,,,,,t,,,,,,,,,,,,,,,,t,,,,#","#,,,,,,,,,,,,,,,,,,,,tt,,,,,,,,,t,t#","#,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,#","##############P,,,,,P###############","#,,,,,,,,,,,,,,,,,,,,,,,,,,t,,,,,,,#","#,,h,h,,,,,,&&&&&&&&&&&,,,,h,ht,,,,#","#,,,,,,,,h,,#P...x...P#,,,,,,,,,,,,#","#,,,,,,,,,,,#.........#,,,,,,,,,,,,#","#,,h,,,,,,,,#.........#,,,,,,,,h,,,#","#,,,,,,,,,,t#.........#,,,,,,,,,,,,#","#,,,,,,,,,,,#####1#####,,,,,,,,,,t,#","#,,,,,,,,,t,,,,,,,,,,,,,,h,,,,,,,,,#","#,,h,t,,h,,,,,,,,,,,,,,,,,,,,,h,,,,#","#,,,,,,,,,,,,,,,,,,t,,,t,,,,,,,,t,,#","#,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,#","######2#############################","##,,,,,,,,################,,,,,,tt,#","##,,,,,,,,RRRRRRRRRRRRRRRR,,,,,,,,,#","##,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,#","##,,,,,,,,RRRRRRRRRRRRRRRR,,,t,,,,,#","##,,,,,,,,################,,,,,,,X,#","##########################,,,,,,,,,#","####################################"],doors:[{id:"1",flag:"masks",trigger:"wall",label:"傩祠"},{id:"2",flag:"nuo",trigger:"shrine",label:"后山"}],marks:{startYaw:[2,0],apo:[17,7],wall:[17,14],shrine:[17,11],mask1:[33,16],mask2:[2,13],mask3:[31,1],nuo1:[10,12],nuo2:[24,11],nuo3:[7,16],nuo4:[28,16],nuo5:[16,16],nuo6:[22,15],cliff:[5,20],bridge:[17,21],mandrill:[30,21],apoCliff:[4,22],exit:[33,23],gate:[17,5],nohEgg:[26,1]},items:[{type:"ammo",at:[5,3]},{type:"herb",at:[26,2]},{type:"ammo",at:[11,10]},{type:"medkit",at:[33,7]},{type:"ammo",at:[2,17]},{type:"herb",at:[23,17]},{type:"armor",at:[20,10]},{type:"ammo",at:[3,23]},{type:"herb",at:[9,19]},{type:"ammo",at:[27,19]}],lights:[{at:[17,5],color:16756832,intensity:3,flicker:.3,y:2.5},{at:[17,10],color:16744512,intensity:5,flicker:.6,y:2},{at:[5,12],color:16752720,intensity:2,flicker:.5,y:2},{at:[29,12],color:16752720,intensity:2,flicker:.5,y:2},{at:[6,19],color:16740416,intensity:3,flicker:.3,y:2},{at:[30,21],color:16732208,intensity:4,flicker:.4,y:2.5}],theme:{wall:"p:stone",wall2:"p:stone",mural:"tex:m_ch4",floor:"p:lattice",floorOut:"p:mud",ceiling:"p:lattice",fog:10134440,fogDensity:.075,hemi:[10529456,3158058,.75],sky:"sky:village",zones:[{rect:[13,9,21,12],wall:"p:temple",floor:"p:lattice"}]},route:["apo","mask1","mask2","mask3","wall","shrine","cliff","bridge","mandrill","exit"]},J0={id:5,title:"七二一的亡灵",place:"七二一厂深层 · 培养舱走廊与冷库",pov:"su",mural:"tex:m_ch5",par:1e3,map:["####################################","#,,,,,,,,,,#.k.k.k.k.k.k.k.k.k.k.k.#","#,@,,,,,,,,1.......................#","#,,,,,,,,,,#.......................#","#,,,,,,,,,,#.k.k.k.k.k.k.k.k.k.k.k.#","##############################2#####","####################...............#","####################...............#","############&&&&&&&#....P.....P....#","############.......#...............#","############.......3...............#","############.......#....P.....P....#","############.....d.#...............#","#############$######...............#","############...############4########","#.......=.................=........#","#.......=.................=........#","#==================================#","#.......=.................=........#","#...m...=.....m.....m.....=....m...#","#.......=.................=........#","#==================================#","#.......=.................=........#","#.......=.................=........#","#################5##################","###########|...........|############","###########|...........|############","###########|.........X.|############","####################################"],doors:[{id:"1"},{id:"2"},{id:"3",flag:"power",trigger:"box3",label:"档案室"},{id:"4",flag:"tape",trigger:"tape",label:"矿车枢纽"},{id:"5",flag:"steelbone",trigger:"steelbone",label:"冷库"}],marks:{startYaw:[-1,0],man:[2,3],corridor:[15,2],scare:[24,2],box1:[21,7],box2:[33,7],box3:[27,13],bench:[33,12],ore1:[22,9],ore2:[32,12],gu1:[27,10],tape:[15,10],photo:[15,9],hub:[27,15],lever1:[2,16],lever2:[33,16],steelbone:[17,19],cold:[17,26],serum:[17,26],vent:[21,27],chase1:[13,26],chase2:[14,27],exit:[21,27]},items:[{type:"ammo",at:[4,1]},{type:"cryo_ammo",at:[9,4]},{type:"herb",at:[25,2]},{type:"cryo_ammo",at:[21,12]},{type:"medkit",at:[34,6]},{type:"ammo",at:[13,11]},{type:"armor",at:[12,14],secret:!0},{type:"cryo_ammo",at:[14,14],secret:!0},{type:"cryo_ammo",at:[2,23]},{type:"herb",at:[33,23]},{type:"ammo",at:[11,15]},{type:"medkit",at:[20,27]}],lights:[{at:[5,2],color:11585752,intensity:2,flicker:0},{at:[16,2],color:4259744,intensity:3,flicker:.3},{at:[26,3],color:4259744,intensity:3,flicker:.8},{at:[27,9],color:16765088,intensity:3,flicker:1},{at:[15,10],color:16760960,intensity:3,flicker:.2},{at:[8,19],color:16760944,intensity:3,flicker:.5},{at:[26,19],color:16760944,intensity:3,flicker:.6},{at:[17,26],color:16719904,intensity:5,flicker:.3}],theme:{wall:"tex:factory_wall",wall2:"p:metal",mural:"tex:m_ch5",floor:"tex:wet_tile",floorOut:"p:mud",ceiling:"p:ceiling",fog:329738,fogDensity:.075,hemi:[4216426,1708048,.45],zones:[{rect:[1,1,10,4],wall:"p:stone"},{rect:[1,15,34,23],wall:"p:rust",floor:"p:concrete"},{rect:[12,25,22,27],wall:"tex:frost_door",floor:"p:frost"},{rect:[12,8,18,12],wall:"tex:wood_panel",floor:"tex:carpet"}]},route:["corridor","box1","box2","box3","tape","hub","steelbone","cold","exit"]},Q0={id:6,title:"山城沦陷",place:"重庆 · 李子坝轻轨站与长江索道",pov:"zhou",mural:"tex:m_ch6",par:1e3,map:["####################################","#......................#.....c.#####","#...P.....P.....P...@..#.......#####","#......................1.......#####","#======================#.......#####","#======================#..c....#####","#======================########...##","#......................#,,,,,,,$,,,#","#...P.....P.....P......#,,,,,,,,,,,#","#......................#,,h,,,,,h,,#","#......................#,,,,,,,,,,,#","###########2############,,,,,,,,,,,#","#&.....................#,,,,,,,,,,,#","#&.....................#,,,,,,,,,,,#","#&...c...c...c...c.....#,,h,,,,,h,,#","#&.....................3,,,,,,,,,,,#","#&.....................#,,,,,,,,,,,#","#&.....................#,,,,,,,,,,,#","########################,,,,,,,,,,,#","#,,,,,,,,,,,,,,,,,,,,,,,,,h,,,,,h,,#","#,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,#","#,,,h,,,,,,,,,,,h,,,,,,,,,,,,,,,,,,#","#,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,#","#,,,,,,,,,h,,,,,,,,,,,,,,,,,,,,,,,,#","#,X,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,#","#,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,#","####################################"],doors:[{id:"1"},{id:"2",flag:"defense",trigger:"console",label:"地铁控制中心"},{id:"3",flag:"log",trigger:"host",label:"渝中街道"}],marks:{startYaw:[1,0],chen:[27,3],console:[28,2],platform:[12,8],trackW:[1,5],trackE:[22,5],sp1:[1,4],sp2:[1,6],sp3:[22,4],sp4:[22,6],sp5:[3,1],sp6:[3,10],host:[11,15],metro1:[3,13],metro2:[20,16],street:[28,16],st1:[33,11],st2:[25,22],st3:[30,24],st4:[12,20],st5:[6,24],cable:[5,21],exit:[2,24]},items:[{type:"mg_ammo",at:[21,1]},{type:"mg_ammo",at:[2,9]},{type:"herb",at:[21,9]},{type:"armor",at:[25,2]},{type:"medkit",at:[12,1]},{type:"mg_ammo",at:[12,9]},{type:"ammo",at:[3,16]},{type:"herb",at:[20,13]},{type:"mg_ammo",at:[32,6],secret:!0},{type:"armor",at:[33,6],secret:!0},{type:"mg_ammo",at:[29,21]},{type:"medkit",at:[18,24]},{type:"ammo",at:[33,25]}],lights:[{at:[6,3],color:13689087,intensity:4,flicker:.5},{at:[16,7],color:13689087,intensity:4,flicker:.3},{at:[27,3],color:6356912,intensity:3,flicker:.1},{at:[9,15],color:6340863,intensity:3,flicker:.3},{at:[18,13],color:6340863,intensity:3,flicker:.6},{at:[29,11],color:16724064,intensity:4,flicker:.2,y:3},{at:[29,21],color:16756800,intensity:4,flicker:.4,y:3},{at:[12,22],color:16724064,intensity:4,flicker:.3,y:3},{at:[5,23],color:4251903,intensity:3,flicker:.1,y:3}],theme:{wall:"p:neon",wall2:"p:concrete",mural:"tex:m_ch6",floor:"p:concrete",floorOut:"p:concrete",ceiling:"p:ceiling",fog:1313296,fogDensity:.05,hemi:[6965866,1708048,.6],sky:"sky:f25",zones:[{rect:[1,12,22,17],wall:"p:metal",floor:"p:tile"},{rect:[24,1,30,5],wall:"p:metal"}]},route:["console","platform","host","street","cable","exit"]},tg={id:7,title:"白帝城",place:"瞿塘峡夔门 · 白帝庙托孤堂与地宫",pov:"lin",mural:"tex:m_ch7",par:1e3,map:["####################################","#,,,,,,,,,,,,#######################","#,@,,,,,,,,,,#######################","#,,,,,,,,,,,,#######################","#,,,,,,,,,,,,#######################","#,,,,,,,,,,,,#######################","#,,,,,,,,,,,,,,,,,,,,,,t,,,,,,,,,,,#","#,,,t,,,,,,,,,,,,,,t,,,,,,,,,,,,,,,#","#,,,,,,,,,,,,,,,,,,,,,,,,,,,,tt,,,,#","#,,,,,,,t,,,,,,,,,,,,,,,,,,,,,,,,,,#","#,,,,,,,,,,t,,,,,,,,,,,,,,,,,,,,,,,#","#,,,t,,,,,,,,,,,,,,,,,,,,t,,,,,,,,,#","#,,,,,,,,,,,,,,,,,,,,,,,,,t,,,,,,,,#","#################1##################","########&&&&&&&&&.&&&&&&&&&#########","#####..#..P.............P..#########","#####..$......P.....P......#########","#####..#...................#########","########..P......x......P..#########","########...................#########","#################2##########,,,,,,,#","########...................#,,,,,,,#","########...................3,,,,,,,#","########...................#,,,,,,,#","########&&&&&&&&&&&&&&&&&&&#,,,,,X,#","############################,,,,,,,#","####################################"],doors:[{id:"1",flag:"gate",trigger:"gate",label:"白帝庙山门"},{id:"2",flag:"hall",trigger:"fang",label:"地宫"},{id:"3",flag:"xu",trigger:"xu",label:"暗道"}],marks:{startYaw:[2,0],su:[3,1],man:[3,3],gate:[17,12],c1:[6,8],c2:[28,9],c3:[12,11],c4:[24,7],c5:[31,11],g1:[9,7],g2:[22,10],g3:[30,7],g4:[4,11],fang:[17,16],glass:[17,14],palace:[17,22],rhythm:[17,23],xu:[17,17],xuGuard1:[9,19],xuGuard2:[25,19],dock:[31,22],exit:[33,24]},items:[{type:"ammo",at:[10,2]},{type:"herb",at:[2,5]},{type:"ammo",at:[33,6]},{type:"cryo_ammo",at:[1,12]},{type:"medkit",at:[17,9]},{type:"armor",at:[5,16],secret:!0},{type:"cryo_ammo",at:[6,15],secret:!0},{type:"ammo",at:[9,16]},{type:"herb",at:[25,19]},{type:"cryo_ammo",at:[9,23]},{type:"medkit",at:[25,21]},{type:"ammo",at:[29,25]}],lights:[{at:[6,3],color:16752736,intensity:3,flicker:.2,y:2.5},{at:[17,10],color:16744512,intensity:3,flicker:.4,y:2.5},{at:[17,15],color:16756816,intensity:6,flicker:.6,y:2.2},{at:[11,17],color:16748608,intensity:3,flicker:.5},{at:[23,17],color:16748608,intensity:3,flicker:.5},{at:[17,23],color:16760928,intensity:4,flicker:.3},{at:[31,22],color:16744512,intensity:4,flicker:.2,y:2.5}],theme:{wall:"p:temple",wall2:"p:stone",mural:"tex:m_ch7",floor:"p:lattice",floorOut:"p:stone",ceiling:"p:lattice",fog:1708048,fogDensity:.055,hemi:[9071194,2758672,.6],sky:"sky:village",water:!0,zones:[{rect:[1,1,34,13],wall:"p:stone"},{rect:[8,21,26,24],wall:"p:stone",floor:"p:stone"}]},route:["gate","fang","palace","rhythm","xu","dock","exit"]},eg={id:8,title:"蛊母",place:"三峡大坝 · 控制中枢与水下闸室",pov:"lin",mural:"tex:m_ch8",par:1100,map:["####################################","#RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR#","#,,,,,,,,,,,,,,,,@,,,,,,,,,,,,,,,,,#","#,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,#","#,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,#","#################1##################","########&&&&&&&&&.&&&&&&&&&#########","########..c..c..c..c..c..c.#########","####...#...................#########","####...$...................#########","####...#...................#########","########...................#########","#################2##################","#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#","#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#","#..................................#","#..................................#","#.....p.....................p......#","#..................................#","#..................................#","#..................................#","#..................................#","#.....p.....................p......#","#..................................#","#..................................#","#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#","#X~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#","####################################"],doors:[{id:"1"},{id:"2",flag:"zhong",trigger:"console",label:"水下闸室"}],marks:{startYaw:[2,0],su:[16,3],man:[18,3],zhou:[15,2],chen:[19,2],console:[17,9],zhong:[17,8],chamber:[17,15],mother:[17,20],a1:[5,15],a2:[29,15],a3:[5,24],a4:[29,24],w1:[3,18],w2:[31,18],w3:[10,24],w4:[24,16],exit:[1,26]},items:[{type:"ammo",at:[4,3]},{type:"cryo_ammo",at:[30,3]},{type:"armor",at:[25,10]},{type:"medkit",at:[9,10]},{type:"cryo_ammo",at:[5,8],secret:!0},{type:"mg_ammo",at:[6,10],secret:!0},{type:"ammo",at:[2,16]},{type:"herb",at:[33,16]},{type:"cryo_ammo",at:[2,23]},{type:"medkit",at:[33,23]},{type:"ammo",at:[17,24]}],lights:[{at:[9,3],color:11583696,intensity:3,flicker:.1,y:3},{at:[25,3],color:11583696,intensity:3,flicker:.1,y:3},{at:[17,8],color:6340863,intensity:5,flicker:.2},{at:[17,20],color:16719888,intensity:7,flicker:.4,y:3},{at:[6,15],color:6340863,intensity:3,flicker:.6},{at:[28,24],color:6340863,intensity:3,flicker:.6}],theme:{wall:"tex:sluice_wall",wall2:"p:concrete",mural:"tex:m_ch8",floor:"p:concrete",floorOut:"p:concrete",ceiling:"p:ceiling",fog:395788,fogDensity:.05,hemi:[4216426,1708048,.55],sky:"sky:f01",water:!0,zones:[{rect:[8,6,26,11],wall:"p:metal",floor:"p:tile"}]},route:["console","chamber","mother","exit"]};async function ig(i){i.setLoadout(["pistol"],{ammo:36}),i.herbs=1,i.armor=0,i.hp=100,i.npc("su",[2,3],!0);const t=[];for(const c of[9,11])for(let h=4;h<=14;h+=2){const u=i.spawn("guest",[h,c],{state:"dormant",ox:(Math.random()-.5)*.8,oz:(Math.random()-.5)*.5});t.push(u)}const e=t[2],n=t[10],s=t[7];i.spawn("guest","cabinGu"),i.spawn("gu","corrGu1"),i.spawn("guest","corrGu2"),i.spawn("gu","cook1"),i.spawn("gu","cook2"),i.spawn("guest","cook3",{state:"dormant"}),await i.cine([{title:["第一章","云梦号"],dur:3.2,sfx:"stinger"},{caption:"2026年10月9日　凌晨1:12<br><small>长江 · 丰都江段</small>",dur:3.5},{video:"opening",from:0,to:5.8,lines:[["陈砚（耳麦）","林队，卫星热成像显示云梦号上有两百多个热源，但……没有一个在移动。",3.2],["林骁","什么意思？",1.2],["陈砚（耳麦）","就是……两百多个人，全站着不动。",1.6]]},{img:"f05",kb:"in",lines:[["苏晚","丰都。传说里的鬼城。（轻声）别又来这套。"],["林骁","不是鬼。先找幸存者。"]]}]),i.objective("搜索甲板，查看散落的物品"),i.hint("<b>WASD</b> 移动　<b>鼠标</b> 视角　<b>Shift</b> 小跑（耗体力）<br><b>E</b> 互动 / 开门　<b>Tab</b> 地图","左侧 <b>摇杆</b> 移动（推到底小跑），右侧 <b>滑动</b> 转视角<br>靠近物品点 <b>互动</b>",9),await i.interact("phone","phone","查看被踩碎的手机","doc"),await i.hud.showDocument("手机 · 最后一段视频",'<p>画面剧烈晃动。宴会厅的水晶灯下，宾客在尖叫。</p><p>镜头对准一个男人——他的脖颈上，正缓缓浮起<b class="red">朱砂色的脉络</b>。</p><p>视频在一声闷响中中断。</p>'),await i.say("苏晚（压低声音）","不是普通感染。这个脉络的走向……像是被“画”上去的。"),await i.say("林骁","先找幸存者。"),i.setFlag("phone"),i.objective("沿着血迹进入一层宴会厅"),await i.until(()=>i.inRect(1,6,18,14)),i.saveCheckpoint(),X.setAmbientLevel(.75),i.objective("调查宴会厅里一动不动的宾客"),await i.until(()=>i.near("aw1",4.5)||i.near("aw2",4.5)||i.near("aw3",4.5)||i.inRect(1,8,18,14)),await i.cine([{img:"f08",kb:"in",dur:1.6,dark:!0},{img:"f10",kb:"in",dur:1.4,sfx:"stinger",shake:!0}]),e.awaken(),i.hint("<b>左键</b> 射击　<b>R</b> 换弹　<b>右键 / F</b> 手电强光<br>瞄准头部伤害三倍","按住 <b>开火</b> 射击，可同时拖动瞄准<br>瞄准头部伤害三倍",7),await i.until(()=>!e.alive),await i.cine([{img:"f13",kb:"in",lines:[["苏晚","让我看看它——勘察镜能扫描菌群。"],["苏晚","朱砂菌群接管了神经。他们怕光——光会让菌丝收缩。"],["林骁","那就别关灯。"]]}]),i.hint("按 <b>C</b> 勘察镜扫描弱点　<b>F / 右键</b> 强光使前方蛊化者硬直","点 <b>勘察</b> 扫描弱点，点 <b>强光</b> 使前方蛊化者硬直",8),n.awaken(),await i.until(()=>!n.alive),s.awaken(),t[5].awaken(),await i.until(()=>!s.alive&&!t[5].alive),await i.wait(1),i.setFlag("hall"),i.objective("探索客房走廊，寻找通往底层的钥匙卡"),await i.until(()=>i.inRect(20,6,21,20)),i.saveCheckpoint(),X.groan(i.at("cabinGu",1.6),.8,.9),(async()=>(await i.until(()=>i.inRect(20,12,21,16)),i.shakeCamera(.3),X.whisper(),await i.wait(1.2),i.jumpscare("infected",8)))();let a=!1;i.addInteract("list","list","阅读档案",async()=>{i.removeInteract("list"),await i.hud.showDocument("档案一 · 云梦号乘客名单",'<p>百慧集团「年度鸡尾酒会」贵宾名单（共 217 人）</p><ul><li>……</li><li>王文涛　百慧生物 · 研发中心</li><li>沈　红　百慧生物 · 实验员</li><li><b class="red">钟　曼　百慧集团 · 董事长</b></li></ul>'),a=!0,i.sayAsync([["陈砚（耳麦）","等等，这名单上有个名字我认识——钟曼，百慧集团董事长。她今晚也在船上？"],["苏晚","百慧……（停顿）我父亲当年所在的公司。"]])},"doc"),await i.until(()=>a&&i.keys.has("red")),await i.wait(3),i.setFlag("cabin"),X.bell(i.at("man",1),.5),setTimeout(()=>X.bell(i.at("man",1),.35),900),i.objective("走廊尽头的客房……传来微弱的铃声"),i.hint("拿到 <b>红色钥匙卡</b> 后可以打开后厨的红色门","拿到 <b>红色钥匙卡</b> 后可以打开后厨的红色门",6),await i.interact("wardrobe","wardrobe","打开衣柜",void 0,1.1,0);const r=["wave1","wave2","wave3","wave4"].map(c=>i.spawn("guest",c));await i.cine([{img:"f19",kb:"in",sfx:"stinger",lines:[["小满（缩在柜角，攥着铜铃）","别过来……它们听到铃声就会走开的。"]]},{img:"f20",kb:"in",chars:[{id:"man",side:"right"}],lines:[["林骁（蹲下，缓缓放下枪）","我们是警察。你叫什么名字？"],["小满","小满。我找不到奶奶了。"],["苏晚（低声）","林骁，这个铃……上面的云雷纹，和朱砂蛊的脉络一模一样。"]]},{img:"f21",kb:"in",sfx:"bell",lines:[["","铃声响起。走廊外的蛊化者齐齐一顿，往后退了半步。"]]},{img:"f20",kb:"out",lines:[["林骁（会意）","带着她。"]]}]);for(const c of r)c.awaken(),c.flee(5);i.npc("man","man",!0),i.bellUnlocked=!0,i.hint("按 <b>Q</b> 让小满摇铃，驱散附近的小型蛊化者（冷却 60 秒）","点 <b>铜铃</b> 让小满摇铃，驱散附近的蛊化者（冷却 60 秒）",8),i.objective("用红色钥匙卡打开后厨"),i.saveCheckpoint(),await i.until(()=>i.inRect(8,16,18,20)),i.saveCheckpoint(),i.objective("穿过后厨，进入冷库"),await i.until(()=>i.inRect(1,22,18,26)),i.openDoor("7",!1);const o=i.spawn("butcher","butcher");o.awakeRadius=0,i.saveCheckpoint(),await i.cine([{img:"f15",kb:"in",dur:2,lines:[["苏晚","这里温度太低了……有东西在里面。"]]},{img:"f16",kb:"in",sfx:"roar",shake:!0,dur:2.2}]),o.awaken(),i.boss=o,i.objective("击败屠夫"),i.addPickup("ammo",6,22,25),i.addPickup("ammo",12,26,25),i.addPickup("herb",1,26,45),i.sayAsync([["苏晚","它身上的厚脂肪挡住了子弹！引它撞向冷凝管，冷气会让它僵住！"],["林骁","你负责看，我负责打。"]]),i.hint("屠夫正面很难打穿：引它<b>冲撞冷凝管</b>，或<b>射击它身旁的冷凝管</b>，冻住后猛攻","引屠夫<b>冲撞冷凝管</b>或<b>射击冷凝管</b>，冻住后猛攻",10),await i.until(()=>!o.alive),i.boss=null,i.hud.setBoss(null),await i.wait(1.2),i.openDoor("8");const l=i.npc("zhou","zhou");await i.cine([{img:"f15",kb:"out",chars:[{id:"zhou",side:"center"}],lines:[["","屠夫倒地，身体迅速枯萎。冷库深处一扇小门里，走出一个满脸疲惫的大叔——周振山。"],["老周（嚼着槟榔）","你们可算来了。再不来我就得拿勺子跟它们拼了。"],["林骁","老周？你不是在局里休假？"],["老周（摊手）","休假休到了游轮上，命苦。驾驶舱就在里面，没人。船是自己在开。"]]}]),l.following=!0,i.objective("前往驾驶舱"),i.saveCheckpoint(),await i.until(()=>i.inRect(1,16,6,20)),i.setCutscene(!0),i.lookTarget=i.at("bridge",1.3),await i.say("","驾驶舱空无一人，舵盘自行转动。雷达屏幕上，云梦号正驶向巫山方向。",3.5),await i.say("广播（变声处理的男声）","女士们先生们，欢迎来到长江的最后一夜。三峡的水，养了五千年的人，也该洗一洗了。",5),await i.say("广播","愿“净江者”与你们同在。",3),await i.say("林骁（拍桌）","他们要把船开到哪？"),await i.say("陈砚（耳麦，急促）","林队！雷达上的航线……船正在往巫山七二一水域加速！那是我们三个月前探过的——"),X.impact(),i.shakeCamera(1.2),i.setCutscene(!1),i.objective("船底传来巨响——到驾驶舱出口"),await i.reachExit(),await i.cine([{img:"f25",kb:"in",sfx:"impact",shake:!0,lines:[["","船舱底部传来巨响，像有什么东西在撞击船体。"]]},{caption:"第一章　云梦号<br><small>— 完 —</small>",dur:3}])}async function ng(i){i.setLoadout(["pistol","mg"],{ammo:36,mg_ammo:60}),i.switchWeapon("pistol"),i.hp=100,i.armor=25,i.herbs=1;const t=i.npc("chen","chen",!0);t.followDist=2.6;const e=["guard1","guard2","guard3","guard4"].map(l=>i.spawn("guard",l));for(const l of e)l.awakeRadius=8;for(await i.cine([{title:["第二章","回溯 · 七二一"],dur:3,sfx:"stinger"},{caption:"三个月前<br><small>巫山深处</small>",dur:3},{img:"tex:m_ch2",kb:"in",chars:[{id:"zhou",side:"left"},{id:"chen",side:"right"}],lines:[["","群山环抱，杂草覆盖的铁轨延伸进山体。锈蚀的牌子上依稀可见“七二一厂”四个红字。"],["老周","这就是你说的“可疑信号源”？我当兵的时候，这地儿早就废了。"],["陈砚（盯着平板）","废是废了，但最近三个月，这儿的电力消耗比一个中型医院还大。"],["老周","那就是有人住。"],["陈砚","我更倾向于——有人在搞事。"]]}]),i.objective("潜入七二一厂主厂房"),i.hint("本章操作老周：<b>1</b> 手枪 <b>2</b> 重机枪<br>从背后靠近守卫按 <b>E</b> 可无声击倒","本章操作老周：点 <b>换枪</b> 切换重机枪<br>从背后靠近守卫点 <b>互动</b> 可无声击倒",9),await i.until(()=>i.inRect(1,7,26,13)),i.saveCheckpoint(),await i.say("陈砚（耳语）","这些人不是警察，也不是军队。"),await i.say("老周","看工装。百慧生物？医药公司，在这儿？"),i.objective("绕到控制室，黑入终端"),await i.interact("terminal","terminal","黑入终端",void 0,-1.2,0);!await i.mg.hack("黑入百慧终端",4,30);)i.hud.message("连线超时，重新尝试……");await i.hud.showDocument("档案二 · “万蛊计划”项目概述",'<p>万蛊计划（WG Project）——1976 年立项。</p><p>以战国朱砂菌为基底，研究神经接管技术。</p><p>早期研究员：<b class="red">苏明远</b>，方鹤年……</p><p class="dim">附件：一张泛黄的交接清单复印件，抬头印着「防疫给水部 · 丹字班」。“丹-7”一栏被红笔圈出，旁注：<b class="red">CG-7</b>。</p>'),await i.say("陈砚","苏明远……苏晚的父亲？"),await i.say("老周（皱眉）","这事不能让丫头知道。至少现在不能。"),i.setFlag("hack"),i.objective("进入地下一层生化实验区"),await i.until(()=>i.inRect(1,15,26,19)),i.saveCheckpoint(),X.setAmbientLevel(.8),i.spawn("gu","b1gu1",{state:"dormant"}),i.spawn("gu","b1gu2"),i.objective("收集实验日志碎片（0/4），寻找铜钥匙");let n=0;const s=["1976.11 —— 楚墓出土的朱砂样本在 37℃ 下出现自主增殖。","1979.03 —— 受试者听见“歌声”。铜器敲击可使菌丝短暂休眠。","1985.07 —— 方提议终止试验，被驳回。苏坚持保留“送魂”样本。","2016.10 —— 苏明远失踪。样本 CG-7 母体转移至……（字迹被血污盖住）"];["log1","log2","log3","log4"].forEach((l,c)=>i.addInteract(l,l,"拾取实验日志碎片",async()=>{i.removeInteract(l),n++,i.objective(`收集实验日志碎片（${n}/4），寻找铜钥匙`),await i.hud.showDocument(`实验日志碎片 ${c+1}/4`,`<p>${s[c]}</p>`),n===2&&(await i.cine([{img:"f17",kb:"in",lines:[["","玻璃培养舱内，浸泡着一具具朱砂色的人形，胸膛起伏。"],["陈砚（声音发抖）","它们……还活着。"],["老周","别出声。"]]},{img:"f29",kb:"in",dur:1.2,sfx:"stinger"},{img:"f30",kb:"in",dur:1.4,shake:!0}]),i.jumpscare("water_gu",6))},"doc")),await i.until(()=>i.keys.has("yellow")),i.objective("用铜钥匙打开通往地下二层的铁门"),await i.until(()=>i.inRect(1,21,30,24)),i.saveCheckpoint();const a=i.spawn("ore","ore1"),r=i.spawn("ore","ore2",{state:"dormant"});await i.say("陈砚","那东西身上全是矿石……子弹打不进去！"),i.objective("黑入配电箱，让矿道铁轨通电"),i.hint("矿蛊体表附着矿石，普通子弹几乎无效——<br>引它们站上 <b>铁轨</b>，再拉 <b>配电箱</b> 放电","矿蛊免疫子弹：引到铁轨上，再拉配电箱放电",9),(async()=>{if(await i.until(()=>!a.alive||a.pos.distanceTo(i.playerPos)<2.2),!a.alive)return;await i.mg.mash("矿蛊扑来！快速格挡！",10,3.5)?(a.stun(3),i.hud.message("格挡成功！")):i.damagePlayer(25,a.pos,"矿蛊")})(),(async()=>{let l=!0;for(;i.chapter?.id===2&&(a.alive||r.alive);){await i.interact("power","power","拉闸放电（铁轨通电 10 秒）",void 0,.6,0);const c=[];for(let h=1;h<=30;h++)c.push([h,22],[h,23]);if(i.electrify(c,10),i.hud.message("铁轨通电！把矿蛊引上铁轨"),l&&(l=!1,i.sayAsync([["陈砚（喊）","老周！引到铁轨上去！我这边拉闸！"]])),!a.alive&&!r.alive)return;await i.cooldown("power","power","配电箱放电中，稍后可再次拉闸",12,.6,0),i.chapter?.id===2&&(a.alive||r.alive)&&i.hud.message("配电箱充能完毕，可以再次拉闸")}})(),await i.say("老周（嚼着槟榔，冷笑）","小子，听你的。"),await i.until(()=>!a.alive&&(!r.alive||i.inRect(31,21,34,24))),i.objective("进入矿道尽头的档案室"),await i.until(()=>i.inRect(32,21,34,24)),await i.interact("archive","archive","查看运输单","doc"),await i.cine([{img:"f23",kb:"in",lines:[["陈砚（念）","“青铜棺×1，战国楚墓出土，经巫山水路运往……‘云梦号’游轮，10月9日启程。”"],["老周","他们要把一口棺材，运上一艘载满人的游轮？"],["陈砚","不是棺材。是母体。"]]},{img:"f17",kb:"out",dur:1.5,sfx:"stinger",tint:"rgba(255,0,0,0.4)",lines:[["","警报突然响起。红灯闪烁。"]]}]),i.objective("逃！沿矿道冲出去"),i.saveCheckpoint();for(const l of["horde1","horde2","horde3","horde4"])i.spawn("gu",l).awaken();i.spawn("ore","horde1").awaken();for(const l of i.level.anchors)l.color=16715792;i.hint("别恋战！按住 <b>Shift</b> 小跑，冲向西侧出口","别恋战！把摇杆推到底小跑，冲向西侧出口",6),await i.reachExit(),await i.cine([{img:"tex:m_ch2",kb:"left",shake:!0,lines:[["","矿车冲出隧道口，坠入山下的草丛。老周的腿被划开一道深口。"]]},{img:"f02",kb:"in",chars:[{id:"chen",side:"right"}],sfx:"radio",lines:[["陈砚（喘气，拨通电话）","许副局长！我是陈砚！七二一厂有大规模生物实验，百慧在背后——"],["许怀远（电话，温和）","别急。你们现在安全吗？把定位发给我，我派人接应你们。"],["陈砚","好……我们在……"],["","老周猛地夺过电话挂断，拔出电池。"],["老周（盯着他）","你没发现吗？他问的第一句话，不是证据在哪，是——你们现在安全吗。"],["老周","他还没问我们看到了什么，就问我们在哪。"]]},{img:"f01",kb:"in",lines:[["","夜。江边废弃的渔船里，陈砚脸色苍白地抱着一块硬盘。"],["陈砚","证据是全的，但……没人会信。"],["老周（包扎伤口）","那我就自己去查。我听说，百慧包下一艘游轮，10月9日。"],["陈砚","你要……上船？"],["老周（拍拍他肩）","总得有人在现场。你负责在外面当我的眼睛。"]]},{caption:"现在——10月9日，凌晨2:40<br><small>第二章　完</small>",dur:3.5}])}async function sg(i){i.setLoadout(["pistol"],{ammo:48}),i.hp=100,i.armor=0,i.herbs=2,i.npc("su","su",!0),i.npc("man","man",!0),i.npc("zhou","zhou"),i.bellUnlocked=!0,await i.cine([{title:["第三章","船舱深处"],dur:3,sfx:"stinger"},{img:"f09",kb:"in",dur:1,dark:!0},{img:"f19",kb:"in",dur:1,sfx:"bell"},{img:"f02",kb:"in",dur:1.2,sfx:"radio"},{caption:"云梦号失控，正驶向巫山",dur:2.8},{img:"f21",kb:"in",chars:[{id:"zhou",side:"right"}],lines:[["","林骁、苏晚、老周、小满沿铁梯下行。灯光忽明忽暗，墙壁渗水。"],["老周","驾驶舱的舵被远程锁死，想停船，只能去轮机舱拉总闸。"],["林骁","多久？"],["老周","以现在的航速，四十分钟后撞上巫山浅滩。"],["苏晚（看着小满）","你留在我身边，铃别离手。"],["小满（点头，小声）","奶奶说过，铃响的时候，不要怕。"]]}]),i.objective("去安全屋找老周补给，然后下到轮机舱"),i.addInteract("zhou","zhou","向老周要补给",()=>{i.removeInteract("zhou"),i.reserve.ammo+=24,i.herbs++,i.say("老周","拿着。我在这儿守着，你们去拉总闸。")},void 0,0,.8),await i.until(()=>i.inRect(1,5,26,14)),i.saveCheckpoint(),i.objective("潜入被淹没的下层，拉下总闸"),i.hint("积水区会持续消耗 <b>氧气</b>，回到干燥的地面（换气点）可以恢复","积水区会消耗 <b>氧气</b>，回到干地面换气",8),await i.say("苏晚（耳麦）","水蛊怕强光，但别一直照，光会招来更多。"),await i.say("林骁（潜水中，低声）","收到。");for(const o of["wg1","wg2","wg3","wg4"])i.spawn("water",o,{state:"dormant"});(async()=>(await i.until(()=>i.water&&i.inRect(10,10,20,14)),i.jumpscare("water_gu",0),await i.mg.mash("水蛊缠住了脚踝！快挣脱！",10,4)||i.damagePlayer(30,i.playerPos,"scare")))(),await i.interact("switch","switch","拉下总闸",void 0,0,-.5),X.impact(),i.shakeCamera(.8),await i.say("","林骁拉动总闸，引擎声骤停。但船并没有减速，舱壁反而传来更大的震动。",3.5),await i.say("老周（喘气，扩音器）","不对。船还在加速，是有人在“拉”它。"),i.setFlag("switch"),i.objective("进入货舱"),await i.until(()=>i.inRect(1,16,26,25)),i.saveCheckpoint();const t=i.prop("coffin_hang","coffin",2.6,2.6,2228224);await i.cine([{img:"f23",kb:"in",lines:[["","货舱深处，吊臂悬着一口青铜棺，表面刻满云雷纹。棺盖微启，里面渗出红色雾气。"]]},{img:"f24",kb:"in",lines:[["方鹤年（录像，嗓音沙哑）","如果你看到这段话，说明有人终于找到了它。"],["方鹤年","朱砂蛊不是武器。它是一种……“回声”。它记得每一个曾经吞噬过的人。"],["苏晚（皱眉）","回声？"],["方鹤年","请告诉晚晚——她父亲没有背叛过任何人。"],["苏晚","他叫我“晚晚”……这个称呼，只有我爸才用。"],["林骁（扶住她肩）","冷静。先过这一关。"]]},{img:"f23",kb:"out",sfx:"whisper",tint:"rgba(80,0,0,0.5)",chars:[{id:"bride2",side:"center"}],lines:[["","货舱灯光熄灭，吊臂开始摇晃。一个穿残破嫁衣的高大女性身影从棺后走出，每一步都带出一声“嘀嗒”。"]]}]);const e=i.spawn("bride","bride");e.awaken(),i.boss=e,i.objective("击败腐妆新娘"),i.sayAsync([["苏晚","她心口有个红点，那是核心！用勘察镜锁定它！"],["林骁","引她到吊臂下面！"]]),i.hint("用 <b>勘察镜</b> 显示她心口的菌核再射击；<br>把她引到吊臂下，按 <b>E</b> 放下货柜","用 <b>勘察</b> 显示菌核再射击；把她引到吊臂下点 <b>互动</b> 砸货柜",10),i.addPickup("ammo",3,17,30),i.addPickup("ammo",25,24,30);let n=!0;const s=()=>i.addInteract("crane","crane","放下吊臂货柜",async()=>{if(!n)return;n=!1,i.removeInteract("crane");const o=i.at("crane");i.rainOn(o.x,o.z,"proj_rock",0),await i.wait(.9),X.explosion(),i.shakeCamera(.9),e.alive&&e.pos.distanceTo(o)<3.5&&(e.vulnerable=!0,e.damage(260,"weak"),e.stun(3),i.hud.message("货柜砸中了新娘！"),setTimeout(()=>e.vulnerable=!1,3e3)),e.alive&&await i.cooldown("crane","crane","吊臂复位中",12),n=!0,e.alive&&s()});s();let a=1;e.onDamaged=o=>{a===1&&o.hp<o.maxHp*.66&&(a=2,i.say("新娘（扭曲的女声，混着哭腔）","为什么……不让我……回去……")),a===2&&o.hp<o.maxHp*.33&&(a=3,i.hud.message("她爬上了天花板……"))},(async()=>{for(;e.alive&&(await i.wait(a===2?1.1:3.5),!!e.alive);){if(a>=2){const o=a===2?3:1;for(let l=0;l<o;l++)i.rainOn(i.playerPos.x+(Math.random()-.5)*7,i.playerPos.z+(Math.random()-.5)*7,"proj_bug",10)}if(a===3&&Math.random()<.45){e.group.visible=!1,e.invulnerable=!0;const o=i.playerPos.x,l=i.playerPos.z;i.rainOn(o,l,"proj_bug",0),X.whisper(),await i.wait(1.3),e.pos.set(o,0,l),e.group.visible=!0,e.invulnerable=!1,X.roar(e.pos),i.shakeCamera(.7),Math.hypot(i.playerPos.x-o,i.playerPos.z-l)<2&&i.jumpscare("bride2",22),e.stun(2)}}})(),await i.until(()=>!e.alive),i.boss=null,i.hud.setBoss(null),i.removeInteract("crane"),i.removeProp(t),await i.cine([{img:"f23",kb:"in",chars:[{id:"bride2",side:"center"}],dark:!0,lines:[["","新娘倒地，嫁衣褪去，露出她胸前挂着的名牌：百慧生物 · 实验员　沈红。"],["苏晚（低声）","她以前也是个人。"]]},{img:"f25",kb:"in",sfx:"radio",chars:[{id:"zhong",side:"right"}],lines:[["老周（扩音器，杂音）","林骁！有直升机在船尾，上面有人往下扔东西！"],["","船尾甲板，一架黑色直升机悬停，一个穿风衣的女人冷冷俯瞰。"],["钟曼（扩音器，优雅）","林警官，苏医生。谢谢你们帮我们“测试”。"],["林骁","钟曼？"],["钟曼","请代我向许局问好。他会明白的。"]]},{img:"f25",kb:"out",sfx:"explosion",shake:!0,lines:[["","直升机离去。船尾突然爆炸。"]]}]),i.setFlag("bride"),i.objective("船体断裂——冲向货舱出口！"),i.saveCheckpoint(),(async()=>{for(;i.chapter?.id===3&&!i.inRect(32,18,34,22);)i.shakeCamera(.4),i.rainOn(i.playerPos.x+(Math.random()-.5)*5,i.playerPos.z+(Math.random()-.5)*5,"proj_rock",12),await i.wait(1.2)})(),await i.reachExit();const r=await i.mg.mash("苏晚被甩出护栏——抓住她！",12,3);await i.cine([{img:"f26",kb:"in",shake:!0,lines:[["",r?"林骁伸手抓住了她——却只抓住了一半。镜头一黑。":"林骁伸手却扑了个空。镜头一黑。"]]},{caption:"",dur:1.2,sfx:"scream",lines:[["小满（尖叫）","苏姐姐！"]]},{img:"tex:m_ch4",kb:"in",lines:[["","巫山江滩，破晓。林骁在冰凉的沙滩上醒来。四周是翻滚的浓雾，远处云梦号像一头断脊的巨兽。"],["林骁（低声）","苏晚？老周？小满？"],["","无人回答。他抬头，雾中隐约有一座村落的灯火，以及——铜铃声。"]],sfx:"bell"},{caption:"第三章　船舱深处<br><small>— 完 —</small>",dur:3}])}async function ag(i){i.setLoadout(["pistol"],{ammo:18}),i.hp=85,i.armor=0,i.herbs=1,await i.cine([{title:["第四章","巫山 · 雾锁"],dur:3,sfx:"stinger"},{img:"s3_2",kb:"in",lines:[["","林骁独自在巫山江滩苏醒。山路旁散落着老旧的纸钱，树上挂着一张张褪色的傩面。"],["林骁（自语）","这是……傩戏？"]],sfx:"whisper"}]),i.objective("循着铜铃声，找到雾中的村落");const t=i.prop("noh_mask","nohEgg",.85,1.35,2762274);t.position.z-=1.35,t.visible=!1,i.onScan=()=>{t.visible||!i.near("nohEgg",16)||(t.visible=!0,i.hud.message("勘察镜：崖壁上嵌着一张白色的面具……"),i.addInteract("nohEgg","nohEgg","查看崖壁上的面具",async()=>{i.removeInteract("nohEgg"),await i.hud.showDocument("现场报告（残页）· 一九七一年十月",`<p class="dim">面具背面用油纸包着一页手写报告，字迹被江水泡得发胀。</p>
         <p>长江巫山段。能面众的江轮在这里停过一夜，上岸的人在崖壁上嵌了这张面具——是记号，给“下一批人”指路。</p>
         <p>丰都名山的洞，我已经封了。丹字班留下的九株样本，八株烧在罐里，一株烧在棺里。</p>
         <p>可交接清单上的“<b class="red">丹-7</b>”，少了一支。</p>
         <p>如果有人再看见这张面具，说明他们回来了。</p>
         <p style="text-align:right">——红黑脸谱的那个人</p>`),await i.say("林骁（自语）","一九七一年……丹-7？CG-7……")},void 0,0,-.8))},(async()=>(await i.until(()=>i.near("nohEgg",7)||i.inRect(1,7,34,17)),!t.visible&&i.near("nohEgg",7)&&i.hud.message("崖壁那边，好像有什么东西在雾里反光……")))(),i.hint("本章弹药稀缺：多用 <b>手电强光</b> 和潜行，避免无谓战斗","本章弹药稀缺：多用 <b>强光</b>，避免无谓战斗",8),(async()=>{for(;i.chapter?.id===4&&!i.near("apo",5)&&!i.inRect(1,7,34,17);)X.bell(i.at("apo",1),.35),await i.wait(4)})();const e=i.npc("apo","apo");await i.until(()=>i.near("apo",5)||i.inRect(1,7,34,17)),i.saveCheckpoint(),await i.cine([{img:"s3_2",kb:"out",chars:[{id:"apo",side:"right"}],lines:[["","村口立着一座青苔斑驳的牌楼。牌楼下，一个佝偻的老妇人背对着他，手里摇着铜铃。"],["阿婆（不回头）","穿官衣的人，又来了。"],["林骁（举枪）","您是？"],["阿婆","杨家的老婆子。小满是我孙女。"],["林骁（缓缓放下枪）","她还活着。我们在船上遇到她。"],["阿婆（轻轻点头）","我听见了铃响。"],["阿婆","傩祠的大门被九张傩面封着。村里少了三张——祠堂后院、水井边、还有屋顶上。"]]}]),i.objective("收集三张缺失的傩面（0/3）");let n=0;const s=["后院的“驱邪”面，獠牙外翻。","水井边的“纳吉”面，嘴角含笑。","屋顶上的“请神”面，额头一道朱砂。"];["mask1","mask2","mask3"].forEach((h,u)=>i.addInteract(h,h,"拾取傩面",async()=>{i.removeInteract(h),n++,i.objective(`收集三张缺失的傩面（${n}/3）`),i.hud.message(s[u]),n===2&&(await i.wait(.5),i.jumpscare("scare_nuo",5))},"mask"));for(const h of["nuo1","nuo2","nuo3","nuo4"])i.spawn("nuo",h);i.hint("戴傩面的村民平时不会攻击——<b>别打他们</b>，一旦受伤就会暴走","傩面者平时不攻击——别打他们，受伤就会暴走",8),await i.until(()=>n>=3),i.objective("回到傩祠，按《开坛歌》的顺序放上傩面"),await i.interact("wall","wall","查看傩面壁雕",void 0,0,0);const a=["开坛","请神","驱邪","纳吉","送神"],r=["开坛","镇宅","请神","判官","驱邪","土地","纳吉","戏童","送神"];for(;!await i.mg.masks("傩面机关",r,a,"阿婆唱的《开坛歌》：“先开坛，后请神，驱邪纳吉送神归。”"););i.setFlag("masks"),await i.until(()=>i.inRect(13,9,21,12)),i.saveCheckpoint(),e.pos.copy(i.at("shrine")),await i.cine([{img:"tex:m_ch4",kb:"in",chars:[{id:"apo",side:"left"}],lines:[["阿婆（坐在火塘边）","两千多年前，楚国的巫祝在这座山里封下一个东西。他们叫它——“蛊母”。"],["林骁","封？"],["阿婆","用朱砂、用铜、用歌。每年秋天，村里人戴上傩面唱“安山调”，就是为了让她继续睡下去。"],["阿婆","直到那些穿白大褂的人开着钻机进了山。"],["阿婆","……这种事，五十多年前也有过一回。那回是个戴红黑脸谱的后生，借了我的铃，替我们封了丰都的洞。"],["","阿婆取出一块锈铜，递给林骁。"],["阿婆","蛊群怕铜音。三长两短，可以让它们暂时停下。"],["林骁","为什么帮我？"],["阿婆","不是帮你。是帮她们。小满，还有你嘴里那个苏家的姑娘。"],["林骁（一怔）","你认识苏晚？"],["阿婆","我认识她爸爸。苏明远，十年前在这里住过半年。"]]}]),i.zhenyinUnlocked=!0,i.hint("获得技能 <b>镇音</b>：按 <b>Z</b> 敲击铜片（三长两短），附近蛊群静止 4 秒","获得技能 <b>镇音</b>：点 <b>镇音</b> 让附近蛊群静止",8),i.objective("穿过傩面者，前往后山悬崖");for(const h of["nuo5","nuo6"])i.spawn("nuo",h);await i.wait(2);for(const h of i.enemies)h.kind.name==="傩面者"&&h.alive&&h.awaken();await i.cine([{img:"s3_2",kb:"in",dur:2.6,sfx:"stinger",lines:[["","浓雾中，戴着傩面的村民缓缓走出，动作整齐如祭祀。一个傩面者面具滑落，露出布满朱砂脉络的脸。"],["林骁（低语）","别动……别动……"]]}]),i.setFlag("nuo"),await i.until(()=>i.inRect(2,19,9,23)),i.saveCheckpoint(),e.pos.copy(i.at("apoCliff"));const o=i.spawn("mandrill","mandrill");o.awakeRadius=0,await i.cine([{img:"s3_2",kb:"up",chars:[{id:"mandrill",side:"center"}],sfx:"roar",shake:!0,lines:[["","黄昏。崖壁上，一个巨大的身影投下阴影——山魈。"]]}]),o.awaken(),i.boss=o,i.objective("击败山魈"),i.addPickup("ammo",3,21,20),i.addPickup("herb",2,19,40),i.sayAsync([["阿婆（远处喊）","打它的脚踝！它的根扎在脚上！"]]),i.hint("山魈的弱点在 <b>脚踝</b>；它冲上吊桥时注意闪避（<b>空格</b>）","山魈的弱点在 <b>脚踝</b>；冲过来时点 <b>闪避</b>",8);let l=1;o.onDamaged=h=>{l===1&&h.hp<h.maxHp*.6&&(l=2,i.say("林骁","它要上吊桥了！")),l===2&&h.hp<h.maxHp*.25&&(l=3,(async()=>(await i.say("阿婆（远处喊）","三长两短！别停！"),X.bellRing(i.at("apoCliff",1)),h.stun(6),h.vulnerable=!0,await i.say("林骁（咬牙，敲击铜片）","看着我！")))())},(async()=>{for(;o.alive;)await i.wait(2.5),l>=2&&i.inRect(10,20,25,22)&&i.shakeCamera(.35)})(),await i.until(()=>!o.alive),i.boss=null,i.hud.setBoss(null),await i.cine([{img:"s3_2",kb:"out",chars:[{id:"apo",side:"left"}],lines:[["","山魈坠入深渊。阿婆倒在地上，胸口渗出红色。"]]},{img:"tex:m_ch4",kb:"in",chars:[{id:"apo",side:"center"}],dark:!0,lines:[["阿婆","我活不过今晚了。你替我……带句话给小满。"],["林骁","你说。"],["阿婆","铃声不是赶它们走的。是……叫它们回家的。"],["林骁（迟疑）","什么意思？"],["阿婆（闭上眼）","穿官衣的……蛇，别信。"],["","阿婆断气。林骁沉默，轻轻为她合上双眼。"]]},{img:"s3_2",kb:"in",sfx:"radio",lines:[["许怀远（耳麦，温和）","林骁？我是许局。你还活着，太好了。"],["林骁","许局，云梦号出事了，百慧——"],["许怀远","我已经知道了。把你的位置发给我，直升机马上过去。"],["","林骁握着耳麦，脑海里闪过阿婆的话：“穿官衣的蛇，别信。”"]]}]),i.removeNpc("apo");const c=await i.mg.choice("许怀远要你的坐标",["A. 报出坐标","B. 拒绝，并关闭定位"]);i.choices.ch4=c,await i.say("林骁",c===0?"……我在巫山傩村后山。":"信号不好，许局。我自己想办法。"),await i.cine([{img:"s3_2",kb:"up",lines:[["","不论选择，远处山腰突然亮起一道微弱的光——是苏晚的紧急信标，位置：七二一厂。"],["林骁（望向山中）","等我。"]]}]),i.objective("前往悬崖尽头的山路"),await i.reachExit(),await i.cine([{caption:"第四章　巫山 · 雾锁<br><small>— 完 —</small>",dur:3}])}async function rg(i){const t=i.choices.ch4===0;i.setLoadout(["cryo","pistol"],{ammo:24,cryo_ammo:t?12:24}),i.hp=90,i.armor=0,i.herbs=t?1:3,i.npc("man","man",!0),i.bellUnlocked=!0,i.zhenyinUnlocked=!1,await i.cine([{title:["第五章","七二一的亡灵"],dur:3,sfx:"stinger"},{caption:"苏晚与小满漂至七二一厂下游<br><small>老周独自游向对岸，去寻找陈砚</small>",dur:3.5},{img:"tex:m_ch5",kb:"in",chars:[{id:"su",side:"left"},{id:"man",side:"right"}],lines:[["","苏晚拖着湿透的身体上岸，小满抱着铜铃，瑟瑟发抖。"],["苏晚（喘气）","你冷吗？"],["小满","不冷。……苏姐姐，这个地方，铃一直在响。"],["","苏晚低头，铜铃表面的云雷纹在微微发烫。"]]}]),i.objective("进入七二一厂地下一层"),i.hint("本章操作苏晚：<b>冷凝枪</b> 可冻结敌人、击碎矿蛊的矿甲；手电较弱，多用 <b>勘察镜</b>","本章操作苏晚：<b>冷凝枪</b> 冻结敌人、击碎矿甲；多用 <b>勘察</b>",9),t&&i.hud.message("许怀远掌握了你的行踪……追兵更多了"),await i.until(()=>i.inRect(12,1,34,4)),i.saveCheckpoint(),i.flashlightWeak=!0,await i.say("小满（拉住苏晚衣角）","姐姐……它们在看我们。"),await i.say("苏晚（强压恐惧）","别看。往前走。"),(async()=>(await i.until(()=>i.inRect(22,1,26,4)),await i.cine([{img:"f30",kb:"in",dur:1.6,sfx:"scream",shake:!0}]),i.spawn("gu","scare",{oz:1}).awaken(),t&&(i.spawn("cultist",[33,2]).awaken(),i.spawn("cultist",[31,3]).awaken())))(),await i.until(()=>i.inRect(20,6,34,13)),i.saveCheckpoint(),i.objective("修复三处配电箱，恢复档案室电力（0/3）"),i.spawn("ore","ore1",{state:"dormant"}),i.spawn("ore","ore2"),i.spawn("gu","gu1");let e=0;const n=l=>i.addInteract(l,l,"修复配电箱",async()=>{i.removeInteract(l),await i.mg.hack("接通线路",3,30)?(e++,X.explosion(),i.objective(`修复三处配电箱，恢复档案室电力（${e}/3）`),e===3&&i.setFlag("power")):(i.hud.message("接线失败，再试一次"),n(l))});["box1","box2","box3"].forEach(n),i.addInteract("bench","bench","化学合成台：制作冷凝弹",()=>{i.reserve.cryo_ammo+=12,i.hud.message("合成冷凝弹 ×12"),X.pickup()}),await i.until(()=>e>=3),i.objective("进入档案室"),await i.until(()=>i.inRect(12,9,18,12)),i.saveCheckpoint(),await i.interact("tape","tape","按下老式录音机"),await i.cine([{img:"tex:m_terminal",kb:"in",lines:[["","档案室墙上贴满发黄的照片。其中一张，是年轻的苏明远抱着襁褓中的婴儿，背景是实验室。"],["苏晚（声音发颤）","……这是我。"]]},{img:"tex:m_terminal",kb:"out",dark:!0,sfx:"radio",lines:[["苏明远（录音，沙哑）","晚晚，如果你听到这段话，说明爸爸没能回去。"],["苏明远","朱砂蛊本是楚巫用来“送魂”的东西。他们用铜与歌声让它沉睡。百慧要的是反过来——用它“唤醒”。"],["苏明远","爸爸做了一份血清，藏在七二一最深处的冷库。它不是解药，它是……钥匙。能让蛊母“回家”的钥匙。"],["苏明远","无论谁找你要这份血清，不要给穿官服的人。"]]}]),i.setFlag("tape"),i.objective("穿过矿车枢纽"),await i.until(()=>i.inRect(1,15,34,23)),i.saveCheckpoint();const s=i.spawn("steelbone","steelbone");s.awakeRadius=0,await i.cine([{img:"tex:m_ch5",kb:"in",chars:[{id:"steelbone",side:"center"}],sfx:"roar",shake:!0,lines:[["","与废旧矿车融合的巨型感染体——钢骨。胸腔嵌着一台仍在转动的发电机。"]]}]),s.awaken(),i.boss=s,i.objective("击败钢骨"),i.addPickup("cryo_ammo",2,23,25),i.addPickup("cryo_ammo",33,15,25),i.hint("拉动两侧 <b>道岔扳手</b>，让冲锋的钢骨撞墙；用 <b>冷凝枪</b> 冻结它，再打胸口的发电机","拉 <b>道岔扳手</b> 让钢骨撞墙；<b>冷凝枪</b> 冻结后打胸口发电机",10),i.sayAsync([["苏晚","小满，摇铃！让它往左边转！"],["小满（含泪摇铃）","铃啊……铃啊……"]]);let a=0;const r=l=>i.addInteract(l,l,"扳动道岔",()=>{a=i.time+6,X.door(),i.hud.message("道岔已切换：6 秒内它冲锋会撞上配电柜！")});r("lever1"),r("lever2"),s.behavior=l=>l.state==="charge"&&a>i.time?(a=0,l.state="stunned",l.stateT=5,l.vulnerable=!0,l.damage(120,"weak"),X.explosion(),i.shakeCamera(.8),i.hud.message("钢骨撞上了配电柜！"),setTimeout(()=>l.vulnerable=!1,5e3),!0):!1,await i.until(()=>!s.alive),i.boss=null,i.hud.setBoss(null),i.removeInteract("lever1"),i.removeInteract("lever2"),await i.cine([{img:"tex:m_ch5",kb:"out",lines:[["","钢骨瘫倒，发电机熄灭。深处的冷库门缓缓打开，寒气涌出。"]]}]),i.setFlag("steelbone"),await i.interact("serum","serum","取下血清瓶","serum"),await i.cine([{img:"f15",kb:"in",lines:[["","冷库中央，悬着一支被红色冷光包裹的血清瓶，瓶身上刻着：“赠晚晚”。"],["","苏晚走近，手指触到瓶身的瞬间，小满手中的铜铃突然发出清亮的长鸣。"]],sfx:"bell"},{img:"f18",kb:"in",sfx:"stinger",shake:!0,lines:[["","冷库深处，所有培养舱同时亮起。"],["小满（尖叫）","它们在叫我们！"],["苏晚","跑！"]]}]),i.objective("逃！冲向通风井");for(const l of["chase1","chase2"])i.spawn("gu",l).awaken();for(let l=0;l<3;l++)i.spawn("gu","hub",{ox:l-1}).awaken();await i.reachExit(),await i.cine([{img:"f05",kb:"in",chars:[{id:"lin",side:"right"}],lines:[["","苏晚与小满冲出地面，迎面撞上一个人影——林骁。"],["林骁（扶住她）","你没事。"],["苏晚（盯着他，片刻后抱住他，又迅速松开）","你……来得真慢。"],["林骁（难得一笑）","我绕了点路。"],["小满","奶奶……"],["林骁（蹲下，轻声）","她让我告诉你，铃声不是赶它们走的，是……叫它们回家的。"],["","小满点头，眼泪滚落。"]]},{img:"f02",kb:"in",chars:[{id:"xu",side:"center"}],lines:[["","远处传来直升机的轰鸣。三架黑色直升机降下，一队特勤队员迅速包围。为首之人，正是许怀远。"],["许怀远（温和）","林骁。苏晚。你们受苦了。"],["","他的目光落在苏晚怀里的血清上。"],["许怀远","东西，交给我吧。"]]}]);const o=await i.mg.choice("许怀远伸手索要血清",["A. 把血清交给许怀远","B. 拒绝"]);i.choices.ch5=o,await i.cine([{img:"f02",kb:"out",lines:[o===0?["","苏晚迟疑着递出血清。许怀远接过，微微一笑。"]:["","苏晚后退半步，林骁挡在她身前。特勤队员的枪口微微抬起。"],["许怀远（叹气）","好吧。我们先回重庆。你们需要休息。"],["","小满的铜铃，在他靠近的那一刻，发出刺耳的颤音。"]],sfx:"bell"},{caption:"第五章　七二一的亡灵<br><small>— 完 —</small>",dur:3}])}async function og(i){const t=i.choices.ch4===0;i.setLoadout(["mg","pistol"],{ammo:24,mg_ammo:180}),i.hp=100,i.armor=50,i.herbs=2,i.npc("chen","chen"),await i.cine([{title:["第六章","山城沦陷"],dur:3,sfx:"stinger"},{caption:"数小时后<br><small>重庆</small>",dur:3},{img:"tex:m_ch6",kb:"in",chars:[{id:"xu",side:"right"}],lines:[["","直升机降落在 NBER 重庆前线指挥部。山城的夜色刚刚亮起，洪崖洞的灯火倒映江面。"],t?["许怀远","我早就说过，你不该单独行动。"]:["许怀远","你关掉定位，是对我不信任？"],["林骁","不是。只是习惯。"],["许怀远（微笑）","好习惯。"],["技术员（惊慌）","长官！嘉陵江水质监测异常！江北、渝中多个社区上报群体高烧！"],["苏晚（冷声）","他们放了蛊。"],["林骁（看向许怀远）","你早知道。"],["","许怀远没有回答。会议室的门从外面锁死。"]]},{img:"tex:m_ch6",kb:"left",chars:[{id:"zhou",side:"left"},{id:"chen",side:"right"}],lines:[["","与此同时，李子坝轻轨站。老周刚抵达重庆，与失散的陈砚会合。"],["老周（大笑）","来啊！老子等这天等多少年了！"]]}]),i.objective("据守站台 90 秒"),i.hint("重机枪压制蛊群；站台中央的 <b>通电闸</b> 可让轨道放电（冷却 20 秒）","重机枪压制蛊群；点站台中央的 <b>通电闸</b> 让轨道放电",9);const e=[];for(let h=1;h<=22;h++)for(const u of[4,5,6])e.push([h,u]);let n=!0;const s=()=>i.addInteract("rail","platform","通电闸（轨道放电 8 秒）",async()=>{n&&(n=!1,i.removeInteract("rail"),i.electrify(e,8),await i.say("陈砚（喊）","老周！轨道通电了！引它们去铁轨！"),await i.wait(20),n=!0,s())});s();const a=i.time+90,r=["sp1","sp2","sp3","sp4","sp5","sp6"];for((async()=>{let h=0;for(;i.time<a&&i.chapter?.id===6;)i.spawn(h%5===4?"ore":"gu",r[h%r.length]).awaken(),h%7===6&&i.spawn("guest",r[(h+2)%r.length]).awaken(),h++,await i.wait(h<10?4:2.6)})();i.time<a;)i.objective(`据守站台（剩余 ${Math.ceil(a-i.time)} 秒）`),await i.wait(1);i.objective("列车来了——离开轨道！"),await i.say("陈砚（喊）","列车！一整列载满蛊化者的列车从楼里冲出来了！快离开轨道！",3),X.impact();const o=new Mt(new fe(18,3.2,8),new ce({map:Pi("tex:m_ch6")??void 0,emissive:4198408,emissiveMap:Pi("tex:m_ch6")??void 0}));o.position.set(-12,1.6,5.5*Xt-1.5),i.addObject(o);const l=new Mc(16769184,40,30);o.add(l),l.position.set(10,0,0);const c=i.time;await i.until(()=>{const h=i.time-c;o.position.x=-12+h*26,i.shakeCamera(.3);for(const u of i.enemies)u.alive&&Math.abs(u.pos.z-o.position.z)<4.5&&Math.abs(u.pos.x-o.position.x)<9&&u.damage(9999,"body");return Math.abs(i.playerPos.z-o.position.z)<4&&Math.abs(i.playerPos.x-o.position.x)<9&&i.damagePlayer(45,o.position),o.position.x>23*Xt+12}),i.removeObject(o),X.explosion(),await i.cine([{img:"tex:m_ch6",kb:"in",sfx:"explosion",shake:!0,lines:[["","列车疾驰而至，撞上蛊群。车身在电弧中炸成火球。"]]}]);for(const h of i.enemies)h.alive&&h.damage(9999,"body");for(i.setFlag("defense"),i.saveCheckpoint(),i.objective("进入地铁控制中心，调出指挥部日志"),i.spawn("gu","metro1",{state:"dormant"}),i.spawn("guest","metro2"),await i.interact("host","host","连接主机");!await i.mg.hack("路径解锁",5,40);)i.hud.message("连接中断，重试……");await i.hud.showDocument("NBER 指挥部 · 三小时前的命令记录",'<p>授权人：<b class="red">许怀远</b></p><p>指令：对重庆江北、渝中区域生物防护带实施撤离。放行。</p>'),await i.say("陈砚（喃喃）","不对……这是……"),await i.say("陈砚（声音发抖）","他撤走了防护。三小时前就撤了。"),i.setFlag("log"),i.saveCheckpoint(),i.objective("穿过沦陷的渝中街道，赶往长江索道站");for(const h of["st1","st2","st3","st4","st5"])i.spawn(Math.random()<.3?"cultist":"gu",h);await i.until(()=>i.inRect(24,7,34,25)),i.jumpscare("infected",6),await i.until(()=>i.near("cable",6)||i.inRect(1,19,10,25)),await i.cine([{img:"f02",kb:"in",chars:[{id:"xu",side:"right"},{id:"lin",side:"left"}],lines:[["","林骁与苏晚在索道站追上许怀远。"],["林骁（举枪）","许局。这不是你。"],["许怀远（转身，眼神疲惫）","阿骁，这是我。一直都是。"],["林骁","为什么？"],["许怀远","我女儿得了渐冻症。医生说她活不过三年。百慧给了我一个机会——蛊能让神经重生。"],["苏晚（冷笑）","那是被吞噬，不是重生。"],["许怀远","那也是活着。"]]},{img:"tex:m_ch6",kb:"right",sfx:"radio",lines:[["许怀远（扩音器）","告诉苏晚，她父亲留下的东西，是钟曼最想要的。"],["苏晚","你们一直在找他留下的血清。"],["许怀远","不。我们在找钥匙。"],["","缆车到达江心。许怀远跃上直升机，朝东方飞去。"],["林骁（低声）","他去的方向……"],["苏晚（看着地图）","白帝城。"]]},{img:"team",kb:"in",lines:[["","缆车缓缓降落。地面上，老周与陈砚挥手。"],["老周（嚼着槟榔）","迟了十分钟。我还以为你们去游览夜景了。"],["林骁（苦笑）","集合。"],["苏晚（举起血清）","这是我爸留下的钥匙。"],["小满（抱紧铜铃）","还有这个。"],["林骁（望向东方的夜空）","去白帝城。"]]}]),i.objective("到索道站集合"),await i.reachExit(),await i.cine([{caption:"第六章　山城沦陷<br><small>— 完 —</small>",dur:3}])}async function lg(i){const t=i.choices.ch5===0;i.setLoadout(["pistol","cryo"],{ammo:48,cryo_ammo:18}),i.hp=100,i.armor=50,i.herbs=2,i.npc("su","su",!0),i.npc("man","man",!0),i.bellUnlocked=!0,i.zhenyinUnlocked=!0,await i.cine([{title:["第七章","白帝城"],dur:3,sfx:"stinger"},{caption:"许怀远叛变<br><small>钟曼的目标，指向三峡</small>",dur:3},{img:"f01",kb:"right",sfx:"gunshot",chars:[{id:"zhou",side:"left"}],lines:[["","五人乘快艇逆流而上，穿过夔门峡口。无名会武装艇从两岸礁石间冲出。"],["老周（扛着榴弹发射器）","今晚的烟花，我包了！"],["陈砚","黑进去了——它们的导航归我了。"],["","敌艇接连撞上暗礁，在江面上燃起火光。"]]},{img:"tex:m_ch7",kb:"in",lines:[["","凌晨。白帝城山门。无名会成员驱使着蛊群在山门外游荡。"]]}]),i.objective("突破白帝城山门");for(const a of["c1","c2","c3","c4","c5"])i.spawn("cultist",a);for(const a of["g1","g2","g3","g4"])i.spawn("gu",a);i.setFlag("bellCharm"),await i.until(()=>i.inRect(1,6,34,12)),i.saveCheckpoint(),await i.say("陈砚（耳语）","镇音的铃，也能反过来用。"),await i.say("小满（点头，摇响铜铃）","这样可以吗？"),i.hint("按 <b>Q</b> 让小满摇铃：附近的蛊化者会<b>调头攻击无名会</b>","点 <b>铜铃</b>：附近的蛊化者会调头攻击无名会",8);const e=()=>i.enemies.filter(a=>a.alive&&a.kind.name==="无名会武装").length;for(;e()>0;)i.objective(`突破白帝城山门（剩余无名会 ${e()}）`),await i.wait(1);for(i.setFlag("gate"),i.objective("进入白帝庙托孤堂"),await i.until(()=>i.inRect(8,14,26,19)),i.saveCheckpoint(),await i.cine([{img:"tex:m_ch7",kb:"in",lines:[["","大殿内供奉着刘备托孤的泥塑。烛光摇曳，一个坐在轮椅上的枯瘦老人背对众人，面朝塑像。"],["方鹤年（不回头）","你们终于来了。（缓缓转轮椅）苏晚，你长得很像你母亲。"],["苏晚（强压颤抖）","我爸呢？"],["方鹤年","你站在他面前。"]]},{img:"f18",kb:"in",sfx:"stinger",lines:[["","方鹤年的轮椅后，是一面巨大的玻璃幕墙。幕墙内浸泡着一具与青铜棺相连的躯体，身上缠满朱砂色菌丝。"],["苏晚（失声）","爸……？"],["方鹤年","十年前，钟曼想取蛊母作为武器。你父亲用自己做了容器，把它锁在体内。他的意识，还在“回声”里。"],["林骁（低声）","所以母体……"],["方鹤年","是你父亲的身体。钟曼三天前把它运去了三峡大坝的水下闸室。她要把蛊母放进库区，顺流而下。"],["老周（咬牙）","那是整条长江！"],["方鹤年","唯一的办法，是让蛊母“回家”。血清是引子，铜铃与歌声是路。"],...t?[["方鹤年","许怀远拿走的那支……是复制品。真的，我一直替晚晚收着。"]]:[],["方鹤年","孩子，你奶奶教过你《安山调》吗？"],["小满（点头，眼泪滑落）","教过。"]]}]),i.setFlag("hall"),i.objective("进入地宫，按“三长两短”激活机关"),await i.interact("rhythm","rhythm","石壁上的《安山调》音符");!await i.mg.rhythm("安山调 · 三长两短",["L","L","L","S","S"]););X.impact(),await i.say("","暗道门开启的瞬间，枪声响起。",2.5);const n=i.spawn("xu","xu");n.awakeRadius=0,i.spawn("cultist","xuGuard1").awaken(),i.spawn("cultist","xuGuard2").awaken(),await i.cine([{img:"tex:m_ch7",kb:"out",chars:[{id:"xu",side:"center"}],lines:[["许怀远（站在殿门，身后是持枪特勤）","林骁，把血清交出来。"],["林骁","许局。你已经没有退路了。"],["许怀远（苦笑）","我早就没有了。"]]}]),n.awaken(),n.mat.color.setRGB(.8,.8,.8),i.boss=n,i.bossName="许怀远",i.objective("击败许怀远"),i.hint("第一阶段：利用 <b>立柱</b> 躲避子弹；<br>他异化后，用 <b>铜铃</b> 让他僵直，再用 <b>冷凝枪</b> 打背后的菌核","躲在立柱后；他异化后用 <b>铜铃</b> 僵直，<b>冷凝枪</b> 打菌核",10),i.addPickup("cryo_ammo",9,19,25),i.addPickup("ammo",25,15,25);let s=1;n.onDamaged=a=>{s===1&&a.hp<a.maxHp*.55&&(s=2,(async()=>(a.stun(2.5),await i.cine([{img:"tex:m_ch7",kb:"in",chars:[{id:"xu",side:"center"}],sfx:"roar",shake:!0,tint:"rgba(120,0,0,0.4)",lines:[["","许怀远从口袋掏出一支 CG-7 样本，注入体内。身体异化，背生朱砂菌触手。"],["许怀远（嘶哑）","我女儿……只剩……三年……"],["林骁（闪避，咬牙）","你不是在救她，你是在杀更多人！"]]}]),a.mat.color.setRGB(1.3,1.3,1.3),i.bossName="异化许怀远",a.speed=3.4,i.jumpscare("xu",0)))())},await i.until(()=>!n.alive),i.boss=null,i.hud.setBoss(null),await i.cine([{img:"tex:m_ch7",kb:"in",chars:[{id:"xu",side:"center"}],dark:!0,lines:[["","许怀远倒地，朱砂脉络退去，露出苍老的本来面目。"],["许怀远（气若游丝）","阿骁……对不起。"],["","他从内袋掏出一枚 U 盘，颤抖着塞进林骁手里。"],["许怀远","大坝闸室……的权限码。替我……看看她。"],["","许怀远闭上眼睛。"]]},{img:"f25",kb:"in",lines:[["","白帝城码头，日落。方鹤年被抬上快艇，气息微弱。"],["方鹤年（握住苏晚的手）","晚晚。你爸爸……一直想对你说……"],["苏晚（蹲下）","说什么？"],["方鹤年","对不起，没能陪你长大。"],["","方鹤年闭上眼。苏晚低头，泪水无声滴落。"],["林骁（轻声）","走吧。去接他回家。"]]}]),i.setFlag("xu"),i.objective("穿过暗道，前往码头"),await i.reachExit(),await i.cine([{caption:"第七章　白帝城<br><small>— 完 —</small>",dur:3}])}async function cg(i){i.setLoadout(["pistol","cryo","mg"],{ammo:60,cryo_ammo:24,mg_ammo:120}),i.hp=100,i.armor=50,i.herbs=3,i.npc("su","su",!0),i.npc("man","man",!0),i.npc("zhou","zhou"),i.npc("chen","chen"),i.bellUnlocked=!0,i.zhenyinUnlocked=!0,await i.cine([{title:["第八章","蛊母"],dur:3,sfx:"stinger"},{caption:"三峡大坝<br><small>长江的最后一道闸</small>",dur:3},{img:"s3_3",kb:"in",sfx:"radio",lines:[["","巨大的混凝土坝体横卧江面，泄洪闸在夜色里轰鸣。"],["陈砚（耳麦）","闸室水位异常！有人在手动开启第七、第八号泄洪口。"],["老周","钟曼。"]]}]),i.objective("进入控制中枢"),await i.until(()=>i.inRect(8,6,26,11)),i.saveCheckpoint(),await i.cine([{img:"tex:m_ch8",kb:"in",chars:[{id:"zhong",side:"center"}],lines:[["","钟曼立于监控屏前，身后是整整一面墙的水位曲线。"],["钟曼（转身，微笑）","林警官。你来得正好。"],["林骁","放弃吧，钟曼。"],["钟曼","放弃？我花了十年，才让“她”醒来。长江是最好的培养皿。三天之后，沿江三亿人，都会听见她的歌。"],["苏晚（冷声）","那不是歌，是吞噬。"],["钟曼（叹息）","你和你父亲，一样固执。"],["","钟曼按下遥控器。闸门开启，水底传来巨大的轰鸣。钟曼趁乱消失在烟雾里。"]],sfx:"impact",shake:!0}]),await i.say("陈砚","我和老周去夺回控制系统！你们带小满下闸室！"),i.setFlag("zhong"),i.removeNpc("zhou"),i.removeNpc("chen"),i.objective("潜入水下闸室"),await i.until(()=>i.inRect(1,15,34,24)),i.saveCheckpoint();const t=i.spawn("mother","mother",{scale:1.2});t.awakeRadius=0,t.invulnerable=!0;const e=i.prop("coffin_hang","mother",3,4.2,3342336);await i.cine([{img:"s3_3",kb:"in",sfx:"whisper",chars:[{id:"coffin",side:"center"}],lines:[["","巨大的水下闸室，中央悬浮着缠满朱砂菌丝的青铜棺与苏明远的躯体。"]]}]),t.awaken(),i.boss=t,i.bossName="蛊母 · 菌丝之壁",i.objective("阶段一：击破四根菌丝锚点（0/4）"),i.hint("蛊母被菌丝锚点保护，先打掉 <b>四根锚点</b>；地上的红圈是菌丝抽打","先打掉四根 <b>锚点</b>；躲开地上的红圈",8);const n=["a1","a2","a3","a4"].map(l=>i.spawn("anchor",l,{scale:1}));for(const l of n)l.awaken();i.addPickup("cryo_ammo",2,20,25),i.addPickup("ammo",32,20,25),i.addPickup("herb",17,24,40);let s=1;for((async()=>{for(;t.alive&&i.chapter?.id===8;)await i.wait(s===1?1.6:2.4),s!==2&&i.rainOn(i.playerPos.x+(Math.random()-.5)*6,i.playerPos.z+(Math.random()-.5)*6,"proj_bug",12)})();n.some(l=>l.alive);)i.objective(`阶段一：击破四根菌丝锚点（${n.filter(l=>!l.alive).length}/4）`),await i.wait(.5);s=2,i.bossName="蛊母 · 回声",await i.cine([{img:"f30",kb:"in",sfx:"whisper",tint:"rgba(80,0,0,0.5)",lines:[["蛊母（苏明远的声音）","晚晚……"],["苏晚（喊）","别开枪！那是我爸的声音……用勘察镜找到核心！"]]}]),i.objective("阶段二：不要开枪！靠近蛊母，用勘察镜锁定核心"),i.hint("<b>开枪会让菌丝大量增殖！</b> 靠近蛊母并保持 <b>勘察镜</b> 扫描","<b>别开枪！</b> 靠近蛊母并保持 <b>勘察</b> 扫描",10),i.onShot=()=>{s===2&&(i.hud.message("菌丝增殖！"),X.roar(t.pos),i.spawn("gu",["w1","w2","w3","w4"][Math.floor(Math.random()*4)]).awaken())};let a=0,r=i.time;for(await i.until(()=>{const l=i.time-r;return r=i.time,i.scanning&&i.playerPos.distanceTo(t.pos)<11&&(a+=l),i.scanCd>0&&!i.scanning&&(i.scanCd=Math.max(0,i.scanCd-l)),a>=3.5}),i.onShot=null,i.hud.message("核心锁定！"),s=3,i.bossName="蛊母 · 安山调",await i.cine([{img:"f19",kb:"in",sfx:"bell",lines:[["蛊母（苏明远的声音，断断续续）","晚晚……是你吗……"],["苏晚（哽咽）","爸，是我。我来接你回家。"],["蛊母","我……撑不住了……她们……在我脑子里……"],["苏晚","没事。有我在。"],["","她举起血清，刺入蛊母心口。小满的铜铃与《安山调》同时响起。"]]}]);!await i.mg.rhythm("安山调 · 最后三拍：三长，两短",["L","L","L","S","S"]);)i.damagePlayer(8,t.pos);t.invulnerable=!1,t.damage(99999,"weak"),i.removeProp(e),i.boss=null,i.hud.setBoss(null),await i.cine([{img:"f29",kb:"in",lines:[["","朱砂菌丝一寸寸褪去，露出苏明远苍老安详的面容。"],["苏明远（最后一次睁眼）","晚晚……你长大了。"],["苏晚（泣不成声）","爸……"],["苏明远","谢谢……你们……让我……回家。"],["","他的身躯化作朱砂色的光点，消散在水里。"]]},{img:"tex:m_ch8",kb:"in",chars:[{id:"zhou",side:"left"},{id:"chen",side:"right"}],sfx:"radio",lines:[["","控制中枢。泄洪闸仍在失控。老周在手动阀门前坚守，陈砚在电子端抢修。"],["老周（扳动阀门，咬着槟榔）","小子，还剩多少秒？"],["陈砚（喊）","九十秒！手动关闭需要有人留在阀门下！"]]}]),i.objective("据守闸室出口，掩护老周关闭阀门");const o=i.time+60;for((async()=>{let l=0;for(;i.time<o&&i.chapter?.id===8;)i.spawn(l%4===3?"ore":"gu",["w1","w2","w3","w4"][l%4]).awaken(),l++,await i.wait(3)})();i.time<o;)i.objective(`掩护老周（剩余 ${Math.ceil(o-i.time)} 秒）`),await i.wait(1);await i.cine([{img:"tex:m_ch8",kb:"in",chars:[{id:"zhou",side:"center"}],lines:[["老周（笑）","那就我吧。我这条腿，早就跑不动了。"],["陈砚","老周——！"],["老周","替我跟林骁说……槟榔……别戒了。"],["","水压吞没了阀门。轰鸣声骤止。"]],sfx:"impact",shake:!0}]);for(const l of i.enemies)l.alive&&l.damage(99999,"body");i.objective("离开闸室"),await i.reachExit(),await i.cine([{img:"s3_3",kb:"out",lines:[["","晨光穿过雾气，洒在大坝上。林骁、苏晚、小满、陈砚站在栏杆边，无人言语。"],["","苏晚把苏明远留下的最后一份实验笔记，轻轻放入江中。"],["小满（摇响铜铃，轻声唱）","安山调……安山安……"],["林骁（低声）","老周。"],["","他取下老周遗落的槟榔袋，放进口袋。"]],sfx:"bell"},{caption:"",dur:2},{img:"f02",kb:"in",dark:!0,lines:[["","黑屏。一辆冷链卡车驶过夜色中的山路。车厢内，一支标着“CG-7 · 备份”的样本管，在黑暗中微微发出红光。"]]},{caption:"《蛊变：长江启示录》<br><small>第一季　完</small>",dur:4}])}const hg={id:21,side:"side1",title:"外滩 · 十六铺夜运",place:"1971 · 上海十六铺 · 雨夜弄堂与码头货仓",pov:"tang",mural:"tex:x_window",par:600,map:["####################################","#&,,,,,,%#o..T..#b.b......b%,,,,,,R#","#,,,,,,,,#......#..........%,,,,,,R#","#&,,,,,,,#..T...2....b.....%,,,,,,R#","#,,,,,,,%#o.....#..........%,,,,b,R#","#,,,,,,,,########...b......%,,,,,,R#","#&,,,,,,,1.................3,,,,,,X#","#,,,,,,,%#..b.......b......%,,,,,,R#","#,,,,,,,,#.................%,b,,,,R#","#&,,,,,,,#...P.....P.......%,,,,,,R#","#,,,,,,,%#.................%,,,,,,R#","#,,,,,,,,#..b...b...b...b..%,,,b,,R#","#&,,,,,,,#.................%,,,,,,R#","#,,,,,,,,#...P.....P.......$,,,,,,R#","#,,,,,,,%#.................%,,,,,,R#","#,,@,,,,,#b.b.b.....b.b.b.b%,,,,,,R#","####################################"],doors:[{id:"1"},{id:"2"},{id:"3",key:"red",label:"码头铁门"}],marks:{startYaw:[0,0],alley:[4,10],a1:[5,7],a2:[3,3],a3:[7,12],door1:[8,6],wh:[12,8],w1:[15,10],w2:[22,8],w3:[24,12],w4:[13,14],w5:[21,2],crate:[22,9],office:[12,2],o1:[14,2],doc1:[13,2],redkey:[11,2],h1:[22,14],h2:[11,12],dock:[30,6],d1:[31,2],d2:[30,10],d3:[32,13],d4:[29,4],ship:[33,6],exit:[34,6],shotgun:[25,14]},items:[{type:"ammo",at:[2,5]},{type:"herb",at:[7,14]},{type:"ammo",at:[11,9]},{type:"medkit",at:[18,1]},{type:"key_red",at:[11,2]},{type:"weapon_mg",at:[25,14]},{type:"mg_ammo",at:[24,2]},{type:"ammo",at:[15,4]},{type:"armor",at:[30,14],secret:!0},{type:"mg_ammo",at:[29,13],secret:!0},{type:"medkit",at:[33,1]},{type:"ammo",at:[29,9]}],lights:[{at:[4,3],color:16728112,intensity:3,flicker:.3,y:2.6},{at:[5,9],color:16756832,intensity:3,flicker:.6},{at:[3,14],color:4243616,intensity:2.5,flicker:.2},{at:[12,2],color:16765066,intensity:3,flicker:.1},{at:[14,9],color:16765066,intensity:3,flicker:.7},{at:[22,9],color:16724e3,intensity:3,flicker:.2,y:1.2},{at:[20,13],color:16765066,intensity:2.5,flicker:.4},{at:[31,4],color:10469631,intensity:3,flicker:.2},{at:[31,11],color:16756832,intensity:3,flicker:.5},{at:[33,6],color:16769184,intensity:4,flicker:.1}],theme:{wall:"tex:x_brick",wall2:"tex:x_shutter",mural:"tex:x_window",floor:"tex:x_concrete",floorOut:"tex:x_stone",ceiling:"tex:x_roof",fog:724242,fogDensity:.045,hemi:[4872832,2103312,.85],sky:"sky:f01",zones:[{rect:[10,1,15,4],wall:"tex:x_plaster",floor:"tex:x_wood"},{rect:[28,1,34,15],wall:"tex:x_iron",floor:"tex:x_wood"}]},route:["alley","door1","wh","office","dock","exit"]},ug={id:22,side:"side2",title:"船舱 · 逆流",place:"1971 · 长江 · 夔门江段 · “江安号”客货轮",pov:"tang",mural:"tex:x_door",par:600,map:["########################################","#,,,,,,%d..%d..%d..%b..b.....b.%c..w..c#","#,,,,,,%...%...%...%.....b.....%.......#","#,,,,,,%%.%%%.%%%.%%.b.......b.%.......#","#,,,,,,%............%...........%..T...#","#,@,,,,1............2.....b.....3......#","#,,,,,,%............%...........%......#","#,,,,,,%%.%%%.%%%.%%.b.......b.%%%.%%%%#","#,,,,,,%...%...%...%.....b.....%.....X.#","#,,,,,,%d..%d..%d..%b..b.....b.%o.....o#","########################################"],doors:[{id:"1"},{id:"2",flag:"bell",trigger:"girl",label:"货舱"},{id:"3",flag:"hold",trigger:"crate",label:"船长室"}],marks:{startYaw:[-1,0],deck:[3,5],cabins:[10,5],girl:[13,1],c1:[9,9],c2:[17,8],c3:[17,2],hold:[22,5],crate:[26,5],lamp1:[22,2],lamp2:[29,8],lamp3:[24,8],n1:[23,3],n2:[28,2],n3:[29,7],n4:[22,8],bridge:[34,5],doc2:[36,3],cap:[35,2],exit:[37,8]},items:[{type:"ammo",at:[4,2]},{type:"herb",at:[9,1]},{type:"mg_ammo",at:[13,9]},{type:"ammo",at:[18,1]},{type:"medkit",at:[17,9]},{type:"mg_ammo",at:[30,1]},{type:"ammo",at:[21,9]},{type:"herb",at:[33,8]},{type:"medkit",at:[38,4]}],lights:[{at:[3,3],color:10469631,intensity:3,flicker:.3},{at:[10,5],color:16765066,intensity:3,flicker:.6},{at:[17,5],color:16765066,intensity:2.5,flicker:.9},{at:[13,1],color:16756832,intensity:2.5,flicker:.2},{at:[22,2],color:16756832,intensity:3,flicker:.4},{at:[26,5],color:16724e3,intensity:4,flicker:.3,y:1.2},{at:[29,8],color:16756832,intensity:3,flicker:.4},{at:[35,3],color:8454032,intensity:2.5,flicker:.1},{at:[37,8],color:16769184,intensity:3,flicker:.2}],theme:{wall:"tex:x_wood",wall2:"tex:x_wood",mural:"tex:x_door",floor:"tex:x_wood",floorOut:"p:deck",ceiling:"p:ceiling",fog:658448,fogDensity:.06,hemi:[3818592,1576968,.7],sky:"sky:f01",zones:[{rect:[20,1,31,9],wall:"tex:x_iron",floor:"tex:x_concrete"},{rect:[32,1,38,9],wall:"p:metal",floor:"p:metal"}]},route:["deck","cabins","girl","hold","crate","bridge","exit"]},dg={id:23,side:"side3",title:"丰都 · 名山溶洞",place:"1971 · 丰都名山脚下 · 丹字班地下设施与楚国崖墓",pov:"tang",mural:"tex:x_memorial",par:780,map:["########################################","#############%..P.........P..%##########","#############%.......x.......5,,X#######","#############%...............%##########","#############%..P.........P..%##########","#####################4##################","##########.............................#","##########..k..k..k..k..k..k..k..k..k..#","##########.............................#","##########......P.......P.......P......#","##########.............................#","##########..k..k..k..k..k..k..k..k..k..#","##########.............................#","#&&&&&&&&#######################3#######","#,,,,,,,,#...%...%...%.d.#...........o.#","#,,,,t,,,#.d.%...%...%...#...T...T.....#","#,,,,,,,,#.RRR.RRR.RRR.RR#.............#","#,,,,,,,,1...............2.............#","#,,,,,,t,#RR.RRR.RRR.RRR.#.............#","#,@,,,,,,#...%.d.%...%...#...c..T..c...#","#,,,,,,,,#...%...%...%...#.............#","########################################"],doors:[{id:"1"},{id:"2",key:"blue",label:"手术室"},{id:"3"},{id:"4",flag:"spider",trigger:"hall",label:"崖墓"},{id:"5",flag:"specimen",trigger:"coffin",label:"崖洞出口"}],marks:{startYaw:[0,0],bank:[4,17],memorial:[4,14],prison:[12,17],p1:[11,15],p2:[19,14],p3:[15,20],p4:[23,19],bluekey:[23,20],surgery:[30,17],s1:[28,14],s2:[34,20],s3:[37,16],doc3:[32,19],hall:[30,9],spider:[18,9],t1:[12,6],t2:[36,12],tomb:[21,4],coffin:[21,2],specimen:[21,3],lampA:[15,3],lampB:[27,3],lampC:[18,1],lampD:[24,1],exitTunnel:[31,2],exit:[32,2]},items:[{type:"ammo",at:[2,15]},{type:"herb",at:[7,20]},{type:"ammo",at:[11,20]},{type:"key_blue",at:[23,20]},{type:"mg_ammo",at:[15,14]},{type:"medkit",at:[19,20]},{type:"ammo",at:[27,20]},{type:"mg_ammo",at:[38,14]},{type:"medkit",at:[11,6]},{type:"ammo",at:[38,12]},{type:"herb",at:[37,6]},{type:"mg_ammo",at:[14,3]},{type:"medkit",at:[28,3]}],lights:[{at:[4,16],color:10469631,intensity:3,flicker:.2},{at:[4,14],color:16756832,intensity:2.5,flicker:.5,y:1.5},{at:[12,17],color:16765066,intensity:2.5,flicker:.8},{at:[20,17],color:16765066,intensity:2.5,flicker:.6},{at:[31,17],color:13696992,intensity:3,flicker:.5},{at:[14,9],color:6356864,intensity:3,flicker:.3},{at:[24,9],color:6356864,intensity:3,flicker:.4},{at:[33,9],color:6356864,intensity:3,flicker:.2},{at:[21,2],color:16724e3,intensity:6,flicker:.3,y:2.5},{at:[31,2],color:10469631,intensity:3,flicker:.1}],theme:{wall:"p:stone",wall2:"tex:x_plaster",mural:"tex:x_memorial",floor:"p:stone",floorOut:"tex:x_stone",ceiling:"p:stone",fog:526856,fogDensity:.065,hemi:[3687480,1575944,.7],sky:"sky:village",zones:[{rect:[26,14,38,20],wall:"tex:x_plaster",floor:"p:tile"},{rect:[10,6,38,12],wall:"tex:x_iron",floor:"tex:x_concrete"},{rect:[14,1,28,4],wall:"p:temple",floor:"p:stone"}]},route:["bank","prison","surgery","hall","tomb","exitTunnel","exit"]};async function fg(i){i.setLoadout(["pistol","cryo"],{ammo:48}),i.switchWeapon("pistol"),i.hp=100,i.armor=0,i.herbs=1,i.scanUnlocked=!1,i.spawn("noh_gun","a1"),i.spawn("noh_blade","a2"),i.spawn("noh_gun","a3",{state:"dormant"}),await i.cine([{title:["联动支线 · 丹字档案","第一幕　外滩 · 十六铺夜运"],dur:3.2,sfx:"stinger"},{caption:"《侠客行1971》 × 《蛊变：长江启示录》<br><small>联动改编故事 · 丹字班、能面众及其经历均为虚构</small>",dur:3.6},{img:"xkx_title",kb:"in",lines:[["","1971 年，上海。秋雨下了整整一夜，外滩的钟楼在雾里只剩一团昏黄。"],["","十六铺的老货仓里，一伙戴白色能面的人，正把一口贴着封条的铜皮木箱抬上开往上游的江轮。"]]},{img:"xkx_hero",kb:"in",lines:[["唐武男","能面众……这群人不碰鸦片，也不碰军火。"],["唐武男","他们只运一样东西——三十年前就该烂在地里的东西。"]]},{img:"xkx_full",kb:"out",sfx:"bell",lines:[["","红黑金白的脸谱扣上。二代无常，夜行。"]]}]),i.objective("穿过同兴里弄堂，潜入十六铺货仓"),i.hint("本支线操作 <b>唐武男</b>：<b>1</b> 二代双枪　<b>3</b> 赤霄（近战，不耗弹）<br>能面众是活人——<b>爆头</b>最快；仓库里能缴获霰弹枪（<b>2</b>）","本支线操作 <b>唐武男</b>：点 <b>换枪</b> 切换双枪 / 赤霄（近战不耗弹）<br>仓库里能缴获霰弹枪",10),await i.until(()=>i.inRect(10,6,26,15)),i.saveCheckpoint(),X.setAmbientLevel(.7),i.spawn("noh_gun","w1"),i.spawn("noh_blade","w2"),i.spawn("noh_gun","w3"),i.spawn("noh_blade","w4",{state:"dormant"}),i.spawn("noh_gun","w5");const t=i.prop("coffin_hang","crate",1.5,0,1114112);await i.say("唐武男（低声）","箱子还在。船还没开。"),i.objective("查看那口铜皮木箱");let e=0;const n=(s,a,r)=>{i.npc(s,a),i.addInteract(s,a,"解开绳索",()=>{i.removeInteract(s),i.removeNpc(s),e++,X.pickup(),i.hud.message(`救出码头工人（${e}/2）`),i.say("码头工人",r)})};n("civ1","h1","谢谢侬……那帮人讲日本话，还讲“丰都”，船要开到四川去！"),n("civ2","h2","箱子是空的！真货下午就上船了，他们留这口箱子钓人！"),await i.interact("crate","crate","撬开铜皮木箱"),X.impact(),await i.cine([{img:"f23",kb:"in",tint:"rgba(60,30,10,0.45)",lines:[["","箱盖撬开——里面是空的。只剩一层发黑的稻草，和一股说不清的铁锈味。"],["","箱壁内侧烙着一行褪色的字：「丹-7　昭和十五年　防疫给水部」。"],["唐武男","昭和十五年……一九四〇。"],["唐武男","真货已经上船了。这口箱子，是给追来的人准备的。"]]}]),i.removeProp(t),i.objective("到账房找出货单，拿码头铁门的钥匙"),i.spawn("noh_blade","w2",{ox:1}),i.spawn("noh_blade","w4",{ox:-1}).awaken(),await i.interact("doc1","doc1","翻看账房里的文件",void 0,0,.6),i.spawn("noh_gun","o1"),await i.hud.showDocument("档案① · 丹字班派遣令（抄件）",`<p class="dim">关东军防疫给水部（731）本部　昭和十五年（1940）</p>
     <p>着即编成「<b class="red">丹字班</b>」，以汉口某药行之名义，自宜昌溯江而上，收购朱砂、丹参。</p>
     <p>目标：川东传说中「能令死者行走之朱砂」。到达地点：<b>丰都</b>。</p>
     <p>分队长：代号「丹一号」。本令阅后焚毁。</p>
     <p class="dim">——页边有一行新写的钢笔字：<b>“丹-7，1971 年秋，原路送回。能面。”</b></p>`),await i.say("唐武男","原路送回……他们要把这东西送回丰都。"),i.objective("拿上钥匙，打开码头铁门"),await i.until(()=>i.inRect(28,1,33,15)),i.saveCheckpoint(),X.setAmbientLevel(.55),i.spawn("noh_gun","d1"),i.spawn("noh_gun","d2"),i.spawn("noh_blade","d3"),i.spawn("noh_blade","d4"),X.radio(),await i.say("","——江轮拉响了汽笛。",2),i.objective("在“江安号”开船前登船"),i.hint("码头尽头的跳板就是登船口","码头尽头的跳板就是登船口",5),await i.reachExit(),await i.cine([{img:"f01",kb:"in",tint:"rgba(40,20,10,0.5)",sfx:"explosion",lines:[["","跳板被收起的前一秒，唐武男纵身跃上船尾。"],["","“江安号”客货轮驶离十六铺，逆流而上。"],...e===2?[["","岸上，两个被救下的码头工人目送着江轮消失在雨里。"]]:[]]},{caption:"第一幕　外滩 · 十六铺夜运<br><small>— 完 —</small>",dur:3}])}async function pg(i){i.setLoadout(["pistol","mg","cryo"],{ammo:40,mg_ammo:10}),i.switchWeapon("pistol"),i.hp=100,i.armor=0,i.herbs=1,i.scanUnlocked=!1,await i.cine([{title:["联动支线 · 丹字档案","第二幕　船舱 · 逆流"],dur:3,sfx:"stinger"},{caption:"三天后　深夜<br><small>长江 · 夔门江段</small>",dur:3},{img:"tex:m_ch4",kb:"in",tint:"rgba(20,30,50,0.5)",lines:[["","“江安号”在峡谷里慢慢地爬。两岸峭壁黑得像墨，只有船头一盏探灯晃来晃去。"],["唐武男","三天了，能面众一个都没露面。"],["","货舱方向突然传来一声闷响。接着是惨叫——不像人的惨叫。"]]}]),i.objective("穿过客舱，查看货舱的动静"),i.hint("<b>丹奴</b>打身体只有一半伤害，倒地后还会爬起来<br><b>爆头</b>、用 <b>赤霄</b> 斩倒地的丹奴，或用火烧，才能让它彻底不动","<b>丹奴</b>倒地后还会爬起来<br><b>爆头</b>、用 <b>赤霄</b> 斩倒地的，或用火烧，才能彻底解决",11),await i.until(()=>i.inRect(8,1,19,9)),i.saveCheckpoint(),X.setAmbientLevel(.75),i.spawn("dannu","c1",{state:"dormant"}),i.spawn("dannu","c2"),(async()=>(await i.until(()=>i.inRect(15,4,19,6)),i.jumpscare("water_gu",0),i.spawn("dannu","c3").awaken()))(),await i.say("","（客舱门后，有人在小声地摇铃——三长，两短。）",3),i.objective("找到摇铃的人"),await i.interact("girl","girl","敲门：“别怕，我不是他们的人”"),await i.cine([{img:"tex:m_ch7",kb:"in",tint:"rgba(60,30,10,0.4)",chars:[{id:"tang",side:"left"}],lines:[["","门后是一个十七八岁的姑娘，背着一只傩戏班的戏箱，手里攥着一只铜铃。"],["傩戏班姑娘","你……你脸上画的是什么？"],["唐武男","脸谱。跟你戏箱里的面具差不多。外面那些东西，你见过？"],["傩戏班姑娘","没见过，但听我师父讲过。三十年前丰都闹过“走尸”，是日本人从山里挖出来的。"],["傩戏班姑娘","师父说，那东西怕铜声。铃一响，它们就站住了。"],["","她把铃塞进唐武男手里。"],["傩戏班姑娘","我们班子回丰都唱戏，就是要去封那个洞。师父没上船……他在码头被人带走了。"],["唐武男","铃我先借着。你锁好门，到丰都之前别出来。"]]}]),i.bellUnlocked=!0,i.bellOwn=!0,i.hint("获得 <b>镇魂铜铃</b>：按 <b>Q</b> 摇铃，6 米内的丹奴僵直 2.5 秒（冷却 12 秒）<br>对能面众无效","获得 <b>镇魂铜铃</b>：点 <b>铜铃</b>，附近的丹奴僵直（对人无效）",9),i.setFlag("bell"),i.objective("进入货舱"),await i.until(()=>i.inRect(21,1,31,9)),i.saveCheckpoint();const t=i.prop("coffin","crate",1.6,0,2228224);await i.cine([{img:"f24",kb:"in",tint:"rgba(60,20,10,0.45)",lines:[["","货舱中央，那口真正的“丹-7”铜皮箱已经裂开，红色的菌丝顺着箱缝爬满了甲板。"],["","三个押运员倒在旁边。他们的能面掉在地上，脸已经不是人的脸了。"],["唐武男","……原来你们自己也镇不住它。"]]}]);const e=["n1","n2","n3","n4"].map(a=>i.spawn("dannu",a));for(const a of e)a.awaken();i.hint("货舱里挂着 <b>煤油灯</b>：靠近按 <b>E</b> 砸碎，火能烧尽附近的丹奴","货舱里挂着 <b>煤油灯</b>：靠近点 <b>互动</b> 砸碎，火能烧尽附近的丹奴",9);for(const a of["lamp1","lamp2","lamp3"])i.addInteract(a,a,"砸碎煤油灯",()=>{i.removeInteract(a);const r=i.at(a);i.fireBurst(r.x,r.z,4.5),i.hud.message("煤油泼开，火舌卷过甲板！")},void 0,0,0);const n=()=>e.filter(a=>a.alive||a.downed).length;let s=!1;for(;n()>0||!s;){if(i.objective(`清理货舱里的丹奴（剩余 ${n()}）`),!s&&n()<=1){s=!0,i.shakeCamera(.5),X.roar(i.at("crate")),await i.say("","裂开的箱子里，又爬出来三个。",2);for(const a of[-1,0,1]){const r=i.spawn("dannu","crate",{ox:a,oz:1.2});r.awaken(),e.push(r)}}await i.wait(.5)}i.removeProp(t),i.setFlag("hold"),i.objective("去船长室，查清这条船要开去哪里"),await i.until(()=>i.inRect(33,1,38,9)),i.saveCheckpoint(),i.spawn("noh_gun","cap").awaken(),i.spawn("noh_blade","bridge",{ox:2}).awaken(),await i.say("能面众（日语口音）","二代无常……你不该上这条船。"),await i.until(()=>!i.enemies.some(a=>a.alive&&a.kind.human)),await i.interact("doc2","doc2","翻看船长桌上的日志",void 0,0,.6),await i.hud.showDocument("档案② · 丹字班试验日志（残页，大半被涂黑）",`<p class="dim">昭和十六年（1941）　丰都　名山脚下　盐仓</p>
     <p>崖墓中取出朱砂样菌。三十七度下自主增殖。</p>
     <p>■■■■■■■■■■■■■■■■■■■■■■■</p>
     <p>受试者称“听见歌声”。<b class="red">铜器敲击可使菌丝暂时休眠。</b></p>
     <p>当地傩戏班夜夜在山下摇铃唱戏，■■■■■■■■，屡禁不止。</p>
     <p>编号“丹奴”者，伤其躯干不死，断其首方止。</p>
     <p class="dim">——日志最后一页夹着一张船票：江安号，终点 <b>丰都</b>。</p>`),await i.say("唐武男","他们在一九四一年就知道铃声能镇住它……还是继续往人身上试。"),i.objective("船靠丰都了——从舷梯下船"),X.radio(),await i.say("","——汽笛长鸣，江轮缓缓靠岸。",2),await i.reachExit(),await i.cine([{img:"s3_2",kb:"in",tint:"rgba(40,40,30,0.45)",lines:[["","黎明。丰都，名山脚下。江雾里能看见半座被炸塌的山崖，崖下是一片早已荒废的盐仓。"],["唐武男","三十年了……还有人记得这里吗？"]]},{caption:"第二幕　船舱 · 逆流<br><small>— 完 —</small>",dur:3}])}function mg(i,t,e,n,s=8){const a=new fe(s,.035,.035),r=new ui({color:16722448,transparent:!0,opacity:.4,depthWrite:!1}),o=new Mt(a,r);o.position.set(t,.5,e),o.rotation.y=-n,i.addObject(o);const l=t-Math.cos(n)*s/2,c=e-Math.sin(n)*s/2,h=t+Math.cos(n)*s/2,u=e+Math.sin(n)*s/2,d=()=>{const _=i.playerPos.x-l,m=i.playerPos.z-c,p=h-l,w=u-c,A=Math.max(0,Math.min(1,(_*p+m*w)/(p*p+w*w)));return Math.hypot(_-p*A,m-w*A)};let f=!1;const g=(async()=>{const _=i.time;for(;i.time-_<1.05;){if(f){i.removeObject(o);return}r.opacity=.25+Math.abs(Math.sin((i.time-_)*18))*.5,await i.wait(.03)}r.color.setHex(14673646),r.opacity=.95,X.tone("sawtooth",2400,1800,.12,.05,X.out());let m=0;const p=i.time;for(;i.time-p<9&&!f;)m-=.05,m<=0&&d()<.5&&(i.damagePlayer(14,new D(t,0,e),"wire"),i.hud.message("钢丝割开了皮肉！"),m=.8),await i.wait(.05);i.removeObject(o)})();return{cancel:()=>{f=!0},done:g}}async function gg(i){i.setLoadout(["pistol","mg","cryo"],{ammo:48,mg_ammo:12}),i.switchWeapon("pistol"),i.hp=100,i.armor=25,i.herbs=2,i.scanUnlocked=!1,i.bellUnlocked=!0,i.bellOwn=!0,await i.cine([{title:["联动支线 · 丹字档案","第三幕　丰都 · 名山溶洞"],dur:3,sfx:"stinger"},{img:"s3_2",kb:"in",tint:"rgba(40,40,30,0.45)",lines:[["","盐仓后面的山壁上，有人用凿子刻满了名字。很多名字下面，只刻着“无名氏”。"],["唐武男","……"],["","山壁正中，一道被炸开又被重新凿通的洞口。洞口新鲜的脚印，一直延伸到黑暗里。"]]}]),i.objective("进入盐仓（可以先在山壁前停留片刻）"),i.addInteract("memorial","memorial","在山壁前默哀",async()=>{i.removeInteract("memorial"),await i.hud.showDocument("名山脚下 · 无名石壁",`<p>丹字班罹难同胞　一九四一 — 一九四五</p>
       <p>王大有　李秀英　陈二娃　张德贵　刘桂兰　赵满仓　周幺妹　何长生　吴老三　冉光福　谭春花　秦水生　……</p>
       <p class="dim">名多不可考。刻字的人没有留下姓名，只在最下面写了一行：</p>
       <p><b>“铃声在，魂就找得到回家的路。”</b></p>`),X.sample("bronze_bell_long",.5),await i.say("唐武男（低声）","我会把洞封上。")},void 0,0,-.8),await i.until(()=>i.inRect(10,14,24,20)),i.saveCheckpoint(),X.setAmbientLevel(.85);for(const c of["p1","p2","p3"])i.spawn("dannu",c,{state:"dormant"});const t=i.spawn("dannu","p4",{state:"dormant"});t.awakeRadius=4,await i.say("唐武男","铁栏、手术床……这里不是盐仓，是牢房。"),i.objective("在牢房里找到手术室的钥匙"),(async()=>(await i.until(()=>i.inRect(22,19,24,20)),i.jumpscare("water_gu",10),t.awaken()))(),await i.until(()=>i.inRect(26,14,38,20)),i.saveCheckpoint(),i.spawn("noh_gun","s1").awaken(),i.spawn("noh_blade","s2").awaken(),i.spawn("noh_gun","s3"),await i.say("能面众","把他留在这儿——和那些人一样！"),await i.until(()=>!i.enemies.some(c=>c.alive&&c.kind.human)),await i.interact("doc3","doc3","翻看手术台上的铁皮箱",void 0,0,.6),await i.hud.showDocument("档案③ · 交接清单（一九四五年八月十六日）",`<p class="dim">奉命销毁本班一切设施、记录及受试者。洞口以炸药封闭。</p>
     <p>以下样本不予销毁，移交「<b class="red">能面</b>」保管：</p>
     <p>丹-1　丹-2　丹-3　丹-4　丹-5　丹-6　<s>丹-7</s>　丹-8　丹-9</p>
     <p class="dim">“丹-7”一栏被人用红笔划掉，旁边是新写的字：</p>
     <p><b>“1971 年秋，丹-7 母株送回原墓，与其余八株合并培养。”</b></p>`),await i.say("唐武男","一九四五年他们投降了。可这些东西没有投降。"),i.objective("穿过标本间，去最深处的崖墓"),await i.until(()=>i.inRect(10,6,38,12)),i.saveCheckpoint(),await i.cine([{img:"f17",kb:"in",tint:"rgba(40,60,30,0.45)",lines:[["","一排排玻璃罐里泡着朱砂色的人形。灯管在头顶嗡嗡作响。"],["","罐子的另一头，有个背着钢丝卷盘的人慢慢转过身来。白色的能面，爪子一样的手套。"]]},{img:"f18",kb:"out",chars:[{id:"tsuchigumo",side:"right"}],lines:[["土蜘蛛","二代无常。上海的账还没算完，你又追到这里来了。"],["唐武男","箱子是你们运回来的。罐子里的人，也是你们的“货”？"],["土蜘蛛","这些是遗产。主人们输了战争，遗产总得有人继承。"]]}]);const e=i.spawn("tsuchigumo","spider");e.awaken(),i.boss=e,i.objective("击败土蜘蛛"),i.hint("土蜘蛛布线前会出现 <b>红色预警线</b>，架好的钢丝碰到会被割伤——绕开它<br>趁他布线时用 <b>赤霄</b> 砍中，可以打断","红色预警线是土蜘蛛的钢丝——绕开它；趁他布线时用 <b>赤霄</b> 砍中可以打断",10);let n=!1;e.interrupt=()=>{n=!0};let s=!1;e.onDamaged=c=>{!s&&c.hp<c.maxHp*.5&&(s=!0,i.say("土蜘蛛","出来！"),i.spawn("noh_blade","t1").awaken(),i.spawn("noh_gun","t2").awaken())};const a=[];(async()=>{for(await i.wait(4);e.alive;){n=!1;const c=h=>!0;if(e.state!=="stunned"){e.behavior=c;const h=i.playerPos.x-e.pos.x,u=i.playerPos.z-e.pos.z,d=Math.hypot(h,u)||1,f=Math.min(.75,Math.max(.35,1-2.5/d)),g=mg(i,e.pos.x+h*f,e.pos.z+u*f,Math.atan2(u,h)+Math.PI/2,9);a.push(g);const _=i.time;await i.until(()=>n||i.time-_>1.05||!e.alive),e.behavior=null,n&&(g.cancel(),e.stun(2.2),i.hud.message("赤霄打断了布线！"),X.impact())}await i.wait(e.hp<e.maxHp*.5?5:7)}})(),await i.until(()=>!e.alive);for(const c of a)c.cancel();i.boss=null,i.hud.setBoss(null),await i.cine([{img:"f18",kb:"in",dark:!0,chars:[{id:"tsuchigumo_dead",side:"center"}],lines:[["土蜘蛛（喘息）","你封得住这个洞……封得住人心吗……"],["土蜘蛛","战争结束了二十六年。想要它的人……只会越来越多。"]]}]),i.setFlag("spider"),i.objective("进入崖墓"),await i.until(()=>i.inRect(14,1,28,4)),i.saveCheckpoint();const r=i.prop("coffin","coffin",1.8,.9,3342336);await i.cine([{img:"f23",kb:"in",tint:"rgba(80,0,0,0.4)",lines:[["","墓室中央是一座石台，石台上一口缠满朱砂菌丝的青铜棺。棺身刻着云雷纹。"],["","八个玻璃罐摆在石台四周，罐里的菌丝正往棺材里爬——它们在“合并”。"],["唐武男","能面众要的不是这口棺……是棺里养出来的东西。"]]},{img:"f24",kb:"out",sfx:"scream",shake:!0,chars:[{id:"mandrill",side:"center"}],lines:[["","棺盖被从里面推开。一个三米高的东西站了起来，身上还挂着一九四〇年代的破军装。"]]}]);const o=i.spawn("specimen","specimen");o.awaken(),i.boss=o,i.bossName="棺中之物 · 丹字班最后的试验体",i.objective("毁掉棺中之物"),i.hint("摇 <b>铜铃</b> 让它僵直，僵直时伤害大幅提高<br>把它引到 <b>火油罐</b> 旁按 <b>E</b> 点燃","点 <b>铜铃</b> 让它僵直，僵直时伤害大幅提高<br>把它引到 <b>火油罐</b> 旁点 <b>互动</b> 点燃",10);for(const c of["lampA","lampB","lampC","lampD"])i.addInteract(c,c,"点燃火油罐",()=>{i.removeInteract(c);const h=i.at(c);i.fireBurst(h.x,h.z,5),i.hud.message("火油罐炸开！")});let l=1;o.onDamaged=c=>{l===1&&c.hp<c.maxHp*.6&&(l=2,i.say("","它身上的菌丝炸开，墓室四周的罐子一个接一个碎裂。"))},(async()=>{for(;o.alive&&(await i.wait(l===2?11:16),!!o.alive);)if(i.enemies.filter(h=>h.alive&&h.kind.name==="丹奴").length<4)for(const h of["lampA","lampB"])i.spawn("dannu",h,{oz:.8}).awaken()})(),await i.until(()=>!o.alive),i.boss=null,i.bossName="",i.hud.setBoss(null),i.removeProp(r),await i.cine([{img:"f23",kb:"in",dark:!0,sfx:"bell",lines:[["","试验体倒在石台前。破军装的口袋里掉出一块铝制的身份牌，上面的名字已经被锈蚀得看不清了。"],["唐武男","你也曾经是个人。"],["","他把炸药绑在青铜棺上，点燃引信。"]]}]),i.setFlag("specimen"),i.objective("崖墓要塌了——从崖洞出口撤出去！"),i.saveCheckpoint(),(async()=>{for(;i.chapter?.id===23&&!i.inRect(30,2,32,2);)i.shakeCamera(.45),i.rainOn(i.playerPos.x+(Math.random()-.5)*5,i.playerPos.z+(Math.random()-.5)*5,"proj_rock",10),await i.wait(1.3)})(),await i.reachExit(),X.explosion(),await i.cine([{img:"s3_2",kb:"in",shake:!0,sfx:"explosion",lines:[["","名山的半边崖壁轰然塌落，把崖墓和盐仓一起埋进了山里。"],["","山下，傩戏班的铃声响了起来。三长，两短。"]]},{img:"xkx_title",kb:"in",lines:[["唐武男","九株样本，八株在罐里，一株在棺里。都烧干净了。"],["唐武男","……都烧干净了吗？"]]},{caption:"同一时刻　丰都下游三里<br><small>江边芦苇丛</small>",dur:3},{img:"f29",kb:"in",tint:"rgba(60,0,0,0.35)",lines:[["","一个满身泥水的能面众爬上岸，摘下裂开的面具。"],["","他手里攥着一支玻璃管。标签被撕掉了一半，只剩下一个“丹”字。管子里的东西，在黑暗中微微发着红光。"]]},{caption:"第三幕　丰都 · 名山溶洞<br><small>— 完 —</small>",dur:3}])}const us=[{data:j0,run:ig},{data:Y0,run:ng},{data:K0,run:sg},{data:Z0,run:ag},{data:J0,run:rg},{data:Q0,run:og},{data:tg,run:lg},{data:eg,run:cg}],ds=[{data:hg,run:fg},{data:ug,run:pg},{data:dg,run:gg}];document.body.classList.add("mobile");const jl={quality:"low",sensitivity:1,volume:.8,aimAssist:Vl,easyQte:Vl,subtitleSize:1};function _g(){try{const i=localStorage.getItem(Cc);if(i){const t=JSON.parse(i);return{unlocked:1,current:1,side:1,sideCur:1,choices:{},...t,settings:{...jl,...t.settings}}}}catch{}return{unlocked:1,current:1,side:1,sideCur:1,choices:{},settings:{...jl}}}const Kt=_g(),Ms=()=>{try{localStorage.setItem(Cc,JSON.stringify(Kt))}catch{}};ps.isNativePlatform()&&Zc.hide().catch(()=>{});const vg=document.querySelector("#game"),ie=new q0(vg,Kt.settings);ie.applySettings();const xg=["menu","chapters","side","pause","dead","inter","ending","settings","controls"];let ta="menu";const Me=i=>xg.forEach(t=>document.getElementById(t).classList.toggle("on",t===i)),ee=i=>document.getElementById(i),Lc=navigator.userAgent,yg=/Macintosh|Mac OS X/.test(Lc),bg=/iPhone|iPad|iPod/.test(Lc)||yg&&navigator.maxTouchPoints>1,Dc=ps.isNativePlatform()?"安卓手机版":bg?"iPhone / iPad 网页版":"手机网页版";ee("platform-label").textContent=Dc;ee("ctl").innerHTML=`<h4>手机版操作</h4>
     <p>左半屏任意位置按下：浮动摇杆移动（推到底小跑，消耗体力）</p>
     <p>右半屏滑动：转动视角　·　按住「开火」时也能拖动瞄准</p>
     <p>「互动」开门 / 拾取 / 对话　·　「换弹」「换枪」「闪避」</p>
     <p>「强光」手电爆闪使蛊化者硬直　·　「勘察」扫描弱点与暗门</p>
     <p>「铜铃」小满摇铃驱散　·　「镇音」三长两短定住蛊群</p>
     <p>「草药」恢复生命　·　「地图」自动地图　·　右上角暂停</p>`;const vo=ee("s-quality"),xo=ee("s-sens"),yo=ee("s-vol"),bo=ee("s-assist"),Mo=ee("s-easy"),wo=ee("s-sub");vo.value=Kt.settings.quality;xo.value=String(Kt.settings.sensitivity);yo.value=String(Kt.settings.volume);bo.checked=Kt.settings.aimAssist;Mo.checked=Kt.settings.easyQte;wo.value=String(Kt.settings.subtitleSize);const Mg=()=>{Object.assign(Kt.settings,{quality:vo.value,sensitivity:Number(xo.value),volume:Number(yo.value),aimAssist:bo.checked,easyQte:Mo.checked,subtitleSize:Number(wo.value)}),ie.settings=Kt.settings,ie.applySettings(),Ms()};[vo,xo,yo,bo,Mo,wo].forEach(i=>i.addEventListener("input",Mg));function wg(){ee("chapter-grid").innerHTML=us.map((i,t)=>{const e=t+1>Kt.unlocked;return`<button class="ch-card ${e?"locked":""}" data-ch="${t+1}" ${e?"disabled":""}>
      <div class="ch-img" style="background-image:url(${we(`tex/${i.data.mural.slice(4)}.webp`)})"></div>
      <b>第${"一二三四五六七八"[t]}章　${i.data.title}</b><small>${e?"未解锁":i.data.place}</small></button>`}).join(""),ee("chapter-grid").querySelectorAll(".ch-card").forEach(i=>i.addEventListener("click",()=>{X.init(),Me(null),fs(Number(i.dataset.ch))}))}const Ic=["第一幕","第二幕","第三幕"];function Sg(){ee("side-grid").innerHTML=ds.map((i,t)=>{const e=t+1>Kt.side;return`<button class="ch-card ${e?"locked":""}" data-act-n="${t+1}" ${e?"disabled":""}>
      <div class="ch-img" style="background-image:url(${we(`tex/${i.data.mural.slice(4)}.webp`)})"></div>
      <b>${Ic[t]}　${i.data.title}</b><small>${e?"未解锁":i.data.place}</small></button>`}).join(""),ee("side-grid").querySelectorAll(".ch-card").forEach(i=>i.addEventListener("click",()=>{X.init(),X.startAmbient(),Me(null),So(Number(i.dataset.actN))}))}async function So(i){const t=++Je;Eo=!0;for(let e=i;e<=ds.length;e++)if(t!==Je||(Kt.sideCur=e,Ms(),!await Eg(ds[e-1],t))||(Kt.side=Math.max(Kt.side,Math.min(ds.length,e+1)),Ms(),!await Uc(e,ie.stats,!0)||t!==Je))return;t===Je&&Ag()}async function Eg(i,t){ie.choices=Kt.choices,ie.loadChapter(i.data),ie.setState("playing"),ie.hud.setFade(0,600),X.setAmbientLevel(.55);try{await i.run(ie)}catch(e){if(console.error(e),t!==Je)return!1}return t===Je}let Je=0,Eo=!1;async function fs(i){const t=++Je;Eo=!1;for(let e=i;e<=us.length;e++){if(t!==Je)return;Kt.current=e,Ms();const n=us[e-1];ie.choices=Kt.choices,ie.loadChapter(n.data),ie.setState("playing"),ie.hud.setFade(0,600),X.setAmbientLevel(.55);try{await n.run(ie)}catch(a){if(console.error(a),t!==Je)return}if(t!==Je||(Kt.choices=ie.choices,Kt.unlocked=Math.max(Kt.unlocked,Math.min(us.length,e+1)),Ms(),!await Uc(e,ie.stats)||t!==Je))return}t===Je&&Tg()}function qr(i){const t=Math.round(i);return`${Math.floor(t/60)}:${String(t%60).padStart(2,"0")}`}function Uc(i,t,e=!1){ie.setState("inter");const n=e?ds:us,s=n[i-1].data;ee("inter-bg").style.backgroundImage=`url(${we(`tex/${s.mural.slice(4)}.webp`)})`,ee("inter-ch").textContent=e?`联动支线 · ${Ic[i-1]}　完成`:`第${"一二三四五六七八"[i-1]}章　完成`,ee("inter-title").textContent=s.title;const a=(h,u)=>u?Math.round(h/u*100):100,r=[["击杀",a(t.kills,t.totalKills),`${t.kills} / ${t.totalKills}`],["物品",a(t.items,t.totalItems),`${t.items} / ${t.totalItems}`],["隐藏区域",a(t.secrets,t.totalSecrets),`${t.secrets} / ${t.totalSecrets}`],["命中率",a(t.hits,t.shots),`爆头 ${t.headshots}`]];ee("inter-rows").innerHTML=r.map(([h,,u])=>`<div class="ir"><span>${h}</span><b data-v="0">0%</b><small>${u}</small></div>`).join("")+`<div class="ir"><span>用时</span><b>${qr(t.time)}</b><small>参考 ${qr(t.par)}</small></div>`;const o=(r[0][1]+r[1][1]+r[2][1])/3+(t.time<t.par?15:0),l=o>=95?"S":o>=80?"A":o>=60?"B":"C";ee("inter-grade").textContent="",ee("btn-next").textContent=i>=n.length?"观看结局":e?"下一幕":"下一章",Me("inter");const c=[...ee("inter-rows").querySelectorAll(".ir b")];return r.forEach(([,h],u)=>{let d=0;const f=setInterval(()=>{d=Math.min(h,d+3),c[u].textContent=`${d}%`,X.dryFire(),d>=h&&clearInterval(f)},30+u*6)}),setTimeout(()=>{ee("inter-grade").textContent=`评级 ${l}`,X.stinger()},1600),new Promise(h=>{ln=h})}let ln=null;function Tg(){ie.setState("menu"),ee("credits").innerHTML=`<h2>蛊变：长江启示录</h2><p>第一季　完</p>
    <p class="cr">原作剧本 · 美术设定：CAI-GENGYU</p><p class="cr">游戏开发：Claude Code</p>
    <p class="cr">${Dc} · 通关总用时 ${qr(ie.totalTime)}</p>
    <p class="tease">黑屏。一辆冷链卡车驶过夜色中的山路。<br>车厢内，一支标着「CG-7 · 备份」的样本管，在黑暗中微微发出红光。</p>`,Me("ending")}function Ag(){ie.setState("menu"),ee("credits").innerHTML=`<h2>丹字档案</h2><p>《侠客行1971》 × 《蛊变：长江启示录》 联动支线　完</p>
    <p class="cr">《侠客行1971》角色与美术：唐武男（二代无常）、能面众、土蜘蛛 —— 取自《侠客行1971》v0.4 美术资源</p>
    <p class="cr">《蛊变：长江启示录》原作剧本 · 美术设定：CAI-GENGYU</p><p class="cr">游戏开发：Claude Code</p>
    <p class="cr">丹字班、能面众及本支线情节均为虚构；七三一部队的罪行是真实的历史。谨以此支线纪念所有无名的受害者。</p>
    <p class="tease">1976 年 11 月，丰都下游。一支考古队在一座“新发现”的楚国崖墓里，<br>挖出了一管在 37℃ 下自主增殖的朱砂样本。<br>领队名单上，有两个年轻的名字：苏明远，方鹤年。</p>`,Me("ending")}ie.onStateChange=i=>{i==="paused"?Me("pause"):i==="dead"?(ee("dead-tip").textContent=["蛊化者畏光——手电强光能让它们硬直。","勘察镜能看到首领的弱点。","小跑会消耗体力，留一点用来闪避。","铜铃声能驱散成群的蛊化者。","被包围时用镇音：三长两短。"][Math.floor(Math.random()*5)],Me("dead")):(i==="playing"||i==="cine")&&Me(null),To()};function To(){ee("clicklock").style.display="none"}document.addEventListener("pointerlockchange",To);setInterval(To,500);ee("clicklock").addEventListener("click",()=>ie.input.lock());document.querySelectorAll(".screen button[data-act]").forEach(i=>{i.addEventListener("click",async()=>{const t=i.dataset.act,e=i.closest(".screen").id;switch(X.init(),X.startAmbient(),t){case"new":Kt.unlocked=Math.max(Kt.unlocked,1),Kt.choices={},ie.totalTime=0,Me(null),fs(1);break;case"continue":Me(null),fs(Kt.current||1);break;case"side":Sg(),ta=e,Me("side");break;case"chapters":wg(),ta=e,Me("chapters");break;case"trailer":Me(null),await ie.cineP.play([{video:"opening",from:0,to:31}]),Me("menu");break;case"settings":case"controls":ta=e,Me(t);break;case"back":Me(ta);break;case"resume":ie.resume();break;case"checkpoint":Me(null),ie.respawn();break;case"restart":Me(null),Eo?So(Kt.sideCur):fs(Kt.current);break;case"next":ln?.(!0),ln=null;break;case"quit":Je++,ln?.(!1),ln=null,location.reload();break}})});(async()=>(await _0(i=>{ee("ld-fill").style.width=`${Math.round(i*100)}%`}),X.init(),await X.loadSamples(["pistol_shot","cryo_blast","scanner_pulse","bronze_bell_long","bronze_bell_short"],we("sfx/")),ee("btn-continue").style.display=Kt.current>1||Kt.unlocked>1?"":"none",ee("loading").remove(),ie.start(),Me("menu")))();location.search.includes("debug")&&Object.assign(window,{__game:ie,__save:Kt,__run:fs,__runSide:So,__next:()=>{ln?.(!0),ln=null}});
