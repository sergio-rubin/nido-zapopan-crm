import { Bath, BedDouble, CarFront, Dumbbell, Ruler } from "lucide-react";

export const SITE_URL = "https://blender-application.wacoding.org";
export const OG_IMAGE = `${SITE_URL}/images/og-nido-zapopan.webp`;

export const property = {
  title: "Departamento en Zapopan",
  price: "$3,450,000 MXN",
  location: "Zapopan, Jalisco",
  description: "Luz, amplitud y amenidades para vivir bien, sin salir de casa.",
};

export const gallery = [
  { src: "/images/apartment-living.webp", alt: "Sala y cocina abiertas con vista urbana en Zapopan" },
  { src: "/images/apartment-bedroom.webp", alt: "Recámara luminosa con acabados en madera" },
  { src: "/images/apartment-amenities.webp", alt: "Alberca exterior rodeada de vegetación" },
  { src: "/images/apartment-exterior.webp", alt: "Fachada contemporánea del edificio" },
];

export const features = [
  { icon: BedDouble, label: "2 recámaras" },
  { icon: Bath, label: "2 baños" },
  { icon: Ruler, label: "95 m²" },
  { icon: CarFront, label: "1 estacionamiento" },
  { icon: Dumbbell, label: "Alberca y gimnasio" },
];
