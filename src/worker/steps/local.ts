import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { z } from "zod";
import { errorMessage } from "../../lib/errors";

// A step done outside the run, in a session: the run writes a brief and stops; on resume it reads the answer.
export class WaitingError extends Error {}

export async function readAnswer<T>(path: string, schema: z.ZodType<T>, brief: string): Promise<T> {
  if (!existsSync(path)) throw new WaitingError(`Write ${path} from ${brief}, then resume the run.`);

  const parsed = schema.safeParse(parseJson(path, await readFile(path, "utf8")));
  if (!parsed.success) throw new WaitingError(`${path} is not valid:\n${z.prettifyError(parsed.error)}`);

  return parsed.data;
}

function parseJson(path: string, text: string): unknown {
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new WaitingError(`${path} is not JSON: ${errorMessage(error)}`);
  }
}
