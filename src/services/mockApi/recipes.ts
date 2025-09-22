import { seedRecipes } from "./seed";
import { clone, delay } from "./utils";

export async function listRecipes() {
  await delay();
  return clone(seedRecipes);
}
