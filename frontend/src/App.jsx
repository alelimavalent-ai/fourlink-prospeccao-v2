import { Routes, Route, Navigate } from 'react-router-dom';
import { auth } from './api';
import Login from './pages/Login.jsx';
import Layout from './components/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Usuarios from './pages/Usuarios.jsx';
import Configuracoes from './pages/Configuracoes.jsx';
import EmBreve from './pages/EmBreve.jsx';
import BaseDados from './pages/BaseDados.jsx';

function Protegida({ children }) {
  if (!auth.token()) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={auth.token() ? <Navigate to="/painel" replace /> : <Login />} />
      <Route element={<Protegida><Layout /></Protegida>}>
        <Route path="/painel" element={<Dashboard />} />
        <Route path="/prospeccao" element={<EmBreve titulo="Prospecção" descricao="Filtros por cidade, bairro, segmento e viabilidade — chega no Módulo 4." />} />
        <Route path="/viabilidade" element={<EmBreve titulo="Viabilidade" descricao="Importação das 4 bases de cobertura e cruzamento por CEP + número — chega no Módulo 3." />} />
        <Route path="/base-de-dados" element={<BaseDados />} />
        <Route path="/usuarios" element={<Usuarios />} />
        <Route path="/configuracoes" element={<Configuracoes />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
