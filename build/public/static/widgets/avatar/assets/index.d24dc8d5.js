import{d as _,c as h,n as w,o as r,r as O,a,F as d,b as f,e as A,f as E,t as g,g as L}from"./vendor.77b9bbbd.js";const z=function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))i(n);new MutationObserver(n=>{for(const o of n)if(o.type==="childList")for(const c of o.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&i(c)}).observe(document,{childList:!0,subtree:!0});function s(n){const o={};return n.integrity&&(o.integrity=n.integrity),n.referrerpolicy&&(o.referrerPolicy=n.referrerpolicy),n.crossorigin==="use-credentials"?o.credentials="include":n.crossorigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function i(n){if(n.ep)return;n.ep=!0;const o=s(n);fetch(n.href,o)}};z();var $=(t,e)=>{const s=t.__vccOpts||t;for(const[i,n]of e)s[i]=n;return s};const B=_({props:{frames:{type:Array,required:!0},width:{type:Number,required:!1,default:64},height:{type:Number,required:!1,default:64}},data(){return{timeout:null,idx:-1}},computed:{src(){return this.idx>=0&&this.idx<this.frames.length?this.frames[this.idx].url:""}},methods:{nextFrame(){if(this.frames.length===0){this.idx=-1;return}this.timeout&&(clearTimeout(this.timeout),this.timeout=null),this.idx++,this.idx>=this.frames.length&&(this.idx=0),this.timeout=setTimeout(()=>{this.nextFrame()},this.frames[this.idx].duration)}},created(){this.nextFrame(),this.$watch("frames",()=>{this.nextFrame()},{deep:!0})},unmounted(){this.timeout&&(clearTimeout(this.timeout),this.timeout=null)}}),I=["src","width","height"];function W(t,e,s,i,n,o){return r(),h("span",{class:"avatar-animation",style:w({width:`${t.width}px`,height:`${t.width}px`})},[t.src?(r(),h("img",{key:0,src:t.src,width:t.width,height:t.height},null,8,I)):(r(),h("span",{key:1,style:w({width:`${t.width}px`,height:`${t.width}px`,display:"inline-block"})},null,4))],4)}var x=$(B,[["render",W]]);function k(t){this.context=t,this.instant=0,this.slow=0,this.clip=0,this.script=t.createScriptProcessor(2048,1,1),this.script.onaudioprocess=e=>{const s=e.inputBuffer.getChannelData(0);let i,n=0,o=0;for(i=0;i<s.length;++i)n+=s[i]*s[i],Math.abs(s[i])>.99&&(o+=1);this.instant=Math.sqrt(n/s.length),this.slow=.95*this.slow+.05*this.instant,this.clip=o/s.length}}k.prototype.connectToSource=function(t,e){console.log("SoundMeter connecting");try{this.mic=this.context.createMediaStreamSource(t),this.mic.connect(this.script),this.script.connect(this.context.destination),typeof e!="undefined"&&e(null)}catch(s){console.error(s),typeof e!="undefined"&&e(s)}};k.prototype.stop=function(){console.log("SoundMeter stopping"),this.mic.disconnect(),this.script.disconnect()};let p=[];const F=t=>{switch(t){case"error":p=["error"];break;case"info":p=["error","info"];break;case"log":p=["error","info","log"];break;case"debug":p=["error","info","log","debug"];break}};F("info");const v=(t,...e)=>{const s=t,i=n=>(...o)=>{p.includes(n)&&console[n](P("hh:mm:ss",new Date),`[${s}]`,...e,...o)};return{log:i("log"),info:i("info"),debug:i("debug"),error:i("error")}},P=(t,e)=>t.replace(/(hh|mm|ss)/g,(s,i)=>{switch(i){case"hh":return y(e.getHours(),"00");case"mm":return y(e.getMinutes(),"00");case"ss":return y(e.getSeconds(),"00");default:return s}}),y=(t,e)=>{const s=`${t}`;return s.length>=e.length?s:e.substr(0,e.length-s.length)+s},U=1001,C=4e3,D=v("WsWrapper.ts");class q{constructor(e,s){this.handle=null,this.reconnectTimeout=null,this.sendBuffer=[],this.onopen=()=>{},this.onclose=()=>{},this.onmessage=()=>{},this.addr=e,this.protocols=s}send(e){this.handle?this.handle.send(e):this.sendBuffer.push(e)}connect(){const e=new WebSocket(this.addr,this.protocols);e.onopen=s=>{for(this.reconnectTimeout&&clearTimeout(this.reconnectTimeout),this.handle=e;this.sendBuffer.length>0;){const i=this.sendBuffer.shift();i&&this.handle.send(i)}this.onopen(s)},e.onmessage=s=>{this.onmessage(s)},e.onclose=s=>{this.handle=null,s.code===C?D.info("custom disconnect, will not reconnect"):s.code===U?D.info("going away, will not reconnect"):this.reconnectTimeout=setTimeout(()=>{this.connect()},1e3),this.onclose(s)}}disconnect(){this.handle&&this.handle.close(C)}}const M=v("WsClient.ts");class J extends q{constructor(e,s){super(e,s);this._on={},this.onopen=i=>{this._dispatch("socket","open",i)},this.onmessage=i=>{if(this._dispatch("socket","message",i),this._on.message){const n=this._parseMessageData(i.data);n.event&&this._dispatch("message",`${n.event}`,n.data)}},this.onclose=i=>{this._dispatch("socket","close",i)}}onSocket(e,s){this.addEventListener("socket",e,s)}onMessage(e,s){this.addEventListener("message",e,s)}addEventListener(e,s,i){const n=Array.isArray(s)?s:[s];this._on[e]=this._on[e]||{};for(const o of n)this._on[e][o]=this._on[e][o]||[],this._on[e][o].push(i)}_parseMessageData(e){try{const s=JSON.parse(e);if(s.event)return{event:s.event,data:s.data||null}}catch(s){M.info(s)}return{event:null,data:null}}_dispatch(e,s,...i){const o=(this._on[e]||{})[s]||[];if(o.length!==0){M.log(`ws dispatch ${e} ${s}`);for(const c of o)c(...i)}}}const T=(t,e)=>`${window[t]!==`{{${t}}}`?window[t]:e}`,G=T("wsUrl",""),H=T("widgetToken","");var j={wsClient:t=>new J(G+"/"+t,H)};const m=v("Page.vue"),N=.05,K=_({components:{AvatarAnimation:x},data(){return{ws:null,speaking:!1,lockedState:"default",initialized:!1,audioInitialized:!1,tuber:{slot:{}},tuberDef:null,settings:null}},computed:{animationName(){return this.lockedState!=="default"?this.lockedState:this.speaking?"speaking":"default"},animations(){return this.tuberDef?this.tuberDef.slotDefinitions.map(t=>{const e=t.items[this.tuber.slot[t.slot]],s=e.states.find(({state:i})=>i===this.animationName);return s&&s.frames.length>0?s:e.states.find(({state:i})=>i==="default")}):[]}},methods:{ctrl(t,e){if(!this.ws){m.error("ctrl: this.ws not initialized");return}this.ws.send(JSON.stringify({event:"ctrl",data:{ctrl:t,args:e}}))},setSlot(t,e){this.tuber.slot[t]=e,this.tuber.slot=Object.assign({},this.tuber.slot),this.ctrl("setSlot",[t,e])},setSpeaking(t){this.speaking!==t&&(this.speaking=t,this.ctrl("setSpeaking",[t]))},lockState(t){this.lockedState!==t&&(this.lockedState=t,this.ctrl("lockState",[t]))},setTuber(t){this.tuber.slot={},this.tuberDef=JSON.parse(JSON.stringify(t)),this.tuberDef.slotDefinitions.forEach(e=>{this.tuber.slot[e.slot]=e.defaultItemIndex}),this.ctrl("setTuber",[t])},startMic(){if(this.audioInitialized)return;if(this.audioInitialized=!0,!navigator.mediaDevices.getUserMedia){alert("navigator.mediaDevices.getUserMedia not supported in this browser.");return}const t=window.AudioContext||window.webkitAudioContext,e=new t;navigator.mediaDevices.getUserMedia({audio:!0}).then(s=>{const i=new k(e);i.connectToSource(s,n=>{if(n){m.error(n);return}setInterval(()=>{const o=this.speaking?N/2:N;this.setSpeaking(i.instant>o)},100)})}).catch(s=>{m.error(s),alert("Error capturing audio.")})},applyStyles(){if(!this.settings){m.error("applyStyles: this.settings not initialized");return}const t=this.settings.styles;t.bgColor!=null&&(document.bgColor=t.bgColor)}},mounted(){this.ws=j.wsClient("avatar"),this.ws.onMessage("init",t=>{this.settings=t.settings,this.$nextTick(()=>{this.applyStyles()}),this.setTuber(this.settings.avatarDefinitions[0]),this.initialized=!0}),this.ws.connect()}}),V={key:0,class:"base"},R=a("td",null,"Start Mic",-1),Y=["onClick"],Q=a("td",null,"State:",-1),X=["onClick"],Z=a("td",null,"Tubers:",-1),tt=["onClick"];function et(t,e,s,i,n,o){const c=O("avatar-animation");return t.initialized?(r(),h("div",V,[a("div",{class:"avatar",style:w({width:`${t.tuberDef.width}px`,height:`${t.tuberDef.height}px`})},[(r(!0),h(d,null,f(t.animations,(l,u)=>(r(),E(c,{key:u,frames:l.frames,width:t.tuberDef.width,height:t.tuberDef.height},null,8,["frames","width","height"]))),128))],4),a("table",null,[a("tr",null,[R,a("td",null,[a("button",{onClick:e[0]||(e[0]=(...l)=>t.startMic&&t.startMic(...l))},"Start")])]),(r(!0),h(d,null,f(t.tuberDef.slotDefinitions,(l,u)=>(r(),h("tr",{key:u},[a("td",null,g(l.slot)+":",1),a("td",null,[(r(!0),h(d,null,f(l.items,(b,S)=>(r(),h("button",{onClick:nt=>t.setSlot(l.slot,S),key:S},g(b.title),9,Y))),128))])]))),128)),a("tr",null,[Q,a("td",null,[(r(!0),h(d,null,f(t.tuberDef.stateDefinitions,(l,u)=>(r(),h("button",{key:u,onClick:b=>t.lockState(l.value)},g(l.value),9,X))),128))])]),a("tr",null,[Z,a("td",null,[(r(!0),h(d,null,f(t.settings.avatarDefinitions,(l,u)=>(r(),h("button",{onClick:b=>t.setTuber(l),key:u},g(l.name),9,tt))),128))])])])])):A("",!0)}var st=$(K,[["render",et]]);const it=L(st);it.mount("#app");
