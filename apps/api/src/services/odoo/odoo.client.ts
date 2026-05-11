import { env } from "../../config/env.js";

type JsonRpcRequest = {
  jsonrpc: "2.0";
  method: "call";
  params: {
    service: string;
    method: string;
    args: unknown[];
  };
  id: number;
};

type JsonRpcResponse<T> = {
  jsonrpc: "2.0";
  id: number;
  result?: T;
  error?: { code: number; message: string; data?: unknown };
};

function joinJsonRpcUrl(base: string): string {
  const trimmed = base.replace(/\/+$/, "");
  return `${trimmed}/jsonrpc`;
}

export class OdooClient {
  private readonly jsonRpcUrl: string;

  constructor(
    private readonly db: string,
    private readonly username: string,
    private readonly password: string,
    baseUrl: string = env.ODOO_URL,
  ) {
    this.jsonRpcUrl = joinJsonRpcUrl(baseUrl);
  }

  private async call<T>(service: string, method: string, args: unknown[]): Promise<T> {
    const body: JsonRpcRequest = {
      jsonrpc: "2.0",
      method: "call",
      params: { service, method, args },
      id: Math.floor(Math.random() * 1_000_000_000),
    };

    const res = await fetch(this.jsonRpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`Odoo HTTP ${res.status}: ${res.statusText}`);
    }

    const json = (await res.json()) as JsonRpcResponse<T>;
    if (json.error) {
      const detail =
        json.error.data !== undefined
          ? ` ${JSON.stringify(json.error.data)}`
          : "";
      throw new Error(`${json.error.message}${detail}`.trim());
    }

    return json.result as T;
  }

  async authenticate(): Promise<number> {
    try {
      const uid = await this.call<number | false>("common", "authenticate", [
        this.db,
        this.username,
        this.password,
        {},
      ]);
      if (uid === false || typeof uid !== "number") {
        throw new Error(
          "Odoo authentication failed (invalid credentials or database)",
        );
      }
      return uid;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[ODOO_AUTH_FAILED] message=${message}`);
      throw err instanceof Error ? err : new Error(message);
    }
  }

  async executeKw<T>(
    uid: number,
    model: string,
    method: string,
    args: unknown[],
    kwargs: Record<string, unknown> = {},
  ): Promise<T> {
    return this.call<T>("object", "execute_kw", [
      this.db,
      uid,
      this.password,
      model,
      method,
      args,
      kwargs,
    ]);
  }
}
