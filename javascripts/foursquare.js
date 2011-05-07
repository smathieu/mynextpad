var foursquare = (function(fs) {
  var client_id = 'I1ATRYBZLDI0EDEZFGC1BADYRVRMLOUMB3GNNS2WNB1U4LHE';
  var secret = 'BCZOYVOBG2GOBTR2NTSNX3QVAVWDDJN2AZ2XIIEPGJQRV1TK';
  var search_url = 'https://api.foursquare.com/v2/venues/search';
  var default_params = {
    client_id: client_id,
    client_secret: secret
  }

  fs.getVenuesNear = function(lat, lng, callback, extra_args) {
    var latlng = lat + ',' + lng;
    var params = $.extend({}, default_params, {ll: latlng});
    if (extra_args) {
      params = $.extend(params, extra_args);
    }
    $.getJSON(search_url, params, function(json) {
      var items = json.response.groups[0].items;
      items = items.sort(function(el1, el2) {
        return el1.location.distance - el2.location.distance;
      });
      callback(items);
    });
  };

  fs.getGroceryStoresNear = function(lat, lng, callback) {
    var category_id = '4bf58dd8d48988d118951735';
    fs.getVenuesNear(lat, lng, callback, {categoryId: category_id});
  };

  fs.getBusStopsNear = function(lat, lng, cb) {
    var cat = '4bf58dd8d48988d1fe931735';
    fs.getVenuesNear(lat, lng, cb, {categoryId: cat});
  }
  fs.getMetroStopsNear = function(lat, lng, cb) {
    var cat = '4bf58dd8d48988d1fd931735';
    fs.getVenuesNear(lat, lng, cb, {categoryId: cat});
  }

  fs.getHospitalsNear = function(lat, lng, cb) {
    var cat = '4bf58dd8d48988d196941735';
    fs.getVenuesNear(lat, lng, cb, {categoryId: cat});
  }
  fs.getGymsNear = function(lat, lng, cb) {
    var cat = '4bf58dd8d48988d176941735';
    fs.getVenuesNear(lat, lng, cb, {categoryId: cat});
  }
  fs.getPoliceNear = function(lat, lng, cb) {
    var cat = '4bf58dd8d48988d12e941735';
    fs.getVenuesNear(lat, lng, cb, {categoryId: cat});
  }
  fs.getFireNear = function(lat, lng, cb) {
    var cat = '4bf58dd8d48988d12c941735';
    fs.getVenuesNear(lat, lng, cb, {categoryId: cat});
  }
  fs.getParksNear = function(lat, lng, cb) {
    var cat = '4bf58dd8d48988d163941735';
    fs.getVenuesNear(lat, lng, cb, {categoryId: cat});
  }
  fs.getSchoolsNear = function(lat, lng, cb) {
    var cat = '4bf58dd8d48988d13b941735';
    fs.getVenuesNear(lat, lng, cb, { categoryId: cat });
  }

  fs.getConvenienceStoresNear = function(lat, lng, cb) {
    var cat = '4d954b0ea243a5684a65b473';
    fs.getVenuesNear(lat, lng, cb, {categoryId: cat});
  }

  fs.getDrugstoresNear = function(lat, lng, cb) {
    var cat = '4bf58dd8d48988d10f951735';
    fs.getVenuesNear(lat, lng, cb, {categoryId: cat});
  }

  return fs;
})(foursquare || {});
