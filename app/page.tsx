'use client';

import { useVulcanSession } from "@/src/components/VulcanSessionProvider";
import CalendarMini from "@/src/components/CalendarMini";

export default function DashboardClient() {
  const { account } = useVulcanSession();
  const loggedInAs = account;

  return (
    <main className="flex min-h-screen bg-[#f5f7fb] text-zinc-800">
      <section className="flex-1 p-4 sm:p-8 overflow-y-auto">
        <header className="mb-8 pb-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-[#f5f7fb] z-10">
          <div>
            <h1 className="text-3xl font-extrabold">Pusty dziennik</h1>
            {loggedInAs && (
              <p className="text-sm text-zinc-500 mt-1">
                Zalogowano jako <span className="font-semibold">{loggedInAs.fullName}</span>
              </p>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-2">Dane dziennika są puste</h2>
              <p className="text-zinc-600 text-sm">
                Aplikacja czeka na automatyczny import danych z eksportu HTML z dziennika Vulcan.
                Po dodaniu pliku do katalogu importu dane pojawią się w zakładkach
                <a className="text-blue-600 hover:underline" href="/calendar"> Kalendarz</a> i
                <a className="text-blue-600 hover:underline" href="/subjects"> Oceny</a>.
              </p>
            </div>
          </div>

          <div className="space-y-6 lg:sticky lg:top-24 self-start">
            <CalendarMini />
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-4">Status</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Import:</span>
                  <span className="text-zinc-400 font-semibold">OCZEKUJE</span>
                </div>
                <div className="flex justify-between">
                  <span>Vulcan:</span>
                  <span
                    className={`font-semibold ${
                      loggedInAs ? 'text-green-600' : 'text-zinc-400'
                    }`}
                  >
                    {loggedInAs ? 'POŁĄCZONO' : 'NIEAKTYWNY'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
