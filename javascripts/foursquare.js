var foursquare = (function(fs) {
  var client_id = 'I1ATRYBZLDI0EDEZFGC1BADYRVRMLOUMB3GNNS2WNB1U4LHE';
  var secret = 'BCZOYVOBG2GOBTR2NTSNX3QVAVWDDJN2AZ2XIIEPGJQRV1TK';
  var search_url = 'https://api.foursquare.com/v2/venues/search';
  var default_params = {
    client_id: client_id,
    client_secret: secret
  }

  fs.getVenuesNear = function(lat, lng, callback) {
    var latlng = lat + ',' + lng;
    var params = $.extend(default_params, {ll: latlng});
    $.getJSON(search_url, params, callback);
  }

  return fs;
})(foursquare || {});
