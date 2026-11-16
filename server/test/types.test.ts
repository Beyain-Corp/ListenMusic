import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ALBUM_ID, ARTIST_ID, GENRE_ID, VIDEO_ID } from "../src/types.js";

describe("Validation Regexes", () => {
  describe("VIDEO_ID", () => {
    it("accepts valid YouTube 11-char IDs", () => {
      assert.equal(VIDEO_ID.test("dQw4w9WgXcQ"), true);
      assert.equal(VIDEO_ID.test("9bZkp7q19f0"), true);
      assert.equal(VIDEO_ID.test("_-aA1234567"), true);
    });

    it("rejects invalid or malicious IDs", () => {
      assert.equal(VIDEO_ID.test(""), false);
      assert.equal(VIDEO_ID.test("short"), false);
      assert.equal(VIDEO_ID.test("toolongstring123"), false);
      assert.equal(VIDEO_ID.test("dQw4w9WgXcQ; rm -rf /"), false);
      assert.equal(VIDEO_ID.test("$(whoami)123"), false);
      assert.equal(VIDEO_ID.test("../../../etc"), false);
    });
  });

  describe("ARTIST_ID", () => {
    it("accepts valid YouTube Music artist IDs", () => {
      assert.equal(ARTIST_ID.test("UC-9-kyTW8ZkZNDHQJ6FgpwQ"), true);
      assert.equal(ARTIST_ID.test("UC1234567890123456789012"), true);
    });

    it("rejects invalid artist IDs", () => {
      assert.equal(ARTIST_ID.test(""), false);
      assert.equal(ARTIST_ID.test("invalid"), false);
      assert.equal(ARTIST_ID.test("UC123"), false);
      assert.equal(ARTIST_ID.test("UC1234567890123456789012;"), false);
    });
  });

  describe("ALBUM_ID", () => {
    it("accepts valid MPRE album IDs", () => {
      assert.equal(ALBUM_ID.test("MPREb_12345678"), true);
      assert.equal(ALBUM_ID.test("MPREabc-def_ghi"), true);
    });

    it("rejects invalid album IDs", () => {
      assert.equal(ALBUM_ID.test(""), false);
      assert.equal(ALBUM_ID.test("NOTMPRE12345"), false);
      assert.equal(ALBUM_ID.test("MPRE;rm"), false);
    });
  });

  describe("GENRE_ID", () => {
    it("accepts valid genre params", () => {
      assert.equal(GENRE_ID.test("ggMPOg1ncmVuZGluZw=="), true);
      assert.equal(GENRE_ID.test("ggMPOg1wb3B1bGFy"), true);
    });

    it("rejects invalid genre params", () => {
      assert.equal(GENRE_ID.test(""), false);
      assert.equal(GENRE_ID.test("short"), false);
      assert.equal(GENRE_ID.test("invalid!char"), false);
    });
  });
});
