import Image from "next/image";
/** The app owns its identity; shared UI components remain brand-agnostic. */
export function AtlasLogo() {
  return (
    <span className="atlas-logo">
      <Image
        src="/brand/atlas-mark.png"
        alt=""
        width={30}
        height={30}
        priority
        className="atlas-logo-mark"
      />
      <span>Atlas</span>
    </span>
  );
}
