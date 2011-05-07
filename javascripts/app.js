$(function() {
  var log = function(msg) {
    if (console) {
      console.log(msg);
    }
  }
  var latlng = new google.maps.LatLng(-34.397, 150.644);

  var map_options = {
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    zoom: 12,
    center: latlng
  };

  var map = new google.maps.Map(document.getElementById("map_canvas"), map_options)
  var geocoder = new google.maps.Geocoder();
  var infowindow = new google.maps.InfoWindow({ 
    size: new google.maps.Size(50,50)
  });

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
          log(items);
          for (var i = 0; i < 5; i++) {
            var item = items[i];
            var loc = item.location;
            var latlng = new google.maps.LatLng(loc.lat, loc.lng);
            var grocery_marker = new google.maps.Marker({
                map: map,
                position: latlng,
                title: item.name
            });

            google.maps.event.addListener(grocery_marker, 'click', (function(marker, item) {
              return function() {
                infowindow.close();
                infowindow.setContent(item.name);
                infowindow.setPosition(marker.getPosition());
                infowindow.open(map, marker);
              }
            })(grocery_marker, item));
            
            markers.push(grocery_marker);
          };

          $('#report').append("<div class='report_row'>The closest grocery store is " + 
            items[0].name +
            " and is located " +
            items[0].location.distance + 
            " ft from your address." +
            "</div>");
            
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
