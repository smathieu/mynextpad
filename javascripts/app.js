
var bixiData = null;
$.getJSON('bikeStations.json', function(data) {
  bixiData = data;
});

function closestBixi(latlng, num) {
  var data = $.map(bixiData, function(dat, i) {
    var lat = Math.abs(dat.lat - latlng.lat);
    var lng = Math.abs(dat.lng - latlng.lng);
    dat.dist = Math.sqrt(lat*lat + lng*lng );
    return dat;
  });

  data.sort(function(a, b) {
    return a.dist - b.dist;
  });

  return data.slice(0, num);
}

$(function() {
  var latlng = new google.maps.LatLng(-34.397, 150.644);

  var map_options = {
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    zoom: 12,
    center: latlng
  };

  var map = new google.maps.Map(document.getElementById("map_canvas"), map_options)
  var geocoder = new google.maps.Geocoder();

  var markers = [];

  function resetMarkers() {
    $.each(markers, function(i, marker) {
      marker.setMap(null);
    });
  };

  function resetReports() {
    $('#report').html('')
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

        foursquare.getGroceryStoresNear(marker.getPosition().lat(), marker.getPosition().lng(), function(items) {
          console.log(items);
          for (var i = 0; i < 5; i++) {
            var item = items[i];
            var loc = item.location;
            var latlng = new google.maps.LatLng(loc.lat, loc.lng);
            var grocery_marker = marker = new google.maps.Marker({
                map: map,
                position: latlng,
                title: 'Grocery ' + item.name
            });
            markers.push(grocery_marker);
          };

          $('#report').append("<div class='report_row'>The closest grocery store is " + 
            items[0].name +
            " and is located " +
            items[0].location.distance + 
            " ft from your address." +
            "</div>");
            
        });

        var loc = { lat: results[0].geometry.location.lat(), lng: results[0].geometry.location.lng()};
        var bixis = closestBixi(loc, 5);

        for (var i = 0, len = bixis.length; i < len; i++) {
          var latlng = new google.maps.LatLng(bixis[i].lat, bixis[i].lng);
          var bixi_marker = new google.maps.Marker({
              map: map,
              position: latlng,
              title: 'Bixi station at ' + bixis[i].name
          });
          markers.push(bixi_marker);
        }
          

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
