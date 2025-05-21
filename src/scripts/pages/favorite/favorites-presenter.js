import Database from '../../data/database';

export default class FavoritesPresenter {
  constructor({ view }) {
    this._view = view;
    this._model = Database;
  }

  async getStories({ page = 1, size = 5, location = 0 } = {}) {
    try {
      const all = await this._model.getAllStories();
      // filter lokasi
      const filtered = location
        ? all.filter(s => s.latitude && s.longitude)
        : all;
      // paging
      const start = (page - 1) * size;
      const pageStories = filtered.slice(start, start + size);

      // normalisasi supaya generateStoryItemTemplate mendapatkan photoUrl, lat, lon
      const normalized = pageStories.map(s => ({
        id: s.id,
        name: s.name,
        description: s.description,
        createdAt: s.createdAt,
        photoUrl: s.photoUrl,
        lat: s.latitude,
        lon: s.longitude,
      }));

      this._view.displayStories(normalized);
      return normalized.length === size; // ada data penuh → selanjutnya masih mungkin
    } catch (err) {
      this._view.displayStoriesError(err.message);
      return false;
    }
  }
}
