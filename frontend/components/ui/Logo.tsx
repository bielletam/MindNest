import type { SVGProps } from "react";

export function LogoMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 80 84"
      width={34}
      height={36}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect
        x="6"
        y="4"
        width="27"
        height="65"
        rx="13.5"
        fill="#818cf8"
        opacity="0.88"
        transform="rotate(-18, 19.5, 36.5)"
      />
      <rect
        x="47"
        y="4"
        width="27"
        height="65"
        rx="13.5"
        fill="#818cf8"
        transform="rotate(18, 60.5, 36.5)"
      />
      <circle cx="57" cy="56" r="13" fill="#161f33" />
    </svg>
  );
}

export function LogoMarkLarge(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 80 84"
      width={66}
      height={70}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: "drop-shadow(0 10px 28px rgba(79,70,229,.45))" }}
      {...props}
    >
      <rect
        x="6"
        y="4"
        width="27"
        height="65"
        rx="13.5"
        fill="#818cf8"
        opacity="0.88"
        transform="rotate(-18, 19.5, 36.5)"
      />
      <rect
        x="47"
        y="4"
        width="27"
        height="65"
        rx="13.5"
        fill="#818cf8"
        transform="rotate(18, 60.5, 36.5)"
      />
      <circle cx="57" cy="56" r="13" fill="#161f33" />
    </svg>
  );
}

export function LogoMarkWhite(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 80 84"
      width={20}
      height={21}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect
        x="6"
        y="4"
        width="27"
        height="65"
        rx="13.5"
        fill="rgba(255,255,255,.82)"
        transform="rotate(-18, 19.5, 36.5)"
      />
      <rect
        x="47"
        y="4"
        width="27"
        height="65"
        rx="13.5"
        fill="white"
        transform="rotate(18, 60.5, 36.5)"
      />
      <circle cx="57" cy="56" r="13" fill="rgba(20,15,70,.85)" />
    </svg>
  );
}

export function Logo() {
  return (
    <div>
      <div className="flex items-end gap-0.5 leading-none mb-0.5">
        <LogoMark />
        <span
          style={{
            fontSize: 22,
            fontWeight: 600,
            color: "#f1f5f9",
            letterSpacing: "-0.03em",
            lineHeight: 1,
          }}
        >
          ind
        </span>
      </div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 800,
          color: "#f8fafc",
          letterSpacing: "-0.03em",
          lineHeight: 1,
          paddingLeft: 2,
        }}
      >
        Nest
      </div>
    </div>
  );
}
