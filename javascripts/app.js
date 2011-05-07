
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

  var MARKER_KEYS = ['bixi', 'grocery']
  var markers = {};
  var main_marker;
  $.each(MARKER_KEYS, function(i, key) {
    markers[key] = []
  });

  function resetMarkersFor(key) {
    $.each(markers[key], function(i, marker) {
      marker.setMap(null);
    });
  }

  function resetMarkers() {
    if (main_marker) {
      main_marker.setMap(null);
    }
    $.each(MARKER_KEYS, function(i, key) {
      resetMarkersFor(key);
    });
  };

  function resetReports() {
    $('#report').html('')
  }

  function showLocalGroceryStores (lat, lng) {
    foursquare.getGroceryStoresNear(lat, lng, function(items) {
      log(items);
      for (var i = 0; i < 5; i++) {
        var item = items[i];
        var loc = item.location;
        var latlng = new google.maps.LatLng(loc.lat, loc.lng);
        var grocery_marker = new google.maps.Marker({
          map: map,
            position: latlng,
            title: 'Grocery ' + item.name
        });

        google.maps.event.addListener(grocery_marker, 'click', (function(marker, item) {
          return function() {
            infowindow.close();
            infowindow.setContent(item.name);
            infowindow.setPosition(marker.getPosition());
            infowindow.open(map, marker);
          }
        })(grocery_marker, item));

        markers['grocery'].push(grocery_marker);
      };

      var item = items[0];
      var loc = item.location;
      var orig_latlng = new google.maps.LatLng(lat, lng);
      var dest_latlng = new google.maps.LatLng(loc.lat, loc.lng);
      getWalkingTime(orig_latlng, dest_latlng, function(walking_time) {
        $('#report').append("<div class='report_row'>The closest grocery store is " + 
          item.name +
          " and is located " +
          item.location.distance + 
          " ft from your address. " +
          "Walk time : " + walking_time +
          "</div>");
      });

    });
  }

  function codeAddress(address) {
    resetMarkers();
    resetReports();
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
        var bixis = closestItems(loc, bixi.stations, 5);

        for (var i = 0, len = bixis.length; i < len; i++) {
          var latlng = new google.maps.LatLng(bixis[i].lat, bixis[i].lng);
          var bixi_marker = new google.maps.Marker({
              map: map,
              position: latlng,
              icon: 'images/biximarker.png',
              title: 'Bixi station at ' + bixis[i].name
          });
          markers['bixi'].push(bixi_marker);
        }
        
        foursquare.getBusStopsNear(marker.getPosition().lat(), marker.getPosition().lng(), function(items) {
          var dat = closestItems(loc, items, 5);
        });

      } else {
        alert("Geocode was not successful for the following reason: " + status);
      }
    });
  }

  $('#search_form').submit(function(event) {
    event.preventDefault()
    codeAddress($('#search').val());
  });
  

  codeAddress('Montreal, QC');

});
