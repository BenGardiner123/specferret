export type ContractType = "api" | "table" | "type" | "event" | "flow" | "config";

export interface ExtractedCodeContract {
  id: string;
  type: ContractType;
  shape: Record<string, unknown>;
  sourceSymbol: string;
  filePath: string;
}

export interface TypeScriptExtractionResult {
  contracts: ExtractedCodeContract[];
  diagnostics: string[];
}

interface Annotation {
  id: string;
  type: ContractType;
  index: number;
}

class TypeParser {
  private i = 0;

  constructor(private readonly input: string) {}

  parseObject(): { shape: Record<string, unknown>; diagnostics: string[] } {
    const diagnostics: string[] = [];
    const object = this.parseObjectType(diagnostics);
    return { shape: object, diagnostics };
  }

  private parseObjectType(diagnostics: string[]): Record<string, unknown> {
    this.skipWs();
    if (this.peek() !== "{") {
      diagnostics.push("Expected object type starting with '{'.");
      return { type: "object", properties: {}, required: [] };
    }

    this.i++; // '{'
    const properties: Record<string, unknown> = {};
    const required: string[] = [];

    while (this.i < this.input.length) {
      this.skipWs();
      if (this.peek() === "}") {
        this.i++; // '}'
        break;
      }

      const name = this.readIdentifier();
      if (!name) {
        diagnostics.push("Unable to parse property name in object type.");
        this.advanceToDelimiter();
        continue;
      }

      this.skipWs();
      let optional = false;
      if (this.peek() === "?") {
        optional = true;
        this.i++;
      }

      this.skipWs();
      if (this.peek() !== ":") {
        diagnostics.push(`Expected ':' after property '${name}'.`);
        this.advanceToDelimiter();
        continue;
      }
      this.i++; // ':'

      this.skipWs();
      const schema = this.parseTypeExpr(diagnostics);
      properties[name] = schema;
      if (!optional) {
        required.push(name);
      }

      this.skipWs();
      if (this.peek() === ";" || this.peek() === ",") {
        this.i++;
      }
    }

    return {
      type: "object",
      properties,
      required,
    };
  }

  private parseTypeExpr(diagnostics: string[]): Record<string, unknown> {
    this.skipWs();

    if (this.peek() === "{") {
      return this.parseObjectType(diagnostics);
    }

    const ident = this.readIdentifier();
    if (!ident) {
      diagnostics.push("Unable to parse type expression.");
      return { type: "object" };
    }

    let base: Record<string, unknown>;
    switch (ident) {
      case "string":
        base = { type: "string" };
        break;
      case "number":
        base = { type: "number" };
        break;
      case "boolean":
        base = { type: "boolean" };
        break;
      case "Date":
        base = { type: "string", format: "date-time" };
        break;
      default:
        diagnostics.push(
          `Unsupported referenced type '${ident}'. Falling back to object.`,
        );
        base = { type: "object" };
        break;
    }

    while (true) {
      this.skipWs();
      if (this.peek() === "[" && this.peek(1) === "]") {
        this.i += 2;
        base = { type: "array", items: base };
        continue;
      }
      break;
    }

    this.skipWs();
    if (this.peek() === "|") {
      diagnostics.push("Union types are not supported in Sprint 3 extraction.");
      while (this.i < this.input.length) {
        const ch = this.peek();
        if (ch === ";" || ch === "," || ch === "}" || ch === "\n") {
          break;
        }
        this.i++;
      }
    }

    return base;
  }

  private readIdentifier(): string {
    this.skipWs();
    const start = this.i;
    while (this.i < this.input.length) {
      const ch = this.input[this.i];
      const ok = /[A-Za-z0-9_]/.test(ch);
      if (!ok) {
        break;
      }
      this.i++;
    }
    return this.input.slice(start, this.i);
  }

  private skipWs(): void {
    while (this.i < this.input.length) {
      const ch = this.input[this.i];
      if (!/\s/.test(ch)) {
        break;
      }
      this.i++;
    }
  }

  private advanceToDelimiter(): void {
    while (this.i < this.input.length) {
      const ch = this.input[this.i];
      if (ch === ";" || ch === "\n" || ch === "}") {
        return;
      }
      this.i++;
    }
  }

  private peek(offset = 0): string {
    return this.input[this.i + offset] ?? "";
  }
}

function parseAnnotations(content: string): Annotation[] {
  const pattern = /^\s*\/\/\s*@ferret-contract:\s*([^\s]+)\s+(api|table|type|event|flow|config)\s*$/gm;
  const out: Annotation[] = [];
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(content)) !== null) {
    out.push({
      id: match[1],
      type: match[2] as ContractType,
      index: match.index + match[0].length,
    });
  }

  return out;
}

function extractDeclaration(content: string, start: number): {
  symbol: string;
  objectBody: string;
  error?: string;
} {
  const tail = content.slice(start);
  const decl = /(?:export\s+)?(interface|type)\s+([A-Za-z0-9_]+)\s*(?:=)?\s*/m.exec(
    tail,
  );

  if (!decl || decl.index === undefined) {
    return {
      symbol: "unknown",
      objectBody: "",
      error: "No interface/type declaration found after annotation.",
    };
  }

  const symbol = decl[2];
  const offset = start + decl.index + decl[0].length;
  const bodyStart = content.indexOf("{", offset);
  if (bodyStart === -1) {
    return {
      symbol,
      objectBody: "",
      error: `Declaration '${symbol}' is not an object-like type.`,
    };
  }

  let depth = 0;
  let end = -1;
  for (let i = bodyStart; i < content.length; i++) {
    const ch = content[i];
    if (ch === "{") depth++;
    if (ch === "}") {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }

  if (end === -1) {
    return {
      symbol,
      objectBody: "",
      error: `Unclosed object type for declaration '${symbol}'.`,
    };
  }

  const objectBody = content.slice(bodyStart, end + 1);
  return { symbol, objectBody };
}

export function extractContractsFromTypeScript(
  filePath: string,
  content: string,
): TypeScriptExtractionResult {
  const annotations = parseAnnotations(content);
  const contracts: ExtractedCodeContract[] = [];
  const diagnostics: string[] = [];

  for (const annotation of annotations) {
    const declaration = extractDeclaration(content, annotation.index);

    if (declaration.error) {
      diagnostics.push(`${filePath}: ${declaration.error}`);
      continue;
    }

    const parser = new TypeParser(declaration.objectBody);
    const { shape, diagnostics: parserDiagnostics } = parser.parseObject();

    for (const d of parserDiagnostics) {
      diagnostics.push(`${filePath} (${declaration.symbol}): ${d}`);
    }

    contracts.push({
      id: annotation.id,
      type: annotation.type,
      shape,
      sourceSymbol: declaration.symbol,
      filePath,
    });
  }

  contracts.sort((a, b) => a.id.localeCompare(b.id));

  return { contracts, diagnostics };
}
