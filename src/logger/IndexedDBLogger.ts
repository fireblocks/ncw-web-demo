import { ILogger, NullLoggerFactory, TLogLevel } from "@fireblocks/ncw-js-sdk";

const DB_NAME = "fireblocks-ncw-sdk-logs";
const TABLE_NAME = "logs";
const DEVICE_ID_INDEX = "deviceIdIndex";

export interface LogEntry {
  timestamp: string;
  deviceId: string;
  level: TLogLevel;
  message: string;
  data?: any;
}
export interface IIndexedDBLoggerOptions {
  deviceId: string;
  logger?: ILogger;
  dbName?: string;
  tableName?: string;
}

export class IndexedDBLogger implements ILogger {
  private _dbInstance: IDBDatabase | null = null;
  private _dbName: string;
  private _tableName: string;
  private _deviceId: string;
  private _logger: ILogger;

  private constructor(options: IIndexedDBLoggerOptions) {
    this._deviceId = options.deviceId;
    this._logger = options.logger ?? NullLoggerFactory();
    this._dbName = options.dbName ?? DB_NAME;
    this._tableName = options.tableName ?? TABLE_NAME;
  }

  public static async initialize(options: IIndexedDBLoggerOptions): Promise<IndexedDBLogger> {
    const logger = new IndexedDBLogger(options);
    await logger._initializeDB();
    return logger;
  }

  public static isIndexedDBAvailable(): boolean {
    try {
      return Boolean(globalThis.indexedDB) === true;
    } catch (e) {
      return false;
    }
  }

  public log(level: TLogLevel, message: string, data?: any): void {
    this._logger.log(level, message, data);

    this._saveLog({
      level,
      message,
      data,
      deviceId: this._deviceId,
      timestamp: new Date().toISOString(),
    });
  }

  public collect(limit: number | null): Promise<LogEntry[]> {
    return new Promise((resolve, reject) => {
      if (!this._dbInstance) {
        reject("IndexedDB is not initialized");
        return;
      }

      const transaction = this._dbInstance.transaction(this._tableName, "readonly");
      const store = transaction.objectStore(this._tableName);

      const index = store.index(DEVICE_ID_INDEX);
      const range = IDBKeyRange.only(this._deviceId);
      const cursorRequest = index.openCursor(range, "prev");

      const result: LogEntry[] = [];

      cursorRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (!cursor || result.length === limit) {
          resolve(result);
        } else {
          result.push(cursor.value);
          cursor.continue();
        }
      };

      cursorRequest.onerror = () => {
        reject("Error retrieving logs from IndexedDB");
      };
    });
  }

  public clear(limit: number | null): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!this._dbInstance) {
        reject("IndexedDB is not initialized");
        return;
      }

      const transaction = this._dbInstance.transaction(this._tableName, "readwrite");
      const store = transaction.objectStore(this._tableName);

      const index = store.index(DEVICE_ID_INDEX);
      const range = IDBKeyRange.only(this._deviceId);
      const cursorRequest = index.openCursor(range);

      let deleted = 0;
      cursorRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (!cursor || deleted === limit) {
          resolve(deleted);
        } else {
          store.delete(cursor.primaryKey);
          deleted++;
          cursor.continue();
        }
      };

      cursorRequest.onerror = () => {
        reject("Error retrieving logs from IndexedDB");
      };
    });
  }

  public count(): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!this._dbInstance) {
        reject("IndexedDB is not initialized");
        return;
      }

      const transaction = this._dbInstance.transaction(this._tableName, "readonly");
      const store = transaction.objectStore(this._tableName);

      const index = store.index(DEVICE_ID_INDEX);
      const range = IDBKeyRange.only(this._deviceId);
      const countRequest = index.count(range);

      countRequest.onsuccess = (event) => {
        const result = (event.target as IDBRequest).result;
        resolve(result);
      };

      countRequest.onerror = () => {
        reject("Error retrieving logs from IndexedDB");
      };
    });
  }

  private _saveLog(logEntry: LogEntry): void {
    if (!this._dbInstance) {
      this._logger.log("ERROR", "IndexedDB is not initialized");
      return;
    }
    const transaction = this._dbInstance.transaction(this._tableName, "readwrite");
    const store = transaction.objectStore(this._tableName);

    const addRequest = store.add(logEntry);

    addRequest.onsuccess = () => {
      this._logger.log("VERBOSE", "Message saved to IndexedDB");
    };

    addRequest.onerror = () => {
      this._logger.log("ERROR", "Error saving message to IndexedDB");
    };
  }

  private _initializeDB(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(this._dbName, 1);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const objectStore = db.createObjectStore(this._tableName, { keyPath: "id", autoIncrement: true });

        objectStore.createIndex(DEVICE_ID_INDEX, "deviceId");
      };

      request.onsuccess = (event) => {
        this._dbInstance = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onerror = () => {
        reject("Error opening IndexedDB");
      };
    });
  }
}
