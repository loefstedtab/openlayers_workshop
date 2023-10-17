import Control from 'ol/control/Control';
import Feature from 'ol/Feature';
import GeoJSON from 'ol/format/GeoJSON';
import OSM from 'ol/source/OSM';
import Point from 'ol/geom/Point';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import colormap from 'colormap';
import {DragAndDrop, Draw, Link, Modify, Snap} from 'ol/interaction';
import {Circle as CircleStyle, Fill, Stroke, Style} from 'ol/style';
import {Map, Tile, View} from 'ol';
import {circular} from 'ol/geom/Polygon';
import {fromLonLat} from 'ol/proj';
import {getArea} from 'ol/sphere';
import Geolocation from 'ol/Geolocation.js'

const source = new OSM();

const layer = new TileLayer({
  source: source,
});

const view = new View({
  center: fromLonLat([0, 0]),
  zoom: 2,
});

const map = new Map({
  target: 'map-container',
  layers: [layer],
  view: view,
});

// const min = 1e8; //The smallest Area
// const max = 2e13; //The biggest Area
// const steps = 50;
// const ramp = colormap({
//   colormap: 'blackbody',
//   nshades: steps,
// });

// function clamp(value, low, high) {
//   return Math.max(low, Math.min(value, high));
// }

// function getColor(feature) {
//   const area = getArea(feature.getGeometry());
//   const f = Math.pow(clamp((area - min) / (max - min), 0, 1), 1 / 2);
//   const index = Math.round(f * (steps - 1));
//   return ramp[index];
// }

map.addInteraction(new Link());

// // map.addInteraction(
// //   new DragAndDrop({
// //     source: source,
// //     formatConstructors: [GeoJSON],
// //   })
// // );

// // map.addInteraction(
// //   new Modify({
// //     source: source,
// //   })
// // );

// // map.addInteraction(
// //   new Draw({
// //     type: 'Polygon',
// //     source: source,
// //   })
// // );

// map.addInteraction(
//   new Snap({
//     source: source,
//   })
// );

const clear = document.getElementById('clear');
clear.addEventListener('click', function () {
  source.clear();
});

const format = new GeoJSON({featureProjection: 'EPSG:3857'});
const download = document.getElementById('download');
source.on('change', function () {
  const features = source.getFeatures();
  const json = format.writeFeatures(features);
  download.href =
    'data:application/json;charset=utf-8,' + encodeURIComponent(json);
});

// navigator.geolocation.watchPosition(
//   function (pos) {
//     const coords = [pos.coords.longitude, pos.coords.latitude];
//     const accuracy = circular(coords, pos.coords.accuracy);
//     source.clear(true);
//     source.addFeatures([
//       new Feature(
//         accuracy.transform('EPSG:4326', map.getView().getProjection())
//       ),
//       new Feature(new Point(fromLonLat(coords))),
//     ]);
//   },
//   function (error) {
//     alert(`ERROR: ${error.message}`);
//   },
//   {
//     enableHighAccuracy: true,
//   }
// );

const geolocation = new Geolocation({
  // enableHighAccuracy must be set to true to have the heading value.
  trackingOptions: {
    enableHighAccuracy: true,
  },
  projection: view.getProjection(),
});

geolocation.setTracking(true);

function el(id) {
  return document.getElementById(id);
}

// update the HTML page when the position changes.
geolocation.on('change', function () {
  el('accuracy').innerText = geolocation.getAccuracy() + ' [m]';
  el('altitude').innerText = geolocation.getAltitude() + ' [m]';
  el('altitudeAccuracy').innerText = geolocation.getAltitudeAccuracy() + ' [m]';
  el('heading').innerText = geolocation.getHeading() + ' [rad]';
  el('speed').innerText = geolocation.getSpeed() + ' [m/s]';
});

// handle geolocation error.
geolocation.on('error', function (error) {
  const info = document.getElementById('info');
  info.innerHTML = error.message;
  info.style.display = '';
});

const accuracyFeature = new Feature();
geolocation.on('change:accuracyGeometry', function () {
  accuracyFeature.setGeometry(geolocation.getAccuracyGeometry());
});

const positionFeature = new Feature();
positionFeature.setStyle(
  new Style({
    image: new CircleStyle({
      radius: 6,
      fill: new Fill({
        color: '#3399CC',
      }),
      stroke: new Stroke({
        color: '#fff',
        width: 2,
      }),
    }),
  })
);

geolocation.on('change:position', function () {
  const coordinates = geolocation.getPosition();
  positionFeature.setGeometry(coordinates ? new Point(coordinates) : null);
});

new VectorLayer({
  map: map,
  source: new VectorSource({
    features: [accuracyFeature, positionFeature],
  }),
});

const locate = document.createElement('div');
locate.className = 'ol-control ol-unselectable locate';
locate.innerHTML = '<button title="Locate me">◎</button>';
locate.addEventListener('click', function () {
  if (!source.isEmpty()) {
    map.getView().fit(source.getExtent(), {
      maxZoom: 18,
      duration: 500,
    });
  }
});

map.addControl(
  new Control({
    element: locate,
  })
);
