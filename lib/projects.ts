import type { Project } from "@/lib/types";

export const projects: Project[] = [
  {
    slug: "mission-control",
    name: "WeaselNet Mission Control",
    callsign: "WMC",
    department: "command",
    status: "alpha",
    summary:
      "The map for the labs. This console is the public slice; the home hub stays local, constrained, and useful.",
    brief:
      "V1 on the home side was deliberately small: Open WebUI, a Whisper transcription folder, a Markdown project inbox, Tailscale, and iPhone voice-memo upload. Processing started manual on purpose. This board is the other half of that idea — a place where projects stop becoming folklore. The publish bar is README + 5 screenshots + a 60-second demo. If a project cannot clear that, it is not finished. It is a rumor with a folder.",
    nextAction:
      "Keep this board as the living catalog. Add a Mission File note the next time a lab actually moves, not the next time it sounds cool.",
    successCriteria:
      "You can answer 'what is live, what is parked, and what still needs a demo' without opening twelve tabs.",
    stack: ["Next.js", "TypeScript", "localStorage", "Open WebUI", "Whisper", "Tailscale"],
    related: ["alfred", "preflight", "personal-projects"],
    updated: "2026-09-04",
    publish: { readme: true, screenshots: false, demo: false },
  },
  {
    slug: "alfred",
    name: "Alfred",
    callsign: "ALFRED",
    department: "command",
    status: "active",
    summary:
      "Dedicated local-AI workstation. Not JARVIS. The machine that remembers, transcribes, and stays off the sim rig.",
    brief:
      "Linux operator is weseals-01 — the extra s is load-bearing, not a typo. Host prompt: weseals-01@alfred. Baseline captured at /home/weseals-01/alfred-baseline-20260818-120216.txt. SSH had not been installed at that checkpoint. Alfred is the brain for named behaviors, local LLMs through Ollama/Open WebUI, and later Dragon Mind. It does not get to live on the DCS box.",
    nextAction:
      "Install SSH, confirm the baseline is still honest, and keep the first remote login boring.",
    successCriteria:
      "A clean, documented box that can take a named behavior request without anyone SSHing in as the wrong weasel.",
    stack: ["Linux", "Ollama", "Open WebUI", "Whisper", "local LLMs"],
    related: ["mission-control", "preflight", "fury-twins"],
    updated: "2026-08-18",
    publish: { readme: false, screenshots: false, demo: false },
  },
  {
    slug: "preflight",
    name: "WeaselNet Preflight",
    callsign: "PREFLIGHT",
    department: "command",
    status: "concept",
    summary:
      "UEFI shows a W. Windows boots. A full-screen diagnostic layer tells you if the night's hardware is actually ready.",
    brief:
      "Machine-specific checks were sketched for Alfred, VR, SIM, CNC, GPU/drivers, network/Tailscale, Quest/SteamVR, haptics, motion controllers, and E-stop. The point is not a pretty splash screen. The point is catching a dead GPU, a wandering Wi-Fi channel, or a Quest that thinks it is still on the kitchen AP before you waste an evening.",
    nextAction:
      "Write the check list as data first — one machine, one pass/fail, no UI theater until a single host reports honestly.",
    successCriteria:
      "You sit down, the board is green or it tells you why not, and you do not discover the problem in VR.",
    stack: ["Windows", "UEFI", "diagnostics"],
    related: ["mission-control", "alfred", "vr-flight-lab"],
    updated: "2026-08-13",
    publish: { readme: false, screenshots: false, demo: false },
  },
  {
    slug: "anky-island",
    name: "Anky Island",
    callsign: "ANKY",
    department: "vr-lab",
    status: "alpha",
    summary:
      "Become an ankylosaur. Wander a jungle, a treehouse, and a beach resort. Pick things up. Wave. Make her laugh.",
    brief:
      "This one started as a daughter's idea and stayed that way on purpose. Alpha does not need combat or a progression treadmill. It needs comfortable VR, stylized color, multiplayer presence, emotes, and objects you can actually grab. It is also the forcing function for CoSpace — if the framework is real, Anky Island should not require a second networking religion. Older daughter is already waiting in the wings for a game of her own. Do not make her inherit a rewrite.",
    nextAction:
      "Playable pickup + emote slice in the jungle/treehouse space, then a 60-second capture of the laugh test.",
    successCriteria: "Did my daughter laugh?",
    stack: ["Unity", "C#", "Meta XR", "CoSpace", "Quest"],
    related: ["cospace", "meshy-pipeline", "colocated-mech-cockpit"],
    updated: "2026-06-22",
    publish: { readme: false, screenshots: false, demo: false },
  },
  {
    slug: "cospace",
    name: "CoSpace",
    callsign: "COSPACE",
    department: "vr-lab",
    status: "active",
    summary:
      "The reusable VR multiplayer framework so daughter games stop paying the same plumbing tax.",
    brief:
      "Comfortable interaction, teleport locomotion unless someone explicitly asks otherwise, modular prefabs, and code you can still read in six months. Stylized and playful for kid-facing work. Controllers-first got the first cockpit online; physics hands can come later if they earn it. CoSpace is the difference between a WeaselNet VR Lab and a pile of almost-games.",
    nextAction:
      "Lock the shared interaction + session prefabs Anky Island can inherit without copy-paste archaeology.",
    successCriteria:
      "A second child-facing project can start from CoSpace instead of from a blank Unity scene and a sigh.",
    stack: ["Unity 2022.3 LTS", "C#", "Meta XR", "Photon Fusion", "Shared Spatial Anchors"],
    related: ["anky-island", "colocated-mech-cockpit", "meshy-pipeline"],
    updated: "2026-07-12",
    publish: { readme: false, screenshots: false, demo: false },
  },
  {
    slug: "colocated-mech-cockpit",
    name: "ColocatedMechCockpit",
    callsign: "MECHPIT",
    department: "vr-lab",
    status: "parked",
    summary:
      "Co-located multiplayer VR mech cockpit. The prototype that proved the room, the hands, and the wireless PCVR path.",
    brief:
      "Started on Windows while relearning C#. Controllers-first to get it working instead of getting it perfect. Stack on the table: Unity 2022.3 LTS, Quest/Android, Meta XR, Photon Fusion, Shared Spatial Anchors. Hurricane VR and Auto Hand were in the conversation for physics hands. Virtual Desktop wireless PCVR was successfully made fully immersive. The useful leftover is not another mech — it is the interaction and alignment lessons CoSpace is supposed to keep.",
    nextAction:
      "Harvest the cockpit interaction notes into CoSpace, then leave the mech parked until a new story needs it.",
    successCriteria:
      "The next VR project does not have to rediscover spatial anchors or controller-first grab the hard way.",
    stack: ["Unity", "C#", "Meta XR", "Photon Fusion", "Virtual Desktop", "Quest"],
    related: ["cospace", "anky-island", "vr-flight-lab"],
    updated: "2025-12-18",
    publish: { readme: false, screenshots: false, demo: false },
  },
  {
    slug: "meshy-pipeline",
    name: "Unity / Meshy Pipeline",
    callsign: "MESHY",
    department: "vr-lab",
    status: "active",
    summary:
      "AI-assisted 3D into Unity without turning every asset into a one-off art emergency.",
    brief:
      "Meshy stayed in the working loop through at least August 2026 because the alternative is sculpting every treehouse prop by hand while a dinosaur waits. The pipeline is a workflow, not a plugin graveyard: generate, sanitize, import, prefab, reuse. Kid-facing art stays stylized, colorful, playful, and non-scary. If it looks like a horror game, it failed the brief even if the topology is pretty.",
    nextAction:
      "Write the import checklist as a one-pager and attach five example prefabs Anky Island can actually use.",
    successCriteria:
      "A new prop can go from prompt to in-world grab without a custom ritual each time.",
    stack: ["Unity", "Meshy", "C#"],
    related: ["anky-island", "cospace"],
    updated: "2026-08-01",
    publish: { readme: false, screenshots: false, demo: false },
  },
  {
    slug: "vr-flight-lab",
    name: "VR Flight Lab",
    callsign: "DCS",
    department: "flight-systems",
    status: "active",
    summary:
      "The sim rig stays clean. The network path is measured. DCS in Quest is a system, not a vibe.",
    brief:
      "Documented networking investigation settled on PC 2.5 GbE → Archer BE3600 → dedicated fixed-channel 5 GHz → Quest 3. SteamVR compatibility confirmed. DCS 40 FPS projection validated. That is the kind of sentence this lab exists to produce. The machine that flies does not also run Alfred's homework.",
    nextAction:
      "Capture the validated path as a one-page preflight for the sim rig, then stop touching the Wi-Fi 'just to see.'",
    successCriteria:
      "A flight night starts from a known-good path, not from a scavenger hunt through router menus.",
    stack: ["DCS", "SteamVR", "Quest 3", "Virtual Desktop", "2.5 GbE"],
    related: ["preflight", "bats", "hardware-bay"],
    updated: "2026-07-12",
    publish: { readme: false, screenshots: false, demo: false },
  },
  {
    slug: "bats",
    name: "BATS / Benchmark Lab",
    callsign: "BATS",
    department: "benchmark-lab",
    status: "concept",
    summary:
      "Performance and diagnostics that leave a paper trail. If you cannot rerun it, you did not measure it.",
    brief:
      "WeaselNet already has enough GPUs and enough opinions. BATS is how those opinions become evidence — frame time, link quality, thermals, driver deltas — stored in a shape a future-you can trust. It sits next to Flight Systems and Hardware because that is where the midnight tweaking usually happens.",
    nextAction:
      "Pick one representative test (Quest link or GPU frame-time) and run it twice on purpose.",
    successCriteria:
      "A hardware change can be accepted or rejected with a before/after, not a shrug.",
    stack: ["Python", "diagnostics", "logging"],
    related: ["vr-flight-lab", "hardware-bay", "mission-control"],
    updated: "2026-07-12",
    publish: { readme: false, screenshots: false, demo: false },
  },
  {
    slug: "fury-twins",
    name: "WeaselNet Fury Twins",
    callsign: "FURY",
    department: "robotics",
    status: "concept",
    summary:
      "One walking chassis. Removable Night Fury / Light Fury shells. A dragon mind that takes orders by name.",
    brief:
      "Build order is not optional: inventory, validate one 3-DOF leg, then a 12-joint Walking Nova chassis, then shells, then Dragon Mind on Pi with camera, audio, eyes, touch, and Alfred in the loop. Teensy owns real-time motion, joint limits, and safe stop. Linux sends named behaviors, not raw leg angles. Separate servo and logic rails. Measure one-leg current before anyone shops for a battery, regulator, fuse, or a heroic wiring loom.",
    nextAction:
      "Finish the one-leg inventory and current measurement. Do not sketch the second dragon until the first joint budget is real.",
    successCriteria:
      "A single leg moves inside limits, stops safely, and reports current you would bet a fuse on.",
    stack: ["Teensy", "servos", "Raspberry Pi", "Alfred", "C++"],
    related: ["alfred", "autonomous-drone"],
    updated: "2026-06-28",
    publish: { readme: false, screenshots: false, demo: false },
  },
  {
    slug: "autonomous-drone",
    name: "Autonomous Drone Navigation",
    callsign: "DRONE",
    department: "robotics",
    status: "shipped",
    summary:
      "Computer-vision object detection for a self-navigating drone. Built, flown, and allowed to keep its shipped badge.",
    brief:
      "This one already did the hard part: it left the bench. Vision-guided navigation is the proof that WeaselNet robotics is not only a dragon in a notebook. Keep the writeup honest — what it detected, how it failed, what you would not do again — and let it mentor Fury Twins instead of competing with it.",
    nextAction:
      "Publish the missing README / shots / 60-second flight so the shipped badge has evidence, not just memory.",
    successCriteria:
      "A stranger can tell what the drone did, and a future build can steal the perception loop without a séance.",
    stack: ["Python", "OpenCV", "computer vision", "autonomy"],
    related: ["fury-twins", "bats"],
    updated: "2024-05-16",
    publish: { readme: false, screenshots: false, demo: false },
  },
  {
    slug: "living-art",
    name: "Living Art Studio",
    callsign: "STUDIO",
    department: "living-art",
    status: "concept",
    summary:
      "Animatronic art, immersive education, workshops, commissions, and a studio that refuses to split art from engineering.",
    brief:
      "The last-known concept included collaborating with Leigh and a mix of installations, programs, subscriptions, and commissioned living pieces. It is the long-game studio, not this week's forcing function. Keep it on the board so it does not vanish, and keep it from stealing cycles from Anky Island and Alfred.",
    nextAction:
      "Write a one-page studio thesis and one workshop outline. No entity paperwork until a first piece has a home.",
    successCriteria:
      "A visitor can tell what Living Art makes, who it is for, and why it is not just 'robots plus feelings.'",
    stack: ["animatronics", "installations", "education", "design"],
    related: ["fury-twins", "anky-island"],
    updated: "2025-11-03",
    publish: { readme: false, screenshots: false, demo: false },
  },
  {
    slug: "personal-projects",
    name: "Personal Projects Archive",
    callsign: "ARCHIVE",
    department: "experimental",
    status: "parked",
    summary:
      "The earlier repo-and-generator instinct. Useful as a lesson: structure without a board still loses the plot.",
    brief:
      "There was a personal-projects tree with README, projects/, tools/, and docs/, plus a next step around AGENTS.md and tighter folders. That is the right housekeeping instinct. This console is the version that also tracks next actions, publish gates, and the last checkpoint — because folder hygiene alone never stopped a project from going missing after a meeting you forgot to record.",
    nextAction:
      "Treat this board as the catalog. Port any still-true notes from the old tree into Mission Files, then leave the generator parked.",
    successCriteria:
      "No second website-generator. One catalog. Notes that survive a forgotten upload.",
    stack: ["Markdown", "docs", "generators"],
    related: ["mission-control"],
    updated: "2026-06-28",
    publish: { readme: false, screenshots: false, demo: false },
  },
  {
    slug: "hardware-bay",
    name: "Hardware Inventory",
    callsign: "BAY",
    department: "hardware",
    status: "active",
    summary:
      "The pile, named. Xeons, Ada cards, Quest 3, and the rule about which machine is allowed to get interesting.",
    brief:
      "Last planning inventory included 2× RTX 4000 Ada, 2× RTX A4000, 1× RTX A4500, 3× RTX A2000, 2× RTX 2080, three Xeon 10980XE workstations, and two Xeon 9700E systems. Architecture decision still stands: dedicated AI workstation, DCS/VR machine kept isolated. The bay page is the living list. This Mission File is the why.",
    nextAction:
      "Walk the room once and mark which cards actually sit in which chassis. Guessing is not inventory.",
    successCriteria:
      "You can point at a box and say what it is for without opening a chat log from June.",
    stack: ["inventory", "workstations", "GPUs", "Quest 3"],
    related: ["alfred", "vr-flight-lab", "bats", "preflight"],
    updated: "2026-06-17",
    publish: { readme: false, screenshots: false, demo: false },
  },
];

const bySlug = new Map(projects.map((project) => [project.slug, project]));

export function getProject(slug: string): Project | undefined {
  return bySlug.get(slug);
}

export function projectsByDepartment(slug: string): Project[] {
  return projects.filter((project) => project.department === slug);
}

export function relatedProjects(project: Project): Project[] {
  return project.related
    .map((slug) => bySlug.get(slug))
    .filter((item): item is Project => Boolean(item));
}

export function projectSlugs(): string[] {
  return projects.map((project) => project.slug);
}
