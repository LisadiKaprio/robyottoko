import{d as x,c as l,a as T,t as d,b as g,F as _,r as z,e as c,o as a,f as v}from"./vendor.bd2f299d.js";const $=function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))o(i);new MutationObserver(i=>{for(const n of i)if(n.type==="childList")for(const r of n.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&o(r)}).observe(document,{childList:!0,subtree:!0});function s(i){const n={};return i.integrity&&(n.integrity=i.integrity),i.referrerpolicy&&(n.referrerPolicy=i.referrerpolicy),i.crossorigin==="use-credentials"?n.credentials="include":i.crossorigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function o(i){if(i.ep)return;i.ep=!0;const n=s(i);fetch(i.href,n)}};$();let f=[];const O=t=>{switch(t){case"error":f=["error"];break;case"info":f=["error","info"];break;case"log":f=["error","info","log"];break;case"debug":f=["error","info","log","debug"];break}};O("info");const m=(t,...e)=>{const s=t,o=i=>(...n)=>{f.includes(i)&&console[i](C("hh:mm:ss",new Date),`[${s}]`,...e,...n)};return{log:o("log"),info:o("info"),debug:o("debug"),error:o("error")}},C=(t,e)=>t.replace(/(hh|mm|ss)/g,(s,o)=>{switch(o){case"hh":return p(e.getHours(),"00");case"mm":return p(e.getMinutes(),"00");case"ss":return p(e.getSeconds(),"00");default:return s}}),p=(t,e)=>{const s=`${t}`;return s.length>=e.length?s:e.substr(0,e.length-s.length)+s},W=t=>{const e=t.replace(/\W/g,"");return Math.floor(e.length*1e3/12)},b=(t,e="pt")=>{const s=`${t}`;return s.match(/^\d+$/)?`${s}${e}`:s},R=1001,y=4e3,k=m("WsWrapper.ts");class j{constructor(e,s){this.handle=null,this.reconnectTimeout=null,this.sendBuffer=[],this.onopen=()=>{},this.onclose=()=>{},this.onmessage=()=>{},this.addr=e,this.protocols=s}send(e){this.handle?this.handle.send(e):this.sendBuffer.push(e)}connect(){const e=new WebSocket(this.addr,this.protocols);e.onopen=s=>{for(this.reconnectTimeout&&clearTimeout(this.reconnectTimeout),this.handle=e;this.sendBuffer.length>0;){const o=this.sendBuffer.shift();o&&this.handle.send(o)}this.onopen(s)},e.onmessage=s=>{this.onmessage(s)},e.onclose=s=>{this.handle=null,s.code===y?k.info("custom disconnect, will not reconnect"):s.code===R?k.info("going away, will not reconnect"):this.reconnectTimeout=setTimeout(()=>{this.connect()},1e3),this.onclose(s)}}disconnect(){this.handle&&this.handle.close(y)}}const S=m("WsClient.ts");class L extends j{constructor(e,s){super(e,s);this._on={},this.onopen=o=>{this._dispatch("socket","open",o)},this.onmessage=o=>{if(this._dispatch("socket","message",o),this._on.message){const i=this._parseMessageData(o.data);i.event&&this._dispatch("message",`${i.event}`,i.data,i)}},this.onclose=o=>{this._dispatch("socket","close",o)}}onSocket(e,s){this.addEventListener("socket",e,s)}onMessage(e,s){this.addEventListener("message",e,s)}addEventListener(e,s,o){const i=Array.isArray(s)?s:[s];this._on[e]=this._on[e]||{};for(const n of i)this._on[e][n]=this._on[e][n]||[],this._on[e][n].push(o)}_parseMessageData(e){try{const s=JSON.parse(e);if(s.event)return s.data=s.data||null,s}catch(s){S.info(s)}return{event:null,data:null}}_dispatch(e,s,...o){const n=(this._on[e]||{})[s]||[];if(n.length!==0){S.log(`ws dispatch ${e} ${s}`);for(const r of n)r(...o)}}}const w=(t,e)=>`${window[t]!==`{{${t}}}`?window[t]:e}`,V=w("wsUrl",""),M=w("widgetToken","");var N={wsClient:t=>new L(V+"/widget_"+t,M)},E=(t,e)=>{const s=t.__vccOpts||t;for(const[o,i]of e)s[o]=i;return s};const h=m("speech-to-text/Page.vue"),F=x({props:{controls:{type:Boolean,required:!0},widget:{type:String,required:!0}},data(){return{ws:null,status:"",errors:[],initedSpeech:!1,lastUtterance:"",recognition:{interimResults:!1,continuous:!0},texts:[],timeout:null,settings:null,srObj:null}},computed:{recognizedText(){return this.texts.length===0||!this.texts[0].ready?"":this.texts[0].recognized},translatedText(){return this.texts.length===0||!this.texts[0].ready?"":this.texts[0].translated},lastRecognizedText(){if(this.texts.length===0)return"";this.texts[this.texts.length-1].recognized},wantsSpeech(){return this.settings.recognition.synthesize||this.settings.translation.synthesize}},methods:{initSpeech(){h.log(speechSynthesis),speechSynthesis.cancel(),speechSynthesis.resume(),this.initedSpeech=!0},_next(){if(this.timeout){h.info("_next(): timeout still active");return}if(!this.recognizedText&&!this.translatedText){h.info("_next(): recognizedText and translatedText empty");return}this.recognizedText&&this.settings.recognition.synthesize&&(h.info("synthesizing recognized text"),this.synthesize(this.recognizedText,this.settings.recognition.synthesizeLang)),this.translatedText&&this.settings.translation.synthesize&&(h.info("synthesizing translated text"),this.synthesize(this.translatedText,this.settings.translation.synthesizeLang)),this.timeout=setTimeout(()=>{this.texts.shift(),this.timeout=null,this._next()},this.calculateSubtitleDisplayTime(`${this.recognizedText} ${this.translatedText}`))},calculateSubtitleDisplayTime(t){const e=W(t);return Math.min(1e4,Math.max(2e3,e))},synthesize(t,e){if(h.info("synthesize",this.lastUtterance,t,e),this.lastUtterance!==t){h.info("speechSynthesis",speechSynthesis),this.lastUtterance=t;let s=new SpeechSynthesisUtterance(`${this.lastUtterance}`);e&&(s.lang=e),speechSynthesis.cancel(),speechSynthesis.speak(s)}},applyStyles(){const t=this.settings.styles;t.bgColorEnabled&&t.bgColor!=null?document.body.style.backgroundColor=t.bgColor:document.body.style.backgroundColor="",t.vAlign==="top"?this.$refs.text_table.style.bottom=null:t.vAlign==="bottom"&&(this.$refs.text_table.style.bottom=0);const e=(s,o,i,n,r)=>{if(n.color!=null&&(o.style.color=n.color),r!=null&&(s.style.webkitTextStrokeColor=r),n.strokeWidth!=null){const u=b(n.strokeWidth);s.style.webkitTextStrokeWidth=u,i.style.webkitTextStrokeWidth=u}if(n.strokeColor!=null&&(i.style.webkitTextStrokeColor=n.strokeColor),n.fontFamily!=null&&(s.style.fontFamily=n.fontFamily,o.style.fontFamily=n.fontFamily,i.style.fontFamily=n.fontFamily),n.fontSize!=null){const u=b(n.fontSize);s.style.fontSize=u,o.style.fontSize=u,i.style.fontSize=u}n.fontWeight!=null&&(s.style.fontWeight=n.fontWeight,o.style.fontWeight=n.fontWeight,i.style.fontWeight=n.fontWeight)};this.settings.recognition.display&&e(this.$refs["speech_text-imb"],this.$refs["speech_text-fg"],this.$refs["speech_text-bg"],t.recognition,t.bgColor),this.settings.translation.enabled&&e(this.$refs["trans_text-imb"],this.$refs["trans_text-fg"],this.$refs["trans_text-bg"],t.translation,t.bgColor)},initVoiceRecognition(){if(!this.controls)return;const t=window.SpeechRecognition||window.webkitSpeechRecognition;if(!t){alert("This widget does not work in this browser. Try a chrome based browser.");return}this.srObj&&(this.srObj.abort(),this.srObj.stop()),this.srObj=new t,this.srObj.lang=this.settings.recognition.lang,this.srObj.interimResults=this.recognition.interimResults,this.srObj.continuous=this.recognition.continuous,this.srObj.onsoundstart=()=>{this.status="Sound started"},this.srObj.onnomatch=()=>{this.status="No match"},this.srObj.onerror=e=>{this.status="Error",this.errors.unshift(e.error),this.errors=this.errors.slice(0,10),this.initVoiceRecognition()},this.srObj.onsoundend=()=>{this.status="Sound ended",this.initVoiceRecognition()},this.srObj.onspeechend=()=>{this.status="Speech ended",this.initVoiceRecognition()},this.srObj.onresult=async e=>{this.onVoiceResult(e),this.initVoiceRecognition()},this.srObj.start()},onVoiceResult(t){if(!this.ws){h.error("onVoiceResult: this.ws not set");return}let e=t.results;h.info("onVoiceResult()",t);for(var s=t.resultIndex;s<e.length;s++){if(!e[s].isFinal)continue;const o=e[s][0].transcript;if(this.lastRecognizedText!==o){this.ws.send(JSON.stringify({event:"onVoiceResult",text:o}));break}}}},mounted(){this.ws=N.wsClient(this.widget),this.ws.onMessage("text",t=>{this.texts.push({recognized:t.recognized,translated:t.translated,ready:!0}),this._next()}),this.ws.onMessage("init",t=>{this.settings=t.settings,this.$nextTick(()=>{this.applyStyles(),this.initVoiceRecognition()})}),this.ws.connect()}}),D={key:0,class:"big",ref:"result_text"},U={key:0},A={key:0},B=g("div",null,"Latest errors:",-1),I={ref:"text_table",class:"btm_table"},P={align:"center",valign:"bottom"};function q(t,e,s,o,i,n){return t.settings?(a(),l("div",D,[t.settings.status.enabled?(a(),l("div",U,[T(d(t.status)+" ",1),t.errors.length>0?(a(),l("div",A,[B,g("ul",null,[(a(!0),l(_,null,z(t.errors,(r,u)=>(a(),l("li",{key:u},d(r),1))),128))])])):c("",!0)])):c("",!0),t.controls&&t.wantsSpeech&&!t.initedSpeech?(a(),l("button",{key:1,onClick:e[0]||(e[0]=(...r)=>t.initSpeech&&t.initSpeech(...r))}," Enable Speech Synthesis ")):c("",!0),g("table",I,[g("tr",null,[g("td",P,[t.settings.recognition.display?(a(),l("div",{key:0,class:"stroke-single-bg",ref:"speech_text-bg"},d(t.recognizedText),513)):c("",!0),t.settings.recognition.display?(a(),l("div",{key:1,class:"stroke-single-fg",ref:"speech_text-fg"},d(t.recognizedText),513)):c("",!0),t.settings.recognition.display?(a(),l("div",{key:2,class:"stroke-single-imb",ref:"speech_text-imb"},d(t.recognizedText),513)):c("",!0),t.settings.translation.enabled?(a(),l("div",{key:3,class:"stroke-single-bg",ref:"trans_text-bg"},d(t.translatedText),513)):c("",!0),t.settings.translation.enabled?(a(),l("div",{key:4,class:"stroke-single-fg",ref:"trans_text-fg"},d(t.translatedText),513)):c("",!0),t.settings.translation.enabled?(a(),l("div",{key:5,class:"stroke-single-imb",ref:"trans_text-imb"},d(t.translatedText),513)):c("",!0)])])],512)],512)):c("",!0)}var G=E(F,[["render",q]]);const J=v(G,{controls:!1,widget:"speech-to-text_receive"});J.mount("#app");
