import { describe, it, expect, afterEach } from 'bun:test';
import { writeContext, type FerretContext } from './index.js';
import { SqliteStore } from '../store/sqlite.js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { randomUUID } from 'node:crypto';

function makeTmpDir(): string {
  const tmp = path.join(os.tmpdir(), `ferret-ctx-test-${randomUUID()}`);
  fs.mkdirSync(tmp, { recursive: true });
  return tmp;
}

async function makeStoreWithData(tmpDir: string) {
  // Use in-memory store but fake the projectRoot for file writing
  const store = new SqliteStore(':memory:');
  await store.init();

  const nodeId = randomUUID();
  await store.upsertNode({
    id: nodeId,
    file_path: 'specs/auth.md',
    hash: 'abc',
    status: 'stable',
  });

  const contractId = 'auth.jwt';
  await store.upsertContract({
    id: contractId,
    node_id: nodeId,
    shape_hash: 'sha256hash',
    shape_schema: JSON.stringify({ type: 'object', properties: { token: { type: 'string' } }, required: ['token'] }),
    type: 'api',
    status: 'stable',
  });

  // Second node that imports auth.jwt
  const nodeId2 = randomUUID();
  await store.upsertNode({
    id: nodeId2,
    file_path: 'specs/search.md',
    hash: 'def',
    status: 'needs-review',
  });

  const contractId2 = 'api.GET/search';
  await store.upsertContract({
    id: contractId2,
    node_id: nodeId2,
    shape_hash: 'sha256hash2',
    shape_schema: JSON.stringify({ type: 'array' }),
    type: 'api',
    status: 'stable',
  });

  await store.upsertDependency({
    id: randomUUID(),
    source_node_id: nodeId2,
    target_contract_id: contractId,
  });

  return { store, contractId, contractId2 };
}

describe('writeContext — Task 5', () => {
  const tmps: string[] = [];

  afterEach(() => {
    // Clean up temp directories
    for (const tmp of tmps) {
      try { fs.rmSync(tmp, { recursive: true, force: true }); } catch {}
    }
    tmps.length = 0;
  });

  it('creates context.json at the correct path', async () => {
    const tmpDir = makeTmpDir();
    tmps.push(tmpDir);
    const { store } = await makeStoreWithData(tmpDir);

    await writeContext(store, tmpDir);

    const contextPath = path.join(tmpDir, '.ferret', 'context.json');
    expect(fs.existsSync(contextPath)).toBe(true);

    await store.close();
  });

  it('produces valid JSON', async () => {
    const tmpDir = makeTmpDir();
    tmps.push(tmpDir);
    const { store } = await makeStoreWithData(tmpDir);

    await writeContext(store, tmpDir);

    const contextPath = path.join(tmpDir, '.ferret', 'context.json');
    const raw = fs.readFileSync(contextPath, 'utf-8');
    expect(() => JSON.parse(raw)).not.toThrow();

    await store.close();
  });

  it('contains version "2.0"', async () => {
    const tmpDir = makeTmpDir();
    tmps.push(tmpDir);
    const { store } = await makeStoreWithData(tmpDir);

    await writeContext(store, tmpDir);

    const ctx = JSON.parse(
      fs.readFileSync(path.join(tmpDir, '.ferret', 'context.json'), 'utf-8')
    ) as FerretContext;
    expect(ctx.version).toBe('2.0');

    await store.close();
  });

  it('stable contracts appear in contracts array', async () => {
    const tmpDir = makeTmpDir();
    tmps.push(tmpDir);
    const { store, contractId } = await makeStoreWithData(tmpDir);

    await writeContext(store, tmpDir);

    const ctx = JSON.parse(
      fs.readFileSync(path.join(tmpDir, '.ferret', 'context.json'), 'utf-8')
    ) as FerretContext;
    const ids = ctx.contracts.map(c => c.id);
    expect(ids).toContain(contractId);

    await store.close();
  });

  it('needs-review contracts appear in needsReview array', async () => {
    const tmpDir = makeTmpDir();
    tmps.push(tmpDir);
    const { store, contractId2 } = await makeStoreWithData(tmpDir);

    await writeContext(store, tmpDir);

    const ctx = JSON.parse(
      fs.readFileSync(path.join(tmpDir, '.ferret', 'context.json'), 'utf-8')
    ) as FerretContext;
    // contractId2 belongs to the needs-review node
    expect(ctx.needsReview).toContain(contractId2);

    await store.close();
  });

  it('edges correctly represent dependency relationships', async () => {
    const tmpDir = makeTmpDir();
    tmps.push(tmpDir);
    const { store, contractId } = await makeStoreWithData(tmpDir);

    await writeContext(store, tmpDir);

    const ctx = JSON.parse(
      fs.readFileSync(path.join(tmpDir, '.ferret', 'context.json'), 'utf-8')
    ) as FerretContext;
    const edge = ctx.edges.find(e => e.to === contractId);
    expect(edge).toBeDefined();
    expect(edge!.from).toBe('specs/search.md');

    await store.close();
  });
});
