// src/data/database.js
import { openDB } from 'idb';

const DATABASE_NAME = 'spost-app-db';
const DATABASE_VERSION = 1;
const STORE = 'saved-stories';

const dbPromise = openDB(DATABASE_NAME, DATABASE_VERSION, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(STORE)) {
      db.createObjectStore(STORE, { keyPath: 'id' });
    }
  },
});

export const Database = {

  async getFavoriteStory(){
    return (await dbPromise).get(STORE)
  },

  async saveStory(story) {
    if (!story.id) throw new Error('`id` diperlukan untuk menyimpan.');
    return (await dbPromise).put(STORE, story);
  },
  async getStoryById(id) {
    if (!id) throw new Error('`id` diperlukan.');
    return (await dbPromise).get(STORE, id);
  },
  async getAllStories() {
    return (await dbPromise).getAll(STORE);
  },
  async removeStory(id) {
    if (!id) throw new Error('`id` diperlukan untuk menghapus.');
    return (await dbPromise).delete(STORE, id);
  },
};

export default Database;
