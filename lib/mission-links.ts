export const missionLinks: Record<string, { blockedBy?: string[]; waitingFor?: string[]; unlocks?: string[] }> = {
  alfred: { waitingFor: ["Moonlight node commissioning", "Girls’ capture workflow"], unlocks: ["Searchable Mission Control memory", "Dragon Mind support", "Automatic transcription intake"] },
  "mission-control": { blockedBy: ["Reliable capture and backup path"], unlocks: ["One operational view across every lab"] },
  preflight: { waitingFor: ["One host’s checks written as data"], unlocks: ["Repeatable Alfred and SIM readiness checks"] },
  "anky-island": { blockedBy: ["Reusable CoSpace interaction prefabs"], unlocks: ["A proven child-facing VR release loop"] },
  cospace: { waitingFor: ["Shared interaction and session prefab baseline"], unlocks: ["Anky Island", "Future daughter VR projects", "Co-located cockpit experiments"] },
  "fury-twins": { blockedBy: ["One-leg current measurement", "Joint inventory"], unlocks: ["Walking Nova chassis", "Night Fury and Light Fury shells"] },
  bats: { waitingFor: ["One representative repeatable benchmark"], unlocks: ["Evidence-based GPU and PCVR decisions"] },
  "hardware-bay": { blockedBy: ["Physical room walk and chassis assignments"], unlocks: ["Accurate AI-node, CNC, and sim planning"] },
};
