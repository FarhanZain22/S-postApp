// src/scripts/pages/detail/StoryDetailPage.js
import {
  generateLoaderAbsoluteTemplate,
  generateStoryDetailErrorTemplate,
  generateStoryDetailTemplate,
} from '../../templates';
import StoryDetailPresenter from './story-detail-presenter';
import { parseActivePathname } from '../../routes/url-parser';
import Map from '../../utils/map';
import * as API from '../../data/api';
// pastikan path & casing sesuai:
import Database from '../../data/database.js';

export default class StoryDetailPage {
  #presenter = null;
  #map = null;

  async render() {
    return `
      <section>
        <div class="story-detail__container">
          <div id="story-detail" class="story-detail"></div>
          <div id="story-detail-loading-container"></div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    const storyId = parseActivePathname().id;
    this.#presenter = new StoryDetailPresenter(storyId, {
      view: this,
      model: API,
    });
    this.#presenter.showStoryDetail();
  }

  async populateStoryDetailAndInitialMap(_, story) {
    document.getElementById('story-detail').innerHTML = generateStoryDetailTemplate(story);

    // pasang tombol simpan/buang
    await this.bindBookmarkButton(story);

    if (story.lat && story.lon) {
      await this.initialMap();
      this.#map.changeCamera([story.lat, story.lon]);
      this.#map.addMarker([story.lat, story.lon], { alt: story.name }, { content: story.name });
    }
  }

  populateStoryDetailError(message) {
    document.getElementById('story-detail').innerHTML =
      generateStoryDetailErrorTemplate(message);
  }

  async initialMap() {
    this.#map = await Map.build('#map', { zoom: 15 });
  }

  showStoryDetailLoading() {
    document.getElementById('story-detail-loading-container').innerHTML =
      generateLoaderAbsoluteTemplate();
  }

  hideStoryDetailLoading() {
    document.getElementById('story-detail-loading-container').innerHTML = '';
  }

  showMapLoading() {
    document.getElementById('map-loading-container').innerHTML =
      generateLoaderAbsoluteTemplate();
  }

  hideMapLoading() {
    document.getElementById('map-loading-container').innerHTML = '';
  }

  async bindBookmarkButton(story) {
    const btn = document.getElementById('story-detail-save');
    if (!btn) return;

    const isSaved = await Database.getStoryById(story.id);
    btn.innerHTML = isSaved
      ? 'Buang Cerita <i class="fas fa-bookmark"></i>'
      : 'Simpan Cerita <i class="far fa-bookmark"></i>';

    btn.addEventListener('click', async () => {
      try {
        if (await Database.getStoryById(story.id)) {
          await Database.removeStory(story.id);
          btn.innerHTML = 'Simpan Cerita <i class="far fa-bookmark"></i>';
          alert('Cerita dihapus dari favorit.');
        } else {
          await Database.saveStory(story);
          btn.innerHTML = 'Buang Cerita <i class="fas fa-bookmark"></i>';
          alert('Cerita berhasil disimpan.');
        }
      } catch (err) {
        console.error(err);
        alert(`Gagal: ${err.message}`);
      }
    });
  }
}
