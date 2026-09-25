import { Barlow_Condensed, DM_Sans, IBM_Plex_Mono, Space_Grotesk } from "next/font/google";

import "./explore.css";

const dm = DM_Sans({ subsets: ["latin"], variable: "--font-dm" });
const space = Space_Grotesk({ subsets: ["latin"], variable: "--font-space" });
const barlow = Barlow_Condensed({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-barlow" });
const plex = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-plex" });

export default function ExploreLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${dm.variable} ${space.variable} ${barlow.variable} ${plex.variable}`}>{children}</div>;
}
