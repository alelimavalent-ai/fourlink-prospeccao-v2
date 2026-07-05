import { useEffect, useState } from 'react';
import { api, auth } from '../api';

export default function Dashboard() {
  const [resumo, setResumo] = useState(null);
  const usuario = auth.usuario();

  useEffect(() => {
    api('/resumo').then(setResumo).catch(() => setResumo({}));
  }, []);

  const cartoes = [
    { rotulo: 'Empresas na base', valor: resumo?.empresas, nota: 'CNPJs RJ · MG · ES (Módulo 2)' },
    { rotulo: 'Com viabilidade de fibra', valor: resumo?.viaveis, nota: 'Cruzamento das 4 bases (Módulo 3)' },
    { rotulo: 'Meus leads atribuídos', valor: resumo?.meusLeads, nota: 'Leads puxados por você' },
    { rotulo: 'Usuários ativos', valor: resumo?.usuarios, nota: 'Equipe com acesso ao painel' },
  ];

  return (
    <div>
      <header className="pagina-cabecalho">
        <div>
          <h2>Bom trabalho, {usuario?.nome?.split(' ')[0]}!</h2>
          <p>Visão geral do Fourlink Prospector.</p>
        </div>
      </header>

      <div className="grade-cartoes">
        {cartoes.map((c) => (
          <div className="cartao" key={c.rotulo}>
            <span className="cartao-rotulo">{c.rotulo}</span>
            <strong className="cartao-valor">{c.valor === undefined ? '—' : c.valor.toLocaleString('pt-BR')}</strong>
            <span className="cartao-nota">{c.nota}</span>
          </div>
        ))}
      </div>

      <div className="painel-aviso">
        <strong>Módulo 2 ativo:</strong> importador da Receita Federal disponível no menu Base de Dados (admins).
        Próximos passos: viabilidade (Módulo 3) e tela de prospecção com exportação (Módulo 4).
      </div>
    </div>
  );
}
