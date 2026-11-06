// Escaped, small Markdown subset for character-sheet descriptions.
// No raw HTML is ever interpreted.
const escape=value=>String(value??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const inline=value=>escape(value).replace(/\*\*([^*\n]+)\*\*/g,'<strong>$1</strong>').replace(/(^|[^*])\*([^*\n]+)\*/g,'$1<em>$2</em>');

export function formatSheetText(value=''){
 const lines=String(value??'').split(/\r?\n/),html=[];let bullets=[];
 const flush=()=>{if(bullets.length){html.push('<ul>'+bullets.join('')+'</ul>');bullets=[];}};
 for(const raw of lines){
  if(!raw.trim()){flush();continue;}
  const match=/^\[(left|center|right)\](.*?)\[\/\1\]$/i.exec(raw.trim());
  const alignment=match?match[1].toLowerCase():'',line=match?match[2]:raw;
  const cls=alignment?' class="cs-rich-align-'+alignment+'"':'';
  const bullet=/^\s*[-*]\s+(.+)$/.exec(line);
  if(bullet){bullets.push('<li'+cls+'>'+inline(bullet[1])+'</li>');continue;}
  flush();
  const heading=/^\s*(#{1,3})\s+(.+)$/.exec(line);
  if(heading){const tag=heading[1].length===1?'h3':'h4';html.push('<'+tag+cls+'>'+inline(heading[2])+'</'+tag+'>');}
  else html.push('<p'+cls+'>'+inline(line)+'</p>');
 }
 flush();
 return '<div class="cs-richtext">'+html.join('')+'</div>';
}

export function applyRichFormat(value,start,end,command){
 const source=String(value??''),from=Math.max(0,Math.min(source.length,start)),to=Math.max(from,Math.min(source.length,end));
 const selected=source.slice(from,to),hasSelection=to>from;
 if(command==='bullet'||command==='heading'){
  const lineStart=source.lastIndexOf('\n',from-1)+1;
  const index=source.indexOf('\n',to),lineEnd=index<0?source.length:index;
  const segment=source.slice(lineStart,lineEnd)||(command==='bullet'?'List item':'Heading');
  const prefix=command==='bullet'?'- ':'## ';
  const inserted=segment.split('\n').map(line=>prefix+line).join('\n');
  return {value:source.slice(0,lineStart)+inserted+source.slice(lineEnd),selectionStart:lineStart,selectionEnd:lineStart+inserted.length};
 }
 const tags={bold:['**','**'],italic:['*','*'],left:['[left]','[/left]'],center:['[center]','[/center]'],right:['[right]','[/right]']};
 const pair=tags[command];if(!pair)return {value:source,selectionStart:from,selectionEnd:to};
 const inner=hasSelection?selected:'Text';
 const inserted=['left','center','right'].includes(command)&&inner.includes('\n')
  ?inner.split('\n').map(line=>pair[0]+line+pair[1]).join('\n')
  :pair[0]+inner+pair[1];
 const selectionStart=from+pair[0].length;
 return {value:source.slice(0,from)+inserted+source.slice(to),selectionStart,selectionEnd:from+inserted.length-pair[1].length};
}

export function safeSheetLink(value){
 const fallback='https://finalfantasyd20.com/gamemastering/formula-reference/';
 if(typeof value!=='string'||!value.trim())return fallback;
 try{const url=new URL(value);return ['http:','https:'].includes(url.protocol)&&!url.username&&!url.password?url.href:fallback;}
 catch{return fallback;}
}
