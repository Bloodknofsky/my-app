import Link from "next/link";
import CopyEmailButton from "./components/CopyEmailButton";

const CONTACT_EMAIL = "armansykot@korea.ac.kr";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="px-6 py-8">
        <h1 className="text-2xl font-semibold">Arman Sykot</h1>
        <p className="text-lg">Quantum Sensing Researcher</p>
      </header>

      <main className="flex flex-1 flex-col gap-8 px-6 py-8">
        {/* Placeholder copy — real bio content is not part of PLAN task 2 */}
        <section aria-labelledby="research-focus-heading">
          <h2 id="research-focus-heading" className="text-xl font-medium">
            Research focus
          </h2>
          <p>
            Research on quantum sensing — precision measurement techniques
            using quantum systems, with applications in navigation,
            metrology, and fundamental physics.
          </p>
        </section>

        <section aria-labelledby="contact-heading">
          <h2 id="contact-heading" className="text-xl font-medium">
            Contact
          </h2>
          <p className="flex items-center gap-2">
            <span>{CONTACT_EMAIL}</span>
            <CopyEmailButton email={CONTACT_EMAIL} />
          </p>
          <p>
            <Link href="/chatbot">RAG Chatbot</Link>
          </p>
        </section>
      </main>
    </div>
  );
}
