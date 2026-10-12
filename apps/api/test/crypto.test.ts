import { describe, expect, it } from "vitest";
import { decrypt, encrypt, pkceChallenge } from "../src/lib/crypto";
import { isAllowedEmail } from "../src/lib/users";

const KEY = "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=";

describe("crypto", () => {
  it("criptografa e descriptografa", async () => {
    const enc = await encrypt("segredo", KEY);
    expect(enc).not.toContain("segredo");
    expect(await decrypt(enc, KEY)).toBe("segredo");
  });

  it("usa IV aleatório", async () => {
    expect(await encrypt("x", KEY)).not.toBe(await encrypt("x", KEY));
  });

  it("calcula o code_challenge do PKCE (vetor da RFC 7636)", async () => {
    expect(await pkceChallenge("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk")).toBe(
      "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM",
    );
  });
});

describe("lista de permissão", () => {
  it("compara sem diferenciar maiúsculas e aceita vários e-mails", () => {
    expect(isAllowedEmail("Dono@Example.com", "dono@example.com")).toBe(true);
    expect(isAllowedEmail("b@x.com", "a@x.com, b@x.com")).toBe(true);
    expect(isAllowedEmail("c@x.com", "a@x.com,b@x.com")).toBe(false);
  });
});
