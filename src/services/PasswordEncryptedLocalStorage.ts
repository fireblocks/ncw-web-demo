import { md } from "node-forge";
import {
  ISecureStorageProvider,
  BrowserLocalStorageProvider,
  decryptAesGCM,
  encryptAesGCM,
} from "@fireblocks/ncw-js-sdk";

export type GetUserPasswordFunc = () => Promise<string>;

/// This secure storage implementations creates an encryption key on-demand based on a user password

export class PasswordEncryptedLocalStorage extends BrowserLocalStorageProvider implements ISecureStorageProvider {
  private encKey: string | null = null;
  constructor(
    private deviceId: string,
    private getPassword: GetUserPasswordFunc,
  ) {
    super(`secure-${deviceId}`);
  }

  public async unlock(): Promise<void> {
    this.encKey = await this._generateEncryptionKey();
  }

  public async lock(): Promise<void> {
    this.encKey = null;
  }

  public async get(): Promise<string | null> {
    if (!this.encKey) {
      throw new Error("Storage locked");
    }

    const encryptedData = await super.get();
    if (!encryptedData) {
      return null;
    }

    return decryptAesGCM(encryptedData, this.encKey, this.deviceId);
  }

  public async set(data: string): Promise<void> {
    if (!this.encKey) {
      throw new Error("Storage locked");
    }

    const encryptedData = await encryptAesGCM(data, this.encKey, this.deviceId);
    await super.set(encryptedData);
  }

  private async _generateEncryptionKey(): Promise<string> {
    let key = await this.getPassword();
    const md5 = md.md5.create();

    for (let i = 0; i < 1000; ++i) {
      md5.update(key);
      key = md5.digest().toHex();
    }

    return key;
  }
}
