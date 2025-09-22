import { seedProfile } from "./seed";
import { clone, delay } from "./utils";

export async function getProfile() {
  await delay();
  return clone(seedProfile);
}
