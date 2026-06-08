import ScoreBadge from "./ScoreBadge.jsx";
import { STATUS_COLORS, PRIORIDADE_COLORS, NICHOS, STATUS_OPTIONS, PRIORIDADE_OPTIONS } from "../data.js";

export default function ProspectsTable({
  filtered, search, setSearch,
  nichoFilter, setNichoFilter,
  prioFilter, setPrioFilter,
  statusFilter, setStatusFilter,
  sortBy, setSortBy,
  altaPrio, mediaPrio,
  onSelect, onNew, onExport,
}) {
  return (
    <>
      {/* Filter bar */}
      <div
        style={{ background: "rgba(27,47,94,0.2)", border: "1px solid rgba(27,47,94,0.5)" }}
        className="rounded-2xl p-4 flex flex-wrap gap-3 items-center"
      >
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar empresa, contato..."
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            flex: "1 1 180px",
            minWidth: 140,
          }}
          className="rounded-xl px-4 py-2.5 text-white text-sm outline-none placeholder-gray-500"
        />

        {[
          { value: nichoFilter, onChange: setNichoFilter, opts: NICHOS },
          { value: prioFilter,  onChange: setPrioFilter,  opts: ["Todas", ...PRIORIDADE_OPTIONS] },
          { value: statusFilter,onChange: setStatusFilter,opts: ["Todos", ...STATUS_OPTIONS] },
          { value: sortBy,      onChange: setSortBy,
            opts: [["score","↓ Score"],["empresa","A-Z Empresa"],["status","Status"]] },
        ].map((f, i) => (
          <select
            key={i}
            value={f.value}
            onChange={e => f.onChange(e.target.value)}
            style={{ background: "#0a1628", border: "1px solid rgba(255,255,255,0.1)", minWidth: 130 }}
            className="rounded-xl px-3 py-2.5 text-white text-sm outline-none"
          >
            {f.opts.map(o =>
              Array.isArray(o)
                ? <option key={o[0]} value={o[0]}>{o[1]}</option>
                : <option key={o}>{o}</option>
            )}
          </select>
        ))}

        <div className="flex gap-2 ml-auto flex-wrap items-center">
          <div
            style={{ background: "rgba(200,49,26,0.15)", border: "1px solid rgba(200,49,26,0.3)" }}
            className="rounded-xl px-3 py-2 text-xs text-red-300 flex items-center gap-1"
          >
            🔴 <strong>{altaPrio}</strong>
          </div>
          <div
            style={{ background: "rgba(234,179,8,0.15)", border: "1px solid rgba(234,179,8,0.3)" }}
            className="rounded-xl px-3 py-2 text-xs text-yellow-300 flex items-center gap-1"
          >
            🟡 <strong>{mediaPrio}</strong>
          </div>
          <button
            onClick={onExport}
            style={{ background: "rgba(27,47,94,0.6)", border: "1px solid rgba(27,47,94,0.9)" }}
            className="px-4 py-2 rounded-xl text-sm font-bold text-blue-300 hover:opacity-80 transition-opacity whitespace-nowrap"
          >
            📤 Exportar CSV
          </button>
          <button
            onClick={onNew}
            style={{ background: "#C8311A" }}
            className="px-4 py-2 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            ➕ Novo Prospect
          </button>
        </div>
      </div>

      {/* Table */}
      <div
        style={{ background: "rgba(27,47,94,0.15)", border: "1px solid rgba(27,47,94,0.4)" }}
        className="rounded-2xl overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr
                style={{
                  background: "rgba(27,47,94,0.6)",
                  borderBottom: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                {["Score","Empresa","Contato","Cidade/UF","Nicho","Status","Prioridade","Observação"].map(h => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs text-gray-400 uppercase tracking-wider font-bold whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-gray-500">
                    Nenhum prospect encontrado.
                  </td>
                </tr>
              )}
              {filtered.map((p, i) => (
                <tr
                  key={p.id}
                  onClick={() => onSelect(p)}
                  className="row-hover"
                  style={{
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                    background: i % 2 === 0 ? "rgba(0,0,0,0.1)" : "transparent",
                  }}
                >
                  <td className="px-4 py-3 text-center"><ScoreBadge score={p.score} /></td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-white whitespace-nowrap">{p.empresa}</div>
                    <div className="text-xs text-gray-500">{p.cnpj}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-white whitespace-nowrap">{p.contato}</div>
                    <div className="text-xs text-blue-400">{p.telefone}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-300 whitespace-nowrap">{p.cidade}/{p.uf}</td>
                  <td className="px-4 py-3 text-gray-300 whitespace-nowrap text-xs">{p.nicho}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[p.status].bg} ${STATUS_COLORS[p.status].text} whitespace-nowrap`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`${PRIORIDADE_COLORS[p.prioridade].text} font-bold text-xs`}>
                      {PRIORIDADE_COLORS[p.prioridade].label} {p.prioridade}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs max-w-xs truncate">
                    {p.observacao}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
