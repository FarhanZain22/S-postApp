// src/scripts/pages/app.js

import { getActiveRoute } from '../routes/url-parser';
import {
  generateAuthenticatedNavigationListTemplate,
  generateMainNavigationListTemplate,
  generateSubscribeButtonTemplate,
  generateUnauthenticatedNavigationListTemplate,
  generateUnsubscribeButtonTemplate,
} from '../templates';
import {
  isServiceWorkerAvailable,
  setupSkipToContent,
  transitionHelper,
} from '../utils';
import { getAccessToken, getLogout } from '../utils/auth';
import { routes } from '../routes/routes';
import {
  isCurrentPushSubscriptionAvailable,
  subscribe,
  unsubscribe,
} from '../utils/notification-helper';

export default class App {
  #content;
  #drawerButton;
  #drawerNavigation;
  #skipLinkButton;

  constructor({ content, drawerNavigation, drawerButton, skipLinkButton }) {
    this.#content = content;
    this.#drawerButton = drawerButton;
    this.#drawerNavigation = drawerNavigation;
    this.#skipLinkButton = skipLinkButton;

    this.#init();
  }

  #init() {
    setupSkipToContent(this.#skipLinkButton, this.#content);
    this.#setupDrawer();
  }

  #setupDrawer() {
    this.#drawerButton.addEventListener('click', () => {
      this.#drawerNavigation.classList.toggle('open');
    });

    document.body.addEventListener('click', (event) => {
      const insideDrawer = this.#drawerNavigation.contains(event.target);
      const insideButton = this.#drawerButton.contains(event.target);

      if (!(insideDrawer || insideButton)) {
        this.#drawerNavigation.classList.remove('open');
      }

      this.#drawerNavigation.querySelectorAll('a').forEach((link) => {
        if (link.contains(event.target)) {
          this.#drawerNavigation.classList.remove('open');
        }
      });
    });
  }

  #setupNavigationList() {
    const isLogin = !!getAccessToken();
    const navListMain = this.#drawerNavigation.children.namedItem('navlist-main');
    const navList     = this.#drawerNavigation.children.namedItem('navlist');

    if (!isLogin) {
      navListMain.innerHTML = '';
      navList.innerHTML     = generateUnauthenticatedNavigationListTemplate();
      return;
    }

    navListMain.innerHTML = generateMainNavigationListTemplate();
    navList.innerHTML     = generateAuthenticatedNavigationListTemplate();

    document.getElementById('logout-button')
      .addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm('Apakah Anda yakin ingin keluar?')) {
          getLogout();
          location.hash = '/login';
        }
      });
  }

  #setupBrandLinks() {
    const isLogin    = !!getAccessToken();
    const brandLinks = document.querySelectorAll('.brand-name__link');
    brandLinks.forEach((link) => {
      link.href = isLogin ? '#/stories' : '#/';
    });
  }

  async #setupPushNotification() {
    const tools = document.getElementById('push-notification-tools');
    if (!tools) return;

    if (!getAccessToken()) {
      tools.innerHTML = '';
      return;
    }

    const subscribed = await isCurrentPushSubscriptionAvailable();
    if (subscribed) {
      tools.innerHTML = generateUnsubscribeButtonTemplate();
      document.getElementById('unsubscribe-button')
        ?.addEventListener('click', () => {
          unsubscribe().finally(() => this.#setupPushNotification());
        });
      return;
    }

    tools.innerHTML = generateSubscribeButtonTemplate();
    document.getElementById('subscribe-button')
      ?.addEventListener('click', () => {
        subscribe().finally(() => this.#setupPushNotification());
      });
  }

  async renderPage() {
  try {
    // Dapatkan route saat ini
    const url = getActiveRoute();
    const getPage = routes[url] || routes['/'];
    const page = getPage();

    // Lakukan transisi dengan helper
    const transition = transitionHelper({
      updateDOM: async () => {
        // Render halaman baru
        this.#content.innerHTML = await page.render();
      },
    });

    // Tunggu transisi selesai dan DOM sudah ter-update
    await transition.ready;

    // Jalankan afterRender (hook tambahan halaman)
    await page.afterRender();

    // Scroll ke atas setelah render halaman
    window.scrollTo({ top: 0, behavior: 'instant' });

    // Setup UI tambahan seperti navigasi dan push notif setelah render
    this.#setupNavigationList();
    this.#setupBrandLinks();

    if (isServiceWorkerAvailable()) {
      await this.#setupPushNotification();
    }

    // Beri tahu kalau halaman sudah selesai di-render
    console.log(`[App] Halaman '${url}' berhasil dirender.`);
  } catch (error) {
    console.error('[App] Gagal merender halaman:', error);
    this.#content.innerHTML = '<p class="error">Gagal memuat halaman. Silakan coba lagi.</p>';
  }
}

}
