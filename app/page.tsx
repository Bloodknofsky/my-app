"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import CopyEmailButton from "./components/CopyEmailButton";

const CONTACT_EMAIL = "armansykot@korea.ac.kr";

function formatClockTime(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function formatClockDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

const researchFocus = [
  {
    title: "Robust Sensing Protocols",
    description:
      "Exploring robust quantum sensing protocols using Diamond NV centers.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6">
        <circle cx="12" cy="12" r="1.8" fill="currentColor" stroke="none" />
        <ellipse cx="12" cy="12" rx="9" ry="3.6" />
        <ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(60 12 12)" />
        <ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(120 12 12)" />
      </svg>
    ),
  },
  {
    title: "Increasing Sensitivity",
    description: "Exploring new ways to increase measurement sensitivity.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6">
        <path d="M3 17.5 L8.5 11 L12.5 14.5 L21 5" />
        <path d="M14.5 5 H21 V11.5" />
      </svg>
    ),
  },
  {
    title: "Confocal Imaging Techniques",
    description:
      "Exploring new techniques involving confocal setup for sensing and imaging.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6">
        <circle cx="12" cy="12" r="8.5" />
        <circle cx="12" cy="12" r="3" />
        <path d="M12 3.5 V6" />
        <path d="M12 18 V20.5" />
        <path d="M3.5 12 H6" />
        <path d="M18 12 H20.5" />
      </svg>
    ),
  },
];

export default function Home() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const update = () => setNow(new Date());
    const timeoutId = setTimeout(update, 0);
    const intervalId = setInterval(update, 1000);
    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center bg-gradient-to-b from-blue-50 via-white to-white">
      <header className="flex w-full justify-center px-6 pt-10 pb-4 sm:pt-14">
        <Image
          src="/koreauniv.png"
          alt="Korea University logo"
          width={220}
          height={60}
          priority
          className="h-auto w-44 sm:w-56"
        />
      </header>

      <div className="flex w-full justify-center px-6 pb-2">
        <Link
          href="/chatbot"
          className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-5 py-2.5 text-sm font-medium text-blue-700 shadow-sm transition-colors hover:bg-blue-50 sm:text-base"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5">
            <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v9a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4H6.5A2.5 2.5 0 0 1 4 14.5v-9Z" />
            <path d="M8 8.5h8" />
            <path d="M8 12h5" />
          </svg>
          NV-Diamond Research Assistant
        </Link>
      </div>

      <main className="flex w-full flex-1 flex-col items-center gap-14 px-6 pb-20 sm:gap-16 sm:px-10">
        {/* Hero */}
        <section className="w-full max-w-2xl rounded-2xl border border-blue-100 bg-white px-6 py-8 text-center shadow-sm shadow-blue-900/5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-900/10 sm:px-10 sm:py-10">
          <h1 className="text-2xl font-bold tracking-tight text-blue-950 sm:text-4xl">
            Arman Sykot
          </h1>
          <p className="mt-2 text-base font-medium text-blue-700 sm:text-lg">
            Quantum Sensing Researcher
          </p>
          <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">
            Quantum Sensing using Diamond NV center, Spin-based qubit,
            Computational Quantum Technology with Diamond NV center
          </p>
        </section>

        {/* Intro paragraph */}
        <section aria-labelledby="research-focus-heading" className="w-full max-w-2xl text-center">
          <p className="text-sm leading-7 text-slate-700 sm:text-lg sm:leading-8">
            Arman Sykot is a researcher whose work centers on quantum sensing
            with Diamond NV centers. His research spans spin-based qubits and
            computational quantum technology, aimed at making NV-center-based
            sensing more robust and practical. Day to day, this involves
            developing sensing protocols, improving measurement sensitivity,
            and advancing confocal-based techniques for sensing and imaging.
          </p>
        </section>

        {/* Research focus */}
        <section className="w-full max-w-4xl">
          <h2 id="research-focus-heading" className="mb-6 text-center text-lg font-semibold text-blue-950 sm:text-2xl">
            Research Focus
          </h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-6">
            {researchFocus.map((item) => (
              <div
                key={item.title}
                className="flex flex-col items-center gap-4 rounded-2xl border border-blue-100 bg-white px-6 py-8 text-center shadow-sm shadow-blue-900/5 transition-shadow hover:shadow-md"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                  {item.icon}
                </div>
                <h3 className="text-sm font-semibold text-blue-950 sm:text-base">{item.title}</h3>
                <p className="text-sm leading-relaxed text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Contact */}
        <section aria-labelledby="contact-heading" className="flex w-full max-w-2xl flex-col items-center gap-4 pt-2 text-center">
          <h2 id="contact-heading" className="text-lg font-semibold text-blue-950 sm:text-2xl">
            Get in Touch
          </h2>
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="inline-flex items-center gap-2 rounded-full bg-blue-700 px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-800 sm:text-base"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m4 6.5 8 6 8-6" />
              </svg>
              {CONTACT_EMAIL}
            </a>
            <CopyEmailButton email={CONTACT_EMAIL} />
          </div>
        </section>

        {/* Divider */}
        <div className="h-px w-full max-w-2xl bg-blue-100" />

        {/* Live clock */}
        <section className="flex w-full flex-col items-center">
          <div className="w-full max-w-sm rounded-2xl bg-gradient-to-b from-white to-blue-50 px-10 py-12 text-center shadow-lg shadow-blue-900/5">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              Current Time
            </p>
            <p
              className="mt-4 text-4xl font-semibold tracking-wider text-[#1f2937] sm:text-5xl"
              suppressHydrationWarning
            >
              {now ? formatClockTime(now) : "--:--:--"}
            </p>
            <p className="mt-4 text-sm text-slate-400 sm:text-base">
              {now ? formatClockDate(now) : ""}
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
