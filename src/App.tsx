import Historico from './components/Historico'
import Frequencias from './components/Frequencias'
import Dashboard from './components/Dashboard'
import { useEffect, useState, type FormEvent } from 'react'
import { supabase, configured } from './lib/supabase'
import type { Session } from '@supabase/supabase-js'
import { Activity, FileText, LayoutDashboard, LogOut, Plus, Search, ShieldCheck, Trash2, Users, Pencil, X, History } from 'lucide-react'

type Servidor = { id:string; matricula:string; nome:string; cargo:string; setor:string; vinculo:string; horario:string|null; modelo_frequencia:'II'|'III'|'IV'; situacao:'Ativo'|'Afastado'|'Inativo' }
type FormData = Omit<Servidor, 'id'>
const vazio:FormData = { matricula:'',nome:'',cargo:'',setor:'',vinculo:'Efetivo',horario:'08h às 12h - 13h às 17h',modelo_frequencia:'III',situacao:'Ativo' }

function App() {
 const [session,setSession]=useState<Session|null>(null)
 const [loading,setLoading]=useState(true)
 const [email,setEmail]=useState('')
 const [senha,setSenha]=useState('')
 const [error,setError]=useState('')
 const [busy,setBusy]=useState(false)
 const [papel,setPapel]=useState('')
 const admin=papel==='admin'
 const podeEmitir=admin||papel==='emissor'
 const [rows,setRows]=useState<Servidor[]>([])
 const [count,setCount]=useState(0)
 const [busca,setBusca]=useState('')
 const [situacao,setSituacao]=useState('Todos')
 const [page,setPage]=useState(0)
 const [aba,setAba]=useState<'dashboard'|'servidores'|'frequencias'|'historico'>('dashboard')
 const [edit,setEdit]=useState<string|null>(null)
 const [form,setForm]=useState<FormData>(vazio)
 const [modal,setModal]=useState(false)
 const [notice,setNotice]=useState('')
 const pageSize=15
 useEffect(()=>{
   if (!supabase) {setLoading(false);return}
   const client=supabase
   client.auth.getSession().then(({data})=>{setSession(data.session);setLoading(false)})
   const {data:{subscription}}=client.auth.onAuthStateChange((_event,s)=>setSession(s))
   return ()=>subscription.unsubscribe()
 },[])
 useEffect(()=>{
  if(!session||!supabase){setPapel('');return}
  supabase.from('perfis').select('papel').eq('id',session.user.id).single().then(({data,error:e})=>{
   if(e)setError('Não foi possível consultar seu perfil. Execute schema.sql no Supabase.')
   setPapel(data?.papel??'');if(data?.papel==='emissor')setAba('frequencias')
  })
 },[session])
 useEffect(()=>{setPage(0)},[busca,situacao])
 useEffect(()=>{
  if(!session||!admin||!supabase)return
  let active=true
  async function fetchRows(){
   let q=supabase!.from('servidores').select('*',{count:'exact'}).order('nome',{ascending:true}).range(page*pageSize,(page+1)*pageSize-1)
   if(busca.trim())q=q.or(`nome.ilike.%${busca.trim().replace(/[,()%]/g,'')}%,matricula.ilike.%${busca.trim().replace(/[,()%]/g,'')}%`)
   if(situacao!=='Todos')q=q.eq('situacao',situacao)
   const {data,count:c,error:e}=await q
   if(active){if(e)setError(e.message);else{setRows(data as Servidor[]);setCount(c??0)}}
  }
  fetchRows()
  return ()=>{active=false}
 },[session,admin,busca,situacao,page,notice])
 async function login(e:FormEvent){e.preventDefault();if(!supabase)return;setBusy(true);setError('');const {error:e2}=await supabase.auth.signInWithPassword({email,password:senha});if(e2)setError(e2.message);setBusy(false)}
 async function save(e:FormEvent){e.preventDefault();if(!supabase||!admin)return;setBusy(true);setError('');const payload={...form,matricula:form.matricula.trim(),nome:form.nome.trim(),cargo:form.cargo.trim(),setor:form.setor.trim()}
  const res=edit?await supabase.from('servidores').update(payload).eq('id',edit):await supabase.from('servidores').insert(payload)
  if(res.error)setError(res.error.message);else{setModal(false);setNotice(`Registro ${edit?'atualizado':'criado'} com sucesso.`);setEdit(null);setForm(vazio)}setBusy(false)
 }
 async function remove(s:Servidor){if(!supabase||!admin||!window.confirm(`Excluir ${s.nome}? Essa ação não pode ser desfeita.`))return;const {error:e}=await supabase.from('servidores').delete().eq('id',s.id);if(e)setError(e.message);else setNotice(`Registro excluído: ${s.matricula}`)}
 function begin(s?:Servidor){setError('');setEdit(s?.id??null);setForm(s?{matricula:s.matricula,nome:s.nome,cargo:s.cargo,setor:s.setor,vinculo:s.vinculo,horario:s.horario,modelo_frequencia:s.modelo_frequencia,situacao:s.situacao}:vazio);setModal(true)}
 if(!configured)return <main className="setup"><ShieldCheck size={38}/><h1>Configuração inicial do SIGF</h1><p>Crie <code>.env.local</code> a partir de <code>.env.example</code> e informe a URL e a chave publicável do Supabase. Depois reinicie <code>npm run dev</code>.</p></main>
 if(loading)return <main className="setup">Carregando SIGF...</main>
 if(!session)return <main className="login"><div className="loginbox"><div className="brandmark"><Activity size={28}/></div><p className="eyebrow">SISTEMA DEMONSTRATIVO</p><h1>SIGF</h1><p>Gestão funcional e emissão de frequências</p><form onSubmit={login}><label>E-mail<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="seu@email.com"/></label><label>Senha<input type="password" value={senha} onChange={e=>setSenha(e.target.value)} required minLength={6} placeholder="••••••••"/></label><button disabled={busy}>{busy?'Entrando...':'Entrar no sistema'}</button></form>{error&&<p className="error">{error}</p>}<small>Ambiente de demonstração · Dados inteiramente fictícios</small></div></main>
 return <div className="layout"><aside><div className="logo"><Activity/><span><strong>SIGF</strong><small>GESTÃO FUNCIONAL</small></span></div><p className="navhead">ESPAÇO DE TRABALHO</p><nav>{admin&&<button className={aba==='dashboard'?'current':''} onClick={()=>setAba('dashboard')}><LayoutDashboard size={18}/> Visão geral</button>}{admin&&<button className={aba==='servidores'?'current':''} onClick={()=>setAba('servidores')}><Users size={18}/> Servidores</button>}<button className={aba==='frequencias'?'current':''} onClick={()=>setAba('frequencias')}><FileText size={18}/> Frequências</button>{admin&&<button className={aba==='historico'?'current':''} onClick={()=>setAba('historico')}><History size={18}/> Histórico</button>}</nav><div className="sidebarfoot"><small>Versão 0.2 · Demonstração</small><button onClick={()=>supabase?.auth.signOut()}><LogOut size={16}/> Sair</button></div></aside><div className="body"><header><div><span className="eyebrow">{admin?'PAINEL ADMINISTRATIVO':'EMISSÃO DE FREQUÊNCIAS'}</span><h1>{aba==='dashboard'?'Visão geral':aba==='servidores'?'Servidores':aba==='frequencias'?'Emissão de frequências':'Histórico'}</h1></div><div className="account"><ShieldCheck size={18}/><span>{session.user.email}</span></div></header><main>
 {!podeEmitir?<div className="panel"><h2>Perfil sem autorização</h2><p>Esta conta precisa do perfil <code>admin</code> ou <code>emissor</code>. Verifique o papel no Supabase e atualize a página.</p></div>:<>
 {notice&&<div className="notice" onClick={()=>setNotice('')}>{notice} <X size={14}/></div>}{error&&<div className="errorbar" onClick={()=>setError('')}>{error} <X size={14}/></div>}
 {admin&&aba==='dashboard'&&<Dashboard/>}
 {admin&&aba==='servidores'&&<div className="panel"><div className="sectionhead"><div><h2>Cadastro funcional</h2><p>Pesquise, inclua e edite os registros de demonstração.</p></div><button className="primary" onClick={()=>begin()}><Plus size={18}/> Novo servidor</button></div><div className="toolbar"><div className="search"><Search size={18}/><input aria-label="Pesquisar por nome ou matrícula" placeholder="Buscar nome ou matrícula" value={busca} onChange={e=>setBusca(e.target.value)}/></div><select value={situacao} onChange={e=>setSituacao(e.target.value)} aria-label="Filtrar situação"><option>Todos</option><option>Ativo</option><option>Afastado</option><option>Inativo</option></select></div><div className="tablewrap"><table><thead><tr><th>Matrícula</th><th>Servidor</th><th>Cargo / Setor</th><th>Modelo</th><th>Situação</th><th>Ações</th></tr></thead><tbody>{rows.map(s=><tr key={s.id}><td className="mono">{s.matricula}</td><td><strong>{s.nome}</strong><small>{s.vinculo}</small></td><td>{s.cargo}<small>{s.setor}</small></td><td>{s.modelo_frequencia}</td><td><span className="pill">{s.situacao}</span></td><td className="actions"><button title="Editar" onClick={()=>begin(s)}><Pencil size={16}/></button><button title="Excluir" onClick={()=>remove(s)}><Trash2 size={16}/></button></td></tr>)}</tbody></table>{rows.length===0&&<p className="empty">Nenhum registro encontrado. Cadastre um servidor para começar.</p>}</div><div className="pagination"><span>{count} registros encontrados</span><div><button disabled={page===0} onClick={()=>setPage(v=>v-1)}>Anterior</button><span>Página {page+1}</span><button disabled={(page+1)*pageSize>=count} onClick={()=>setPage(v=>v+1)}>Próxima</button></div></div></div>}
 {aba==='frequencias'&&<Frequencias/>}
 {admin&&aba==='historico'&&<Historico/>}
 </>}
 </main></div>
 {admin&&modal&&<div className="overlay" onMouseDown={e=>{if(e.target===e.currentTarget)setModal(false)}}><div className="dialog"><div className="sectionhead"><h2>{edit?'Editar servidor':'Novo servidor'}</h2><button className="iconbtn" onClick={()=>setModal(false)}><X/></button></div><form onSubmit={save} className="formgrid">{([['matricula','Matrícula'],['nome','Nome completo'],['cargo','Cargo'],['setor','Setor'],['vinculo','Vínculo'],['horario','Horário']] as const).map(([field,label])=><label key={field}>{label}<input required={field!=='horario'} value={form[field]??''} onChange={e=>setForm(f=>({...f,[field]:e.target.value}))}/></label>)}<label>Modelo de frequência<select value={form.modelo_frequencia} onChange={e=>setForm(f=>({...f,modelo_frequencia:e.target.value as FormData['modelo_frequencia']}))}><option value="II">II — Plantão / ECH</option><option value="III">III — Vínculo normal</option><option value="IV">IV — Mais Médicos</option></select></label><label>Situação<select value={form.situacao} onChange={e=>setForm(f=>({...f,situacao:e.target.value as FormData['situacao']}))}><option>Ativo</option><option>Afastado</option><option>Inativo</option></select></label><div className="formactions"><button type="button" className="secondary" onClick={()=>setModal(false)}>Cancelar</button><button disabled={busy} className="primary">{busy?'Salvando...':'Salvar registro'}</button></div></form></div></div>}
 </div>
}
export default App
