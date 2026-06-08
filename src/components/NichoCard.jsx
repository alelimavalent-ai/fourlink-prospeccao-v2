export default function NichoCard({ nicho, count, color }) {
  return (
    <div
      style={{ background: "rgba(27,47,94,0.5)", border: "1px solid rgba(200,49,26,0.2)" }}
      className="rounded-xl p-4 flex flex-col gap-1"
    >
      <div className="text-xs text-gray-400 truncate">{nicho}</div>
      <div className={`w-full h-1 rounded-full ${color} mb-1`} />
      <div className="text-2xl font-black text-white">{count}</div>
      <div className="text-xs text-gray-500">empresas</div>
    </div>
  );
}
