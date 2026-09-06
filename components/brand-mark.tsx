import Image from "next/image";

export function BrandMark({ className = "size-10" }: { className?: string }) {
  return <span className={`relative block shrink-0 overflow-hidden rounded-lg border border-primary/40 bg-primary/10 ${className}`}><Image src="/weaselnet-mark.svg" alt="WeaselNet" fill sizes="48px" className="object-contain p-1" priority /></span>;
}
