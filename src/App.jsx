import './App.css'

function App() {
  return (
    <main className="app-shell">
      <section className="app-panel">
        <img src="/logo.jpeg" alt="Logo Avance" className="app-logo" />
        <p className="app-eyebrow">Avance</p>
        <h1>Controle de frequencia escolar</h1>
        <p className="app-copy">
          O sistema principal roda nas paginas estaticas do projeto. Use os atalhos abaixo para entrar
          direto no fluxo de login ou no painel.
        </p>
        <div className="app-actions">
          <a className="app-link app-link-primary" href="/login.html">
            Ir para login
          </a>
          <a className="app-link" href="/dashboard.html">
            Abrir dashboard
          </a>
        </div>
      </section>
    </main>
  )
}

export default App
