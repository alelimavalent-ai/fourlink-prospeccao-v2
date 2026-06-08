import { useState } from "react";
import { STATUS_OPTIONS, PRIORIDADE_OPTIONS, NICHOS_LIST, UF_OPTIONS } from "../data.js";
import { getScript } from "../scripts.js";

export default function ProspectModal({ prospect, isNew, onClose, onSave, onDelete }) {
  const [form, setForm] = useState({ ...prospect });
  const [tab, setTab] = useState("dados");
  const [copied, setCopied] = useState("");

  const script = getScript(form.nicho);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const copy = (text, key) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(""), 2000);
    });
  };

  const inputStyle = {
    background: "rgba(27,47,94,0.4)",
    border: "1px solid rgba(255,255,255,0.1)",
  };
  const selectStyle = {
    background: "#070e1f",
    border: "1px solid rgba(255,255,255,0.1)",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.88)" }}
    >
      <div
        style={{
          background: "#0b1730",
          border: "1px solid rgba(200,49,26,0.4)",
          maxWidth: 600,
          width: "100%",
          maxHeight: "92vh",
        }}
        className="rounded-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
          className="px-6 py-4 flex justify-between items-center flex-shrink-0"
        >
          <h2 className="text-white font-black text-lg">
            {isNew ? "➕ Novo Prospect" : "✏️ Editar Prospect"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl leading-none">
            ×
          </button>
        </div>

        {/* Tabs */}
        <div
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
          className="px-6 flex gap-1 flex-shrink-0"
        >
          {[["dados", "📋 Dados"], ["script", "📲 Script CRM"]].map(([t, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                borderBottom: tab === t ? "2px solid #C8311A" : "2px solid transparent",
              }}
              className={`px-4 py-3 text-sm font-bold transition-colors ${
                tab === t ? "text-white" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1">
          {tab === "dados" && (
            <div className="p-6 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                {/* Full-width fields */}
                <div className="col-span-2 flex flex-col gap-1">
                  <label className="text-xs text-gray-400 uppercase tracking-wider">Empresa *</label>
                  <input
                    value={form.empresa || ""}
                    onChange={e => set("empresa", e.target.value)}
                    style={inputStyle}
                    className="rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-red-500/60"
                    placeholder="Nome da empresa"
                  />
                </div>
                {[
                  { label: "Nome do Contato", key: "contato", placeholder: "Ex: João Silva" },
                  { label: "Telefone / WhatsApp", key: "telefone", placeholder: "(xx) 9xxxx-xxxx" },
                  { label: "CNPJ / MEI", key: "cnpj", placeholder: "xx.xxx.xxx/0001-xx" },
                  { label: "Cidade", key: "cidade", placeholder: "Ex: Belo Horizonte" },
                ].map(({ label, key, placeholder }) => (
                  <div key={key} className="flex flex-col gap-1">
                    <label className="text-xs text-gray-400 uppercase tracking-wider">{label}</label>
                    <input
                      value={form[key] || ""}
                      onChange={e => set(key, e.target.value)}
                      style={inputStyle}
                      className="rounded-lg px-3 py-2 text-white text-sm outline-none"
                      placeholder={placeholder}
                    />
                  </div>
                ))}
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-400 uppercase tracking-wider">UF</label>
                  <select
                    value={form.uf}
                    onChange={e => set("uf", e.target.value)}
                    style={selectStyle}
                    className="rounded-lg px-3 py-2 text-white text-sm outline-none"
                  >
                    {UF_OPTIONS.map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400 uppercase tracking-wider">Nicho</label>
                <select
                  value={form.nicho}
                  onChange={e => set("nicho", e.target.value)}
                  style={selectStyle}
                  className="rounded-lg px-3 py-2 text-white text-sm outline-none"
                >
                  {NICHOS_LIST.map(n => <option key={n}>{n}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-400 uppercase tracking-wider">Status</label>
                  <select
                    value={form.status}
                    onChange={e => set("status", e.target.value)}
                    style={selectStyle}
                    className="rounded-lg px-2 py-2 text-white text-sm outline-none"
                  >
                    {STATUS_OPTIONS.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-400 uppercase tracking-wider">Prioridade</label>
                  <select
                    value={form.prioridade}
                    onChange={e => set("prioridade", e.target.value)}
                    style={selectStyle}
                    className="rounded-lg px-2 py-2 text-white text-sm outline-none"
                  >
                    {PRIORIDADE_OPTIONS.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-400 uppercase tracking-wider">Score (1-10)</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={form.score}
                    onChange={e => set("score", Number(e.target.value))}
                    style={inputStyle}
                    className="rounded-lg px-3 py-2 text-white text-sm outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400 uppercase tracking-wider">Observação</label>
                <textarea
                  value={form.observacao || ""}
                  onChange={e => set("observacao", e.target.value)}
                  rows={3}
                  style={{ ...inputStyle, resize: "none" }}
                  className="rounded-lg px-3 py-2 text-white text-sm outline-none"
                  placeholder="Notas sobre o prospect, operadora atual, urgência..."
                />
              </div>
            </div>
          )}

          {tab === "script" && (
            <div className="p-6 flex flex-col gap-5">
              <div
                style={{
                  background: "rgba(200,49,26,0.1)",
                  border: "1px solid rgba(200,49,26,0.3)",
                }}
                className="rounded-xl px-4 py-3 text-sm text-red-300"
              >
                Scripts personalizados para o nicho <strong>{form.nicho}</strong>.{" "}
                Substitua <strong>[Nome]</strong> antes de enviar.
              </div>

              {[
                { key: "whatsapp", label: "📱 WhatsApp / Abordagem Inicial", text: script.whatsapp },
                { key: "email", label: "📧 E-mail Corporativo", text: script.email },
              ].map(({ key, label, text }) => (
                <div
                  key={key}
                  style={{
                    background: "rgba(27,47,94,0.3)",
                    border: "1px solid rgba(27,47,94,0.7)",
                  }}
                  className="rounded-xl overflow-hidden"
                >
                  <div
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
                    className="flex justify-between items-center px-4 py-2.5"
                  >
                    <span className="text-sm font-bold text-white">{label}</span>
                    <button
                      onClick={() => copy(text, key)}
                      style={{
                        background:
                          copied === key ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.07)",
                        border: `1px solid ${copied === key ? "rgba(34,197,94,0.4)" : "rgba(255,255,255,0.1)"}`,
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        copied === key ? "text-green-400" : "text-gray-300 hover:text-white"
                      }`}
                    >
                      {copied === key ? "✓ Copiado!" : "Copiar"}
                    </button>
                  </div>
                  <pre
                    className="px-4 py-3 text-xs text-gray-300 whitespace-pre-wrap leading-relaxed"
                    style={{ fontFamily: "inherit" }}
                  >
                    {text}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
          className="px-6 py-4 flex gap-3 flex-shrink-0"
        >
          <button
            onClick={() => onSave(form)}
            style={{ background: "#C8311A" }}
            className="flex-1 py-2.5 rounded-xl text-white font-bold text-sm hover:opacity-90 transition-opacity"
          >
            {isNew ? "Cadastrar" : "Salvar"}
          </button>
          {!isNew && (
            <button
              onClick={() => onDelete(form.id)}
              style={{
                background: "rgba(239,68,68,0.15)",
                border: "1px solid rgba(239,68,68,0.4)",
              }}
              className="px-4 py-2.5 rounded-xl text-red-400 font-bold text-sm hover:opacity-90"
            >
              🗑️
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
            className="flex-1 py-2.5 rounded-xl text-gray-300 font-bold text-sm hover:opacity-90"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
