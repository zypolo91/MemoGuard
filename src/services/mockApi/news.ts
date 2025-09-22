import { seedNews } from "./seed";
import { clone, delay } from "./utils";

export async function listNews() {
  await delay();
  return clone(seedNews);
}
