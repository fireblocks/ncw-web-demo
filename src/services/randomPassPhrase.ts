// @ts-ignore
import { binary_to_base58 } from "base58-js";

export function randomPassPhrase(): string {
  const length = 16;
  const passPhrase = crypto.getRandomValues(new Uint8Array(length));
  return binary_to_base58(passPhrase);
}
