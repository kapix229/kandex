'use client';

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 py-8">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h1 className="text-3xl font-bold text-zinc-800">Import automatyczny</h1>
        <p className="mt-2 text-sm text-zinc-600">
          W tej wersji dane dziennika są pobierane automatycznie z eksportu HTML zapisanych w katalogu tymczasowym.
          Nie ma osobnego formularza importu ani ręcznego wklejania treści HTML.
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-slate-50 to-zinc-100 p-6">
        <h2 className="text-lg font-bold text-zinc-900">Jak to działa</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-zinc-700">
          <li>Eksport z dziennika Vulcan zapisuje się jako plik HTML.</li>
          <li>Plik trafia do katalogu tymczasowego aplikacji.</li>
          <li>Po odświeżeniu widoków kalendarz i oceny automatycznie odczytują dane z eksportu.</li>
          <li>Po zaimportowaniu plik jest usuwany, więc dziennik pozostaje czysty.</li>
        </ul>
      </div>
    </div>
  );
}
