import { Link, createFileRoute } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { useEffect, useRef } from "react";

import { FeatureRail } from "@/components/nido/FeatureRail";
import { InterestSheet } from "@/components/nido/InterestSheet";
import { PropertyGallery } from "@/components/nido/PropertyGallery";
import { OG_IMAGE, SITE_URL, property } from "@/lib/property";

const TITLE = "Departamento en Zapopan · $3,450,000 MXN";
const DESCRIPTION =
  "Departamento en Zapopan, Jalisco: 2 recámaras, 2 baños, 95 m², estacionamiento, alberca y gimnasio. $3,450,000 MXN.";
const SHORT = "2 recámaras, 2 baños, 95 m², estacionamiento, alberca y gimnasio.";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Apartment",
      "@id": `${SITE_URL}/#departamento`,
      name: "Departamento en Zapopan",
      url: `${SITE_URL}/`,
      image: OG_IMAGE,
      numberOfBedrooms: 2,
      numberOfBathroomsTotal: 2,
      floorSize: { "@type": "QuantitativeValue", value: 95, unitCode: "MTK" },
      address: { "@type": "PostalAddress", addressLocality: "Zapopan", addressRegion: "Jalisco", addressCountry: "MX" },
      amenityFeature: [
        { "@type": "LocationFeatureSpecification", name: "Estacionamiento", value: 1 },
        { "@type": "LocationFeatureSpecification", name: "Alberca", value: true },
        { "@type": "LocationFeatureSpecification", name: "Gimnasio", value: true },
      ],
    },
    {
      "@type": "Offer",
      url: `${SITE_URL}/`,
      price: 3450000,
      priceCurrency: "MXN",
      availability: "https://schema.org/InStock",
      itemOffered: { "@id": `${SITE_URL}/#departamento` },
    },
  ],
};

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { name: "robots", content: "index,follow,max-image-preview:large" },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "es_MX" },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: SHORT },
      { property: "og:url", content: `${SITE_URL}/` },
      { property: "og:image", content: OG_IMAGE },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: SHORT },
      { name: "twitter:image", content: OG_IMAGE },
    ],
    links: [
      { rel: "canonical", href: `${SITE_URL}/` },
      { rel: "preload", as: "image", href: "/images/apartment-living.webp" },
    ],
    scripts: [{ type: "application/ld+json", children: JSON.stringify(jsonLd) }],
  }),
  component: HomePage,
});

function useReveal() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const elements = ref.current?.querySelectorAll<HTMLElement>("[data-reveal]") ?? [];
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      elements.forEach((el) => el.classList.add("is-revealed"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            observer.unobserve(entry.target);
          }
        }),
      { threshold: 0.18 },
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
  return ref;
}

function HomePage() {
  const page = useReveal();
  return (
    <main id="main-content" ref={page} className="home-page">
      <section className="property-hero" aria-labelledby="property-title">
        <PropertyGallery />
        <div className="property-panel nido-panel-in">
          <h1 id="property-title">
            Departamento
            <br />
            en Zapopan
          </h1>
          <p className="property-price">{property.price}</p>
          <p className="property-location">
            <MapPin size={22} strokeWidth={1.5} aria-hidden="true" />
            {property.location}
          </p>
          <InterestSheet />
          <FeatureRail />
        </div>
      </section>

      <section className="amenities" aria-labelledby="amenities-title">
        <div className="amenities-image" data-reveal>
          <img src="/images/apartment-amenities.webp" alt="Alberca del desarrollo con áreas verdes" width={1400} height={900} loading="lazy" />
        </div>
        <div className="amenities-copy" data-reveal>
          <span className="measure-label">AMENIDADES</span>
          <h2 id="amenities-title">
            Vivir bien,
            <br />
            sin salir de casa
          </h2>
          <p>Alberca y gimnasio para tu día a día, en un entorno contemporáneo y bien conectado con Zapopan.</p>
          <div className="copper-rule" aria-hidden="true" />
        </div>
        <div className="location-note" data-reveal>
          <MapPin size={22} strokeWidth={1.45} aria-hidden="true" />
          <div>
            <strong>Zapopan, Jalisco</strong>
            <span>Solicita la ubicación exacta y agenda una visita.</span>
          </div>
          <InterestSheet compact />
        </div>
      </section>

      <footer className="site-footer">
        <span>Zapopan · Jalisco · México</span>
        <Link to="/privacidad">Aviso de privacidad</Link>
      </footer>

      <div className="mobile-cta">
        <span>{property.price}</span>
        <InterestSheet compact />
      </div>
    </main>
  );
}
