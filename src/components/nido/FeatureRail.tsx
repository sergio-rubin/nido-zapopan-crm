import { features } from "@/lib/property";

export function FeatureRail() {
  return (
    <ul className="feature-rail" aria-label="Características del departamento">
      {features.map(({ icon: Icon, label }, i) => (
        <li key={label}>
          <span className={`rail-dot${i === 0 ? " is-active" : ""}`} aria-hidden="true" />
          <Icon size={21} strokeWidth={1.55} aria-hidden="true" />
          <span>{label}</span>
        </li>
      ))}
    </ul>
  );
}
