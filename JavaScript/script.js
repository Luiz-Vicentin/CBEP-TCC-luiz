// Endereço da raiz calculado pelo arquivo compartilhado, inclusive em file://.
const raizSite = new URL('../', document.currentScript.src);
const autores = [
 ['Alice Ruiz','autores/alice-ruiz.html'],['Cristóvão Tezza','autores/cristovao-tezza.html'],
 ['Dalton Trevisan','Dalton_Pasta/dalton.html'],['Domingos Pellegrini','autores/domingos-pellegrini.html'],
 ['Emiliano Perneta','autores/emiliano-perneta.html'],['Emílio de Menezes','autores/emilio-de-menezes.html'],
 ['Helena Kolody','Helena_Pasta/helena.html'],['Jéssica Iancovski','autores/jessica-iancovski.html'],
 ['Luci Collin','Luci_Pasta/luci.html'],['Luís Henrique Pellanda','autores/luis-henrique-pellanda.html'],
 ['Olívio Jekupé','Olivio_Pasta/olivio.html'],
 ['Paulo Leminski','autores/paulo-leminski.html']
];
const painel=document.querySelector('#painel-lateral');
const titulo=document.querySelector('#titulo-painel');
const pesquisa=document.querySelector('#pesquisa');
const lista=document.querySelector('#lista-catalogo');
const vazio=document.querySelector('#sem-resultados');
const botoes=[...document.querySelectorAll('[data-menu]')];
let modo=null;
const ordenar=(a,b)=>a.localeCompare(b,'pt-BR',{sensitivity:'base'});
const normalizar=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const elemento=(tag,classe,txt)=>{const e=document.createElement(tag);if(classe)e.className=classe;if(txt!==undefined)e.textContent=txt;return e};
function criarLink(pai,texto,url){const a=elemento('a','',texto);a.href=url.startsWith('#') ? url : new URL(url,raizSite).href;pai.append(a);return a}
function urlObra(autor,titulo){return autor.links?.[titulo] || '#'}
function renderizar(){
 lista.replaceChildren();const termo=normalizar(pesquisa.value.trim());let total=0;
 if(modo==='autores'){
  [...autores].sort((a,b)=>ordenar(a[0],b[0])).filter(a=>normalizar(a[0]).includes(termo)).forEach(([nome,url])=>{
   const li=elemento('li');criarLink(li,nome,url);lista.append(li);total++;
  });
 }else{
  catalogoObras.flatMap(a=>a.obras.map(obra=>({autor:a,titulo:obra})))
   .filter(x=>normalizar(x.titulo+' '+(x.autor.aliases?.[x.titulo]||'')).includes(termo))
   .sort((a,b)=>ordenar(a.titulo,b.titulo))
   .forEach(x=>{const li=elemento('li');criarLink(li,x.titulo,urlObra(x.autor,x.titulo));lista.append(li);total++});
 }

 if(vazio)vazio.hidden=total>0;
}
function fechar(){painel.hidden=true;modo=null;botoes.forEach(b=>b.setAttribute('aria-expanded','false'))}
function abrir(tipo){
 if(modo===tipo&&!painel.hidden){fechar();return}
 modo=tipo;pesquisa.value='';painel.hidden=false;
 titulo.textContent=tipo==='obras'?'Obras':'Autores';
 pesquisa.placeholder=tipo==='obras'?'Pesquisar obra...':'Pesquisar autor...';
 botoes.forEach(b=>b.setAttribute('aria-expanded',String(b.dataset.menu===tipo)));
 renderizar();pesquisa.focus();
}
botoes.forEach(b=>b.addEventListener('click',()=>abrir(b.dataset.menu)));
document.querySelector('#fechar-painel')?.addEventListener('click',fechar);
pesquisa.addEventListener('input',renderizar);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!painel.hidden)fechar()});


