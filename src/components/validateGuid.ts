const uuidRegex = new RegExp("^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$", "i");

export function validateGuid(guid: string | null): boolean {
  return guid ? uuidRegex.test(guid) : false;
}
