import { seedTasks } from "./seed";
import { clone, delay } from "./utils";

export async function listTasks() {
  await delay();
  return clone(seedTasks);
}
