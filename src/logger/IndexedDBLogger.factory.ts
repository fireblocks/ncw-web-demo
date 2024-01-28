import { IIndexedDBLoggerOptions, IndexedDBLogger } from "./IndexedDBLogger";

export function IndexedDBLoggerFactory(options: IIndexedDBLoggerOptions): Promise<IndexedDBLogger> {
  if (!IndexedDBLogger.isIndexedDBAvailable()) {
    throw new Error("IndexedDB is not available");
  }

  return IndexedDBLogger.initialize(options);
}
