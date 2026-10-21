import { StrictMode, useCallback, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { Banana, Bug, LogOut, Check, ClipboardPlus, CloudRain, Download, FileText, History, Map as MapIcon, MapPin, Sprout, Thermometer, Wifi, WifiOff } from "lucide-react";
import "./styles.css";

type Tipo = "actividad" | "plaga";
interface Registro {
  id: string; tipo: Tipo; lote: string; detalle: string; severidad?: "baja" | "media" | "alta";
  lat?: number; lng?: number; responsable: string; creado: string; sync: boolean;
}
interface Dia { fecha: string; lluvia_mm: number; tmax: number }

const CENTRO = { lat: 7.9361746, lng: -76.6907864 }; // Finca Indira
const LOTES = Array.from({ length: 20 }, (_, i) => `L-${String(i + 1).padStart(2, "0")}`);
const ACTIVIDADES = ["Fertilización", "Control de plagas", "Deshoje", "Riego", "Drenaje", "Cosecha"];
const PLAGAS = ["Sigatoka negra", "Sospecha Fusarium R4T", "Otra plaga"];

// ---- IndexedDB (cola offline) ----
const abrir = () => new Promise<IDBDatabase>((ok, no) => {
  const r = indexedDB.open("bananapp", 1);
  r.onupgradeneeded = () => r.result.createObjectStore("registros", { keyPath: "id" });
  r.onsuccess = () => ok(r.result);
  r.onerror = () => no(r.error);
});
async function tx<T>(modo: IDBTransactionMode, f: (s: IDBObjectStore) => IDBRequest<T>) {
  const db = await abrir();
  return new Promise<T>((ok, no) => {
    const q = f(db.transaction("registros", modo).objectStore("registros"));
    q.onsuccess = () => ok(q.result);
    q.onerror = () => no(q.error);
  });
}
const leerTodos = () => tx<Registro[]>("readonly", (s) => s.getAll());

// Envía pendientes en lotes pequeños; el UUID hace el reenvío seguro (idempotente).
async function sincronizar() {
  const pend = (await leerTodos()).filter((r) => !r.sync);
  for (let i = 0; i < pend.length; i += 20) {
    const lote = pend.slice(i, i + 20);
    const res = await fetch("/api/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ registros: lote }) });
    if (!res.ok) throw new Error("sync");
    const { aceptados } = (await res.json()) as { aceptados: string[] };
    for (const r of lote) if (aceptados.includes(r.id)) await tx("readwrite", (s) => s.put({ ...r, sync: true }));
  }
}

function App({ onSalir }: { onSalir: () => void }) {
  const [tab, setTab] = useState<"registrar" | "mapa" | "reporte">("registrar");
  const [online, setOnline] = useState(navigator.onLine);
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [clima, setClima] = useState<Dia[]>(() => JSON.parse(localStorage.getItem("clima") ?? "[]"));
  const [msg, setMsg] = useState("");

  const [tipo, setTipo] = useState<Tipo>("actividad");
  const [lote, setLote] = useState(LOTES[0]);
  const [detalle, setDetalle] = useState(ACTIVIDADES[0]);
  const [sev, setSev] = useState<"baja" | "media" | "alta">("media");
  const [resp, setResp] = useState(localStorage.getItem("responsable") ?? "usuario");
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);

  const recargar = useCallback(async () => setRegistros((await leerTodos()).sort((a, b) => b.creado.localeCompare(a.creado))), []);
  const sync = useCallback(async () => {
    try { await sincronizar(); } catch { /* queda pendiente */ }
    await recargar();
  }, [recargar]);

  useEffect(() => {
    void sync();
    const on = () => { setOnline(true); void sync(); };
    const off = () => setOnline(false);
    window.addEventListener("online", on); window.addEventListener("offline", off);
    if (import.meta.env.PROD && "serviceWorker" in navigator) void navigator.serviceWorker.register("/sw.js");
    fetch(`/api/clima?lat=${CENTRO.lat}&lng=${CENTRO.lng}`).then((r) => r.json()).then((j: { dias?: Dia[] }) => {
      if (j.dias) { setClima(j.dias); localStorage.setItem("clima", JSON.stringify(j.dias)); }
    }).catch(() => { /* usa el último clima guardado */ });
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, [sync]);

  const capturarGps = () => navigator.geolocation.getCurrentPosition(
    (p) => setGps({ lat: p.coords.latitude, lng: p.coords.longitude }),
    () => setMsg("No se pudo obtener el GPS; se guardará sin coordenadas."),
    { enableHighAccuracy: true, timeout: 10000 }
  );

  async function guardar() {
    if (!resp.trim()) { setMsg("Escribe el nombre del responsable."); return; }
    localStorage.setItem("responsable", resp.trim());
    const r: Registro = {
      id: crypto.randomUUID(), tipo, lote, detalle, responsable: resp.trim(), creado: new Date().toISOString(), sync: false,
      ...(tipo === "plaga" ? { severidad: sev, ...(gps ?? {}) } : {})
    };
    await tx("readwrite", (s) => s.put(r));
    setGps(null); setMsg("Guardado en el dispositivo ✔");
    await recargar();
    if (navigator.onLine) void sync();
  }

  const semana = useMemo(() => registros.filter((r) => Date.now() - Date.parse(r.creado) < 7 * 864e5), [registros]);
  const pendientes = registros.filter((r) => !r.sync).length;
  const lluviaAlta = clima.slice(0, 3).some((d) => d.lluvia_mm >= 30);

  function csv() {
    const filas = ["fecha,tipo,lote,detalle,severidad,lat,lng,responsable", ...semana.map((r) =>
      [r.creado, r.tipo, r.lote, `"${r.detalle}"`, r.severidad ?? "", r.lat ?? "", r.lng ?? "", `"${r.responsable}"`].join(","))];
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([filas.join("\n")], { type: "text/csv" }));
    a.download = `reporte-semanal-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  const plagasGps = registros.filter((r) => r.tipo === "plaga" && r.lat !== undefined && r.lng !== undefined);
  const D = 0.012; // ±~1,3 km alrededor del centro de la finca
  const px = (lng: number) => ((lng - CENTRO.lng + D) / (2 * D)) * 300;
  const py = (lat: number) => 300 - ((lat - CENTRO.lat + D) / (2 * D)) * 300;
  const color = { baja: "#e9c46a", media: "#e29a5b", alta: "#d4806b" };

  const NAV = [["registrar", "Registrar", ClipboardPlus], ["mapa", "Mapa", MapIcon], ["reporte", "Reporte", FileText]] as const;
  const estado = <div className="estado"><span className={`pill ${online ? "" : "off"}`}>{online ? <Wifi size={14} /> : <WifiOff size={14} />}{online ? "En línea" : "Sin señal"}{pendientes > 0 && ` · ${pendientes} pend.`}</span><button type="button" className="salir" onClick={onSalir} aria-label="Cerrar sesión" title="Cerrar sesión"><LogOut size={18} /></button></div>;
  const marca = <div className="brand"><Banana color="#5b8a64" /><div>BananApp<small>Finca Indira</small></div></div>;
  const botones = (cls: string) => NAV.map(([k, n, Ic]) => <button key={k} type="button" className={tab === k ? "on" : ""} onClick={() => setTab(k)} aria-label={n}><Ic size={cls === "n" ? 22 : 18} />{n}</button>);

  return (
    <div className="shell">
      <aside className="side"><div>{marca}<nav>{botones("s")}</nav></div>{estado}</aside>
      <header className="top">{marca}{estado}</header>
      <main className="content">
        {lluviaAlta && <div className="alerta"><CloudRain size={20} />Lluvia fuerte prevista en 3 días: revisa drenaje y riego.</div>}
        {tab === "registrar" && (
          <div className="grid dos">
            <section className="card">
              <h2><ClipboardPlus size={18} />Nuevo registro</h2>
              <div className="seg">
                <button type="button" className={tipo === "actividad" ? "on" : ""} onClick={() => { setTipo("actividad"); setDetalle(ACTIVIDADES[0]); }}><Sprout size={16} />Actividad</button>
                <button type="button" className={tipo === "plaga" ? "on" : ""} onClick={() => { setTipo("plaga"); setDetalle(PLAGAS[0]); }}><Bug size={16} />Plaga</button>
              </div>
              <div className="row2">
                <div><label htmlFor="lote">Lote</label><select id="lote" value={lote} onChange={(e) => setLote(e.target.value)}>{LOTES.map((l) => <option key={l}>{l}</option>)}</select></div>
                {tipo === "plaga" && <div><label htmlFor="sev">Severidad</label><select id="sev" value={sev} onChange={(e) => setSev(e.target.value as typeof sev)}><option value="baja">Baja</option><option value="media">Media</option><option value="alta">Alta</option></select></div>}
              </div>
              <label htmlFor="det">{tipo === "actividad" ? "Actividad" : "Tipo de plaga"}</label>
              <select id="det" value={detalle} onChange={(e) => setDetalle(e.target.value)}>{(tipo === "actividad" ? ACTIVIDADES : PLAGAS).map((x) => <option key={x}>{x}</option>)}</select>
              <label htmlFor="resp">Responsable</label>
              <input id="resp" value={resp} onChange={(e) => setResp(e.target.value)} placeholder="Tu nombre" />
              {tipo === "plaga" && <button type="button" className="btn ghost" onClick={capturarGps}><MapPin size={18} />{gps ? `${gps.lat.toFixed(5)}, ${gps.lng.toFixed(5)}` : "Capturar ubicación GPS"}</button>}
              <button type="button" className="btn" onClick={() => void guardar()}><Check size={18} />Guardar</button>
              {msg && <p className="msg" role="status">{msg}</p>}
            </section>
            <div className="grid">
              <section className="card">
                <h2><CloudRain size={18} />Clima</h2>
                {clima.length === 0 ? <small>Sin datos aún.</small> : clima.slice(0, 4).map((d) => <div className="clima" key={d.fecha}><b>{d.fecha.slice(5)}</b><span><CloudRain size={15} />{d.lluvia_mm} mm</span><span><Thermometer size={15} />{d.tmax} °C</span></div>)}
              </section>
              <section className="card">
                <h2><History size={18} />Recientes</h2>
                {registros.length === 0 ? <small>Aún no hay registros.</small> : <ul>{registros.slice(0, 6).map((r) => (
                  <li key={r.id}><div><b>{r.lote}</b> · {r.detalle}<small>{new Date(r.creado).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" })} · {r.responsable}</small></div><span className={`tag ${r.sync ? "" : "pend"}`}>{r.sync ? "enviado" : "pendiente"}</span></li>
                ))}</ul>}
              </section>
            </div>
          </div>
        )}
        {tab === "mapa" && (
          <section className="card">
            <h2><MapIcon size={18} />Mapa de plagas</h2>
            <svg className="mapa" viewBox="0 0 300 300" role="img" aria-label="Mapa de plagas de la finca">
              <rect x="30" y="30" width="240" height="240" rx="8" fill="#fff" fillOpacity=".55" stroke="#5b8a64" strokeDasharray="4" />
              <circle cx="150" cy="150" r="3" fill="#5b8a64" /><text x="156" y="146" fontSize="8" fill="#7b8077">Centro</text>
              {plagasGps.map((r) => <circle key={r.id} cx={px(r.lng!)} cy={py(r.lat!)} r="7" fill={color[r.severidad ?? "media"]} stroke="#fff" strokeWidth="2"><title>{`${r.lote} · ${r.detalle} (${r.severidad})`}</title></circle>)}
            </svg>
            <div className="leyenda"><span>{plagasGps.length} foco(s) con GPS</span>{(["baja", "media", "alta"] as const).map((k) => <span key={k}><i className="dot" style={{ background: color[k] }} />{k}</span>)}</div>
          </section>
        )}
        {tab === "reporte" && (
          <section className="card">
            <h2><FileText size={18} />Reporte semanal</h2>
            <table><tbody>
              <tr><td>Registros</td><td>{semana.length}</td></tr>
              {ACTIVIDADES.map((a) => <tr key={a}><td>{a}</td><td>{semana.filter((r) => r.detalle === a).length}</td></tr>)}
              <tr><td>Plagas reportadas</td><td>{semana.filter((r) => r.tipo === "plaga").length}</td></tr>
              <tr><td>Severidad alta</td><td>{semana.filter((r) => r.severidad === "alta").length}</td></tr>
              <tr><td>Lotes afectados</td><td>{new Set(semana.filter((r) => r.tipo === "plaga").map((r) => r.lote)).size}</td></tr>
            </tbody></table>
            <button type="button" className="btn" onClick={csv} disabled={semana.length === 0}><Download size={18} />Descargar CSV</button>
          </section>
        )}
      </main>
      <nav className="nav">{botones("n")}</nav>
    </div>
  );
}

const USUARIO = "usuario";
const CLAVE = "usuario123";

function Login({ onEntrar }: { onEntrar: () => void }) {
  const [u, setU] = useState("");
  const [c, setC] = useState("");
  const [error, setError] = useState(false);
  function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (u.trim() === USUARIO && c === CLAVE) { localStorage.setItem("sesion", "1"); onEntrar(); } else setError(true);
  }
  return (
    <div className="login">
      <form className="card" onSubmit={enviar}>
        <div className="brand"><Banana color="#5b8a64" /><div>BananApp<small>Finca Indira</small></div></div>
        <label htmlFor="u">Usuario</label>
        <input id="u" value={u} onChange={(e) => { setU(e.target.value); setError(false); }} autoComplete="username" autoFocus />
        <label htmlFor="c">Contraseña</label>
        <input id="c" type="password" value={c} onChange={(e) => { setC(e.target.value); setError(false); }} autoComplete="current-password" />
        {error && <p className="msg err" role="alert">Usuario o contraseña incorrectos.</p>}
        <button type="submit" className="btn">Entrar</button>
      </form>
    </div>
  );
}

function Root() {
  const [dentro, setDentro] = useState(localStorage.getItem("sesion") === "1");
  if (!dentro) return <Login onEntrar={() => setDentro(true)} />;
  return <App onSalir={() => { localStorage.removeItem("sesion"); setDentro(false); }} />;
}

createRoot(document.getElementById("root")!).render(<StrictMode><Root /></StrictMode>);
