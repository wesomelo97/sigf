import { useCallback, useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { supabase } from '../lib/supabase'

type Auditoria = { id:number; ocorrido_em:string; acao:string; matricula:string|null; nome:string|null; alteracoes:Record<string, unknown> }
type Emissao = { id:number; emitido_em:string; inicio:string; fim:string; quantidade:number; arquivo_nome:string; filtros:Record<string, unknown> }
const data = (valor:string) => new Date(valor).toLocaleString('pt-BR')
const acao = (valor:string) => ({ INSERT:'Cadastro',UPDATE:'Edição',DELETE:'Exclusão' }[valor] ?? valor)

export default function Historico(){
 const [aba,setAba]=useState<'auditoria'|'emissoes'>('auditoria')
 const [auditoria,setAuditoria]=useState<Auditoria[]>([])
 const [emissoes,setEmissoes]=useState<Emissao[]>([])
 const [loading,setLoading]=useState(false)
 const [erro,setErro]=useState('')
 const carregar=useCallback(async()=>{
  if(!supabase)return
  setLoading(true);setErro('')
  const [a,e]=await Promise.all([
   supabase.from('auditoria_servidores').select('id,ocorrido_em,acao,matricula,nome,alteracoes').order('ocorrido_em',{ascending:false}).limit(100),
   supabase.from('emissoes_frequencia').select('id,emitido_em,inicio,fim,quantidade,arquivo_nome,filtros').order('emitido_em',{ascending:false}).limit(100)
  ])
  if(a.error||e.error)setErro(a.error?.message||e.error?.message||'Erro desconhecido')
  else {setAuditoria((a.data??[]) as Auditoria[]);setEmissoes((e.data??[]) as Emissao[])}
  setLoading(false)
 },[])
 useEffect(()=>{void carregar()},[carregar])
 return <div className="panel">
  <div className="sectionhead"><div><h2>Histórico administrativo</h2><p>Últimos 100 eventos de cada categoria. Registros anteriores à instalação da auditoria não aparecem.</p></div><button className="secondary" disabled={loading} onClick={()=>void carregar()}><RefreshCw size={16}/> {loading?'Consultando...':'Atualizar'}</button></div>
  <div className="toolbar"><button className={aba==='auditoria'?'primary':'secondary'} onClick={()=>setAba('auditoria')}>Alterações de cadastro ({auditoria.length})</button><button className={aba==='emissoes'?'primary':'secondary'} onClick={()=>setAba('emissoes')}>PDFs gerados ({emissoes.length})</button></div>
  {erro&&<p className="errorbar" role="alert">{erro}. Execute o arquivo supabase/auditoria_emissoes.sql.</p>}
  {aba==='auditoria'?<div className="tablewrap"><table><thead><tr><th>Data</th><th>Ação</th><th>Matrícula</th><th>Servidor</th><th>Detalhes</th></tr></thead><tbody>{auditoria.map(item=><tr key={item.id}><td>{data(item.ocorrido_em)}</td><td>{acao(item.acao)}</td><td>{item.matricula}</td><td>{item.nome}</td><td><details><summary>Ver alterações</summary><pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',maxWidth:420}}>{JSON.stringify(item.alteracoes,null,2)}</pre></details></td></tr>)}</tbody></table>{!loading&&!auditoria.length&&<p className="empty">Nenhuma alteração registrada ainda.</p>}</div>:
  <div className="tablewrap"><table><thead><tr><th>Data</th><th>Período</th><th>Folhas</th><th>Arquivo</th><th>Filtros</th></tr></thead><tbody>{emissoes.map(item=><tr key={item.id}><td>{data(item.emitido_em)}</td><td>{item.inicio} a {item.fim}</td><td>{item.quantidade}</td><td>{item.arquivo_nome}</td><td><details><summary>Ver filtros</summary><pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',maxWidth:360}}>{JSON.stringify(item.filtros,null,2)}</pre></details></td></tr>)}</tbody></table>{!loading&&!emissoes.length&&<p className="empty">Nenhum PDF registrado ainda.</p>}</div>}
  <p className="muted">Os eventos identificam a conta pelo ID no banco. Um PDF gerado não comprova impressão física, entrega ou comparecimento do servidor.</p>
 </div>
}
