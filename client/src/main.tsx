import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import """;

function App() {
  return (
    <main className="app">
      <header className="header">
        <span className="eyebrow">Finca Indira</span>
        <span className="status">● En línea</span>
      </header>
      <section className="hero">
        <p className="eyebrow">BananApp</p>
        <h1>Trabajo de campo, incluso sin señal.</h1>
        <p>La base de la aplicación está lista para registrar y sincronizar tus actividades.</p>
        <button type="button">Registrar actividad</button>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
