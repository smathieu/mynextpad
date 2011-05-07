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

  function codeAddress(address) {
    resetMarkers();
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
                title: item.name
            });
            markers.push(grocery_marker);
          };
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
