// Builds the static web bundle for the Android wrapper and copies it into android/.
//   node scripts/build-android.mjs
// Server routes cannot be part of a static export, so src/app/api is set aside for the build
// and always put back. In the Android build the app calls the provider directly instead.
import { execSync } from "node:child_process";
import { existsSync, renameSync, rmSync } from "node:fs";

const api = "src/app/api";
const stash = ".api-stash";
if (existsSync(stash)) throw new Error(`${stash} exists: a previous build was interrupted. Move it back to ${api} first.`);
renameSync(api, stash);
try {
  rmSync(".next", { recursive: true, force: true });
  rmSync("out", { recursive: true, force: true });
  execSync("npx next build", { stdio: "inherit", env: { ...process.env, NEXT_PUBLIC_TARGET: "android" } });
} finally {
  renameSync(stash, api);
  rmSync(".next", { recursive: true, force: true }); // its generated types point at the android route set
}
execSync("npx cap sync android", { stdio: "inherit" });
