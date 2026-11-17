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

    it("unwraps double-quoted arguments and replaces legacy tv_samsung client", () => {
      const parsed = parseExtraArgs('-4 --extractor-args "youtube:player_client=tv_samsung;skip=hls,dash"');
      assert.deepEqual(parsed, [
        "-4",
        "--extractor-args",
        "youtube:player_client=web;skip=hls,dash",
      ]);
    });

    it("unwraps single-quoted arguments and preserves modern clients", () => {
      const parsed = parseExtraArgs("-4 --extractor-args 'youtube:player_client=web_embedded,android;skip=hls,dash'");
      assert.deepEqual(parsed, [
        "-4",
        "--extractor-args",
        "youtube:player_client=web_embedded,android;skip=hls,dash",
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

    it("converts JSON cookie arrays into Netscape format", () => {
      const json = JSON.stringify([
        { domain: ".youtube.com", name: "LOGIN_INFO", value: "tok123", httpOnly: true, secure: true },
        { domain: ".youtube.com", name: "SID", value: "sid456", secure: false },
      ]);
      const out = normalizeNetscapeCookies(json);
      assert.match(out, /#HttpOnly_\.youtube\.com\tTRUE\t\/\tTRUE\t\d+\tLOGIN_INFO\ttok123/);
      assert.match(out, /\.youtube\.com\tTRUE\t\/\tFALSE\t\d+\tSID\tsid456/);
    });

    it("converts raw HTTP Cookie headers into Netscape format", () => {
      const header = "LOGIN_INFO=afm123; SID=sid789; HSID=h123";
      const out = normalizeNetscapeCookies(header);
      assert.match(out, /\.youtube\.com\tTRUE\t\/\tTRUE\t\d+\tLOGIN_INFO\tafm123/);
      assert.match(out, /\.youtube\.com\tTRUE\t\/\tTRUE\t\d+\tSID\tsid789/);
    });
  });
});
