
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

  var MARKER_KEYS = ['bixi', 'grocery', 'police', 'hospital', 'fire', 'gym', 'metro', 'bus', 'park']
  var markers = {};
  var main_marker;

  var selected_key;

  $.each(MARKER_KEYS, function(i, key) {
    markers[key] = []
  });

  function setSelected(key) {
    selected_key = key;
    $('.report_row').removeClass('selected');
    $('.report_row.' + key).addClass('selected');
  }

  function hideMarkersFor(key) {
    if (key == 'all') {
      hideMarkers();
    }
    else {
      $.each(markers[key], function(i, marker) {
        marker.setMap(null);
      });
    }
  }

  function hideMarkers() {
    $.each(MARKER_KEYS, function(i, key) {
      hideMarkersFor(key);
    });
  }

  function resetMarkersFor(key) {
    if (key == 'all') {
      resetMarkers();
    }
    else {
      hideMarkers(key);
      markers[key] = [];
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
      zIndex: 0,
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
        id: key + '_row',
        'class': 'report_row ' + key,
      })
      .append($('<div class="report-image"/>'))
      .append(
        $('<div />', {
          'class': 'report-text',
        })
        .text(text)
      )
      .mouseenter(function() {
        hideMarkers();
        showMarkersFor(key);
        $(this).addClass('hover');
      })
      .mouseleave(function() {
        hideMarkers();
        showMarkersFor(selected_key);
        $(this).removeClass('hover');
      })
      .click(function() {
        hideMarkers();
        showMarkersFor(key);
        setSelected(key);
      })
    .appendTo($('#report'));
  }

  function add_walking_time (key, time) {
    $('#' + key + '_row .report-text').append($('<span>', {
      'class': 'walking_distance'
    }).append(time));
  }

  function fs_add_walking_time (key, lat, lng, loc) {
    var orig_latlng = new google.maps.LatLng(lat, lng);
    var dest_latlng = new google.maps.LatLng(loc.lat, loc.lng);
    getWalkingTime(orig_latlng, dest_latlng, function(walking_time) {
      add_walking_time(key, walking_time);
    });
  }

  function showLocalGroceryStores (lat, lng) {
    foursquare.getGroceryStoresNear(lat, lng, function(items) {
      items = closestItems({lat: lat, lng:lng}, items, 15);
      for (var i = 0; i < 5; i++) {
        var item = items[i];
        if (item) {
          placeMarker('grocery', item.location, 'Grocery ' + item.name, undefined, {icon : item.categories[0].icon});
        }
      };

      var item = items[0];
      if (item) {
      var loc = item.location;

        addReportRow('grocery',
          "The closest grocery store is " +
          items[0].name +
          " and is located " +
          items[0].location.distance +
          " ft from your address."
         );
        fs_add_walking_time('grocery', lat, lng, loc);
      }
    });
  }

  function showLocalBixiStations(loc) {
    var bixis = closestItems(loc, bixi.stations, 20);
    for (var i = 0, len = bixis.length; i < len; i++) {
      placeMarker('bixi', bixis[i], 'Bixi station at ' + bixis[i].name, undefined, {icon: 'images/markers/biximarker.png'});
    }
    var item = bixis[0];
    addReportRow('bixi', "The closest bixi station is at " + item.name);
    fs_add_walking_time('bixi', loc.lat, loc.lng, item);
  }

  function showLocalBusStops(lat, lng) {
    foursquare.getBusStopsNear(lat, lng, function(items) {
      var dat = closestItems({lat: lat, lng: lng}, items, 20);
      for (var i = 0, len = dat.length; i < len; i++) {
        placeMarker('bus', dat[i].location, 'Bus station at ' + dat[i].name, undefined, {icon : dat[i].categories[0].icon});
      }
      if (dat[0]) {
        addReportRow('bus', "The closest Bus station is " + dat[0].name);
        fs_add_walking_time('bus', lat, lng, dat[0].location);
      }
    });
  }
  function showLocalMetroStops(lat, lng) {
    foursquare.getMetroStopsNear(lat, lng, function(items) {
      var dat = closestItems({lat: lat, lng: lng}, items, 10);
      for (var i = 0, len = dat.length; i < len; i++) {
        placeMarker('metro', dat[i].location, 'Metro station at ' + dat[i].name, undefined, {icon : dat[i].categories[0].icon});
      }
      if (dat[0]) {
        addReportRow('metro', "The closest Metro station is " + dat[0].name);
        fs_add_walking_time('metro', lat, lng, dat[0].location);
      }
    });
  }
  function showLocalGyms(lat, lng) {
    foursquare.getGymsNear(lat, lng, function(items) {
      var dat = closestItems({lat: lat, lng: lng}, items, 10);
      for (var i = 0, len = dat.length; i < len; i++) {
        placeMarker('gym', dat[i].location, 'Gym at ' + dat[i].name, undefined, {icon: dat[i].categories[0].icon});
      }
      if (dat[0]) {
        addReportRow('gym', "The closest Gym is " + dat[0].name);
        fs_add_walking_time('gym', lat, lng, dat[0].location);
      }
    });
  }

  function showLocalHospitals(lat, lng) {
    foursquare.getHospitalsNear(lat, lng, function(items) {
      var dat = closestItems({lat: lat, lng: lng}, items, 5);
      for (var i = 0, len = dat.length; i < len; i++) {
        placeMarker('hospital', dat[i].location, 'Hospital at ' + dat[i].name, undefined, {icon : dat[i].categories[0].icon});
      }
      if (dat[0]) {
        addReportRow('hospital', "The closest Hospital is " + dat[0].name);
        fs_add_walking_time('hospital', lat, lng, dat[0].location);
      }
    });
  }

 function showLocalFireStations(lat, lng) {
    foursquare.getFireNear(lat, lng, function(items) {
      var dat = closestItems({lat: lat, lng: lng}, items, 5);
      for (var i = 0, len = dat.length; i < len; i++) {
        placeMarker('fire', dat[i].location, 'Fire Station at ' + dat[i].name, undefined, {icon : dat[i].categories[0].icon});
      }
      if (dat[0]) {
        addReportRow('fire', "The closest Fire station is " + dat[0].name);
        fs_add_walking_time('fire', lat, lng, dat[0].location);
      }
    });
  }

 function showLocalPoliceStations(lat, lng) {
    foursquare.getPoliceNear(lat, lng, function(items) {
      var dat = closestItems({lat: lat, lng: lng}, items, 5);
      for (var i = 0, len = dat.length; i < len; i++) {
        placeMarker('police', dat[i].location, 'Police station at ' + dat[i].name, undefined, {icon : dat[i].categories[0].icon});
      }
      if (dat[0]) {
        addReportRow('police', "The closest Police station is " + dat[0].name);
        fs_add_walking_time('police', lat, lng, dat[0].location);
      }
    });
  }

  function showLocalParks(lat, lng) {
    foursquare.getParksNear(lat, lng, function(items) {
      var dat = closestItems({lat: lat, lng: lng}, items, 2);
      for (var i = 0, len = dat.length; i < len; i++) {
        placeMarker('park', dat[i].location, 'Park at ' + dat[i].name);
      }
      if (dat[0]) {
        addReportRow('park', "The closest Park is " + dat[0].name);
        fs_add_walking_time('park', lat, lng, dat[0].location);
      }
    });
  }

  function codeAddress(address) {
    resetMarkers();
    resetReports();
    $('#search').removeClass('error');
    geocoder.geocode( { 'address': address}, function(results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
        map.setCenter(results[0].geometry.location);
        main_marker = new google.maps.Marker({
            map: map,
            position: results[0].geometry.location,
            zIndex: 200,
            icon: 'images/markers/green-dot.png'
        });
        var marker = main_marker;

        var loc = { lat: results[0].geometry.location.lat(), lng: results[0].geometry.location.lng()};
        addReportRow('all', "Show all markers");
        setSelected('all');
        showLocalGroceryStores(marker.getPosition().lat(), marker.getPosition().lng());
        showLocalBixiStations(loc);
        showLocalBusStops(loc.lat, loc.lng);
        showLocalMetroStops(loc.lat, loc.lng);
        showLocalGyms(loc.lat, loc.lng);
        showLocalPoliceStations(loc.lat, loc.lng);
        showLocalFireStations(loc.lat, loc.lng);
        showLocalHospitals(loc.lat, loc.lng);
        showLocalParks(loc.lat, loc.lng);
      } else {
        $('#search').addClass('error');
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

  $('#submit').button();
  
});


