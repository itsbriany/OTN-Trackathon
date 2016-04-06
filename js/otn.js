var getColor = function(temp) {
  return temp > 18 ? '#800026' :
    temp > 15  ? '#BD0026' :
    temp > 12  ? '#E31A1C' :
    temp > 9   ? '#FC4E2A' :
    temp > 6   ? '#FD8D3C' :
    temp > 3   ? '#FEB24C' :
    temp > 0   ? '#FED976' :
                 '#FFEDA0';
};

var AnimalTypes = {
  ARCTIC_CHAR: 'Arctic Char',
  GREY_SEAL: 'Grey Seal',
  HALIBUT: 'Halibut'
};

var map = L.map('mapid').setView([49.505, -70.09], 5);

L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpandmbXliNDBjZWd2M2x6bDk3c2ZtOTkifQ._QA7i5Mpkd_m30\
IGElHziw', {
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
    '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
    'Imagery © <a href="http://mapbox.com">Mapbox</a>',
    id: 'mapbox.light'
}).addTo(map);

var sealIcon = L.icon({
    iconUrl: '/js/seal.png',
    iconSize:     [19, 21], // size of the icon
    iconAnchor:   [8, 12], // point of the icon which will correspond to marker's location
    popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
});

var fishIcon = L.icon({
  iconUrl: '/js/char.png',
  iconSize:     [19, 21], // size of the icon
  iconAnchor:   [8, 12], // point of the icon which will correspond to marker's location
  popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
});

var halibutIcon = L.icon({
  iconUrl: '/js/halibut.png',
  iconSize:     [19, 21], // size of the icon
  iconAnchor:   [8, 12], // point of the icon which will correspond to marker's location
  popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
});

var changeImageBackgroundColor = function(marker, temperature) {
  marker.valueOf()._icon.style.backgroundColor = getColor(temperature);
};

var addMovement = function(movement) {
  "use strict";
  try {
    var results = markers.filter(function(marker) {
      return marker.movement.tag_id === movement.tag_id;
    })
      .map(function(marker) {
        var temperature = movement.temp || 'white';
        marker.setLatLng(L.latLng(movement.lat, movement.lon));
        changeImageBackgroundColor(marker, temperature);
        marker.update();
    });
    // Not found
    if (results.length <= 0) {
      var newMarker;
      switch(movement.animalType) {
        case AnimalTypes.ARCTIC_CHAR:
          newMarker = L.marker([movement.lat, movement.lon], {icon: fishIcon});
          break;
        case AnimalTypes.GREY_SEAL:
          newMarker = L.marker([movement.lat, movement.lon], {icon: sealIcon});
          break;
        case AnimalTypes.HALIBUT:
          newMarker = L.marker([movement.lat, movement.lon], {icon: halibutIcon});
          break;
      }
      newMarker.movement = movement;
      markers.push(newMarker.addTo(map));
    }
  } catch (err) {
    console.log(err.message);
  }
};

var selectMovement = function(animalType, movementIndex) {
  "use strict";
  switch(animalType) {
    case AnimalTypes.GREY_SEAL:
      return greySealMovements[movementIndex];
    case AnimalTypes.ARCTIC_CHAR:
      return charMovements[movementIndex];
    case AnimalTypes.HALIBUT:
      return halibutMovements[movementIndex];
    default:
      return greySealMovements[movementIndex];
  }
};

var getMovements = function(movementIndex, animalType) {
  "use strict";
  return Rx.Observable.from(movementIndex)
    .zip(Rx.Observable.interval(1000), function (movementIndex) {
      return selectMovement(animalType, movementIndex);
    })
    .flatMap(function(movements) {
      return movements.map(function(movement) {
        movement.animalType = animalType;
        return movement;
      });
    })
    .onErrorResumeNext(Rx.Observable.just('Encountered Invalid Data.'));
};

var markers = [];

var doMovements = function() {
  "use strict";
  var sealMovementStream = getMovements(greySealMovementIndices, AnimalTypes.GREY_SEAL);
  var charMovementStream = getMovements(charMovementIndices, AnimalTypes.ARCTIC_CHAR);
  var halibutMovementStream = getMovements(halibutMovementIndices, AnimalTypes.HALIBUT);

  var movementStreams = sealMovementStream
    .merge(charMovementStream)
    .merge(halibutMovementStream);

  movementStreams.subscribe(
    function(movement) {
      "use strict";
      addMovement(movement);
    },
    function(err) {
      "use strict";
      console.log(err.message);
    },
    function() {
      "use strict";
      console.log('Done!');
    }
  );
};

doMovements();