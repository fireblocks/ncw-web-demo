import type { CloudKit } from "tsl-apple-cloudkit";

export const cloudkitBackup = async (cloudkit: CloudKit, passphrase: string, passphraseId: string) => {
  const db = cloudkit.getDefaultContainer().privateCloudDatabase;
  const recordName = `backup_t_${passphraseId}`;
  const recordType = "Backup";

  // create
  const result = await db.saveRecords([
    {
      recordName,
      recordType,
      fields: {
        phrase: {
          type: "STRING",
          value: passphrase,
        },
      },
    },
  ]);

  if (result.hasErrors) {
    console.error("Failed to save records", result.errors);
    throw new Error("Failed to backup");
  }
};

export const cloudkitRecover = async (cloudkit: CloudKit, passphraseId: string) => {
  const db = cloudkit.getDefaultContainer().privateCloudDatabase;
  const recordName = `backup_t_${passphraseId}`;
  const recordType = "Backup";

  const results = await db.fetchRecords([
    {
      recordName,
      recordType,
    },
  ]);

  if (results.hasErrors) {
    console.error("Failed to fetch records", results.errors);
    throw new Error("Failed to recover");
  }

  if (results.records.length === 1) {
    if (Array.isArray(results.records[0].fields)) {
      throw new Error("Unexpected schema");
    }
    if (results.records[0].fields["phrase"].type !== "STRING") {
      throw new Error("Unexpected schema");
    }
    return results.records[0].fields["phrase"].value as string;
  }

  throw new Error("not found");
};
