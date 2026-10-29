// Interação regional isolada dos menus compartilhados do CBEP.
(()=>{
// O mapa original fica incorporado no HTML; funciona sem servidor ou internet.
const canvas=document.querySelector('canvas');
const ctx=canvas.getContext('2d');
const source=new Image();
const palette=[[95,120,98],[146,152,122],[158,173,153],[120,145,166],[134,168,157],[131,149,130],[166,167,148],[155,179,193],[119,142,159],[176,187,175]];
const names=['Noroeste','Centro Ocidental','Norte Central','Norte Pioneiro','Centro Oriental','Oeste','Sudoeste','Centro-Sul','Sudeste','Metropolitana de Curitiba'];
let regions=[],hitMap,target=-1,frame=0,previous=0;
let selectedRegion=-1;
let pin=null;
let strengths=Array(10).fill(0);
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
source.onload=()=>{
 const w=source.naturalWidth,h=source.naturalHeight;canvas.width=w;canvas.height=h;
 ctx.drawImage(source,0,0);const pixels=ctx.getImageData(0,0,w,h).data;
 hitMap=new Int8Array(w*h).fill(-1);
 const bounds=palette.map(()=>({x:w,y:h,r:0,b:0}));
 // Identifica as cores na imagem aprovada, preservando seus contornos.
 for(let p=0;p<w*h;p++){
  const k=p*4,r=pixels[k],g=pixels[k+1],b=pixels[k+2];
  if(Math.min(r,g,b)>222)continue;
  let best=-1,distance=Infinity;
  palette.forEach((c,i)=>{const d=(r-c[0])**2+(g-c[1])**2+(b-c[2])**2;if(d<distance){distance=d;best=i}});
  hitMap[p]=best;const x=p%w,y=Math.floor(p/w),box=bounds[best];
  box.x=Math.min(box.x,x);box.y=Math.min(box.y,y);box.r=Math.max(box.r,x);box.b=Math.max(box.b,y);
 }
 // Agrupa áreas contínuas delimitadas pelas linhas brancas.
 // A cor só nomeia a área completa; nunca seleciona pixels espalhados.
 const total=w*h,visited=new Uint8Array(total),queue=new Int32Array(total);
 const areas=new Int8Array(total).fill(-1);
 for(let start=0;start<total;start++){
  if(visited[start]||hitMap[start]<0)continue;
  let head=0,tail=1;queue[0]=start;visited[start]=1;
  const votes=Array(10).fill(0);
  while(head<tail){
   const at=queue[head++],x=at%w;votes[hitMap[at]]++;
   for(const next of [x?at-1:-1,x<w-1?at+1:-1,at-w,at+w]){
    if(next>=0&&next<total&&!visited[next]&&hitMap[next]>=0){visited[next]=1;queue[tail++]=next}
   }
  }
  if(tail>10000){
   const label=votes.indexOf(Math.max(...votes));
   for(let j=0;j<tail;j++)areas[queue[j]]=label;
  }
 }
 // Ilhas e pequenos detalhes costeiros pertencem à região mais próxima.
 let head=0,tail=0;
 for(let at=0;at<total;at++)if(areas[at]>=0)queue[tail++]=at;
 while(head<tail){
  const at=queue[head++],x=at%w;
  for(const next of [x?at-1:-1,x<w-1?at+1:-1,at-w,at+w]){
   if(next>=0&&next<total&&areas[next]<0){areas[next]=areas[at];queue[tail++]=next}
  }
 }
 bounds.forEach(box=>{box.x=w;box.y=h;box.r=0;box.b=0});
 for(let at=0;at<total;at++){
  if(hitMap[at]<0)continue;
  const label=areas[at];hitMap[at]=label;
  const x=at%w,y=Math.floor(at/w),box=bounds[label];
  box.x=Math.min(box.x,x);box.y=Math.min(box.y,y);box.r=Math.max(box.r,x);box.b=Math.max(box.b,y);
 }
 regions=bounds.map(box=>{
  const layer=document.createElement('canvas');layer.width=box.r-box.x+1;layer.height=box.b-box.y+1;
  return {box,layer,context:layer.getContext('2d')};
 });
 regions.forEach((region,i)=>{
  const {box,layer,context}=region,out=context.createImageData(layer.width,layer.height);
  for(let y=box.y;y<=box.b;y++)for(let x=box.x;x<=box.r;x++){
   const p=y*w+x;if(hitMap[p]!==i)continue;
   const k=p*4,q=((y-box.y)*layer.width+x-box.x)*4;
   // Reforça a cor sem mudar posição, tamanho ou máscara da região.
   const gray=.2126*pixels[k]+.7152*pixels[k+1]+.0722*pixels[k+2];
   for(let c=0;c<3;c++)out.data[q+c]=Math.max(0,Math.min(255,(gray+(pixels[k+c]-gray)*1.25)*.78));
   out.data[q+3]=255;
  }
  context.putImageData(out,0,0);
 });
 render();canvas.dataset.ready='true';
};
function render(){
 // A imagem completa permanece intacta em todos os quadros.
 ctx.globalAlpha=1;ctx.drawImage(source,0,0);
 regions.forEach(({box,layer},i)=>{
  if(strengths[i]<=0)return;
  ctx.globalAlpha=strengths[i];ctx.drawImage(layer,box.x,box.y);
 });
 ctx.globalAlpha=1;
 if(pin){
  const scale=canvas.width/(canvas.getBoundingClientRect().width||canvas.width);
  ctx.save();ctx.translate(pin.x,pin.y);ctx.scale(scale,scale);
  ctx.shadowColor='rgba(0,0,0,.35)';ctx.shadowBlur=5;
  ctx.beginPath();ctx.moveTo(0,0);
  ctx.bezierCurveTo(-5,-8,-14,-17,-14,-26);
  ctx.arc(0,-26,14,Math.PI,0);
  ctx.bezierCurveTo(14,-17,5,-8,0,0);
  ctx.closePath();ctx.fillStyle='#c73535';ctx.fill();
  ctx.shadowBlur=0;ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();
  ctx.beginPath();ctx.arc(0,-26,5,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();
  ctx.restore();
 }
}
function animate(time){
 const amount=1-Math.exp(-Math.min(time-previous||16,50)/65);previous=time;
 let moving=false;
 strengths=strengths.map((s,i)=>{const goal=i===target?1:0;if(reduced.matches)return goal;const next=s+(goal-s)*amount;if(Math.abs(next-goal)>.0005)moving=true;return Math.abs(next-goal)<.0005?goal:next});
 render();frame=moving?requestAnimationFrame(animate):0;
}
function activate(i){
 if(target===i)return;target=i;
 // Só a região atual recebe destaque, sem sobreposição de transições.
 strengths=strengths.map((value,index)=>index===i?value:0);
 canvas.style.cursor=i<0?'default':'pointer';
 canvas.setAttribute('aria-label',i<0?'Mapa do Paraná. Use as setas para explorar e Enter para ver os autores.':'Região '+names[i]+'. Pressione Enter para ver os autores.');
 if(!frame){previous=0;frame=requestAnimationFrame(animate)}
}
function hit(event){
 if(!hitMap)return -1;const rect=canvas.getBoundingClientRect();
 const x=Math.floor((event.clientX-rect.left)*canvas.width/rect.width),y=Math.floor((event.clientY-rect.top)*canvas.height/rect.height);
 return x>=0&&y>=0&&x<canvas.width&&y<canvas.height?hitMap[y*canvas.width+x]:-1;
}
canvas.addEventListener('pointermove',e=>{if(e.pointerType==='mouse'||e.pointerType==='pen')activate(hit(e))});
canvas.addEventListener('pointerleave',e=>{if(e.pointerType!=='touch')activate(selectedRegion)});
canvas.addEventListener('click',e=>{
 const i=hit(e);if(i<0)return;
 const rect=canvas.getBoundingClientRect();
 selectRegion(i,{x:(e.clientX-rect.left)*canvas.width/rect.width,y:(e.clientY-rect.top)*canvas.height/rect.height});
});
canvas.addEventListener('keydown',e=>{
 if(['ArrowRight','ArrowDown','ArrowLeft','ArrowUp'].includes(e.key)){e.preventDefault();const step=['ArrowRight','ArrowDown'].includes(e.key)?1:-1;activate((target+step+10)%10)}
 if(e.key==='Enter'||e.key===' '){e.preventDefault();if(target>=0)selectRegion(target)}
 if(e.key==='Escape')closePanel();
});
canvas.addEventListener('blur',()=>activate(selectedRegion));
source.src=document.querySelector('#map-image').src;

const regionNames=["Noroeste Paranaense", "Centro Ocidental Paranaense", "Norte Central Paranaense", "Norte Pioneiro Paranaense", "Centro Oriental Paranaense", "Oeste Paranaense", "Sudoeste Paranaense", "Centro-Sul Paranaense", "Sudeste Paranaense", "Metropolitana de Curitiba"];
const authorsByRegion=[[], [], [{"cidade": "Londrina", "autores": ["Domingos Pellegrini"]}, {"cidade": "Novo Itacolomi", "autores": ["Olívio Jekupé"]}], [], [], [], [], [], [{"cidade": "Cruz Machado", "autores": ["Helena Kolody"]}], [{"cidade": "Curitiba", "autores": ["Alice Ruiz", "Dalton Trevisan", "Emílio de Menezes", "Jéssica Iancoski", "Luci Collin", "Luís Henrique Pellanda", "Paulo Leminski"]}, {"cidade": "Pinhais", "autores": ["Emiliano Perneta"], "nota": "O local pertencia a Curitiba na época de seu nascimento."}]];
const panel=document.querySelector('#authors-panel');
function selectRegion(index,point){
 // No teclado, posiciona o pino dentro da região, perto do centro de seus limites.
 if(!point&&regions[index]){
  const {box}=regions[index],cx=(box.x+box.r)/2,cy=(box.y+box.b)/2;
  let distance=Infinity;
  for(let y=box.y;y<=box.b;y++)for(let x=box.x;x<=box.r;x++){
   if(hitMap[y*canvas.width+x]!==index)continue;
   const d=(x-cx)**2+(y-cy)**2;
   if(d<distance){distance=d;point={x,y}}
  }
 }
 pin=point||null;
 selectedRegion=index;activate(index);
 document.querySelector('#region-title').textContent=regionNames[index];
 const groups=authorsByRegion[index],content=document.querySelector('#city-groups');content.replaceChildren();
 let count=groups.reduce((sum,group)=>sum+group.autores.length,0);
 document.querySelector('#author-count').textContent=count?count+' '+(count===1?'autor do CBEP':'autores do CBEP')+' • Local de nascimento':'Autores do CBEP • Local de nascimento';
 if(!count){const empty=document.createElement('p');empty.className='empty';empty.textContent='Nenhum autor do catálogo CBEP nasceu nesta região.';content.append(empty)}
 groups.forEach(group=>{
  const section=document.createElement('section');section.className='city';
  const title=document.createElement('h3');title.textContent=group.cidade;section.append(title);
  const list=document.createElement('ul');
  group.autores.forEach(name=>{const item=document.createElement('li');item.textContent=name;list.append(item)});
  section.append(list);
  if(group.nota){const note=document.createElement('p');note.className='note';note.textContent=group.nota;section.append(note)}
  content.append(section);
 });
 panel.hidden=false;document.querySelector('#mapa-layout').classList.add('has-selection');
 render();
}
function closePanel(){
 pin=null;
 selectedRegion=-1;activate(-1);panel.hidden=true;
 document.querySelector('#mapa-layout').classList.remove('has-selection');
 render();
}

// Mantém o tamanho visual do pino quando o mapa muda de largura.
new ResizeObserver(()=>{if(source.complete&&source.naturalWidth)render()}).observe(canvas);
document.querySelector('#close-panel').addEventListener('click',()=>{closePanel();canvas.focus()});

})();
