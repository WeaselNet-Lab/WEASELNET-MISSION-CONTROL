import { provisionOwner } from "@/lib/auth/account";
import { ensureReady } from "@/lib/db/ready";

const username = process.env.WEASELNET_OWNER_USERNAME ?? "";
const password = process.env.WEASELNET_OWNER_PASSWORD ?? "";
const rotate = process.env.WEASELNET_OWNER_ROTATE === "yes";

if (!username || !password) {
  console.error("Set WEASELNET_OWNER_USERNAME and WEASELNET_OWNER_PASSWORD. There is no default password.");
  process.exit(1);
}

ensureReady();
try {
  provisionOwner(username, password, rotate);
  console.log(rotate ? "Owner password rotated and sessions cleared." : "Owner account created.");
} catch (error) {
  console.error(error instanceof Error ? error.message : "Provision failed.");
  process.exit(1);
}
