import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { normalizeNetscapeCookies, parseExtraArgs } from "../src/config.js";

describe("Config helpers", () => {
  describe("parseExtraArgs", () => {
    it("handles undefined or empty strings", () => {
      assert.deepEqual(parseExtraArgs(undefined), []);
      assert.deepEqual(parseExtraArgs(""), []);
      assert.deepEqual(parseExtraArgs("   "), []);
    });

    it("parses unquoted space-separated arguments", () => {
      assert.deepEqual(parseExtraArgs("-4 --no-warnings"), ["-4", "--no-warnings"]);
    });

    it("unwraps double-quoted arguments preserving inner content", () => {
      const parsed = parseExtraArgs('-4 --extractor-args "youtube:player_client=tv_samsung;skip=hls,dash"');
      assert.deepEqual(parsed, [
        "-4",
        "--extractor-args",
        "youtube:player_client=tv_samsung;skip=hls,dash",
      ]);
    });

    it("unwraps single-quoted arguments", () => {
      const parsed = parseExtraArgs("-4 --extractor-args 'youtube:player_client=tv_samsung;skip=hls,dash'");
      assert.deepEqual(parsed, [
        "-4",
        "--extractor-args",
        "youtube:player_client=tv_samsung;skip=hls,dash",
      ]);
    });
  });

  describe("normalizeNetscapeCookies", () => {
    it("preserves valid tab-delimited cookies", () => {
      const input = `# Netscape HTTP Cookie File
.youtube.com\tTRUE\t/\tTRUE\t1794854772\tLOGIN_INFO\tAFMMF2cw...
`;
      const out = normalizeNetscapeCookies(input);
      assert.match(out, /\.youtube\.com\tTRUE\t\/\tTRUE\t1794854772\tLOGIN_INFO\tAFMMF2cw\.\.\./);
    });

    it("converts spaces into tabs for pasted web cookies", () => {
      const input = `.youtube.com    TRUE    /    TRUE    1794854772    LOGIN_INFO    AFMMF2cw...`;
      const out = normalizeNetscapeCookies(input);
      assert.match(out, /\.youtube\.com\tTRUE\t\/\tTRUE\t1794854772\tLOGIN_INFO\tAFMMF2cw\.\.\./);
    });

    it("preserves #HttpOnly_ cookies", () => {
      const input = `#HttpOnly_.youtube.com\tTRUE\t/\tTRUE\t1794854772\tHSID\tA1B2C3D4`;
      const out = normalizeNetscapeCookies(input);
      assert.match(out, /#HttpOnly_\.youtube\.com\tTRUE\t\/\tTRUE\t1794854772\tHSID\tA1B2C3D4/);
    });

    it("filters out standard comment lines", () => {
      const input = `# This is an arbitrary comment
.youtube.com\tTRUE\t/\tTRUE\t1794854772\tSID\tsecret123
`;
      const out = normalizeNetscapeCookies(input);
      assert.equal(out.includes("# This is an arbitrary comment"), false);
      assert.match(out, /\.youtube\.com\tTRUE\t\/\tTRUE\t1794854772\tSID\tsecret123/);
    });
  });
});
