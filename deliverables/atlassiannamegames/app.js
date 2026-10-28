(()=>{
"use strict";
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};
const norm=s=>String(s).toLowerCase().replace(/[^a-z0-9]/g,"");
const CARDS=window.CARDS,COLORS=["canary","coral","mint","sky","lilac","tangerine"],ROT=[-2.5,1.8,-1,2.6,-2,1.2];
const PREFIX="atlpostit-",ALPHA="ABCDEFGHJKMNPQRSTUVWXYZ23456789",MAX=10,LOCK=4000;
const app=$("#app");
const rid=n=>Array.from({length:n},()=>ALPHA[Math.random()*ALPHA.length|0]).join("");
const ss={get:k=>{try{return sessionStorage.getItem(k)}catch{return null}},set:(k,v)=>{try{sessionStorage.setItem(k,v)}catch{}}};
const ls={get:k=>{try{return localStorage.getItem(k)||""}catch{return ""}},set:(k,v)=>{try{localStorage.setItem(k,v)}catch{}}};
const myId=ss.get("atl_pid")||(()=>{const i=rid(12);ss.set("atl_pid",i);return i})();
let toastT;const say=m=>{const t=$("#toast");t.textContent=m;t.classList.add("on");clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove("on"),3000)};
const base=()=>location.href.split("#")[0],joinUrl=c=>base()+"#join="+c;
const qr=u=>{try{const q=qrcode(0,"M");q.addData(u);q.make();return q.createSvgTag({cellSize:4,margin:0,scalable:true})}catch{return ""}};
const foot=`<footer>Status 28 Oct 2026. Rollouts are staged, so your site may differ. Not affiliated with Atlassian. Made by Ingo Jurz.</footer>`;
const back=`<button class="btn ghost" data-go="home">Back</button>`;
const answers=[...new Map(CARDS.map(c=>[norm(c.nw),c.nw])).values()].sort((a,b)=>a.localeCompare(b));
const story=(c,title)=>`${title?`<p class="label">${esc(c.app)}, ${esc(c.when)}</p><h2 class="stt">${esc(c.old)} <span aria-hidden="true">&rarr;</span><span class="sr"> became </span> ${esc(c.nw)}</h2>`:""}<section class="sec"><h3 class="label">The story</h3><p>${esc(c.why)}</p></section><section class="sec"><h3 class="label">Still seen in</h3><p>${esc(c.stays)}</p></section>${c.src?`<p class="srcl"><a href="${esc(c.src)}" target="_blank" rel="noopener">Read the source</a></p>`:""}`;
let timers=[],G=null,peer=null,conn=null,V=null,isHost=false;
const every=(f,ms)=>{const t=setInterval(f,ms);timers.push(t);return t};
const stopTimers=()=>{timers.forEach(clearInterval);timers=[]};
const closeNet=()=>{try{conn&&conn.close()}catch{}try{peer&&peer.destroy()}catch{}peer=conn=G=V=null;isHost=false};
const cleanup=()=>{stopTimers();closeNet();document.onkeydown=null};
const screen=(key,html,raw)=>{app.dataset.s=key;app.innerHTML=raw?html:`<div class="wrap">${html}</div>`;if(typeof setNav==="function")setNav(key);window.scrollTo(0,0);const h=$("h1,h2",app);if(h){h.setAttribute("tabindex","-1")}};
const friends=()=>nameScreen("host"),joinFocus=()=>{home();const j=$("#jc");j&&j.focus()};
const ACT={home:"home",name:"friends",lobby:"friends",round:"friends",reveal:"friends",final:"friends",one:"onePhone",oneI:"onePhone",oneR:"onePhone",oneT:"onePhone",oneE:"onePhone",mem:"memorySetup",memS:"memorySetup",fl:"flash",li:"list",tl:"timeline"};
const setNav=key=>{const k=ACT[key.replace(/\d+$/,"")];$$("#links button").forEach(b=>b.classList.toggle("on",b.dataset.go===k));if(!/^(round|lobby|reveal|final)/.test(key))$("#navctx").innerHTML="";$("#nav").classList.remove("open");$("#burger").setAttribute("aria-expanded","false")};
document.addEventListener("click",e=>{const g=e.target.closest("[data-go]");if(!g)return;e.preventDefault();
if((G||conn)&&!confirm("Leave the current room?"))return;
({home,solo,memorySetup,flash,list,timeline:timelineView,onePhone,friends,joinFocus}[g.dataset.go]||home)()});
$("#burger").onclick=()=>{const n=$("#nav"),o=n.classList.toggle("open");$("#burger").setAttribute("aria-expanded",o)};

/* ---------- home ---------- */
const PEEL=[["Issue","Work item","sky"],["Project","Space","mint"],["Rule","Flow","coral"],["Analytics","Insights","lilac"],["Insight","Assets","tangerine"]];
function home(){cleanup();history.replaceState(null,"",base());
screen("home",`<div class="home"><section class="hl"><h1>Who am I now?</h1><p class="sub">The new Atlassian name sits on your forehead. Everyone else can read it.</p>
<div class="paths"><button class="path lead" id="pF"><b>Play with friends</b><span>Own phone or laptop each. Share a link or QR.</span></button>
<button class="path" id="pO"><b>One phone, one table</b><span>Pass the phone around.</span></button><button class="path" data-go="solo"><b>Learn alone</b><span>Memory, flashcards, stories, timeline.</span></button></div>
<form class="joinrow" id="jf"><div><label class="field" for="jc">Got a room code?</label><input id="jc" class="code-in" type="text" maxlength="5" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="ABCDE"></div><button class="btn">Join room</button></form>${foot}</section>
<section class="hr"><div class="stack"><div class="note c-sky n1"></div><div class="note c-coral n2"></div><button class="note c-canary n3" id="peel" aria-live="polite"><span class="tape red" id="peelTag">Old name</span><span class="big" id="peelTxt">Issue</span><span class="meta" id="peelMeta">Tap to peel</span></button></div></section></div>`,true);
let i=0,shown=false;$("#peel").onclick=()=>{const b=$("#peel"),[o,n,c]=PEEL[i%PEEL.length];if(!shown){b.className="note n3 c-"+c;$("#peelTxt").textContent=n;$("#peelTag").textContent="was "+o;$("#peelMeta").textContent="Tap for the next one";shown=true}else{i++;shown=false;const[o2,,]=PEEL[i%PEEL.length];b.className="note n3 c-canary";$("#peelTxt").textContent=o2;$("#peelTag").textContent="Old name";$("#peelMeta").textContent="Tap to peel"}};
$("#pF").onclick=()=>nameScreen("host");$("#pO").onclick=onePhone;
$("#jf").onsubmit=e=>{e.preventDefault();const c=$("#jc").value.trim().toUpperCase();if(c.length!==5){$("#jc").focus();return say("Room codes have 5 characters.")}nameScreen("join",c)}}

function solo(){cleanup();screen("solo",`<div class="top">${back}</div><div class="paths" style="grid-template-columns:1fr"><button class="path lead" data-go="memorySetup"><b>Memory</b><span>Match each old term with its new name.</span></button><button class="path" data-go="flash"><b>Flashcards</b><span>Learn it, plus where the old term still shows up.</span></button><button class="path" data-go="list"><b>Cheat sheet</b><span>All ${CARDS.length} renamings, sorted by era.</span></button></div>${foot}`)}

/* ---------- names, errors ---------- */
function nameScreen(mode,code){cleanup();
const saved=ss.get("atl_room")||"",auto=mode==="join"&&saved.startsWith(code+"|");
if(auto)return startJoin(code,saved.split("|")[1]);
screen("name",`<div class="top">${back}</div><section class="panel" style="max-width:460px;margin:auto"><h2>${mode==="host"?"Open a room":"Join room "+esc(code)}</h2><form id="nf"><label class="field" for="nm">Your name</label><input id="nm" type="text" maxlength="16" autocomplete="nickname" required value="${esc(ls.get("atl_name"))}" placeholder="e.g. Ingo"><button class="btn primary" style="width:100%;margin-top:14px">${mode==="host"?"Create room":"Join room"}</button></form></section>`);
$("#nm").focus();$("#nf").onsubmit=e=>{e.preventDefault();const n=$("#nm").value.trim();if(!n)return;ls.set("atl_name",n);mode==="host"?startHost(n):startJoin(code,n)}}
function busy(m){screen("busy",`<div class="top">${back}</div><section class="panel" style="max-width:460px;margin:auto;text-align:center"><span class="tape">${esc(m)}</span></section>`)}
function problem(title,msg,retry){cleanup();screen("err",`<div class="top">${back}</div><section class="panel" style="max-width:520px;margin:auto"><h2>${esc(title)}</h2><p>${esc(msg)}</p><div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px">${retry?`<button class="btn primary" id="retry">Try again</button>`:""}<button class="btn" data-go="home">Back to menu</button></div></section>`);if(retry)$("#retry").onclick=retry}

/* ---------- host ---------- */
function startHost(name,tries=0){busy("Opening room...");const code=rid(5);peer=new Peer(PREFIX+code);
peer.on("open",()=>{G={code,hostId:myId,set:{rounds:3,secs:90,deck:"cloud"},phase:"lobby",round:0,players:{},order:[],queue:[],endsAt:0,hint:0,log:[]};isHost=true;addPlayer(myId,name,null);history.replaceState(null,"",base()+"#host="+code);broadcast()});
peer.on("error",e=>{if(e.type==="unavailable-id"&&tries<5){try{peer.destroy()}catch{}return startHost(name,tries+1)}problem("Could not open a room","The signalling service did not answer. Check your connection and try again.",()=>startHost(name))});
peer.on("connection",c=>{c.on("data",m=>onMsg(c,m));c.on("close",()=>drop(c));c.on("error",()=>drop(c))});
peer.on("disconnected",()=>{try{peer.reconnect()}catch{}})}
const glog=(k,t)=>{G.log.push({k,t});if(G.log.length>30)G.log.shift()};
function uniq(n){n=(n||"Player").trim().slice(0,16)||"Player";let m=n,i=2;const u=Object.values(G.players).map(p=>p.name.toLowerCase());while(u.includes(m.toLowerCase()))m=n.slice(0,13)+" "+i++;return m}
function addPlayer(id,name,c){const p={id,name:uniq(name),score:0,conn:c,on:true,spec:G.phase==="round",card:null,lock:0,solved:false,pts:0};G.players[id]=p;G.order.push(id);return p}
function onMsg(c,m){if(!G||!m||typeof m!=="object")return;
if(m.t==="join"){const id=String(m.id||"").slice(0,24);if(!id)return;let p=G.players[id];
if(p){if(p.conn&&p.conn!==c){const o=p.conn;p.conn=null;try{o.close()}catch{}}p.conn=c;p.on=true}
else{if(G.order.length>=MAX){c.send({t:"err",e:"full"});return setTimeout(()=>{try{c.close()}catch{}},400)}p=addPlayer(id,m.name,c);glog("info",p.name+" joined")}
c.pid=id;broadcast()}
else if(m.t==="guess"&&c.pid)onGuess(c.pid,String(m.v||"").slice(0,60))}
function drop(c){const p=G&&c.pid&&G.players[c.pid];if(!p||p.conn!==c)return;p.on=false;p.conn=null;
if(G.phase==="lobby"||G.phase==="final"){delete G.players[p.id];G.order=G.order.filter(x=>x!==p.id)}else glog("info",p.name+" left");
if(G.phase==="round"&&allDone())endRound();else broadcast()}
const allDone=()=>{const a=G.order.map(i=>G.players[i]).filter(p=>p.on&&!p.spec);return a.length>0&&a.every(p=>p.solved)};
function nextCard(){if(!G.queue.length){let pool=CARDS.filter(c=>G.set.deck==="all"||(G.set.deck==="cloud"?c.ed!=="past":c.ed==="past"));if(pool.length<4)pool=CARDS;G.queue=shuffle(pool.map(c=>c.id))}return G.queue.pop()}
function startRound(){G.round++;G.phase="round";G.hint=0;G.endsAt=Date.now()+G.set.secs*1000;
G.order.forEach(id=>{const p=G.players[id];if(!p.on){p.card=null;p.spec=true;return}p.spec=false;p.card=nextCard();p.solved=false;p.pts=0;p.lock=0});
glog("info","Round "+G.round+" started");clearInterval(G.tick);G.tick=setInterval(tick,400);broadcast()}
function tick(){if(!G||G.phase!=="round")return;const tot=G.set.secs*1000,el=(Date.now()-(G.endsAt-tot))/tot,h=Math.floor(el*4)>=3?3:Math.max(0,Math.min(2,Math.floor(el*4)));if(h!==G.hint){G.hint=h;broadcast()}if(Date.now()>=G.endsAt)endRound()}
function endRound(){clearInterval(G.tick);G.phase=G.round>=G.set.rounds?"final":"reveal";glog("info","Round "+G.round+" over");broadcast()}
function onGuess(pid,v){if(G.phase!=="round")return;const p=G.players[pid],now=Date.now();if(!p||p.spec||p.solved||p.lock>now)return;const c=CARDS[p.card];
if(norm(v)===norm(c.nw)){const f=(G.endsAt-now)/(G.set.secs*1000);p.pts=Math.max(5,Math.round(10+f*20)-G.hint*3);p.score+=p.pts;p.solved=true;glog("ok",p.name+" solved it (+"+p.pts+")");tell(pid,"ok","Right! +"+p.pts+" points");if(allDone())return endRound()}
else{p.lock=now+LOCK;glog("no",p.name+" guessed \""+v+"\": not it");tell(pid,"no","Not it. Locked for 4 seconds.")}
broadcast()}
function tell(pid,k,m){if(pid===G.hostId)return ev(k,m);const c=G.players[pid]&&G.players[pid].conn;if(c&&c.open)try{c.send({t:"ev",k,m})}catch{}}
function ev(k,m){say(m);if(k==="no"){const g=$("#gbtn");if(g){g.classList.remove("shake");void g.offsetWidth;g.classList.add("shake")}}if(k==="ok"&&navigator.vibrate)navigator.vibrate(60)}
function viewFor(pid){const now=Date.now(),me=G.players[pid],reveal=G.phase!=="round";
return{you:pid,code:G.code,phase:G.phase,set:G.set,round:G.round,hint:G.hint,left:G.phase==="round"?Math.max(0,G.endsAt-now):0,lockLeft:me?Math.max(0,me.lock-now):0,log:G.log.slice(-6),
players:G.order.map(id=>{const p=G.players[id],c=typeof p.card==="number"?CARDS[p.card]:null,own=id===pid,open=!own||p.solved||reveal;
const o={id,name:p.name,score:p.score,on:p.on,host:id===G.hostId,spec:p.spec,solved:p.solved,pts:p.pts};
if(c){if(open){o.nw=c.nw;o.app=c.app;o.old=c.old;if(p.solved||reveal){o.stays=c.stays;o.why=c.why;o.src=c.src}}else{if(G.hint>=1)o.app=c.app;if(G.hint>=2)o.old=c.old;if(G.hint>=3)o.len=c.nw.length,o.first=c.nw[0]}}
return o})}}
function broadcast(){if(!G)return;for(const id of G.order){const p=G.players[id];if(id!==G.hostId&&p.conn&&p.conn.open)try{p.conn.send({t:"view",v:viewFor(id)})}catch{}}applyView(viewFor(G.hostId))}
const hostSet=(k,v)=>{G.set[k]=k==="deck"?v:+v;if(k==="deck")G.queue=[];broadcast()};
const hostStart=()=>{if(G.order.filter(i=>G.players[i].on).length<2)return say("You need at least two players.");G.order.forEach(i=>G.players[i].score=0);G.round=0;startRound()};
const hostNext=()=>G.phase==="reveal"?startRound():null;
const hostAgain=()=>{G.order=G.order.filter(i=>G.players[i].on);Object.keys(G.players).forEach(i=>{if(!G.players[i].on)delete G.players[i]});G.order.forEach(i=>{const p=G.players[i];p.score=0;p.card=null;p.solved=false;p.spec=false});G.phase="lobby";G.round=0;G.queue=[];broadcast()};

/* ---------- guest ---------- */
function startJoin(code,name){busy("Joining room "+code+"...");let joined=false,over=false;
const fail=(t,m)=>{if(over)return;over=true;clearTimeout(to);problem(t,m,()=>startJoin(code,name))};
const to=setTimeout(()=>fail("No room found","Room "+code+" did not answer. Check the code and ask the host to keep the game tab open."),12000);
peer=new Peer();
peer.on("open",()=>{conn=peer.connect(PREFIX+code,{reliable:true});
conn.on("open",()=>conn.send({t:"join",id:myId,name}));
conn.on("data",m=>{if(m.t==="view"){if(!joined){joined=true;clearTimeout(to);ss.set("atl_room",code+"|"+name);history.replaceState(null,"",base()+"#join="+code)}applyView(m.v)}else if(m.t==="ev")ev(m.k,m.m);else if(m.t==="err"&&m.e==="full")fail("Room is full","This room already has "+MAX+" players.")});
conn.on("close",()=>joined?hostGone():fail("Could not connect","The connection closed before the game started."));
conn.on("error",()=>joined?hostGone():fail("Could not connect","The connection failed. Try again."))});
peer.on("error",e=>joined?hostGone():fail(e.type==="peer-unavailable"?"No room found":"Connection problem",e.type==="peer-unavailable"?"Room "+code+" does not exist or the host left. Check the code.":"Your network blocked the connection ("+e.type+"). Try another network or ask the host for a new link."))}
function hostGone(){ss.set("atl_room","");problem("The host left","The room is closed. Ask the host to open a new one, or play one of the solo modes.")}
const sendGuess=v=>isHost?onGuess(myId,v):conn&&conn.open&&conn.send({t:"guess",v});

/* ---------- views ---------- */
function applyView(v){v.rx=performance.now();V=v;const key=v.phase==="round"?"round"+v.round:v.phase;
if(app.dataset.s!==key||v.phase==="reveal"||v.phase==="final"){app.dataset.s=key;({lobby:buildLobby,round:buildRound,reveal:buildReveal,final:buildFinal})[v.phase](v)}
else v.phase==="lobby"?updLobby(v):updRound(v);
const nc=$("#navctx");if(nc&&!nc.firstChild){nc.innerHTML=`<span class="tape">Room ${esc(v.code)}</span><button type="button" class="btn small" id="navleave">Leave</button>`;$("#navleave").onclick=()=>{if(confirm("Leave this room?"))leave()}}}
const status=p=>p.host?"Host":(p.on?"Ready":"Away");
const col=i=>COLORS[i%COLORS.length];
const leave=()=>{ss.set("atl_room","");home()};

function buildLobby(v){const url=joinUrl(v.code);
screen("lobby",`<div class="top"><span class="tape">Room ${v.code}</span></div>
<div class="lobby"><section class="ticket" aria-label="Invite friends"><span class="tape sm">Invite friends</span><div class="code" aria-label="Room code ${v.code.split("").join(" ")}">${v.code}</div><div class="qr" role="img" aria-label="QR code with the invite link">${qr(url)}</div><p style="margin:0 0 10px;color:#5b564a;font-size:.95rem">Scan it, or share the link.</p><div class="row"><button class="btn primary" id="share">Share link</button><button class="btn" id="copy">Copy link</button></div></section>
<section class="panel"><h2>Players</h2><ul class="people" id="ppl" aria-live="polite"></ul><div id="set"></div><p class="hint" id="sm" aria-live="polite"></p><div id="sw"></div></section></div>`);
app.dataset.seen="";
$("#copy").onclick=()=>navigator.clipboard?navigator.clipboard.writeText(url).then(()=>say("Link copied"),()=>say(url)):say(url);
$("#share").onclick=()=>navigator.share?navigator.share({title:"Atlassian Post-It",text:"Join my Atlassian Post-It room "+v.code,url}).catch(()=>{}):$("#copy").click();
updLobby(v)}
function updLobby(v){const host=v.players.find(p=>p.host),isH=v.you===host.id,seen=app.dataset.seen.split(",");
$("#ppl").innerHTML=v.players.map((p,i)=>`<li class="${seen.includes(p.id)?"":"pop"} ${p.on?"":"off"}"><span class="tape sm">${esc(p.name)}${p.id===v.you?" (you)":""}</span><div class="note c-${col(i)}" style="--rot:${ROT[i%6]}deg;margin-top:-4px"><span class="big">${status(p)}</span></div></li>`).join("");
app.dataset.seen=v.players.map(p=>p.id).join(",");
const sig=JSON.stringify([v.set,isH]),s=$("#set");if(s.dataset.sig!==sig){s.dataset.sig=sig;const o=(k,a)=>a.map(([x,l])=>`<option value="${x}" ${String(v.set[k])===String(x)?"selected":""}>${l}</option>`).join("");
s.innerHTML=isH?`<label class="field" for="sr">Rounds</label><select id="sr">${o("rounds",[[2,"2 rounds"],[3,"3 rounds"],[5,"5 rounds"]])}</select><label class="field" for="ss">Time per round</label><select id="ss">${o("secs",[[60,"60 seconds"],[90,"90 seconds"],[120,"2 minutes"]])}</select><label class="field" for="sd">Cards</label><select id="sd">${o("deck",[["cloud","Cloud today (23 cards)"],["all","Everything"],["past","Time travel, 2013 to 2017"]])}</select>`:`<p class="hint">${v.set.rounds} rounds, ${v.set.secs} seconds each. The host picks the cards.</p>`;
if(isH){$("#sr").onchange=e=>hostSet("rounds",e.target.value);$("#ss").onchange=e=>hostSet("secs",e.target.value);$("#sd").onchange=e=>hostSet("deck",e.target.value)}}
const n=v.players.filter(p=>p.on).length;$("#sm").textContent=n<2?"Waiting for friends. Share the link or the QR code.":n+" players in the room.";
$("#sw").innerHTML=isH?`<button class="btn primary" id="go" style="width:100%;margin-top:10px" ${n<2?"disabled":""}>Start the game</button>`:`<p class="hint">Waiting for the host to start.</p>`;if(isH&&$("#go"))$("#go").onclick=hostStart}

function tileHTML(p,v,i){const c=col(i),rot=`--rot:${ROT[i%6]}deg`,m=p.id===v.you;
if(p.spec||!p.nw&&!m)return`<span class="tape sm nm">${esc(p.name)}</span><div class="note c-${c}" style="${rot};opacity:.5"><span class="meta">Joins next round</span></div>`;
if(m&&!p.solved){const hs=[];if(v.hint>=1)hs.push("It lives in: "+p.app);if(v.hint>=2)hs.push("It used to be: "+p.old);if(v.hint>=3)hs.push(p.len+" letters, starts with "+p.first);
const gap=Math.round(v.set.secs/4);
return`<span class="tape nm">You</span><div class="note c-${c}" style="${rot}"><span class="q" aria-hidden="true">?</span><span class="sr">Your note is hidden from you.</span><ul class="hints">${hs.length?hs.map(h=>`<li>${esc(h)}</li>`).join(""):`<li>Ask the others. A hint unlocks every ${gap} seconds.</li>`}</ul></div><button class="btn primary" id="gbtn">Guess my note</button>`}
return`${p.solved?`<span class="stamp">+${p.pts}</span>`:""}<span class="tape ${m?"":"sm"} nm">${m?"You":esc(p.name)}${p.on?"":" (away)"}</span><div class="note c-${c}" style="${rot}"><span class="big">${esc(p.nw)}</span><span class="meta">${esc(p.app)}</span>${p.old?`<span class="meta">formerly ${esc(p.old)}</span>`:""}</div>`}
function buildRound(v){stopTimers();const order=[...v.players].sort((a,b)=>(b.id===v.you)-(a.id===v.you)||0);
screen("round"+v.round,`<div class="bar"><span class="tape">Round ${v.round} of ${v.set.rounds}</span><div class="clock" id="clk"><b id="sec" aria-hidden="true">${Math.ceil(v.left/1000)}</b><i></i></div></div>
<div class="wall" id="wall">${order.map((p,i)=>`<article class="tile slap ${p.id===v.you?"me":""} ${p.solved?"done":""}" data-id="${esc(p.id)}" style="--i:${i}">${tileHTML(p,v,v.players.indexOf(p))}</article>`).join("")}</div>
<ul class="feed" id="feed"></ul><div class="sr" role="status" aria-live="polite" id="live"></div>
<dialog id="dlg" aria-label="Guess your note"><form id="gf"><label class="field" for="gq">Your note says</label><input id="gq" type="text" autocomplete="off" placeholder="Type to filter the list"><div class="opts" id="opts"></div><button type="button" class="btn ghost" id="gx">Cancel</button></form></dialog>`);
setTimeout(()=>$$(".slap").forEach(t=>t.classList.remove("slap")),1500);
every(tickUI,200);app.dataset.sigs="{}";bindGuess();updRound(v)}
function bindGuess(){const d=$("#dlg"),q=$("#gq"),o=$("#opts");
const fill=()=>{const k=norm(q.value);const l=answers.filter(a=>norm(a).includes(k));o.innerHTML=l.length?l.map(a=>`<button type="button" data-a="${esc(a)}">${esc(a)}</button>`).join(""):`<p class="hint">Nothing matches. Try fewer letters.</p>`};
const pick=a=>{d.close();sendGuess(a)};
q.oninput=fill;o.onclick=e=>{const b=e.target.closest("[data-a]");if(b)pick(b.dataset.a)};
$("#gf").onsubmit=e=>{e.preventDefault();const b=$("[data-a]",o);if(b)pick(b.dataset.a)};$("#gx").onclick=()=>d.close();
d.addEventListener("click",e=>{if(e.target===d)d.close()});
app.openGuess=()=>{q.value="";fill();d.showModal();q.focus()}}
function updRound(v){const sigs=JSON.parse(app.dataset.sigs||"{}"),order=v.players;
order.forEach((p,i)=>{const t=$(`.tile[data-id="${CSS.escape(p.id)}"]`);if(!t)return;const s=JSON.stringify([p.solved,p.nw,p.app,p.old,p.len,p.on,p.spec,v.hint]);if(sigs[p.id]!==s){sigs[p.id]=s;t.classList.toggle("done",p.solved);t.innerHTML=tileHTML(p,v,i)}});
app.dataset.sigs=JSON.stringify(sigs);const g=$("#gbtn");if(g)g.onclick=app.openGuess;
$("#feed").innerHTML=[...v.log].reverse().slice(0,5).map(l=>`<li class="${l.k}">${esc(l.t)}</li>`).join("");tickUI()}
function tickUI(){if(!V||V.phase!=="round")return;const left=Math.max(0,V.left-(performance.now()-V.rx)),tot=V.set.secs*1000,s=Math.ceil(left/1000),c=$("#clk");
if(c){$("#sec").textContent=s;c.style.setProperty("--p",(left/tot).toFixed(3));c.classList.toggle("low",left/tot<.2)}
const g=$("#gbtn");if(g){const l=Math.max(0,V.lockLeft-(performance.now()-V.rx));g.disabled=l>0;g.textContent=l>0?"Locked for "+Math.ceil(l/1000)+"s":"Guess my note"}}

function buildReveal(v){const h=v.you===v.players.find(p=>p.host).id;
screen("reveal",`<div class="top"><span class="tape">Round ${v.round} of ${v.set.rounds}: the notes</span></div>
<div class="rv">${v.players.filter(p=>p.nw).map(p=>`<div class="row"><div class="note c-${col(v.players.indexOf(p))}" style="--rot:${ROT[v.players.indexOf(p)%6]}deg"><span class="big">${esc(p.nw)}</span></div><div><div class="who">${esc(p.name)} ${p.solved?`solved it, +${p.pts}`:"did not get it"}</div><div class="was">${esc(p.app)}, formerly ${esc(p.old)}</div>${story(p)}</div></div>`).join("")}</div>
<section class="panel" style="margin-top:18px"><h2>Scores</h2><ol class="rank">${[...v.players].sort((a,b)=>b.score-a.score).map(p=>`<li><span>${esc(p.name)}</span><b>${p.score}</b></li>`).join("")}</ol>${h?`<button class="btn primary" id="nx" style="width:100%">Next round</button>`:`<p class="hint">Waiting for the host.</p>`}</section>`);
if(h)$("#nx").onclick=hostNext}
function buildFinal(v){const h=v.you===v.players.find(p=>p.host).id,r=[...v.players].sort((a,b)=>b.score-a.score),w=r[0],txt=`${w.name} won Atlassian Post-It with ${w.score} points. Which renamed Atlassian term trips you up most?`;
screen("final",`<div class="top"><span class="tape red">Final scores</span></div><h1 class="podium">${esc(w.name)} wins</h1><ol class="rank">${r.map(p=>`<li><span>${esc(p.name)}</span><b>${p.score}</b></li>`).join("")}</ol>
<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:16px">${h?`<button class="btn primary" id="again">Play again</button>`:`<span class="hint">The host can start another game.</span>`}<button class="btn" id="cp">Copy result</button></div>${foot}`);
$("#cp").onclick=()=>navigator.clipboard?navigator.clipboard.writeText(txt).then(()=>say("Copied")):say(txt);if(h)$("#again").onclick=hostAgain}

/* ---------- one phone ---------- */
function onePhone(){cleanup();const o=Object.assign({pl:"Anna, Ben",secs:60,deck:"cloud"},JSON.parse(ls.get("atl_one")||"{}"));
screen("one",`<div class="top">${back}</div><section class="panel" style="max-width:520px;margin:auto"><h2>One phone, one table</h2><p>The holder presses the phone to their forehead. Everyone else reads the note and explains it without saying it. Right guess: tap Got it.</p>
<form id="of"><label class="field" for="pl">Players, separated by commas</label><input id="pl" type="text" value="${esc(o.pl)}"><label class="field" for="sc">Seconds per turn</label><select id="sc">${[30,45,60,90].map(s=>`<option ${s===o.secs?"selected":""}>${s}</option>`).join("")}</select><label class="field" for="dk">Cards</label><select id="dk"><option value="cloud" ${o.deck==="cloud"?"selected":""}>Cloud today</option><option value="all" ${o.deck==="all"?"selected":""}>Everything</option><option value="past" ${o.deck==="past"?"selected":""}>Time travel</option></select><button class="btn primary" style="width:100%;margin-top:14px">Start</button></form></section>`);
$("#of").onsubmit=e=>{e.preventDefault();const pl=$("#pl").value.split(",").map(s=>s.trim()).filter(Boolean);if(pl.length<2)return say("Add at least two players.");const c={pl:pl.join(", "),secs:+$("#sc").value,deck:$("#dk").value};ls.set("atl_one",JSON.stringify(c));
const pool=CARDS.filter(k=>c.deck==="all"||(c.deck==="cloud"?k.ed!=="past":k.ed==="past"));const S={pl,sc:Object.fromEntries(pl.map(p=>[p,0])),deck:shuffle(pool),turn:0};oneIntro(S,c)}}
function oneIntro(S,c){stopTimers();document.onkeydown=null;if(S.turn>=S.pl.length*2)return oneEnd(S);const p=S.pl[S.turn%S.pl.length];
screen("oneI",`<div class="top">${back}<span class="tape sm">Turn ${S.turn+1} of ${S.pl.length*2}</span></div><div class="note c-canary" style="--rot:-1.5deg"><span class="meta">Next up</span><span class="big">${esc(p)}</span><span class="meta">Press the phone to your forehead. No saying the word, no spelling it.</span></div><p><button class="btn primary" id="rd" style="width:100%;margin-top:22px">Start the clock</button></p><ol class="rank">${S.pl.map(n=>`<li><span>${esc(n)}</span><b>${S.sc[n]}</b></li>`).join("")}</ol>`);$("#rd").onclick=()=>oneRun(S,c,p)}
function oneRun(S,c,p){let t=c.secs,got=0,cur;const next=()=>{if(!S.deck.length)S.deck=shuffle(CARDS);cur=S.deck.pop();draw()};
const draw=()=>{screen("oneR",`<div class="bar"><span class="tape sm">${esc(p)}: ${got}</span><div class="clock" id="clk"><b id="sec">${t}</b><i></i></div></div><div class="note c-${COLORS[got%6]}" style="--rot:-1deg"><span class="big">${esc(cur.nw)}</span><span class="meta">${esc(cur.app)}</span><span class="meta">formerly ${esc(cur.old)}</span></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:22px"><button class="btn" id="sk">Skip</button><button class="btn good" id="ok">Got it</button></div>`);$("#clk").style.setProperty("--p",t/c.secs);$("#ok").onclick=()=>{got++;next()};$("#sk").onclick=next};
document.onkeydown=e=>{if(e.key==="ArrowRight")$("#ok")&&$("#ok").click();if(e.key==="ArrowLeft")$("#sk")&&$("#sk").click()};
next();every(()=>{t--;const s=$("#sec");if(s)s.textContent=t,$("#clk").style.setProperty("--p",t/c.secs);if(t<=0){stopTimers();document.onkeydown=null;S.sc[p]+=got;S.turn++;screen("oneT",`<div class="note c-mint" style="--rot:-1deg"><span class="meta">Time</span><span class="big">${got} right</span><span class="meta">${esc(p)}, pass the phone on.</span></div><p><button class="btn primary" id="nx" style="width:100%;margin-top:22px">Next</button></p>`);$("#nx").onclick=()=>oneIntro(S,c)}},1000)}
function oneEnd(S){const r=Object.entries(S.sc).sort((a,b)=>b[1]-a[1]);screen("oneE",`<div class="top"><span class="tape red">Final scores</span></div><h1 class="podium">${esc(r[0][0])} wins</h1><ol class="rank">${r.map(([n,s])=>`<li><span>${esc(n)}</span><b>${s}</b></li>`).join("")}</ol><div style="display:flex;gap:10px;margin-top:16px"><button class="btn primary" data-go="onePhone">Play again</button>${back}</div>`)}

/* ---------- memory, flashcards, list ---------- */
function memorySetup(){cleanup();screen("memS",`<div class="top">${back}</div><section class="panel" style="max-width:520px;margin:auto"><h2>Memory</h2><p>Flip two notes. Match the old term with its new name.</p><div style="display:grid;gap:10px;margin-top:10px"><button class="btn primary" data-n="6">Easy, 6 pairs</button><button class="btn primary" data-n="10">Medium, 10 pairs</button><button class="btn primary" data-n="14">Hard, 14 pairs</button></div></section>`);$$("[data-n]").forEach(b=>b.onclick=()=>memory(+b.dataset.n))}
function memory(n){const pick=shuffle(CARDS.filter(c=>c.ed!=="past")).slice(0,n),cards=shuffle(pick.flatMap(c=>[{id:c.id,t:c.old,k:"o"},{id:c.id,t:c.nw,k:"n"}]));let open=[],moves=0,found=0,lock=false;const t0=Date.now();
screen("mem",`<div class="top">${back}<span class="tape">Moves <b id="mv">0</b></span></div><div class="grid" id="g">${cards.map((c,i)=>`<button class="mc down" data-i="${i}" aria-label="Note ${i+1}, face down">?</button>`).join("")}</div><p id="info" class="hint" style="min-height:3em;margin-top:16px" aria-live="polite"></p>`);
$("#g").onclick=e=>{const b=e.target.closest(".mc");if(!b||lock||!b.classList.contains("down"))return;const i=+b.dataset.i;b.classList.remove("down");b.textContent=cards[i].t;b.setAttribute("aria-label",cards[i].t);open.push(i);
if(open.length<2)return;moves++;$("#mv").textContent=moves;const[a,c]=open;
if(cards[a].id===cards[c].id&&cards[a].k!==cards[c].k){[a,c].forEach(j=>$(`[data-i="${j}"]`).classList.add("done"));const k=CARDS[cards[a].id];$("#info").textContent=k.old+" is now "+k.nw+" ("+k.app+", "+k.when+")";open=[];if(++found===n)$("#info").innerHTML=`Done in ${moves} moves and ${Math.round((Date.now()-t0)/1000)} seconds. <button class="btn primary" data-go="memorySetup">Play again</button>`}
else{lock=true;setTimeout(()=>{[a,c].forEach(j=>{const x=$(`[data-i="${j}"]`);x.classList.add("down");x.textContent="?";x.setAttribute("aria-label","Note face down")});open=[];lock=false},900)}}}
function flash(){cleanup();let q=shuffle(CARDS),known=0,show=false;
const draw=()=>{if(!q.length)return screen("fl",`<div class="top">${back}</div><section class="panel" style="max-width:520px;margin:auto"><h2>Round done</h2><p>${known} of ${CARDS.length} known on the first try.</p><button class="btn primary" id="nr">New round</button></section>`),$("#nr").onclick=flash;
const c=q[0];screen("fl",`<div class="top">${back}<span class="tape sm">${q.length} left</span></div><div class="cardface"><span class="tape sm">${esc(c.app)}</span> <span class="tape sm">${esc(c.when)}</span><p class="term">${esc(show?c.nw:c.old)}</p>${show?`<p class="was">Used to be: <b>${esc(c.old)}</b></p>${story(c)}`:`<p class="hint">What is it called now?</p>`}</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px">${show?`<button class="btn" id="a">Again later</button><button class="btn good" id="k">Knew it</button>`:`<button class="btn primary" id="r" style="grid-column:1/-1">Reveal</button>`}</div>`);
if(!show)$("#r").onclick=()=>{show=true;draw()};else{$("#k").onclick=()=>{if(!c.seen)known++;q.shift();show=false;draw()};$("#a").onclick=()=>{c.seen=true;q.push(q.shift());show=false;draw()}}};draw()}
const ERAS=[["Current, Cloud","cloud"],["Cloud and Data Center","all"],["History","past"]];
const rows=()=>`<label class="field" for="q">Filter</label><input id="q" type="text" placeholder="Type a term, app or year" autocomplete="off"><p class="hint">Tap a row for the story.</p>`+ERAS.map(([h,k])=>`<h3 class="grp">${h}</h3><div class="acc">${CARDS.filter(c=>c.ed===k).map(c=>`<div class="item" data-t="${esc([c.old,c.nw,c.app,c.when,c.why].join(" ").toLowerCase())}"><button type="button" class="head" id="h${c.id}" aria-expanded="false" aria-controls="p${c.id}"><span><b>${esc(c.old)}</b> <span aria-hidden="true">&rarr;</span><span class="sr"> became </span> <b>${esc(c.nw)}</b><small>${esc(c.app)}, ${esc(c.when)}</small></span><i aria-hidden="true"></i></button><div class="pbody" id="p${c.id}" role="region" aria-labelledby="h${c.id}" hidden>${story(c)}</div></div>`).join("")}</div>`).join("");
const timeline=()=>{const cols=[...new Set(CARDS.map(c=>c.y).filter(Boolean))].sort((a,b)=>a-b).concat(null);
return`<p class="hint">One row per app, one column per year with renamings. Tap a note for the story.</p><div class="tl" tabindex="0" role="region" aria-label="Timeline, scrolls sideways"><div class="tlg" style="--n:${cols.length}"><div class="th sticky"></div>${cols.map(y=>`<div class="th">${y||"Year unclear"}</div>`).join("")}${GROUPS.map((g,gi)=>`<div class="tn sticky">${esc(g)}</div>${cols.map(y=>`<div class="tc">${CARDS.filter(c=>c.grp===g&&c.y===y).map(c=>`<button type="button" class="chip c-${COLORS[gi%6]}" data-d="${c.id}"><b>${esc(c.nw)}</b><small>was ${esc(c.old)}</small></button>`).join("")}</div>`).join("")}`).join("")}</div></div>`};
function list(tab){cleanup();const tl=tab==="tl";
screen(tl?"tl":"li",`<div class="top">${back}</div><h2>Cheat sheet</h2><div class="tabs" role="tablist" aria-label="View"><button type="button" role="tab" aria-selected="${!tl}" data-tab="list">List</button><button type="button" role="tab" aria-selected="${tl}" data-tab="tl">Timeline</button></div>${tl?timeline():rows()}<dialog id="sd" aria-label="Term story"><div class="sdin" id="sdc"></div><button type="button" class="btn" id="sdx">Close</button></dialog>${foot}`);
$$("[data-tab]").forEach(b=>b.onclick=()=>list(b.dataset.tab));
const sd=$("#sd");$("#sdx").onclick=()=>sd.close();sd.addEventListener("click",e=>{if(e.target===sd)sd.close()});
$$("[data-d]").forEach(b=>b.onclick=()=>{$("#sdc").innerHTML=story(CARDS[b.dataset.d],true);sd.showModal()});
$$(".head").forEach(b=>b.onclick=()=>{const o=b.getAttribute("aria-expanded")==="true";b.setAttribute("aria-expanded",!o);$("#"+b.getAttribute("aria-controls")).hidden=o});
const q=$("#q");if(q)q.oninput=()=>{const k=q.value.trim().toLowerCase();$$(".item").forEach(i=>{i.hidden=!!k&&!i.dataset.t.includes(k)});$$(".grp").forEach(g=>{g.hidden=!$$(".item:not([hidden])",g.nextElementSibling).length})}}
const timelineView=()=>list("tl");

/* ---------- boot ---------- */
const m=location.hash.match(/join=([A-Za-z0-9]{5})/);
if(m)nameScreen("join",m[1].toUpperCase());else home();
})();
