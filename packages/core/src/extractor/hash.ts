import { createHash } from 'node:crypto';

/**
 * Produces a stable SHA-256 hex fingerprint of a schema object.
 * Used for quick change detection — if the hash changes, the schema changed.
 * JSON.stringify is order-sensitive on keys, so we sort keys for stability.
 */
export function hashSchema(schema: unknown): string {
  const sortObject = (obj: any): any => {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    if (Array.isArray(obj)) {
      return obj.map(sortObject);
    }
    return Object.keys(obj)
      .sort()
      .reduce((acc, key) => {
        acc[key] = sortObject(obj[key]);
        return acc;
      }, {} as any);
  };

  const stable = JSON.stringify(sortObject(schema));
  return createHash('sha256').update(stable).digest('hex');
}
