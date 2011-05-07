
function calcDistances(latlng, data) {
  return $.map(data, function(dat, i) {
    var d = $.extend({}, dat);
    var loc = d.location?d.location:d;
    var lat = Math.abs(loc.lat - latlng.lat);
    var lng = Math.abs(loc.lng - latlng.lng);
    d.dist = Math.sqrt(lat*lat + lng*lng );
    return d;
  });
}

function closestItems(latlng, data, num) {
  var data = calcDistances(latlng, data);
  data.sort(function(a, b) {
    return a.dist - b.dist;
  });
  return data.slice(0, num);
}

$(function() {
  var directionsService = new google.maps.DirectionsService();

  function getWalkingTime(start_latlng, end_latlng, callback) {
    var request = {
      origin:  start_latlng,
      destination: end_latlng,
      travelMode: google.maps.TravelMode.WALKING
    };
    directionsService.route(request, function(response, status) {
      if (status == google.maps.DirectionsStatus.OK) {
        var duration = response.routes[0].legs[0].duration.text;
        callback(duration);
      }
      else {
        log('Error checking walking time');
        log(status);
      }
    });
  }

  var log = function(msg) {
    if (console) {
      console.log(msg);
    }
  }
  var latlng = new google.maps.LatLng(-34.397, 150.644);

  var map_options = {
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    zoom: 15,
    center: latlng
  };

  var map = new google.maps.Map(document.getElementById("map_canvas"), map_options)
  var geocoder = new google.maps.Geocoder();
  var infowindow = new google.maps.InfoWindow({ 
    size: new google.maps.Size(50,50)
  });

  var MARKER_KEYS = ['bixi', 'grocery', 'police', 'hospital', 'fire', 'gym', 'metro', 'bus']
  var markers = {};
  var main_marker;

  var selected_key = 'all';

  $.each(MARKER_KEYS, function(i, key) {
    markers[key] = []
  });

  function resetMarkersFor(key) {
    if (key == 'all') {
      resetMarkers();
    }
    else {
      $.each(markers[key], function(i, marker) {
        marker.setMap(null);
      });
    }
  }

  function showMarkersFor(key) {
    if (key == 'all') {
      showMarkers();
    }
    else {
      $.each(markers[key], function(i, marker) {
        marker.setMap(map);
      });
    }
  }

  function showMarkers() {
    if (main_marker) {
      main_marker.setMap(map);
    }
    $.each(MARKER_KEYS, function(i, key) {
      showMarkersFor(key);
    });
  };

  function resetMarkers() {
    if (main_marker) {
      main_marker.setMap(null);
    }
    $.each(MARKER_KEYS, function(i, key) {
      resetMarkersFor(key);
    });
  };

  function placeMarker(key, loc, name, content, options) {
    if (!content) content = name;

    var latlng = new google.maps.LatLng(loc.lat, loc.lng);
    var marker_params = {
      map: map,
      position: latlng,
      title: name
    };
    marker_params = $.extend(marker_params, options);
    var mark = new google.maps.Marker(marker_params);

    google.maps.event.addListener(mark, 'click', function() {
      infowindow.close();
      infowindow.setContent(name);
      infowindow.setPosition(mark.getPosition());
      infowindow.open(map, mark);
    });

    markers[key].push(mark);
  }

  function resetReports() {
    $('#report').html('')
  }
  function addReportRow(key, text) {
    return $('<li>', {
        'class': 'report_row ' + key,
      })
      .append($('<div class="report-image"/>'))
      .append($('<div />', {
        'class': 'report-text',
      })
      .text(text))
      .mouseenter(function() {
        resetMarkers();
        showMarkersFor(key);
      })
      .mouseleave(function() {
        resetMarkers();
        showMarkersFor(selected_key);
      })
      .click(function() {
        resetMarkers();
        showMarkersFor(key);
        selected_key = key;
      })
    .appendTo($('#report'));
  }

  function showLocalGroceryStores (lat, lng) {
    foursquare.getGroceryStoresNear(lat, lng, function(items) {
      items = closestItems({lat: lat, lng:lng}, items, 5);
      for (var i = 0; i < 5; i++) {
        var item = items[i];
        placeMarker('grocery', item.location, 'Grocery ' + item.name);
      };

      var item = items[0];
      var loc = item.location;
      var orig_latlng = new google.maps.LatLng(lat, lng);
      var dest_latlng = new google.maps.LatLng(loc.lat, loc.lng);

      getWalkingTime(orig_latlng, dest_latlng, function(walking_time) {
        addReportRow('grocery',
          "The closest grocery store is " +
          items[0].name +
          " and is located " +
          items[0].location.distance +
          " ft from your address."
         );
      });
    });
  }

  function showLocalBixiStations(loc) {
    var bixis = closestItems(loc, bixi.stations, 5);
    for (var i = 0, len = bixis.length; i < len; i++) {
      placeMarker('bixi', bixis[i], 'Bixi station at ' + bixis[i].name, undefined, {icon: 'images/biximarker.png'});
    }
    var item = bixis[0];
    addReportRow('bixi', "The closest bixi station is at " + item.name);
  }

  function showLocalBusStops(lat, lng) {
    foursquare.getBusStopsNear(lat, lng, function(items) {
      var dat = closestItems({lat: lat, lng: lng}, items, 5);
      for (var i = 0, len = dat.length; i < len; i++) {
        placeMarker('bus', dat[i].location, 'Bus station at ' + dat[i].name);
      }
      if (dat[0]) {
        addReportRow('bus', "The closest Bus station is " + dat[0].name);
      }
    });
  }
  function showLocalMetroStops(lat, lng) {
    foursquare.getMetroStopsNear(lat, lng, function(items) {
      var dat = closestItems({lat: lat, lng: lng}, items, 2);
      for (var i = 0, len = dat.length; i < len; i++) {
        placeMarker('metro', dat[i].location, 'Metro station at ' + dat[i].name);
      }
      if (dat[0]) {
        addReportRow('metro', "The closest Metro station is " + dat[0].name);
      }
    });
  }
  function showLocalGyms(lat, lng) {
    foursquare.getGymsNear(lat, lng, function(items) {
      var dat = closestItems({lat: lat, lng: lng}, items, 2);
      for (var i = 0, len = dat.length; i < len; i++) {
        placeMarker('gym', dat[i].location, 'Gym at ' + dat[i].name);
      }
      if (dat[0]) {
        addReportRow('gym', "The closest Gym is " + dat[0].name);
      }
    });
  }

  function showLocalHospitals(lat, lng) {
    foursquare.getHospitalsNear(lat, lng, function(items) {
      var dat = closestItems({lat: lat, lng: lng}, items, 2);
      for (var i = 0, len = dat.length; i < len; i++) {
        placeMarker('hospital', dat[i].location, 'Hospital at ' + dat[i].name);
      }
      if (dat[0]) {
        addReportRow('hospital', "The closest Hospital is " + dat[0].name);
      }
    });
  }

 function showLocalFireStations(lat, lng) {
    foursquare.getFireNear(lat, lng, function(items) {
      var dat = closestItems({lat: lat, lng: lng}, items, 2);
      for (var i = 0, len = dat.length; i < len; i++) {
        placeMarker('fire', dat[i].location, 'Fire Station at ' + dat[i].name);
      }
      if (dat[0]) {
        addReportRow('fire', "The closest Fire station is " + dat[0].name);
      }
    });
  }

 function showLocalPoliceStations(lat, lng) {
    foursquare.getPoliceNear(lat, lng, function(items) {
      var dat = closestItems({lat: lat, lng: lng}, items, 2);
      for (var i = 0, len = dat.length; i < len; i++) {
        placeMarker('police', dat[i].location, 'Police station at ' + dat[i].name);
      }
      if (dat[0]) {
        addReportRow('police', "The closest Police station is " + dat[0].name);
      }
    });
  }


  function codeAddress(address) {
    resetMarkers();
    resetReports();
    selected_key = 'all';
    geocoder.geocode( { 'address': address}, function(results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
        map.setCenter(results[0].geometry.location);
        main_marker = new google.maps.Marker({
            map: map,
            position: results[0].geometry.location
        });
        var marker = main_marker;
        showLocalGroceryStores(marker.getPosition().lat(), marker.getPosition().lng());

        var loc = { lat: results[0].geometry.location.lat(), lng: results[0].geometry.location.lng()};
        addReportRow('all', "Show all markers");
        showLocalBixiStations(loc);
        showLocalBusStops(loc.lat, loc.lng);
        showLocalMetroStops(loc.lat, loc.lng);
        showLocalGyms(loc.lat, loc.lng);
        showLocalPoliceStations(loc.lat, loc.lng);
        showLocalFireStations(loc.lat, loc.lng);
        showLocalHospitals(loc.lat, loc.lng);
      } else {
        alert("Geocode was not successful for the following reason: " + status);
      }
    });
  }



  $('#search_form').submit(function(event) {
    event.preventDefault()
    codeAddress($('#search').val());
  });
  
  var default_search = 'Montreal, QC';
  $('#search').val(default_search);
  codeAddress(default_search);

});
