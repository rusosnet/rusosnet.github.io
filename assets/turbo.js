import { ga } from '@params';
import * as Turbo from '@hotwired/turbo';

// google analytics
window.dataLayer = window.dataLayer || [];

function gtag() {
  dataLayer.push(arguments);
}

document.addEventListener('turbo:load', e => {
  gtag('js', new Date());
  gtag('config', ga.ID, { page_location: e.detail.url });
});
