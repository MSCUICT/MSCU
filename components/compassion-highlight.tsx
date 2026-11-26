import Link from "next/link"
import { ArrowRight, HeartHandshake } from "lucide-react"

// Homepage teaser for the Compassion Ministry page (/compassion).
export default function CompassionHighlight() {
  return (
    <section
      id="compassion"
      className="scroll-mt-24 py-16 md:py-24 px-4 sm:px-6 lg:px-8"
      style={{ backgroundColor: "#E3F2FD" }}
    >
      <div className="max-w-7xl mx-auto text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-gray-600 mb-4">
          Medical School Christian Union
        </p>
        <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: "#1E88E5" }}>
          Compassion Ministry
        </h2>
        <p className="text-xl md:text-2xl font-semibold text-gray-800 mb-4">
          Acts of kindness, hearts of love
        </p>
        <p className="text-lg text-gray-700 max-w-2xl mx-auto italic">&ldquo;Kindness is contagious&rdquo;</p>

        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/compassion"
            className="inline-flex items-center gap-2 text-white font-semibold py-3 px-8 rounded-lg transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
            style={{ backgroundColor: "#FB8C00" }}
          >
            Visit the Compassion page
            <ArrowRight size={20} />
          </Link>
          <Link
            href="/compassion#assistance"
            className="inline-flex items-center gap-2 font-semibold py-3 px-8 rounded-lg border-2 bg-white transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            style={{ color: "#1E88E5", borderColor: "#1E88E5" }}
          >
            <HeartHandshake size={20} />
            Seek Assistance
          </Link>
        </div>
      </div>
    </section>
  )
}
