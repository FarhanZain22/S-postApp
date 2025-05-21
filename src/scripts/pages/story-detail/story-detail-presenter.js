export default class StoryDetailPresenter {
    #storyId;
    #view;
    #model;
  
    constructor(storyId, { view, model }) {
      this.#storyId = storyId;
      this.#view = view;
      this.#model = model;
    }
  
    async showStoryDetail() {
  this.#view.showStoryDetailLoading();
  try {
    let response = await this.#model.getStoryById(this.#storyId);

    if (!response.ok || !response.story) {
      // Jika API gagal atau tidak punya story, coba ambil dari IndexedDB
      const localStory = await import('../../data/database.js').then(m => m.default.getStoryById(this.#storyId));
      if (!localStory) {
        this.#view.populateStoryDetailError('Cerita tidak ditemukan di server maupun lokal.');
        return;
      }

      // Normalisasi data lokal agar sesuai dengan struktur template
      const story = {
        ...localStory,
        photoUrl:
          localStory.photoUrl ||
          (localStory.photo instanceof Blob ? URL.createObjectURL(localStory.photo) : ''),
        lat: localStory.latitude,
        lon: localStory.longitude,
      };

      this.#view.populateStoryDetailAndInitialMap(null, story);
      return;
    }

    // Data dari API
    this.#view.populateStoryDetailAndInitialMap(response.message, response.story);
  } catch (error) {
    console.error('showStoryDetail: error:', error);
    this.#view.populateStoryDetailError(error.message);
  } finally {
    this.#view.hideStoryDetailLoading();
  }
}

  }