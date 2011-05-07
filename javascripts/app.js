
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

  var markers = [];

  function placeMarker(loc, name, content) {
    if (!content) content = name;


    var latlng = new google.maps.LatLng(loc.lat, loc.lng);
    var mark = new google.maps.Marker({
      map: map,
        position: latlng,
        title: name
    });

    google.maps.event.addListener(mark, 'click', function() {
      infowindow.close();
      infowindow.setContent(name);
      infowindow.setPosition(mark.getPosition());
      infowindow.open(map, mark);
    });

    markers.push(mark);
  }

  function resetMarkers() {
    $.each(markers, function(i, marker) {
      marker.setMap(null);
    });
  };

  function resetReports() {
    $('#report').html('')
  }

  function showLocalGroceryStores (lat, lng) {
    foursquare.getGroceryStoresNear(lat, lng, function(items) {
      items = closestItems({lat: lat, lng:lng}, items, 5);
      for (var i = 0; i < 5; i++) {
        var item = items[i];
        placeMarker(item.location, 'Grocery ' + item.name);
      };

      $('<li>', {
        'class': 'report_row grocery',
      })
        .append($('<img />'))
        .append("The closest grocery store is " + 
          items[0].name +
          " and is located " +
          items[0].location.distance + 
          " ft from your address.")
        .appendTo($('#report'));
    });
  }

  function showLocalBixiStations(loc) {
    var bixis = closestItems(loc, bixi.stations, 5);
    for (var i = 0, len = bixis.length; i < len; i++) {
      placeMarker(bixis[i], 'Bixi station at ' + bixis[i].name);
    }
  }

  function showLocalBusStops(lat, lng) {
    foursquare.getBusStopsNear(lat, lng, function(items) {
      var dat = closestItems({lat: lat, lng: lng}, items, 5);
      for (var i = 0, len = dat.length; i < len; i++) {
        placeMarker(dat[i].location, 'Bus station at ' + dat[i].name);
      }
    });
  }
  function showLocalMetroStops(lat, lng) {
    foursquare.getMetroStopsNear(lat, lng, function(items) {
      var dat = closestItems({lat: lat, lng: lng}, items, 2);
      for (var i = 0, len = dat.length; i < len; i++) {
        placeMarker(dat[i].location, 'Metro station at ' + dat[i].name);
      }
    });
  }
  function showLocalGyms(lat, lng) {
    foursquare.getGymsNear(lat, lng, function(items) {
      var dat = closestItems({lat: lat, lng: lng}, items, 2);
      for (var i = 0, len = dat.length; i < len; i++) {
        placeMarker(dat[i].location, 'Gym at ' + dat[i].name);
      }
    });
  }

 function showLocalHospitals(lat, lng) {
    foursquare.getHospitalsNear(lat, lng, function(items) {
      var dat = closestItems({lat: lat, lng: lng}, items, 2);
      for (var i = 0, len = dat.length; i < len; i++) {
        placeMarker(dat[i].location, 'Hospital at ' + dat[i].name);
      }
    });
  }

 function showLocalFireStations(lat, lng) {
    foursquare.getFireNear(lat, lng, function(items) {
      var dat = closestItems({lat: lat, lng: lng}, items, 2);
      for (var i = 0, len = dat.length; i < len; i++) {
        placeMarker(dat[i].location, 'Fire Station at ' + dat[i].name);
      }
    });
  }

 function showLocalPoliceStations(lat, lng) {
    foursquare.getPoliceNear(lat, lng, function(items) {
      var dat = closestItems({lat: lat, lng: lng}, items, 2);
      for (var i = 0, len = dat.length; i < len; i++) {
        placeMarker(dat[i].location, 'Police station at ' + dat[i].name);
      }
    });
  }


  function codeAddress(address) {
    resetMarkers();
    resetReports();
    geocoder.geocode( { 'address': address}, function(results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
        map.setCenter(results[0].geometry.location);
        var marker = new google.maps.Marker({
            map: map,
            position: results[0].geometry.location
        });
        markers.push(marker);
        showLocalGroceryStores(marker.getPosition().lat(), marker.getPosition().lng());

        var loc = { lat: results[0].geometry.location.lat(), lng: results[0].geometry.location.lng()};
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
  

  codeAddress('Montreal, QC');

});
