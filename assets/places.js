import { places } from '@params';

const toCoords = c => ({ lat: c[0], lng: c[1] });

window.initMap = function () {
  const uluru = toCoords([-34.90798399999999, -56.1702578]);

  const map = new google.maps.Map(document.getElementById('map'), {
    zoom: 13,
    center: uluru,
  });

  const bubble = new google.maps.InfoWindow();

  const markers = [];

  places.forEach(p => {
    const marker = new google.maps.Marker({
      position: toCoords(p.coords),
      map: map,
    });

    markers.push(marker);

    google.maps.event.addListener(marker, 'click', () => {
      bubble.setContent(p.description.replace(/\n/, '<br />'));
      bubble.open(map, marker);
    });
  });

  const links = document.querySelectorAll('a[data-jump]');

  for (let i = 0; i < links.length; ++i) {
    const index = links[i].dataset.jump;
    const p = places[index];

    links[i].addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();

      bubble.setContent(p.description.replace(/\n/, '<br />'));
      bubble.open(map, markers[i]);

      map.setZoom(15);
      map.setCenter(toCoords(p.coords));

      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
};
