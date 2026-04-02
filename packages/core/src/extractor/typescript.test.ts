import assert from "node:assert/strict";
import { describe, it } from "bun:test";
import { extractContractsFromTypeScript } from "./typescript.js";

describe("extractContractsFromTypeScript — S28 acceptance criteria", () => {
  it("extracts deterministic contract shapes from annotated interfaces", () => {
    const src = `
// @ferret-contract: api.GET/users api
export interface GetUsersResponse {
  id: string;
  email: string;
  active: boolean;
  createdAt: Date;
}
`;

    const first = extractContractsFromTypeScript("src/users.ts", src);
    const second = extractContractsFromTypeScript("src/users.ts", src);

    assert.equal(first.diagnostics.length, 0);
    assert.equal(JSON.stringify(first), JSON.stringify(second));
    assert.equal(first.contracts.length, 1);

    const contract = first.contracts[0];
    assert.equal(contract.id, "api.GET/users");
    assert.equal(contract.type, "api");
    assert.equal(contract.sourceSymbol, "GetUsersResponse");

    const shape = contract.shape as Record<string, unknown>;
    assert.equal(shape.type, "object");
  });

  it("records diagnostics for unsupported unions", () => {
    const src = `
// @ferret-contract: api.GET/profile api
export interface ProfileResponse {
  email: string | null;
}
`;

    const result = extractContractsFromTypeScript("src/profile.ts", src);

    assert.equal(result.contracts.length, 1);
    assert.ok(
      result.diagnostics.some((d) =>
        d.includes("Union types are not supported"),
      ),
    );
  });

  it("fails extraction when annotation has no following declaration", () => {
    const src = `// @ferret-contract: api.GET/missing api`;
    const result = extractContractsFromTypeScript("src/missing.ts", src);

    assert.equal(result.contracts.length, 0);
    assert.ok(
      result.diagnostics.some((d) =>
        d.includes("No interface/type declaration found"),
      ),
    );
  });
});
