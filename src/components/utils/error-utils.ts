import { FireblocksError } from "@fireblocks/ncw-js-sdk";

export function handleError(error: unknown, setErr: React.Dispatch<React.SetStateAction<string | null>>): void {
  if (error instanceof FireblocksError) {
    setErr(getErrorMessage(error));
  } else if (error instanceof Error) {
    setErr(error.message);
  } else {
    setErr("Unknown Error");
  }
}

function getErrorMessage(error: FireblocksError): string {
  return JSON.stringify({ message: error.message, key: error.key, code: error.code });
}
