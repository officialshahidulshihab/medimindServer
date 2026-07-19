import { describe, expect, test } from "vitest";

describe("Vercel entrypoint module resolution", () => {
  test("api entrypoint can be imported without extension-resolution errors", async () => {
    const entrypoint = await import("../../api/index.js");

    expect(entrypoint).toBeDefined();
    expect(typeof entrypoint.default).toBe("function");
  });
});
