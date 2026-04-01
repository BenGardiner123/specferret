import { describe, it, expect } from 'bun:test';
import { validateFerretSchema, compareSchemas } from './validator.js';

// ─── validateFerretSchema ────────────────────────────────────────────────────

describe('validateFerretSchema', () => {
  it('warns on every unsupported keyword when present', () => {
    const UNSUPPORTED = [
      '$ref', 'allOf', 'anyOf', 'oneOf', 'not',
      'if', 'then', 'else', '$defs', 'definitions',
      'patternProperties', 'dependencies',
    ];

    for (const keyword of UNSUPPORTED) {
      const shape = { type: 'object', [keyword]: {} };
      const result = validateFerretSchema(shape, 'specs/test.md');
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain(keyword);
      expect(result.warnings[0]).toContain('specs/test.md');
      expect(result.valid).toBe(true); // always valid — warnings do not fail the schema
    }
  });

  it('does not warn on valid supported keywords', () => {
    const shape = {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string' },
        score: { type: 'number' },
        active: { type: 'boolean' },
        tags: { type: 'array', items: { type: 'string' } },
        status: { type: 'string', enum: ['pending', 'active', 'cancelled'] },
      },
      required: ['id', 'name'],
      additionalProperties: false,
    };
    const result = validateFerretSchema(shape, 'specs/valid.md');
    expect(result.warnings).toHaveLength(0);
    expect(result.valid).toBe(true);
  });

  it('warns on multiple unsupported keywords in a single schema', () => {
    const shape = {
      type: 'object',
      allOf: [{}],
      anyOf: [{}],
      '$ref': '#/definitions/Foo',
    };
    const result = validateFerretSchema(shape, 'specs/complex.md');
    expect(result.warnings.length).toBeGreaterThanOrEqual(3);
    expect(result.valid).toBe(true);
  });

  it('does not warn on null or primitive shape', () => {
    expect(validateFerretSchema(null, 'f.md').warnings).toHaveLength(0);
    expect(validateFerretSchema('string shape', 'f.md').warnings).toHaveLength(0);
    expect(validateFerretSchema(42, 'f.md').warnings).toHaveLength(0);
  });
});

// ─── compareSchemas ──────────────────────────────────────────────────────────

describe('compareSchemas — breaking changes', () => {
  it('required field removed → breaking', () => {
    const prev = {
      type: 'object',
      properties: { id: { type: 'string' }, email: { type: 'string' } },
      required: ['id', 'email'],
    };
    const curr = {
      type: 'object',
      properties: { id: { type: 'string' }, email: { type: 'string' } },
      required: ['id'],
    };
    const result = compareSchemas(prev, curr);
    expect(result.classification).toBe('breaking');
    expect(result.reason).toContain('email');
  });

  it('field type changed → breaking', () => {
    const prev = { type: 'object', properties: { count: { type: 'string' } } };
    const curr = { type: 'object', properties: { count: { type: 'integer' } } };
    const result = compareSchemas(prev, curr);
    expect(result.classification).toBe('breaking');
  });

  it('required field added → breaking', () => {
    const prev = {
      type: 'object',
      properties: { id: { type: 'string' }, name: { type: 'string' } },
      required: ['id'],
    };
    const curr = {
      type: 'object',
      properties: { id: { type: 'string' }, name: { type: 'string' } },
      required: ['id', 'name'],
    };
    const result = compareSchemas(prev, curr);
    expect(result.classification).toBe('breaking');
    expect(result.reason).toContain('name');
  });

  it('enum value removed → breaking', () => {
    const prev = { type: 'string', enum: ['pending', 'active', 'cancelled'] };
    const curr = { type: 'string', enum: ['pending', 'active'] };
    const result = compareSchemas(prev, curr);
    expect(result.classification).toBe('breaking');
    expect(result.reason).toContain('cancelled');
  });

  it('response type changed → breaking', () => {
    const prev = { response: { type: 'array', items: { type: 'string' } } };
    const curr = { response: { type: 'object', properties: {} } };
    const result = compareSchemas(prev, curr);
    expect(result.classification).toBe('breaking');
  });

  it('property removed → breaking', () => {
    const prev = {
      type: 'object',
      properties: { id: { type: 'string' }, secret: { type: 'string' } },
      required: ['id'],
    };
    const curr = {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
    };
    const result = compareSchemas(prev, curr);
    expect(result.classification).toBe('breaking');
    expect(result.reason).toContain('secret');
  });
});

describe('compareSchemas — non-breaking changes', () => {
  it('optional field added → non-breaking', () => {
    const prev = {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
    };
    const curr = {
      type: 'object',
      properties: { id: { type: 'string' }, description: { type: 'string' } },
      required: ['id'],
    };
    const result = compareSchemas(prev, curr);
    expect(result.classification).toBe('non-breaking');
    expect(result.reason).toContain('description');
  });

  it('enum value added → non-breaking', () => {
    const prev = { type: 'string', enum: ['pending', 'active'] };
    const curr = { type: 'string', enum: ['pending', 'active', 'cancelled'] };
    const result = compareSchemas(prev, curr);
    expect(result.classification).toBe('non-breaking');
    expect(result.reason).toContain('cancelled');
  });
});

describe('compareSchemas — no-change', () => {
  it('property order changed → no-change', () => {
    const prev = {
      type: 'object',
      properties: { id: { type: 'string' }, name: { type: 'string' } },
      required: ['id', 'name'],
    };
    const curr = {
      type: 'object',
      properties: { name: { type: 'string' }, id: { type: 'string' } }, // order swapped
      required: ['id', 'name'],
    };
    const result = compareSchemas(prev, curr);
    expect(result.classification).toBe('no-change');
  });

  it('required array reordered → no-change', () => {
    const prev = {
      type: 'object',
      properties: { id: { type: 'string' }, email: { type: 'string' } },
      required: ['id', 'email'],
    };
    const curr = {
      type: 'object',
      properties: { id: { type: 'string' }, email: { type: 'string' } },
      required: ['email', 'id'], // same fields, different order
    };
    const result = compareSchemas(prev, curr);
    expect(result.classification).toBe('no-change');
  });

  it('identical schemas → no-change', () => {
    const schema = {
      type: 'object',
      properties: { id: { type: 'string', format: 'uuid' } },
      required: ['id'],
    };
    const result = compareSchemas(schema, { ...schema });
    expect(result.classification).toBe('no-change');
  });

  it('empty schemas compared → no-change', () => {
    const result = compareSchemas({}, {});
    expect(result.classification).toBe('no-change');
  });
});
