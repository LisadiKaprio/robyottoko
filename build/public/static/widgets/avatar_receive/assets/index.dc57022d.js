import{d as m,c as l,n as c,o as a,r as S,a as _,F as $,b as T,e as D,f as N,g as C}from"./vendor.7f7fabf4.js";const O=function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))i(n);new MutationObserver(n=>{for(const o of n)if(o.type==="childList")for(const r of o.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&i(r)}).observe(document,{childList:!0,subtree:!0});function s(n){const o={};return n.integrity&&(o.integrity=n.integrity),n.referrerpolicy&&(o.referrerPolicy=n.referrerpolicy),n.crossorigin==="use-credentials"?o.credentials="include":n.crossorigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function i(n){if(n.ep)return;n.ep=!0;const o=s(n);fetch(n.href,o)}};O();let h=[];const x=t=>{switch(t){case"error":h=["error"];break;case"info":h=["error","info"];break;case"log":h=["error","info","log"];break;case"debug":h=["error","info","log","debug"];break}};x("info");const u=(t,...e)=>{const s=t,i=n=>(...o)=>{h.includes(n)&&console[n](L("hh:mm:ss",new Date),`[${s}]`,...e,...o)};return{log:i("log"),info:i("info"),debug:i("debug"),error:i("error")}},L=(t,e)=>t.replace(/(hh|mm|ss)/g,(s,i)=>{switch(i){case"hh":return d(e.getHours(),"00");case"mm":return d(e.getMinutes(),"00");case"ss":return d(e.getSeconds(),"00");default:return s}}),d=(t,e)=>{const s=`${t}`;return s.length>=e.length?s:e.substr(0,e.length-s.length)+s};var g=(t,e)=>{const s=t.__vccOpts||t;for(const[i,n]of e)s[i]=n;return s};const E=m({props:{frames:{type:Array,required:!0},width:{type:Number,required:!1,default:64},height:{type:Number,required:!1,default:64}},data(){return{timeout:null,idx:-1}},computed:{src(){return this.idx>=0&&this.idx<this.frames.length?this.frames[this.idx].url:""}},methods:{nextFrame(){if(this.frames.length===0){this.idx=-1;return}this.timeout&&(clearTimeout(this.timeout),this.timeout=null),this.idx++,this.idx>=this.frames.length&&(this.idx=0),this.timeout=setTimeout(()=>{this.nextFrame()},this.frames[this.idx].duration)}},created(){this.nextFrame(),this.$watch("frames",()=>{this.idx=-1,this.nextFrame()},{deep:!0})},unmounted(){this.timeout&&(clearTimeout(this.timeout),this.timeout=null)}}),A=["src","width","height"];function B(t,e,s,i,n,o){return a(),l("span",{class:"avatar-animation",style:c({width:`${t.width}px`,height:`${t.width}px`})},[t.src?(a(),l("img",{key:0,src:t.src,width:t.width,height:t.height},null,8,A)):(a(),l("span",{key:1,style:c({width:`${t.width}px`,height:`${t.width}px`,display:"inline-block"})},null,4))],4)}var I=g(E,[["render",B]]);const M=1001,p=4e3,b=u("WsWrapper.ts");class W{constructor(e,s){this.handle=null,this.reconnectTimeout=null,this.sendBuffer=[],this.onopen=()=>{},this.onclose=()=>{},this.onmessage=()=>{},this.addr=e,this.protocols=s}send(e){this.handle?this.handle.send(e):this.sendBuffer.push(e)}connect(){const e=new WebSocket(this.addr,this.protocols);e.onopen=s=>{for(this.reconnectTimeout&&clearTimeout(this.reconnectTimeout),this.handle=e;this.sendBuffer.length>0;){const i=this.sendBuffer.shift();i&&this.handle.send(i)}this.onopen(s)},e.onmessage=s=>{this.onmessage(s)},e.onclose=s=>{this.handle=null,s.code===p?b.info("custom disconnect, will not reconnect"):s.code===M?b.info("going away, will not reconnect"):this.reconnectTimeout=setTimeout(()=>{this.connect()},1e3),this.onclose(s)}}disconnect(){this.handle&&this.handle.close(p)}}const k=u("WsClient.ts");class F extends W{constructor(e,s){super(e,s);this._on={},this.onopen=i=>{this._dispatch("socket","open",i)},this.onmessage=i=>{if(this._dispatch("socket","message",i),this._on.message){const n=this._parseMessageData(i.data);n.event&&this._dispatch("message",`${n.event}`,n.data)}},this.onclose=i=>{this._dispatch("socket","close",i)}}onSocket(e,s){this.addEventListener("socket",e,s)}onMessage(e,s){this.addEventListener("message",e,s)}addEventListener(e,s,i){const n=Array.isArray(s)?s:[s];this._on[e]=this._on[e]||{};for(const o of n)this._on[e][o]=this._on[e][o]||[],this._on[e][o].push(i)}_parseMessageData(e){try{const s=JSON.parse(e);if(s.event)return{event:s.event,data:s.data||null}}catch(s){k.info(s)}return{event:null,data:null}}_dispatch(e,s,...i){const o=(this._on[e]||{})[s]||[];if(o.length!==0){k.log(`ws dispatch ${e} ${s}`);for(const r of o)r(...i)}}}const w=(t,e)=>`${window[t]!==`{{${t}}}`?window[t]:e}`,z=w("wsUrl",""),q=w("widgetToken","");var P={wsClient:t=>new F(z+"/"+t,q)};const f=u("Page.vue"),j=m({components:{AvatarAnimation:I},data(){return{ws:null,speaking:!1,lockedState:"default",initialized:!1,tuber:{slot:{}},tuberDef:null,settings:null}},computed:{animationName(){return this.lockedState!=="default"?this.lockedState:this.speaking?"speaking":"default"},animations(){return this.tuberDef?this.tuberDef.slotDefinitions.map(t=>{const e=t.items[this.tuber.slot[t.slot]],s=e.states.find(({state:i})=>i===this.animationName);return s&&s.frames.length>0?s:e.states.find(({state:i})=>i==="default")}):[]}},methods:{setSlot(t,e){this.tuber.slot[t]=e,this.tuber.slot=Object.assign({},this.tuber.slot)},setSpeaking(t){this.speaking!==t&&(this.speaking=t)},lockState(t){this.lockedState!==t&&(this.lockedState=t)},setTuber(t){if(!this.settings){f.error("setTuber: this.settings not initialized");return}if(t<0||t>=this.settings.avatarDefinitions.length){f.error("setTuber: index out of bounds");return}const e=this.settings.avatarDefinitions[t];this.tuber.slot={},this.tuberDef=JSON.parse(JSON.stringify(e)),this.tuberDef.slotDefinitions.forEach(s=>{this.tuber.slot[s.slot]=s.defaultItemIndex})},applyStyles(){if(!this.settings){f.error("applyStyles: this.settings not initialized");return}const t=this.settings.styles;t.bgColor!=null&&(document.bgColor=t.bgColor)}},mounted(){this.ws=P.wsClient("avatar"),this.ws.onMessage("init",t=>{this.settings=t.settings,this.$nextTick(()=>{this.applyStyles()}),this.setTuber(t.state.tuberIdx===-1?0:t.state.tuberIdx);for(const e of Object.keys(t.state.slots))this.setSlot(e,t.state.slots[e]);this.lockState(t.state.lockedState),this.initialized=!0}),this.ws.onMessage("ctrl",({data:t})=>{if(t.ctrl==="setSlot"){const e=t.args[0],s=t.args[1];this.setSlot(e,s)}else if(t.ctrl==="setSpeaking"){const e=t.args[0];this.setSpeaking(e)}else if(t.ctrl==="lockState"){const e=t.args[0];this.lockState(e)}else if(t.ctrl==="setTuber"){const e=t.args[0];this.setTuber(e)}}),this.ws.connect()}}),J={key:0,class:"base"};function U(t,e,s,i,n,o){const r=S("avatar-animation");return t.initialized?(a(),l("div",J,[_("div",{class:"avatar",style:c({width:`${t.tuberDef.width}px`,height:`${t.tuberDef.height}px`})},[(a(!0),l($,null,T(t.animations,(v,y)=>(a(),N(r,{key:y,frames:v.frames,width:t.tuberDef.width,height:t.tuberDef.height},null,8,["frames","width","height"]))),128))],4)])):D("",!0)}var G=g(j,[["render",U]]);const V=C(G);V.mount("#app");
