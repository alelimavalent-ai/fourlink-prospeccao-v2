export default function Toast({ message }) {
  if (!message) return null;
  return (
    <div
      className="fixed top-4 right-4 z-50 px-5 py-3 rounded-xl text-sm font-bold text-white shadow-2xl animate-pulse"
      style={{ background: "#1B2F5E", border: "1px solid rgba(200,49,26,0.5)" }}
    >
      {message}
    </div>
  );
}
