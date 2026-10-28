import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { gerarFrequencias, type Modelo, type RegistroFrequencia } from '../lib/frequenciaPdf'
import { FileDown, Search } from 'lucide-react'

const hoje=new Date()
const toInput=(d:Date)=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
const initialStart=toInput(new Date(hoje.getFullYear(),hoje.getMonth(),1))
const initialEnd=toInput(new Date(hoje.getFullYear(),hoje.getMonth()+1,0))
export default function Frequencias(){
 const [inicio,setInicio]=useState(initialStart)
 const [fim,setFim]=useState(initialEnd)
 const [nome,setNome]=useState('')
 const [cargo,setCargo]=useState('')
 const [setor,setSetor]=useState('')
 const [modelo,setModelo]=useState<'Todos'|Modelo>('Todos')
 const [situacao,setSituacao]=useState('Ativo')
 const [busy,setBusy]=useState(false)
 const [message,setMessage]=useState('')
 async function emitir(){
  if(!supabase)return
  const diaInicial=new Date(`${inicio}T12:00:00`),diaFinal=new Date(`${fim}T12:00:00`)
  const qtdDias=Math.round((diaFinal.getTime()-diaInicial.getTime())/86400000)+1
  if(!inicio||!fim||qtdDias<1||qtdDias>31){setMessage('Escolha um período de 1 a 31 dias.');return}
  setBusy(true);setMessage('Consultando servidores no Supabase...')
  try{
   const all:RegistroFrequencia[]=[]
   for(let from=0;from<5000;from+=500){
    let q=supabase.from('servidores').select('matricula,nome,cargo,setor,vinculo,horario,modelo_frequencia').order('matricula').range(from,from+499)
    if(nome.trim()){const safe=nome.trim().replace(/[,()%]/g,'');q=q.or(`nome.ilike.%${safe}%,matricula.ilike.%${safe}%`)}
    if(cargo.trim())q=q.ilike('cargo',`%${cargo.trim().replace(/[%_]/g,'')}%`)
    if(setor.trim())q=q.ilike('setor',`%${setor.trim().replace(/[%_]/g,'')}%`)
    if(modelo!=='Todos')q=q.eq('modelo_frequencia',modelo)
    if(situacao!=='Todos')q=q.eq('situacao',situacao)
    const {data,error}=await q
    if(error)throw error
    const batch=(data??[]) as RegistroFrequencia[]
    all.push(...batch)
    if(batch.length<500)break
   }
   if(!all.length)throw new Error('Nenhum servidor encontrado para estes filtros.')
   if(all.length>1000)throw new Error('O limite por PDF é de 1.000 servidores. Refine os filtros.')
   setMessage(`Gerando ${all.length} página(s) em PDF...`)
   gerarFrequencias(all,inicio,fim)
   // Este evento registra a geracao local do PDF, nao sua impressao fisica.
   const {data:{user}}=await supabase.auth.getUser()
   if(!user)throw new Error('PDF gerado, mas a sessao expirou antes de registrar o historico.')
   const arquivo=`SIGF_frequencias_${inicio}_${fim}_${all.length}.pdf`
   const {error:logError}=await supabase.from('emissoes_frequencia').insert({
    usuario_id:user.id,inicio,fim,quantidade:all.length,arquivo_nome:arquivo,
    filtros:{nome:nome.trim()||null,cargo:cargo.trim()||null,setor:setor.trim()||null,modelo,situacao}
   })
   if(logError)setMessage(`PDF gerado com ${all.length} folha(s), mas o historico nao foi registrado: ${logError.message}`)
   else setMessage(`PDF gerado com ${all.length} folha(s) e emissao registrada no historico.`)
  }catch(e){setMessage(e instanceof Error?e.message:'Erro desconhecido ao gerar PDF.')}
  finally{setBusy(false)}
 }
 return <div className="panel"><div className="sectionhead"><div><h2>Emitir folhas de frequência</h2><p>Modelos II, III e IV • documento demonstrativo com dados fictícios.</p></div></div>
 <div className="formgrid frequencyform"><label>Início do período<input type="date" value={inicio} onChange={e=>setInicio(e.target.value)}/></label><label>Fim do período<input type="date" value={fim} onChange={e=>setFim(e.target.value)}/></label><label>Nome ou matrícula<input value={nome} onChange={e=>setNome(e.target.value)} placeholder="Em branco = todos"/></label><label>Cargo<input value={cargo} onChange={e=>setCargo(e.target.value)} placeholder="Em branco = todos"/></label><label>Setor / lotação<input value={setor} onChange={e=>setSetor(e.target.value)} placeholder="Em branco = todos"/></label><label>Modelo<select value={modelo} onChange={e=>setModelo(e.target.value as typeof modelo)}><option>Todos</option><option value="II">II — ECH / plantão</option><option value="III">III — Vínculo normal</option><option value="IV">IV — Mais Médicos</option></select></label><label>Situação<select value={situacao} onChange={e=>setSituacao(e.target.value)}><option>Ativo</option><option>Todos</option><option>Afastado</option><option>Inativo</option></select></label></div>
 <div className="frequencyactions"><button className="primary" disabled={busy} onClick={emitir}><FileDown size={18}/>{busy?'Preparando...':'Gerar PDF com os filtros'}</button><p className="muted"><Search size={15}/> Sem filtros de identificação, o sistema inclui todos os registros da situação selecionada (até 1.000).</p></div>
 {message&&<p role="status" className="notice">{message}</p>}
 <p className="muted">Os PDFs reproduzem os campos essenciais dos modelos fornecidos, com cabeçalho demonstrativo no lugar da identidade oficial. Confira a paginação impressa antes de apresentar como versão definitiva.</p></div>
}
