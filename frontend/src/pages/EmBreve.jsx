export default function EmBreve({ titulo, descricao }) {
  return (
    <div>
      <header className="pagina-cabecalho">
        <div>
          <h2>{titulo}</h2>
          <p>{descricao}</p>
        </div>
      </header>
      <div className="cartao em-breve">
        <span className="selo-modulo">Em construção</span>
        <p>Esta área será liberada no próximo módulo do Prospector.</p>
      </div>
    </div>
  );
}
