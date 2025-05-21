// src/pages/favorites/favorite-page.js
import {
  generateLoaderAbsoluteTemplate,
  generateStoryItemTemplate,
  generateStoriesListEmptyTemplate,
  generateStoriesListErrorTemplate,
} from '../../templates';
import Database from '../../data/database';

export default class FavoritePage {
  #currentPage = 1;
  #pageSize = 5;
  #showLocationOnly = false;

  async render() {
    return `
      <section class="container">
        <h1 class="section-title">Favorite Stories</h1>

        <div class="stories-list__container">
          <div class="stories-filter">
            <label class="filter-label">
              <input type="checkbox" id="location-filter"${this.#showLocationOnly ? ' checked' : ''}>
              Tampilkan story dengan lokasi
            </label>
            <label class="filter-label">
              Jumlah per halaman:
              <select id="size-filter" class="size-select">
                <option value="5"${this.#pageSize === 5 ? ' selected' : ''}>5</option>
                <option value="10"${this.#pageSize === 10 ? ' selected' : ''}>10</option>
                <option value="20"${this.#pageSize === 20 ? ' selected' : ''}>20</option>
              </select>
            </label>
          </div>

          <div id="stories-list"></div>
          <div id="stories-list-loading-container"></div>

          <div class="pagination">
            <button id="prev-page" class="btn btn-outline pagination-btn" disabled>
              ‹ Sebelumnya
            </button>
            <span id="page-info" class="page-info">Halaman ${this.#currentPage}</span>
            <button id="next-page" class="btn btn-outline pagination-btn" disabled>
              Selanjutnya ›
            </button>
          </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    // Setup event handler filter & pagination
    this._setupFilters();
    this._setupPagination();

    // Load & tampilkan cerita favorit
    await this._loadAndDisplayStories();
  }

  // === PRIVATE ===
  async _loadAndDisplayStories() {
    const listEl = document.getElementById('stories-list');
    const loadingEl = document.getElementById('stories-list-loading-container');
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    const pageInfo = document.getElementById('page-info');

    // tampilkan loader
    loadingEl.innerHTML = generateLoaderAbsoluteTemplate();

    try {
      // ambil semua cerita dari IndexedDB
      let stories = await Database.getAllStories();
      console.log('All favorite stories:', stories);

      // filter lokasi jika dicentang
      if (this.#showLocationOnly) {
        stories = stories.filter(s => s.latitude && s.longitude);
      }

      // paging manual
      const totalPages = Math.ceil(stories.length / this.#pageSize) || 1;
      this.#currentPage = Math.min(this.#currentPage, totalPages);
      const start = (this.#currentPage - 1) * this.#pageSize;
      const pageStories = stories.slice(start, start + this.#pageSize);

      // normalisasi photoUrl
            // normalisasi data untuk template
      const normalized = pageStories.map(s => {
        const photoUrl = s.photoUrl
          || (s.photo instanceof Blob ? URL.createObjectURL(s.photo) : s.photo || '');
        return {
          ...s,
          photoUrl,
          // alias latitude/longitude sesuai template
          lat: s.latitude,
          lon: s.longitude,
        };
      });(s => {
        const photoUrl = s.photoUrl
          || (s.photo instanceof Blob ? URL.createObjectURL(s.photo) : '');
        return { ...s, photoUrl };
      });
      console.log('Normalized page stories:', normalized);

      // render list atau empty state
      if (normalized.length === 0) {
        listEl.innerHTML = generateStoriesListEmptyTemplate();
      } else {
        listEl.innerHTML = normalized.map(generateStoryItemTemplate).join('');
      }

      // update pagination controls
      prevBtn.disabled = this.#currentPage <= 1;
      nextBtn.disabled = this.#currentPage >= totalPages;
      pageInfo.textContent = `Halaman ${this.#currentPage} dari ${totalPages}`;

    } catch (err) {
      console.error('Error loading favorite stories:', err);
      listEl.innerHTML = generateStoriesListErrorTemplate(err.message);
    } finally {
      // sembunyikan loader
      loadingEl.innerHTML = '';
    }
  }

  _setupFilters() {
    document.getElementById('location-filter')
      .addEventListener('change', e => {
        this.#showLocationOnly = e.target.checked;
        this.#currentPage = 1;
        this._loadAndDisplayStories();
      });

    document.getElementById('size-filter')
      .addEventListener('change', e => {
        this.#pageSize = Number(e.target.value);
        this.#currentPage = 1;
        this._loadAndDisplayStories();
      });
  }

  _setupPagination() {
    document.getElementById('prev-page')
      .addEventListener('click', () => {
        if (this.#currentPage > 1) {
          this.#currentPage--;
          this._loadAndDisplayStories();
        }
      });

    document.getElementById('next-page')
      .addEventListener('click', () => {
        this.#currentPage++;
        this._loadAndDisplayStories();
      });
  }
}
