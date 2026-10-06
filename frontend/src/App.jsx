import { useEffect } from 'react';
import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { useSalesTrainer } from './hooks/useSalesTrainer';
import SimulatorPage from './pages/SimulatorPage';
import ConceptsPage from './pages/ConceptsPage';

export default function App() {
  const { pathname } = useLocation();
  const trainer = useSalesTrainer(pathname === '/');
  useEffect(() => {
    document.title = `${pathname === '/conceitos' ? 'Conceitos' : 'Laboratório de vendas'} · Entrelinhas`;
    window.scrollTo(0, 0);
  }, [pathname]);
  return <>
    <a className="skip-link" href="#main-content">Ir para o conteúdo</a>
    <header className="topbar"><Link to="/" className="brand" aria-label="Entrelinhas, página inicial"><span className="brand-mark" aria-hidden="true">e.</span><div><strong>entrelinhas</strong><span>laboratório de vendas</span></div></Link>
      <nav className="site-nav" aria-label="Navegação principal"><NavLink to="/" end>Simulador</NavLink><NavLink to="/conceitos">Conceitos</NavLink></nav>
      <div className="local-badge"><span aria-hidden="true" />Nimble · local</div>
    </header>
    <main id="main-content"><Routes><Route path="/" element={<SimulatorPage trainer={trainer} />} /><Route path="/conceitos" element={<ConceptsPage />} /><Route path="*" element={<div className="panel"><h1>Página não encontrada</h1><Link to="/">Voltar ao simulador</Link></div>} /></Routes>
      <footer><p>Reações simuladas por IA; os percentuais não são taxas reais de conversão.<br />O modelo pode superestimar promessas que não constam dos fatos da oferta.</p><span>Uma experiência com Nimble 9B · System One</span></footer>
    </main>
  </>;
}
