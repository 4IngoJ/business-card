// Builds the cheat sheet PDF from CARDS in the look of the game: Ink pages, hairline cards, coloured notes with a red tape.
// Loaded on demand with vendor/jspdf.umd.min.js; fonts are fetched from fonts/pdf/ when the button is clicked.
const run=async(cards,JsPDF)=>{
const FONTS=[["Onest","normal","onest-400"],["Onest","bold","onest-700"],["Mono","normal","geist-mono-500"]];
const b64=buf=>{let s="";const u=new Uint8Array(buf);for(let i=0;i<u.length;i+=0x8000)s+=String.fromCharCode.apply(null,u.subarray(i,i+0x8000));return btoa(s)};
const bufs=await Promise.all(FONTS.map(f=>fetch("fonts/pdf/"+f[2]+".ttf").then(r=>{if(!r.ok)throw new Error(f[2]);return r.arrayBuffer()})));
const doc=new JsPDF({unit:"pt",format:"a4"}),W=doc.internal.pageSize.getWidth(),H=doc.internal.pageSize.getHeight();
FONTS.forEach((f,i)=>{doc.addFileToVFS(f[2]+".ttf",b64(bufs[i]));doc.addFont(f[2]+".ttf",f[0],f[1])});
const M=40,CW=W-2*M,NW=150,PAD=14,TX=M+PAD+NW+18,TW=M+CW-PAD-TX,BOTTOM=H-54;
const INK="#1A1917",PAPER="#FAF9F7",MUTE="#A9A6A0",LINE="#34322F",RAISE="#201F1D";
const NOTE={canary:"#F7D44C",coral:"#FF8C8C",mint:"#86E3BC",sky:"#8CCBFF",lilac:"#CDB4FF",tangerine:"#FFB866"},NAMES=Object.keys(NOTE);
const t=s=>String(s).replace(/[‘’]/g,"'").replace(/[“”]/g,'"').replace(/[–—]/g,"-").replace(/→/g,"to").replace(/[^\x20-\x7E -ÿ]/g,"");
const font=(f,s,size,col,sp)=>{doc.setFont(f,s);doc.setFontSize(size);doc.setTextColor(col);doc.setCharSpace(sp||0)};
const wrap=(s,f,st,size,w,sp)=>{font(f,st,size,PAPER,sp);return doc.splitTextToSize(t(s),w)};
const page=()=>{doc.setFillColor(INK);doc.rect(0,0,W,H,"F");doc.setFillColor("#2E2D2B");for(let x=12;x<W;x+=24)for(let yy=12;yy<H;yy+=24)doc.rect(x,yy,.9,.9,"F")};
page();
let y=M+6;
const mono=(s,x,yy,col,size,opt)=>{font("Mono","normal",size||7.5,col||MUTE,.5);doc.text(t(s).toUpperCase(),x,yy,opt)};

// header
mono("ingo.jurz  /  Atlassian Post-It",M,y,PAPER,8.5);y+=36;
font("Onest","bold",38,PAPER,-1.2);doc.text("Cheat sheet",M,y);y+=24;
font("Onest","normal",12,MUTE,0);doc.text("Every renamed term from the game, with its story and where the old name still shows up.",M,y);y+=17;
y+=2;
mono("Status 28 Oct 2026  |  Rollouts are staged  |  Not affiliated with Atlassian",M,y+8,MUTE,7);y+=34;

const ERAS=[["Current, Cloud","cloud"],["Cloud and Data Center","all"],["History","past"]];
const GR=window.GROUPS||[];
let n=0;
const need=h=>{if(y+h>BOTTOM){doc.addPage();page();y=M}};

ERAS.forEach(([h,k])=>{
const list=cards.filter(c=>c.ed===k);if(!list.length)return;
need(60);mono(h,M,y+8,PAPER,9);doc.setDrawColor(LINE);doc.setLineWidth(.6);doc.line(M+doc.getTextWidth(t(h).toUpperCase())+14,y+5.5,M+CW,y+5.5);y+=24;
list.forEach(c=>{
n++;
const col=NOTE[NAMES[Math.max(0,GR.indexOf(c.grp))%6]];
const nameL=wrap(c.nw,"Onest","bold",17,NW-28,-.5),metaL=wrap(c.app+", "+c.when,"Mono","normal",7.5,NW-28,.2);
const noteH=34+nameL.length*19+10+metaL.length*10+20;
const why=wrap(c.why,"Onest","normal",9.5,TW),stays=wrap(c.stays,"Onest","normal",9.5,TW);
const textH=10+why.length*13+10+10+stays.length*13+(c.src?22:0);
const cardH=Math.max(noteH+16,textH)+2*PAD;
need(cardH+12);
doc.setFillColor(RAISE);doc.setDrawColor(LINE);doc.setLineWidth(.7);doc.roundedRect(M,y,CW,cardH,9,9,"FD");
// note
const nx=M+PAD,ny=y+PAD+14;
doc.setFillColor("#0E0D0C");doc.rect(nx+1,ny+5,NW,noteH-4,"F");
doc.setFillColor(col);doc.roundedRect(nx,ny,NW,noteH,2,2,"F");
doc.setFillColor(0,0,0);font("Onest","bold",17,INK,-.5);nameL.forEach((l,i)=>doc.text(l,nx+NW/2,ny+40+i*19,{align:"center"}));
font("Mono","normal",7.5,"#4A463E",.2);metaL.forEach((l,i)=>doc.text(l,nx+NW/2,ny+40+nameL.length*19+6+i*10,{align:"center"}));
// red tape with the old name
const tape=t("was "+c.old).toUpperCase();font("Mono","normal",6.5,"#FFFFFF",.5);
const tl=doc.splitTextToSize(tape,NW-20)[0],tw=doc.getTextWidth(tl)+14;
doc.setFillColor("#B3261E");doc.rect(nx+NW/2-tw/2,ny-6,tw,13,"F");doc.text(tl,nx+NW/2,ny+3,{align:"center"});
// number and text
mono(String(n).padStart(2,"0"),nx,y+PAD+6,MUTE,7.5);
let ty=y+PAD+8;
mono("The story",TX,ty,MUTE,7);ty+=14;font("Onest","normal",9.5,PAPER,0);why.forEach(l=>{doc.text(l,TX,ty);ty+=13});ty+=10;
mono("Still seen in",TX,ty,MUTE,7);ty+=14;font("Onest","normal",9.5,PAPER,0);stays.forEach(l=>{doc.text(l,TX,ty);ty+=13});
if(c.src){ty+=6;const host=c.src.replace(/^https?:\/\//,"").split("/")[0];font("Mono","normal",7,PAPER,.3);const lab=t("Read the source ("+host+")");doc.textWithLink(lab,TX,ty+4,{url:c.src});doc.setDrawColor(MUTE);doc.setLineWidth(.4);doc.line(TX,ty+6,TX+doc.getTextWidth(lab),ty+6)}
y+=cardH+12;
});
y+=8;
});

const pages=doc.getNumberOfPages();
for(let p=1;p<=pages;p++){doc.setPage(p);mono("didact.digital/business-card/deliverables/atlassiannamegames",M,H-28,MUTE,6.5);mono("Page "+p+" / "+pages,W-M,H-28,MUTE,6.5,{align:"right"})}
doc.setCharSpace(0);
const url="https://didact.digital/business-card/deliverables/atlassiannamegames/";
doc.setProperties({title:"Atlassian Renamings Cheat Sheet by Ingo Jurz",subject:"Renamed Atlassian terms ("+cards.length+" renamings back to 2013), with the story and where the old name still shows up. Status 28 Oct 2026.",author:"Ingo Jurz",keywords:"Atlassian, Jira, Confluence, Jira Service Management, Bitbucket, renamings, renamed terms, work item, space, flow, cheat sheet, enablement, training",creator:"Atlassian Post-It: Who Am I Now? ("+url+")"});
doc.setLanguage("en-US");doc.setCreationDate(new Date("2026-10-28T00:00:00Z"));doc.setDisplayMode("fullwidth","continuous","UseNone");doc.viewerPreferences({DisplayDocTitle:true});
doc.addMetadata('<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:xmpRights="http://ns.adobe.com/xap/1.0/rights/"><dc:title>Atlassian Renamings Cheat Sheet by Ingo Jurz</dc:title><dc:creator>Ingo Jurz</dc:creator><dc:language>en-US</dc:language><dc:source>'+url+'</dc:source><xmpRights:Marked>True</xmpRights:Marked><xmpRights:WebStatement>'+url+'</xmpRights:WebStatement></rdf:Description></rdf:RDF>',"http://www.w3.org/1999/02/22-rdf-syntax-ns#");
return doc};
// A stale cached app.js still calls .save() right on the result, so the promise carries it too.
window.cheatPdf=(c,J)=>{const p=run(c,J);p.save=n=>p.then(d=>d.save(n));return p};
