import Image from "next/image";

interface SizeProps {
  width?: number;
  height?: number;
  className?: string;
}

export function LogoMark({ width = 34, height = 34 }: SizeProps) {
  return (
    <Image
      src="/logo.png"
      alt="MindNest"
      width={width}
      height={height}
      style={{ objectFit: "contain", borderRadius: "22%" }}
    />
  );
}

export function LogoMarkLarge({ width = 66, height = 66 }: SizeProps) {
  return (
    <Image
      src="/logo.png"
      alt="MindNest"
      width={width}
      height={height}
      style={{ objectFit: "contain", borderRadius: "22%", filter: "drop-shadow(0 10px 28px rgba(79,70,229,.45))" }}
    />
  );
}

export function LogoMarkWhite({ width = 20, height = 20 }: SizeProps) {
  return (
    <Image
      src="/logo.png"
      alt="MindNest"
      width={width}
      height={height}
      style={{ objectFit: "contain", borderRadius: "22%" }}
    />
  );
}

export function Logo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <Image
        src="/logo.png"
        alt="MindNest"
        width={36}
        height={36}
        style={{ objectFit: "contain", borderRadius: "22%" }}
      />
      <span
        style={{
          fontSize: 20,
          fontWeight: 800,
          color: "#f1f5f9",
          letterSpacing: "-0.03em",
          lineHeight: 1,
        }}
      >
        MindNest
      </span>
    </div>
  );
}
