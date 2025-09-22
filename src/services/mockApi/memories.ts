import { seedMemories } from "./seed";
import { clone, delay } from "./utils";

export async function listMemories() {
  await delay();
  return clone(seedMemories);
}
