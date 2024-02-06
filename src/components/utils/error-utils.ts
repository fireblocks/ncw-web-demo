import { FireblocksError } from "@fireblocks/ncw-js-sdk";

export function getErrorMessage(error: FireblocksError): string {
  return `Error: ${error.message} ${JSON.stringify({ key: error.key, code: error.code })}`;
}
