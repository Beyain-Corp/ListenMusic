import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  addFavorite,
  addFavorites,
  addToPlaylist,
  createPlaylist,
  deletePlaylist,
  getLibrary,
  importLibrary,
  pushHistory,
  removeFromPlaylist,
  removeFavorite,
  renamePlaylist,
  sanitizeTrack,
  useLibraryStorage,
  type LibraryStorage,
} from "../src/library.js";
import type { Track } from "../src/types.js";

function memoryStorage(initialJson: string | null = null): LibraryStorage & { data: string | null; failNext: boolean } {
  const store = {
    data: initialJson,
    failNext: false,
    async read() {
      return store.data;
    },
    async write(json: string) {
      if (store.failNext) {
        store.failNext = false;
        throw new Error("Simulated disk write failure");
      }
      store.data = json;
    },
  };
  return store;
}

const sampleTrack: Track = {
  id: "dQw4w9WgXcQ",
  title: "Never Gonna Give You Up",
  artist: "Rick Astley",
  duration: 213,
  thumb: "https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
  art: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hq720.jpg",
  kind: "song",
};

describe("Library Module", () => {
  let store: ReturnType<typeof memoryStorage>;

  beforeEach(() => {
    store = memoryStorage();
    useLibraryStorage(store);
  });

  describe("sanitizeTrack", () => {
    it("preserves valid track fields", () => {
      const sanitized = sanitizeTrack(sampleTrack);
      assert.equal(sanitized.id, sampleTrack.id);
      assert.equal(sanitized.title, sampleTrack.title);
      assert.equal(sanitized.artist, sampleTrack.artist);
      assert.equal(sanitized.duration, 213);
    });

    it("throws on invalid ID", () => {
      assert.throws(() => sanitizeTrack({ id: "invalid" }), /Invalid track/);
    });

    it("strips non-https URLs for artwork", () => {
      const sanitized = sanitizeTrack({
        id: "dQw4w9WgXcQ",
        title: "Test",
        thumb: "http://insecure.com/art.jpg",
        art: "javascript:alert(1)",
      });
      assert.equal(sanitized.thumb, "");
      assert.equal(sanitized.art, "");
    });
  });

  describe("Favorites and History", () => {
    it("adds and removes favorites without duplicates", async () => {
      await addFavorite(sampleTrack);
      let lib = await getLibrary();
      assert.equal(lib.favorites.length, 1);
      assert.equal(lib.favorites[0]?.id, sampleTrack.id);

      // Duplicate addition keeps 1 entry
      await addFavorite(sampleTrack);
      lib = await getLibrary();
      assert.equal(lib.favorites.length, 1);

      await removeFavorite(sampleTrack.id);
      lib = await getLibrary();
      assert.equal(lib.favorites.length, 0);
    });

    it("adds bulk favorites skipping duplicates", async () => {
      const track2: Track = { ...sampleTrack, id: "9bZkp7q19f0", title: "Gangnam Style" };
      await addFavorites([sampleTrack, track2, sampleTrack]);
      const lib = await getLibrary();
      assert.equal(lib.favorites.length, 2);
    });

    it("pushes history up to limit", async () => {
      await pushHistory(sampleTrack);
      const lib = await getLibrary();
      assert.equal(lib.history.length, 1);
      assert.equal(lib.history[0]?.id, sampleTrack.id);
    });
  });

  describe("Playlists", () => {
    it("creates, renames, adds tracks, and deletes playlists", async () => {
      const p = await createPlaylist("Rock Classics", [sampleTrack]);
      assert.equal(p.name, "Rock Classics");
      assert.equal(p.tracks.length, 1);

      const renamed = await renamePlaylist(p.id, "Rock Legends");
      assert.equal(renamed.name, "Rock Legends");

      const track2: Track = { ...sampleTrack, id: "9bZkp7q19f0", title: "Track 2" };
      const updated = await addToPlaylist(p.id, track2);
      assert.equal(updated.tracks.length, 2);

      const removed = await removeFromPlaylist(p.id, sampleTrack.id);
      assert.equal(removed.tracks.length, 1);
      assert.equal(removed.tracks[0]?.id, track2.id);

      await deletePlaylist(p.id);
      const lib = await getLibrary();
      assert.equal(lib.playlists.length, 0);
    });
  });

  describe("Library Import & Merging", () => {
    it("replaces library on replace mode", async () => {
      await addFavorite(sampleTrack);
      const backup = {
        favorites: [{ ...sampleTrack, id: "9bZkp7q19f0" }],
        playlists: [],
        history: [],
      };
      const res = await importLibrary(backup, "replace");
      assert.equal(res.favoritesAdded, 1);
      const lib = await getLibrary();
      assert.equal(lib.favorites.length, 1);
      assert.equal(lib.favorites[0]?.id, "9bZkp7q19f0");
    });

    it("merges playlists by name without duplicating tracks", async () => {
      const p1 = await createPlaylist("Favorites Mix", [sampleTrack]);
      const backup = {
        favorites: [],
        playlists: [
          {
            id: "different-id",
            name: "Favorites Mix",
            tracks: [sampleTrack, { ...sampleTrack, id: "9bZkp7q19f0", title: "Track 2" }],
          },
        ],
        history: [],
      };
      const res = await importLibrary(backup, "merge");
      assert.equal(res.playlistsMerged, 1);
      assert.equal(res.tracksAdded, 1);

      const lib = await getLibrary();
      assert.equal(lib.playlists.length, 1);
      assert.equal(lib.playlists[0]?.tracks.length, 2);
    });
  });

  describe("Promise Chain Recovery", () => {
    it("recovers from transient storage write failures and continues persisting", async () => {
      store.failNext = true;
      await assert.rejects(
        () => addFavorite(sampleTrack),
        /Simulated disk write failure/,
      );

      // The next write must succeed and NOT be locked by the previous rejection
      const track2: Track = { ...sampleTrack, id: "9bZkp7q19f0", title: "Recovered Track" };
      await addFavorite(track2);

      const lib = await getLibrary();
      assert.equal(lib.favorites.some((t) => t.id === track2.id), true);
      assert.ok(store.data?.includes("Recovered Track"));
    });
  });
});
