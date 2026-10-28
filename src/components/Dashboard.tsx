import { useCallback, useEffect, useState } from 'react'
import { Activity, Building2, BriefcaseBusiness, RefreshCw, Users, UserCheck, UserX, ClipboardList } from 'lucide-react'
import { supabase } from '../lib/supabase'
import '../styles/dashboard.css'

type Grupo = { nome: string; quantidade: number }
type Resumo = {
  total: number; ativos: number; afastados: number; inativos: number;
  setores: number; cargos: number;
  por_setor: Grupo[]; por_cargo: Grupo[]; por_modelo: Grupo[]
}

function GraficoBarras({ titulo, grupos, limite = 10 }: { titulo: string; grupos: Grupo[]; limite?: number }) {
  const selecionados = grupos.slice(0, limite)
  const maximo = Math.max(...selecionados.map(g => g.quantidade), 1)
  return <section className="dash-panel">
    <h3>{titulo}</h3>
    {selecionados.length === 0 ? <p className="dash-empty">Nenhum registro disponível.</p> :
      <div className="dash-bars">
        {selecionados.map(item => <div className="dash-bar" key={item.nome}>
          <span title={item.nome}>{item.nome}</span>
          <div className="dash-track"><div className="dash-fill" style={{ width: `${(item.quantidade / maximo) * 100}%` }} /></div>
          <strong>{item.quantidade.toLocaleString('pt-BR')}</strong>
        </div>)}
      </div>}
      {grupos.length > limite && <p className="dash-footnote">Exibindo os {limite} maiores grupos de {grupos.length}.</p>}
  </section>
}

export default function Dashboard() {
  const [dados, setDados] = useState<Resumo | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [atualizado, setAtualizado] = useState('')
  const carregar = useCallback(async () => {
    if (!supabase) { setErro('Supabase não configurado.'); setCarregando(false); return }
    setCarregando(true)
    setErro('')
    const { data, error } = await supabase.rpc('dashboard_resumo')
    if (error) setErro(`${error.message}. Verifique se executou supabase/dashboard.sql no SQL Editor.`)
    else { setDados(data as Resumo); setAtualizado(new Date().toLocaleString('pt-BR')) }
    setCarregando(false)
  }, [])

  useEffect(() => { void carregar() }, [carregar])
  const indicadores = dados ? [
    { label: 'Servidores cadastrados', valor: dados.total, Icone: Users },
    { label: 'Ativos', valor: dados.ativos, Icone: UserCheck },
    { label: 'Afastados', valor: dados.afastados, Icone: Activity },
    { label: 'Inativos', valor: dados.inativos, Icone: UserX },
    { label: 'Setores', valor: dados.setores, Icone: Building2 },
    { label: 'Cargos distintos', valor: dados.cargos, Icone: BriefcaseBusiness }
  ] : []

  return <div className="dash-root">
    <div className="dash-intro">
      <div><p className="eyebrow">INDICADORES EM TEMPO REAL NA CONSULTA</p><h2>Panorama funcional</h2><p>Consolidação dos cadastros fictícios armazenados no Supabase.</p></div>
      <button className="secondary dash-refresh" onClick={() => void carregar()} disabled={carregando}><RefreshCw size={16} /> {carregando ? 'Atualizando...' : 'Atualizar dados'}</button>
    </div>
    {erro && <div className="errorbar" role="alert">{erro}</div>}
    {carregando && !dados && <p className="dash-empty">Consultando indicadores...</p>}
    {dados && <>
      <div className="dash-metrics">{indicadores.map(({ label, valor, Icone }) => <div className="dash-metric" key={label}><div><span>{label}</span><Icone size={19} /></div><strong>{valor.toLocaleString('pt-BR')}</strong></div>)}</div>
      <div className="dash-charts">
        <GraficoBarras titulo="Servidores por setor" grupos={dados.por_setor} />
        <GraficoBarras titulo="Servidores por cargo" grupos={dados.por_cargo} />
        <GraficoBarras titulo="Modelos de frequência atribuídos" grupos={dados.por_modelo.map(g => ({ ...g, nome: `Modelo ${g.nome}` }))} limite={4} />
        <section className="dash-panel"><h3>Situação funcional</h3><div className="dash-status"><div><span>Ativos</span><strong>{dados.ativos}</strong></div><div><span>Afastados</span><strong>{dados.afastados}</strong></div><div><span>Inativos</span><strong>{dados.inativos}</strong></div></div><p className="dash-footnote"><ClipboardList size={15} /> Estes números representam situação cadastral, não presença, faltas ou frequência apurada.</p></section>
      </div>
      <p className="dash-timestamp">Última consulta: {atualizado}. Atualize para buscar alterações recentes.</p>
    </>}
  </div>
}
