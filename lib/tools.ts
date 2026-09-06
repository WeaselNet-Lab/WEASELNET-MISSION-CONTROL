export const toolRegistry = [
  { name: "Mission Control local state", callsign: "CORE", status: "online", purpose: "Captures, field logs, evidence, checkpoints, pins, and hardware overrides in this browser.", next: "Use EXFIL CACHE before changing browsers." },
  { name: "Git + GitHub", callsign: "GIT", status: "ready", purpose: "Repository state, recent movement, README evidence, releases, and commit-backed recovery.", next: "Add repository URLs to each Evidence Locker." },
  { name: "Alfred API", callsign: "ALFRED", status: "planned", purpose: "Durable memory, capture classification, semantic search, and project summaries.", next: "Expose one authenticated Tailscale-only intake endpoint." },
  { name: "Whisper", callsign: "EAR", status: "planned", purpose: "Turn voice memos, meetings, and screen recordings into Drop items.", next: "Watch one inbound recording folder and emit transcript + metadata." },
  { name: "Tailscale", callsign: "TAIL", status: "planned", purpose: "Reachability and last-seen signal for Alfred, Moonlight nodes, and family laptops.", next: "Read device status without changing network policy." },
  { name: "System telemetry", callsign: "BATS", status: "planned", purpose: "GPU memory, thermals, storage, drivers, and service health from nvidia-smi and host diagnostics.", next: "Define one host-status JSON contract." },
  { name: "OBS / capture watcher", callsign: "REC", status: "planned", purpose: "Detect completed recordings and send them into the Alfred intake path.", next: "Standardize the Windows Completed Recordings folder." },
  { name: "Syncthing or secure uploader", callsign: "FERRY", status: "planned", purpose: "Move completed recordings from the girls’ laptops to Alfred reliably.", next: "Choose folder sync or a minimal authenticated upload endpoint." },
] as const;
