import { describe, expect, it } from "vitest";
import { initialPositions, positionBetween } from "./ordering";

describe("ordering", () => {
  it("gera posições em ordem crescente", () => {
    const keys = initialPositions(5);
    expect([...keys].sort()).toEqual(keys);
  });

  it("insere entre duas posições", () => {
    const [a, b] = initialPositions(2) as [string, string];
    const mid = positionBetween(a, b);
    expect(mid > a && mid < b).toBe(true);
  });
});
