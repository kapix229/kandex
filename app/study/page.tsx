export default function StudyPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--accent)]">Kandex</p>
        <h1 className="mt-2 text-3xl font-extrabold text-[var(--text)]">Nauka</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">Miejsce na materiały, plan nauki i pracę z asystentem AI. Dane z dziennika są oddzielone od warstwy nauki.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="workspace-card rounded-2xl p-5"><h2 className="font-bold text-[var(--text)]">Plan nauki</h2><p className="mt-2 text-sm text-[var(--text-muted)]">Tutaj Kandex może budować plan na podstawie terminów i ocen.</p></div>
        <div id="ai" className="workspace-card rounded-2xl p-5"><h2 className="font-bold text-[var(--text)]">Asystent AI</h2><p className="mt-2 text-sm text-[var(--text-muted)]">Panel AI jest dostępny po prawej stronie na większych ekranach.</p></div>
      </div>
    </div>
  );
}