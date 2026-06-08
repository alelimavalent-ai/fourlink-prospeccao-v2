import NichoCard from "./NichoCard.jsx";
import ScoreBadge from "./ScoreBadge.jsx";
import { STATUS_OPTIONS, STATUS_COLORS, NICHO_BAR_COLORS } from "../data.js";

export default function Dashboard({ prospects, onSelectProspect, setTab }) {
  const nichoDistrib = Object.entries(
    prospects.reduce((acc, p) => { acc[p.nicho] = (acc[p.nicho] || 0) + 1; return acc; }, {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 6);

  const kpis = [
    { label: "Total Prospects",  value: prospects.length,                                     icon: "🏢", color: "#1B2F5E" },
    { label: "Alta Prioridade",  value: prospects.filter(p => p.score >= 7).length,           icon: "🔥", color: "#C8311A" },
    { label: "Em Negociação",    value: prospects.filter(p => p.status === "Negociando").length, icon: "💬", color: "#7c3aed" },
    { label: "Convertidos",      value: prospects.filter(p => p.status === "Convertido").length, icon: "✅", color: "#16a34a" },
  ];

  const top5 = [...prospects].sort((a, b) => b.score - a.score).slice(0, 5);

  return (
    <div className="flex flex-col gap-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpis.map(k => (
          <div
            key={k.label}
            style={{
              background: `linear-gradient(135deg, ${k.color}33, ${k.color}11)`,
              border: `1px solid ${k.color}44`,
            }}
            className="rounded-2xl p-4"
          >
            <div className="text-2xl mb-1">{k.icon}</div>
            <div className="text-3xl font-black text-white">{k.value}</div>
            <div className="text-xs text-gray-400 mt-1">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Nichos */}
      <div
        style={{ background: "rgba(27,47,94,0.2)", border: "1px solid rgba(27,47,94,0.5)" }}
        className="rounded-2xl p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">📊</span>
          <span className="font-black text-lg text-white uppercase tracking-wider">
            Distribuição por Nicho
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {nichoDistrib.map(([nicho, count], i) => (
            <NichoCard key={nicho} nicho={nicho} count={count} color={NICHO_BAR_COLORS[i % NICHO_BAR_COLORS.length]} />
          ))}
        </div>
      </div>

      {/* Pipeline */}
      <div
        style={{ background: "rgba(27,47,94,0.2)", border: "1px solid rgba(27,47,94,0.5)" }}
        className="rounded-2xl p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">🚀</span>
          <span className="font-black text-lg text-white uppercase tracking-wider">
            Pipeline de Vendas
          </span>
        </div>
        <div className="flex flex-wrap gap-3">
          {STATUS_OPTIONS.map(s => {
            const count = prospects.filter(p => p.status === s).length;
            const c = STATUS_COLORS[s];
            return (
              <div
                key={s}
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                className="rounded-xl px-4 py-3 flex items-center gap-3"
              >
                <div className={`w-2.5 h-2.5 rounded-full ${c.dot}`} />
                <div>
                  <div className={`text-xs ${c.text} font-bold`}>{s}</div>
                  <div className="text-2xl font-black text-white">{count}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top 5 */}
      <div
        style={{ background: "rgba(27,47,94,0.2)", border: "1px solid rgba(27,47,94,0.5)" }}
        className="rounded-2xl p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">⭐</span>
          <span className="font-black text-lg text-white uppercase tracking-wider">
            Top 5 — Maior Score
          </span>
        </div>
        <div className="flex flex-col gap-2">
          {top5.map((p, i) => (
            <div
              key={p.id}
              onClick={() => { onSelectProspect(p); setTab("prospects"); }}
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
              className="row-hover rounded-xl px-4 py-3 flex items-center gap-4"
            >
              <div
                style={{
                  color: i === 0 ? "#C8311A" : i === 1 ? "#ff7b00" : "#888",
                  fontWeight: 900,
                  fontSize: 18,
                  minWidth: 24,
                }}
              >
                #{i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-white text-sm truncate">{p.empresa}</div>
                <div className="text-xs text-gray-400">{p.nicho} · {p.cidade}/{p.uf}</div>
              </div>
              <ScoreBadge score={p.score} />
              <div
                className={`px-2 py-0.5 rounded-full text-xs font-bold ${STATUS_COLORS[p.status].bg} ${STATUS_COLORS[p.status].text}`}
              >
                {p.status}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
