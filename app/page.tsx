import Navbar from "@/components/navbar"
import Hero from "@/components/hero"
import About from "@/components/about"
import MissionVision from "@/components/mission-vision"
import UpcomingEvents from "@/components/upcoming-events"
import Resources from "@/components/resources"
import PhotoGallery from "@/components/photo-gallery"
import Testimonials from "@/components/testimonials"
import Footer from "@/components/footer"
import ThemeOfYear from "@/components/ThemeOfYear"
import CompassionHighlight from "@/components/compassion-highlight"

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://medicalschoolcu.org/#organization",
      name: "Medical School Christian Union",
      alternateName: "MSCU",
      url: "https://medicalschoolcu.org",
      logo: {
        "@type": "ImageObject",
        url: "https://medicalschoolcu.org/mscu.png",
      },
      description:
        "A vibrant fellowship of Christian medical students at the University of Nairobi committed to faith, service, and excellence in healthcare.",
      sameAs: [
        "https://x.com/mscuon",
        "https://www.instagram.com/mscuon",
        "https://youtube.com/@mscuon.",
      ],
      address: {
        "@type": "PostalAddress",
        streetAddress: "Hospital Road, Upper Hill",
        addressLocality: "Nairobi",
        addressCountry: "KE",
      },
      contactPoint: {
        "@type": "ContactPoint",
        email: "contact@mscu.org",
        contactType: "general",
      },
    },
    {
      "@type": "WebSite",
      "@id": "https://medicalschoolcu.org/#website",
      url: "https://medicalschoolcu.org",
      name: "MSCU - Medical School Christian Union",
      publisher: { "@id": "https://medicalschoolcu.org/#organization" },
    },
    {
      "@type": "WebPage",
      "@id": "https://medicalschoolcu.org/#webpage",
      url: "https://medicalschoolcu.org",
      name: "MSCU - Medical School Christian Union | University of Nairobi",
      isPartOf: { "@id": "https://medicalschoolcu.org/#website" },
      about: { "@id": "https://medicalschoolcu.org/#organization" },
      description:
        "A vibrant fellowship of Christian medical students at the University of Nairobi committed to faith, service, and excellence in healthcare.",
    },
  ],
}

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main>
        <Navbar />
        <Hero />
        <About />
        <MissionVision />
        <ThemeOfYear />
        <UpcomingEvents />
        <CompassionHighlight />
        <Resources />
        <PhotoGallery />
        <Testimonials />
        <Footer />
      </main>
    </>
  )
}
