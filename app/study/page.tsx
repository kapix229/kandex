"use client";

import { useEffect, useState } from "react";
import SyncButton from "@/components/SyncButton";
import { useVulcanSession } from "@/src/components/VulcanSessionProvider";

export default function StudyPage() {
  const { account } = useVulcanSession();

  return (
    <div className="mx-auto max-w-4xl py-8 space-y-6">
      <div className="workspace-card rounded-2xl p-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">Kandex</p>
        <h1 className="mt-2 text-3xl font-extrabold text-[var(--text)]">Nauka</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">
          Miejsce na materiały, plan nauki i pracę z asystentem AI. Dane z dziennika są oddzielone od warstwy nauki.
        </p>
      </div>

      <div className="workspace-card rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Plan nauki */}
        <div>
          <h2 className="font-bold text-[var(--text)] mb-3">Plan nauki</h2>
          <p className="text-sm text-[var(--text-muted)]">
            Kandex analizuje Twoje oceny i terminy, aby zbudować spersonalizowany plan nauki. Możesz tu śledzić nadchodzące terminy sprawdzianów i daty oddawania zadań.
          </p>
          <ul className="list-disc pl-5 space-y-2 text-[var(--text)]">
            <li>Automatyczna detekcja terminów z EduVULCAN</li>
            <li>Priorytetyzacja na podstawie średnich ocen</li>
            <li>Pamiętaj o regularnych powtórzeniach</li>
          </ul>
        </div>

        {/* Asystent AI */}
        <div id="ai" className="workspace-card rounded-2xl p-5">
          <h2 className="font-bold text-[var(--text)] mb-3">Asystent AI</h2>
          <p className="text-sm text-[var(--text-muted)]">
            AI Asystent jest dostępny po prawej stronie na większych ekranach (skrót: Cmd/Ctrl+K).
          </p>
          <ul className="list-disc pl-5 space-y-2 text-[var(--text)]">
            <li>Wyjaśnianie trudnych zagadnień</li>
            <li>Generowanie materiałów do nauki</li>
            <li>Planowanie sesji nauki</li>
            <li>Analiza ocen i frekwencji</li>
          </ul>
        </div>
      </div>

      {/* Connect EduVULCAN callout */}
      <div className="workspace-card rounded-2xl p-6 bg-[var(--surface-muted)] border border-[var(--border)]">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">Połącz dziennik</p>
        <p className="mt-2 text-sm leading-relaxed text-[var(--text)]">
          Aby korzystać z pełnej funkcjonalności planowania nauki, połącz swoje konto EduVULCAN. Twoje dane o ocenach i terminach będą dostępne automatycznie.
        </p>
        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          <a
            href="/settings"
            className="flex-1 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-center text-sm font-bold text-[#211e24] transition hover:brightness-105"
          >
            Ustawienia dziennika →
          </a>
          {account ? (
            <a
              href="/subjects"
              className="rounded-xl bg-[var(--surface-muted)] px-4 py-2.5 text-center text-sm font-bold text-[var(--text)] transition hover:bg-white/[0.08]"
            >
              Sprawdź oceny →
            </a>
          ) : (
            <span className="text-sm text-[var(--text-muted)]">Najpierw połącz konto</span>
          )}
        </div>
      </div>
    </div>
  );
}