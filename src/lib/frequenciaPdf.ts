import { jsPDF } from 'jspdf'

export type Modelo = 'II' | 'III' | 'IV'
export type RegistroFrequencia = { matricula:string; nome:string; cargo:string; setor:string; vinculo:string; horario:string|null; modelo_frequencia:Modelo }

const fmt = (d: Date) => `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
const parseDate = (value:string) => { const [y,m,d] = value.split('-').map(Number); return new Date(y,m-1,d,12) }
const dates = (start: string, end: string) => {
  const s=parseDate(start), e=parseDate(end), arr:Date[]=[]
  for(let d=new Date(s);d<=e;d.setDate(d.getDate()+1)) arr.push(new Date(d))
  return arr
}
const titleByModel:Record<Modelo,string>={
  'II':'FREQUÊNCIA - ECH / HORA EXTRA / PLANTÃO',
  'III':'FREQUÊNCIA - VÍNCULO NORMAL (6 OU 8 HORAS)',
  'IV':'FREQUÊNCIA - MAIS MÉDICOS / MÉDICOS PELO BRASIL'
}
function text(pdf:jsPDF, str:string, x:number,y:number, size=8, bold=false, align:'left'|'center'|'right'='left'){
 pdf.setFont('helvetica',bold?'bold':'normal');pdf.setFontSize(size);pdf.setTextColor(30,36,44);pdf.text(str,x,y,{align,maxWidth:184})
}
function cell(pdf:jsPDF,x:number,y:number,w:number,h:number,content:string,grey=false,bold=false,align:'left'|'center'='center',fontSize=7){
 if(grey){pdf.setFillColor(204,204,204);pdf.rect(x,y,w,h,'F')}
 pdf.setDrawColor(90);pdf.setLineWidth(.2);pdf.rect(x,y,w,h)
 if(content) text(pdf,content,align==='center'?x+w/2:x+2,y+h/2+2,fontSize,bold,align)
}
export function gerarFrequencias(registros:RegistroFrequencia[],inicio:string,fim:string){
 const dias=dates(inicio,fim)
 if(!registros.length) throw new Error('Nenhum servidor selecionado.')
 if(dias.length<1||dias.length>31) throw new Error('O período precisa ter entre 1 e 31 dias.')
 const pdf=new jsPDF({orientation:'portrait',unit:'mm',format:'a4',compress:true})
 registros.forEach((s,index)=>{
  if(index) pdf.addPage()
  const model=s.modelo_frequencia
  text(pdf,'SIGF 2.0  |  DOCUMENTO DEMONSTRATIVO - DADOS FICTÍCIOS',105,13,8,true,'center')
  text(pdf,titleByModel[model],105,22,10,true,'center')
  pdf.setDrawColor(80); pdf.setLineWidth(.3)
  const x=12,w=186,y=28,row=8
  cell(pdf,x,y,26,row,'Nome:',true,true,'left');cell(pdf,x+26,y,102,row,s.nome,false,true,'left',8)
  cell(pdf,x+128,y,25,row,'Matrícula:',true,true,'left');cell(pdf,x+153,y,33,row,s.matricula,false,false,'left',7)
  cell(pdf,x,y+row,26,row,'Cargo:',true,true,'left');cell(pdf,x+26,y+row,102,row,s.cargo,false,false,'left',7)
  cell(pdf,x+128,y+row,25,row,'Lotação:',true,true,'left');cell(pdf,x+153,y+row,33,row,s.setor,false,false,'left',6)
  cell(pdf,x,y+row*2,26,row,'Período:',true,true,'left');cell(pdf,x+26,y+row*2,75,row,`${fmt(parseDate(inicio))} a ${fmt(parseDate(fim))}`,false,false,'left',8)
  cell(pdf,x+101,y+row*2,27,row,'Horário:',true,true,'left');cell(pdf,x+128,y+row*2,58,row,s.horario||'Não informado',false,false,'left',7)
  const ty=y+row*3
  cell(pdf,x,ty,w,7,model==='II'?'VÍNCULO                                        ECH / HORA EXTRA / PLANTÃO':`VÍNCULO: ${s.vinculo}`,true,true)
  const headers=model==='II'?['DIA','ENTRADA','ASSINATURA','SAÍDA / DIA','ENTRADA','ASSINATURA','SAÍDA']:['DIA','ENTRADA','ASSINATURA','INTERVALO','ASSINATURA','SAÍDA']
  // Modelo II mantém grupos separados de vínculo e atividade extra.
  let cy=ty+7
  const tableX=x
  const widths=model==='II'?[12,26,43,12,26,43,24]:[12,26,49,24,49,26]
  let xx=tableX
  widths.forEach((cw,i)=>{cell(pdf,xx,cy,cw,8,headers[i],true,true,'center',6.3);xx+=cw})
  cy+=8
  const maxBody=205
  const rh=Math.min(6.35,maxBody/dias.length)
  dias.forEach(d=>{
   const weekend=d.getDay()===0?'DOMINGO':d.getDay()===6?'SÁBADO':''
   let cur=x
   widths.forEach((cw,i)=>{
    const label=i===0?String(d.getDate()):(weekend&&(i===2||i===5)?weekend:'')
    cell(pdf,cur,cy,cw,rh,label,Boolean(weekend),Boolean(weekend),'center',6.5);cur+=cw
   })
   cy+=rh
  })
  const footerHeight=15
  const sign=model==='IV'?['ASSINATURA DO MÉDICO','ASSINATURA DO GERENTE DA UNIDADE','ASSINATURA DO COORDENADOR DISTRITAL']:model==='II'?['ASSINATURA DO SERVIDOR','CHEFIA IMEDIATA']:['ASSINATURA DO SERVIDOR','RESPONSÁVEL PELA UNIDADE']
  let sx=x
  sign.forEach((label,i)=>{const sw=i===sign.length-1?x+w-sx:w/sign.length;cell(pdf,sx,cy,sw,footerHeight,label,false,true,'center',6.5);sx+=sw})
  if(model==='IV') text(pdf,'Orientações: registrar especialização no turno de estudos; justificar ausências; informar intervalo pactuado.',x,Math.min(287,cy+19),6)
  text(pdf,`SIMULAÇÃO • ${index+1} / ${registros.length}`,198,293,6,false,'right')
 })
 pdf.save(`SIGF_frequencias_${inicio}_${fim}_${registros.length}.pdf`)
}
