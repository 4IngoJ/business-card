// Builds the cheat sheet PDF from CARDS. Loaded on demand, together with vendor/jspdf.umd.min.js.
window.cheatPdf=(cards,JsPDF)=>{
const doc=new JsPDF({unit:"pt",format:"a4"}),W=doc.internal.pageSize.getWidth(),H=doc.internal.pageSize.getHeight(),M=48,TW=W-2*M,BOTTOM=H-56;
const t=s=>String(s).replace(/[‘’]/g,"'").replace(/[“”]/g,'"').replace(/[–—]/g,"-").replace(/→/g,"->").replace(/[^\x20-\x7E -ÿ]/g,"");
const ERAS=[["Current, Cloud","cloud"],["Cloud and Data Center","all"],["History","past"]];
const INK=[26,25,23],MUTE=[110,104,92];
let y=M;
const color=c=>doc.setTextColor(c[0],c[1],c[2]);
const put=(s,size,style,c,gap)=>{doc.setFont("helvetica",style);doc.setFontSize(size);color(c);const ls=doc.splitTextToSize(t(s),TW);ls.forEach(l=>{doc.text(l,M,y);y+=size*1.35});y+=gap||0};
const need=h=>{if(y+h>BOTTOM){doc.addPage();y=M}};
const lines=(s,size)=>{doc.setFontSize(size);return doc.splitTextToSize(t(s),TW).length*size*1.35};

put("Atlassian renaming cheat sheet",22,"bold",INK,4);
put("Atlassian Post-It: Who Am I Now?  |  Status 28 Oct 2026",10,"normal",MUTE,2);
put("Rollouts are staged, so your site may differ. Not affiliated with Atlassian. Made by Ingo Jurz.",10,"normal",MUTE,14);

let n=0;
ERAS.forEach(([h,k])=>{
const list=cards.filter(c=>c.ed===k);if(!list.length)return;
need(60);put(h,14,"bold",INK,6);
list.forEach(c=>{
n++;
const head=n+".  "+c.old+"  ->  "+c.nw;
const meta=c.app+", "+c.when;
const block=lines(head,12)+lines(meta,9)+4+lines("The story",8)+lines(c.why,10)+2+lines("Still seen in",8)+lines(c.stays,10)+2+(c.src?lines(c.src,8):0)+16;
need(block);
put(head,12,"bold",INK,0);
put(meta,9,"normal",MUTE,4);
put("THE STORY",8,"bold",MUTE,0);put(c.why,10,"normal",INK,2);
put("STILL SEEN IN",8,"bold",MUTE,0);put(c.stays,10,"normal",INK,2);
if(c.src){doc.setFont("helvetica","normal");doc.setFontSize(8);color(MUTE);const ls=doc.splitTextToSize(t(c.src),TW);ls.forEach((l,i)=>{if(i===0)doc.textWithLink(l,M,y,{url:c.src});else doc.text(l,M,y);y+=8*1.35})}
y+=16;
});
});

const pages=doc.getNumberOfPages();
for(let p=1;p<=pages;p++){doc.setPage(p);doc.setFont("helvetica","normal");doc.setFontSize(8);color(MUTE);doc.text("didact.digital/business-card/deliverables/atlassiannamegames",M,H-30);doc.text("Page "+p+" of "+pages,W-M,H-30,{align:"right"})}
doc.setProperties({title:"Atlassian renaming cheat sheet",author:"Ingo Jurz",subject:"Renamed Atlassian terms, status 28 Oct 2026"});
return doc};
