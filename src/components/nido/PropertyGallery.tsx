import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState, type KeyboardEvent } from "react";

import { gallery } from "@/lib/property";

export function PropertyGallery() {
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState<Record<number, boolean>>({});
  const current = gallery[index] ?? gallery[0]!;

  const select = (next: number) => setIndex((next + gallery.length) % gallery.length);

  useEffect(() => {
    gallery.slice(1).forEach(({ src }) => {
      const image = new Image();
      image.src = src;
    });
  }, []);

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "ArrowLeft") select(index - 1);
    if (event.key === "ArrowRight") select(index + 1);
  };

  return (
    <section className="gallery" aria-roledescription="carrusel" aria-label="Galería del departamento" onKeyDown={onKeyDown}>
      <div className="gallery-stage nido-stage-in">
        {!loaded[index] && <div className="image-skeleton" aria-hidden="true" />}
        <img
          key={current.src}
          className="gallery-image nido-fade"
          src={current.src}
          alt={current.alt}
          width={1600}
          height={1072}
          fetchPriority={index === 0 ? "high" : "auto"}
          onLoad={() => setLoaded((prev) => ({ ...prev, [index]: true }))}
          ref={(img) => {
            if (img?.complete && img.naturalWidth > 0 && !loaded[index]) setLoaded((p) => ({ ...p, [index]: true }));
          }}
        />
        <button className="gallery-arrow is-left" type="button" aria-label="Foto anterior" onClick={() => select(index - 1)}>
          <ChevronLeft size={24} strokeWidth={1.5} />
        </button>
        <button className="gallery-arrow is-right" type="button" aria-label="Foto siguiente" onClick={() => select(index + 1)}>
          <ChevronRight size={24} strokeWidth={1.5} />
        </button>
        <p className="gallery-count" aria-live="polite">
          {index + 1} / {gallery.length}
        </p>
        <span className="gallery-scan nido-scan-in" aria-hidden="true" />
      </div>
      <ul className="gallery-thumbs" aria-label="Miniaturas">
        {gallery.map((image, i) => (
          <li key={image.src}>
            <button
              type="button"
              aria-label={`Ver foto ${i + 1}: ${image.alt}`}
              aria-current={i === index ? "true" : undefined}
              onClick={() => select(i)}
            >
              <img src={image.src} alt="" width={320} height={214} loading="lazy" />
            </button>
          </li>
        ))}
      </ul>
      <div className="gallery-progress" aria-hidden="true">
        <span style={{ width: `${((index + 1) / gallery.length) * 100}%` }} />
      </div>
    </section>
  );
}
