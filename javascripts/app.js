$(function() {
    var latlng = new google.maps.LatLng(-34.397, 150.644);
  
    var map_options = {
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      zoom: 8,
      center: latlng
    };
  
  var map = new google.maps.Map(document.getElementById("map_canvas"), map_options)
});
