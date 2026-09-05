import Image from "next/image";
/** The app owns its identity; shared UI components remain brand-agnostic. */
export function AtlasLogo() {
  return (
    <span className="inline-flex items-center gap-3">
      <Image
        src="/brand/atlas-mark.png"
        alt=""
        width={36}
        height={36}
        priority
        className="rounded-lg"
      />
      <span className="text-lg font-semibold tracking-[0.12em]">Atlas</span>
    </span>
  );
}
