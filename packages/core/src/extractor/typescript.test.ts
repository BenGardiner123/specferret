import assert from "node:assert/strict";
import { describe, it } from "bun:test";
import { extractContractsFromTypeScript } from "./typescript.js";

describe("extractContractsFromTypeScript — S28 acceptance criteria", () => {
  it("extracts deterministic contract shapes from exported interfaces without annotations", () => {
    const src = `
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
    assert.equal(contract.id, "type.src/users/getusersresponse");
    assert.equal(contract.type, "type");
    assert.equal(contract.sourceSymbol, "GetUsersResponse");

    const shape = contract.shape as Record<string, unknown>;
    assert.equal(shape.type, "object");
  });

  it("extracts enum and function signatures from exported declarations", () => {
    const src = `
export enum UserRole {
  Admin,
  Viewer,
}

export function getUser(id: string): UserRole {
  return UserRole.Admin;
}
`;

    const result = extractContractsFromTypeScript("src/roles.ts", src);

    assert.equal(result.contracts.length, 2);
    const enumContract = result.contracts.find((contract) =>
      contract.sourceSymbol === "UserRole",
    );
    const functionContract = result.contracts.find((contract) =>
      contract.sourceSymbol === "getUser",
    );

    assert.ok(enumContract);
    assert.ok(functionContract);

    const enumShape = enumContract?.shape as Record<string, unknown>;
    assert.equal(enumShape.type, "string");

    const functionShape = functionContract?.shape as Record<string, unknown>;
    assert.equal(functionShape.type, "object");
  });

  it("records diagnostics for unsupported unions", () => {
    const src = `
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

  it("applies annotation overrides for id and type when present", () => {
    const src = `
// @ferret-contract: api.GET/profile api
export interface ProfileResponse {
  email: string;
}
`;
    const result = extractContractsFromTypeScript("src/missing.ts", src);

    assert.equal(result.contracts.length, 1);
    assert.equal(result.contracts[0].id, "api.GET/profile");
    assert.equal(result.contracts[0].type, "api");
  });

  it("reports unmatched annotations", () => {
    const src = `
// @ferret-contract: api.GET/missing api
interface MissingContract {
  id: string;
}
`;
    const result = extractContractsFromTypeScript("src/missing.ts", src);

    assert.equal(result.contracts.length, 0);
    assert.ok(result.diagnostics.some((d) => d.includes("did not match")));
  });
});
