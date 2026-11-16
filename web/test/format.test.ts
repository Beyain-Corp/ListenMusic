import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatTime, cn, shuffled, parseList } from "../src/lib/format.js";

describe("Web Utilities", () => {
  describe("formatTime", () => {
    it("formats seconds into mm:ss and hh:mm:ss", () => {
      assert.equal(formatTime(0), "0:00");
      assert.equal(formatTime(45), "0:45");
      assert.equal(formatTime(65), "1:05");
      assert.equal(formatTime(3600), "1:00:00");
      assert.equal(formatTime(3665), "1:01:05");
      assert.equal(formatTime(-10), "0:00");
      assert.equal(formatTime(NaN), "0:00");
    });
  });

  describe("cn", () => {
    it("joins class names filtering falsy values", () => {
      assert.equal(cn("foo", false, "bar", null, undefined, "baz"), "foo bar baz");
      assert.equal(cn(), "");
    });
  });

  describe("shuffled", () => {
    it("returns array with same elements without mutating original", () => {
      const orig = [1, 2, 3, 4, 5];
      const res = shuffled(orig);
      assert.equal(res.length, orig.length);
      assert.deepEqual(res.slice().sort(), orig);
      assert.notEqual(res, orig);
    });
  });

  describe("parseList", () => {
    it("splits comma and newline separated tracks with deduplication", () => {
      const input = "Song A, Song B\nSong C, song a\n\nSong D";
      const result = parseList(input);
      assert.deepEqual(result, ["Song A", "Song B", "Song C", "Song D"]);
    });

    it("respects MAX_TERMS limit", () => {
      const input = Array.from({ length: 100 }, (_, i) => `Song ${i}`).join(", ");
      const result = parseList(input);
      assert.equal(result.length, 50);
    });
  });
});
