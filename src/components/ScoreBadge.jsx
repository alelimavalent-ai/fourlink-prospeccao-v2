export default function ScoreBadge({ score }) {
  const color = score >= 8 ? "text-red-400" : score >= 5 ? "text-yellow-400" : "text-gray-400";
  return <span className={`font-bold text-lg ${color}`}>{score}</span>;
}
