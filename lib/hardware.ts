import type { HardwareAsset } from "@/lib/types";

export const hardwareAssets: HardwareAsset[] = [
  {
    id: "alfred-host",
    name: "Alfred",
    kind: "workstation",
    role: "Local AI / command brain",
    notes:
      "Dedicated Linux box. Operator weseals-01@alfred. Allowed to be loud: Ollama, Whisper, project memory. Not a flight machine.",
  },
  {
    id: "sim-host",
    name: "SIM / VR path PC",
    kind: "workstation",
    role: "DCS + PCVR, keep it clean",
    notes:
      "Isolation is the feature. No local-LLM sidecars. Validated path starts at 2.5 GbE on this host.",
  },
  {
    id: "xeon-10980xe",
    name: "Xeon 10980XE workstations",
    kind: "workstation",
    role: "Heavy chassis pool",
    count: 3,
    notes:
      "Three of these were on the June 2026 planning board. Assign by job, not by whichever one boots first.",
  },
  {
    id: "xeon-9700e",
    name: "Xeon 9700E systems",
    kind: "workstation",
    role: "Secondary compute",
    count: 2,
    notes: "Two systems in the last inventory. Good candidates for CNC, compile, or overflow — pick one job each.",
  },
  {
    id: "rtx-4000-ada",
    name: "RTX 4000 Ada",
    kind: "gpu",
    role: "Preferred AI / workstation GPU",
    count: 2,
    notes: "Ada generation, professional board. First pick for Alfred-class workloads if they are not already spoken for.",
  },
  {
    id: "rtx-a4500",
    name: "RTX A4500",
    kind: "gpu",
    role: "High-memory pro GPU",
    count: 1,
    notes: "Singleton. Treat it as assigned, not spare, until the room walk says otherwise.",
  },
  {
    id: "rtx-a4000",
    name: "RTX A4000",
    kind: "gpu",
    role: "Workhorse pro GPU",
    count: 2,
    notes: "Solid for mixed compute. Do not silently raid these for a 'quick test' on the sim box.",
  },
  {
    id: "rtx-a2000",
    name: "RTX A2000",
    kind: "gpu",
    role: "Compact / auxiliary",
    count: 3,
    notes: "Three boards. Useful for encode, light inference, or a machine that should not get the good toys.",
  },
  {
    id: "rtx-2080",
    name: "RTX 2080",
    kind: "gpu",
    role: "Legacy / overflow",
    count: 2,
    notes: "Still silicon. Not the future of the lab. Fine for a parked host or a benchmark control.",
  },
  {
    id: "quest-3",
    name: "Meta Quest 3",
    kind: "hmd",
    role: "Primary headset",
    notes:
      "Child-facing VR and DCS wireless PCVR. Comfort first. Teleport unless someone explicitly asks to locomote the hard way.",
  },
  {
    id: "link-path",
    name: "Validated Quest path",
    kind: "network",
    role: "PCVR wireless",
    notes:
      "PC 2.5 GbE → Archer BE3600 → dedicated fixed-channel 5 GHz → Quest 3. SteamVR confirmed. DCS 40 FPS projection validated. Do not 'optimize' this on game night.",
  },
  {
    id: "isolation",
    name: "Isolation policy",
    kind: "policy",
    role: "Architecture rule",
    notes:
      "AI workloads live on Alfred. Flight and VR live on the clean rig. If a job wants both, it is two jobs.",
  },
];

export const hardwareKinds: { id: HardwareAsset["kind"]; label: string }[] = [
  { id: "workstation", label: "Workstations" },
  { id: "gpu", label: "GPUs" },
  { id: "hmd", label: "Headsets" },
  { id: "network", label: "Network" },
  { id: "policy", label: "Standing orders" },
];
