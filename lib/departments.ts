import type { Department, DepartmentId } from "@/lib/types";

export const departments: Department[] = [
  {
    slug: "command",
    name: "Command",
    callsign: "CMD",
    summary:
      "The Batcomputer wing. Local AI, remote access, boot diagnostics, and the memory of what you were just doing.",
    mandate:
      "Keep Alfred, Mission Control, and Preflight talking to each other so the rest of the labs have a place to report home.",
  },
  {
    slug: "vr-lab",
    name: "VR Lab",
    callsign: "VRL",
    summary:
      "Comfortable, stylized, controllers-first worlds. Built once as CoSpace, reused every time a daughter has a new idea.",
    mandate:
      "Ship playable slices, prefer teleport locomotion, and never rebuild the multiplayer plumbing from scratch again.",
  },
  {
    slug: "flight-systems",
    name: "Flight Systems",
    callsign: "FLIGHT",
    summary:
      "DCS, Quest 3, and the clean sim rig that does not get contaminated by local-LLM experiments.",
    mandate:
      "Protect the flight path. Measure the network. Leave the VR box alone unless the frame time asks for help.",
  },
  {
    slug: "robotics",
    name: "Robotics",
    callsign: "MECH",
    summary:
      "Walking chassis, removable dragon shells, drones that actually look where they are going.",
    mandate:
      "Teensy owns real-time motion. Linux sends named behaviors. Measure current before you pick a battery.",
  },
  {
    slug: "benchmark-lab",
    name: "Benchmark Lab",
    callsign: "BATS",
    summary:
      "The department that turns 'it felt better after I tweaked it' into a repeatable number.",
    mandate:
      "Reproducible evidence first. One-off heroics later, if at all.",
  },
  {
    slug: "hardware",
    name: "Hardware Bay",
    callsign: "BAY",
    summary:
      "Workstations, GPUs, Quest, and the isolation policy that keeps SIM clean and Alfred loud.",
    mandate:
      "Know what is installed, what it is for, and which machine is allowed to get messy.",
  },
  {
    slug: "living-art",
    name: "Living Art",
    callsign: "STUDIO",
    summary:
      "Animatronic installations, workshops, and the studio idea that treats art and engineering as the same craft.",
    mandate:
      "Keep the studio concept alive without letting it swallow the labs that already have daughters waiting.",
  },
  {
    slug: "experimental",
    name: "Experimental",
    callsign: "X",
    summary:
      "Side quests that earned a folder so they stop pretending they are the main campaign.",
    mandate:
      "Park cleanly, document the lesson, and promote anything that starts repeating.",
  },
];

const bySlug = new Map(departments.map((department) => [department.slug, department]));

export function getDepartment(slug: string): Department | undefined {
  return bySlug.get(slug as DepartmentId);
}

export function departmentName(slug: DepartmentId): string {
  return bySlug.get(slug)?.name ?? slug;
}
