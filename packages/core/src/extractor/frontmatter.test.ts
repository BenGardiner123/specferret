import { describe, it, expect } from 'bun:test';
import { extractFromSpecFile } from './frontmatter.js';

const VALID_SPEC = `---
ferret:
  id: api.GET/users
  type: api
  shape:
    response:
      type: array
      items:
        type: object
        properties:
          id:
            type: string
            format: uuid
          name:
            type: string
        required: [id, name]
---

# Users Endpoint

Returns all users.
`;

const SPEC_WITH_IMPORTS = `---
ferret:
  id: api.GET/search
  type: api
  shape:
    response:
      type: array
      items:
        type: string
  imports:
    - auth.jwt
    - tables.document
---
`;

const SPEC_WITH_UNSUPPORTED_KEYWORD = `---
ferret:
  id: tables.user
  type: table
  shape:
    type: object
    allOf:
      - type: string
    properties:
      id:
        type: string
---
`;

const SPEC_NO_FRONTMATTER = `# Just a markdown file

No frontmatter here. Ferret should skip this.
`;

const SPEC_MISSING_FIELDS = `---
ferret:
  id: api.GET/broken
  type: api
---
`;

describe('extractFromSpecFile — Task 3', () => {
  it('extracts valid frontmatter correctly', () => {
    const result = extractFromSpecFile('specs/users.md', VALID_SPEC);
    expect(result.filePath).toBe('specs/users.md');
    expect(result.fileType).toBe('spec');
    expect(result.extractedBy).toBe('gray-matter');
    expect(result.warning).toBeUndefined();
    expect(result.contracts).toHaveLength(1);
    expect(result.contracts[0].id).toBe('api.GET/users');
    expect(result.contracts[0].type).toBe('api');
    expect(result.contracts[0].shape_hash).toBeDefined();
    expect(result.contracts[0].shape_hash).toHaveLength(64); // SHA-256 hex
    expect(result.contracts[0].imports).toEqual([]);
  });

  it('extracts imports correctly', () => {
    const result = extractFromSpecFile('specs/search.md', SPEC_WITH_IMPORTS);
    expect(result.contracts[0].imports).toEqual(['auth.jwt', 'tables.document']);
  });

  it('missing frontmatter returns warning, empty contracts, does not throw', () => {
    const result = extractFromSpecFile('specs/plain.md', SPEC_NO_FRONTMATTER);
    expect(result.warning).toBe('no-frontmatter');
    expect(result.contracts).toHaveLength(0);
    expect(result.filePath).toBe('specs/plain.md');
    expect(result.fileType).toBe('spec');
  });

  it('missing required field "shape" throws with field name in message', () => {
    expect(() => extractFromSpecFile('specs/broken.md', SPEC_MISSING_FIELDS))
      .toThrow('shape');
  });

  it('missing multiple required fields throws with all field names in message', () => {
    const specMissingAll = `---\nferret:\n  someField: value\n---\n`;
    expect(() => extractFromSpecFile('specs/broken.md', specMissingAll))
      .toThrow(/id.*type.*shape|Missing required/);
  });

  it('unsupported schema keyword produces warning, does not fail', () => {
    const stderrOutput: string[] = [];
    const originalWrite = process.stderr.write.bind(process.stderr);
    // Capture stderr writes
    process.stderr.write = (chunk: any) => {
      stderrOutput.push(String(chunk));
      return true;
    };

    let result: ReturnType<typeof extractFromSpecFile> | undefined;
    try {
      result = extractFromSpecFile('specs/complex.md', SPEC_WITH_UNSUPPORTED_KEYWORD);
    } finally {
      process.stderr.write = originalWrite;
    }

    expect(result).toBeDefined();
    expect(result!.contracts).toHaveLength(1);
    expect(result!.warning).toBeUndefined();
    expect(stderrOutput.some(line => line.includes('allOf'))).toBe(true);
  });

  it('extraction is synchronous — the function itself has no async/await', () => {
    // If extractFromSpecFile returns a Promise, this would be a thenable object
    const result = extractFromSpecFile('specs/users.md', VALID_SPEC);
    expect(result).not.toBeInstanceOf(Promise);
    expect(typeof (result as any).then).not.toBe('function');
  });

  it('identical files produce identical shape_hash', () => {
    const r1 = extractFromSpecFile('specs/a.md', VALID_SPEC);
    const r2 = extractFromSpecFile('specs/b.md', VALID_SPEC);
    expect(r1.contracts[0].shape_hash).toBe(r2.contracts[0].shape_hash);
  });

  it('different shapes produce different shape_hash', () => {
    const specA = VALID_SPEC;
    const specB = specA.replace('format: uuid', 'format: email');
    const r1 = extractFromSpecFile('specs/a.md', specA);
    const r2 = extractFromSpecFile('specs/b.md', specB);
    expect(r1.contracts[0].shape_hash).not.toBe(r2.contracts[0].shape_hash);
  });

  it('property order change in shape does NOT change shape_hash', () => {
    const specA = `---
ferret:
  id: api.GET/test
  type: api
  shape:
    type: object
    properties:
      id:
        type: string
      name:
        type: string
    required: [id, name]
---
`;
    const specB = `---
ferret:
  id: api.GET/test
  type: api
  shape:
    type: object
    properties:
      name:
        type: string
      id:
        type: string
    required: [id, name]
---
`;
    const r1 = extractFromSpecFile('specs/a.md', specA);
    const r2 = extractFromSpecFile('specs/b.md', specB);
    // Keys are sorted before hashing — order change is a no-change
    expect(r1.contracts[0].shape_hash).toBe(r2.contracts[0].shape_hash);
  });
});
