import { Link, useLocation } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";

export function SiteHeader() {
  const pathname = useLocation({ select: (l) => l.pathname });
  const isStaff = pathname.startsWith("/interesados") || pathname.startsWith("/login");
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      setScrolled(window.scrollY > 10);
      setProgress(scrollable > 0 ? Math.min(window.scrollY / scrollable, 1) : 0);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [pathname]);

  return (
    <header className={`site-header${scrolled ? " is-scrolled" : ""}`}>
      <div className="header-inner">
        <Link className="wordmark" to="/" aria-label="NIDO Zapopan, inicio">
          <img src="/icons/icon-192.png" alt="" width={34} height={34} />
          <span className="wordmark-copy">
            <strong>NIDO</strong>
            <small>Zapopan · Jal.</small>
          </span>
        </Link>
        <nav className="header-nav" aria-label="Navegación principal">
          <span className="header-context" aria-hidden="true">
            EXPEDIENTE · 01
          </span>
          <Link className="header-link" to={isStaff ? "/" : "/interesados"}>
            <span className="header-link-dot" aria-hidden="true" />
            <span>{isStaff ? "Ver propiedad" : "Interesados"}</span>
            <ArrowUpRight size={16} strokeWidth={1.7} aria-hidden="true" />
          </Link>
        </nav>
      </div>
      <span className="header-progress" aria-hidden="true">
        <i style={{ transform: `scaleX(${progress})` }} />
      </span>
    </header>
  );
}
