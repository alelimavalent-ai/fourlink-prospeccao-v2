import { useState, useMemo } from "react";
import {
  NICHOS, STATUS_OPTIONS, PRIORIDADE_OPTIONS,
  INITIAL_PROSPECTS, EMPTY_FORM,
} from "./data.js";
import Dashboard from "./components/Dashboard.jsx";
import ProspectsTable from "./components/ProspectsTable.jsx";
import ProspectModal from "./components/ProspectModal.jsx";
import Toast from "./components/Toast.jsx";

export default function App() {
  const [prospects, setProspects] = useState(INITIAL_PROSPECTS);
  const [search, setSearch] = useState("");
  const [nichoFilter, setNichoFilter] = useState("Todos os nichos");
  const [prioFilter, setPrioFilter] = useState("Todas");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [sortBy, setSortBy] = useState("score");
  const [tab, setTab] = useState("dashboard");
  const [editing, setEditing] = useState(null);
  const [isNew, setIsNew] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  const filtered = useMemo(() => {
    return prospects
      .filter(p => {
        const q = search.toLowerCase();
        return (
          (!q || p.empresa.toLowerCase().includes(q) ||
            p.contato.toLowerCase().includes(q) ||
            p.cidade.toLowerCase().includes(q)) &&
          (nichoFilter === "Todos os nichos" || p.nicho === nichoFilter) &&
          (prioFilter === "Todas" || p.prioridade === prioFilter) &&
          (statusFilter === "Todos" || p.status === statusFilter)
        );
      })
      .sort((a, b) => {
        if (sortBy === "score")   return b.score - a.score;
        if (sortBy === "empresa") return a.empresa.localeCompare(b.empresa);
        if (sortBy === "status")  return a.status.localeCompare(b.status);
        return 0;
      });
  }, [prospects, search, nichoFilter, prioFilter, statusFilter, sortBy]);

  const altaPrio  = filtered.filter(p => p.score >= 7).length;
  const mediaPrio = filtered.filter(p => p.score >= 4 && p.score < 7).length;

  const exportCSV = () => {
    const headers = ["Empresa","CNPJ","Contato","Telefone","Cidade","UF","Nicho","Funcionários","Status","Prioridade","Score","Observação"];
    const rows = filtered.map(p => [
      p.empresa, p.cnpj, p.contato, p.telefone, p.cidade, p.uf,
      p.nicho, p.funcionarios, p.status, p.prioridade, p.score,
      `"${(p.observacao || "").replace(/"/g, '""')}"`,
    ]);
    const csv = [headers, ...rows].map(r => r.join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fourlink_prospects_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`✅ ${filtered.length} prospects exportados!`);
  };

  const handleSave = form => {
    if (isNew) {
      setProspects(ps => [{ ...form, id: Date.now() }, ...ps]);
      showToast("✅ Prospect cadastrado!");
    } else {
      setProspects(ps => ps.map(p => p.id === form.id ? form : p));
      showToast("✅ Prospect atualizado!");
    }
    setEditing(null);
  };

  const handleDelete = id => {
    setProspects(ps => ps.filter(p => p.id !== id));
    setEditing(null);
    showToast("🗑️ Prospect removido.");
  };

  const openNew = () => { setEditing({ ...EMPTY_FORM }); setIsNew(true); };
  const openEdit = p => { setEditing(p); setIsNew(false); };

  return (
    <div className="min-h-screen" style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: "#070e1f" }}>
      <Toast message={toast} />

      {/* Header */}
      <header
        style={{
          background: "linear-gradient(135deg, #0d1b3e 0%, #1B2F5E 100%)",
          borderBottom: "1px solid rgba(200,49,26,0.3)",
        }}
        className="px-4 md:px-6 py-4"
      >
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div
              style={{ background: "#C8311A", width: 36, height: 36, borderRadius: 10 }}
              className="flex items-center justify-center text-white font-black text-sm flex-shrink-0"
            >
              F
            </div>
            <div>
              <div
                className="font-black text-xl"
                style={{
                  background: "linear-gradient(90deg, #fff 0%, #C8311A 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Máquina de Prospecção
              </div>
              <div className="text-xs text-gray-400">
                Fourlink Telecom · B2B · {new Date().toLocaleDateString("pt-BR")}
              </div>
            </div>
          </div>

          <nav className="flex gap-2">
            {[
              ["dashboard", "📊 Dashboard"],
              ["prospects", "🎯 Prospects"],
            ].map(([t, label]) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  background: tab === t ? "#C8311A" : "rgba(255,255,255,0.05)",
                  border: tab === t ? "none" : "1px solid rgba(255,255,255,0.1)",
                }}
                className="px-4 py-2 rounded-xl text-sm font-bold transition-all text-white"
              >
                {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="p-4 md:p-6 flex flex-col gap-5">
        {tab === "dashboard" && (
          <Dashboard
            prospects={prospects}
            onSelectProspect={openEdit}
            setTab={setTab}
          />
        )}

        {tab === "prospects" && (
          <ProspectsTable
            filtered={filtered}
            search={search} setSearch={setSearch}
            nichoFilter={nichoFilter} setNichoFilter={setNichoFilter}
            prioFilter={prioFilter} setPrioFilter={setPrioFilter}
            statusFilter={statusFilter} setStatusFilter={setStatusFilter}
            sortBy={sortBy} setSortBy={setSortBy}
            altaPrio={altaPrio} mediaPrio={mediaPrio}
            onSelect={openEdit}
            onNew={openNew}
            onExport={exportCSV}
          />
        )}
      </main>

      {editing && (
        <ProspectModal
          prospect={editing}
          isNew={isNew}
          onClose={() => setEditing(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
