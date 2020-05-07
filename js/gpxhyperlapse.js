// Be a good client-side citizen and define GpxHyperlapseApp object and locally
// scoped variables
var GpxHyperlapseApp = GpxHyperlapseApp || {};

GpxHyperlapseApp.hyperlapse = null;
GpxHyperlapseApp.xmlGpx = '';
GpxHyperlapseApp.isLoaded = false;
GpxHyperlapseApp.Strava_access_token = null;
GpxHyperlapseApp.Strava_athlete = null;
GpxHyperlapseApp.Strava_athlete_id = null;
GpxHyperlapseApp.startPoint = null;
GpxHyperlapseApp.endPoint = null;
GpxHyperlapseApp.latLngPoints = new Array();

function dropHandler(event) {
  event.preventDefault();
  var filelist = event.dataTransfer.files;
  if (!filelist) return;
  if (filelist.length > 0) {
    var file = filelist[0];
    var filereader = new FileReader();
    filereader.onloadend =
        function() {
      readerOnLoadEnd(filereader, file);
    }

    if (file.name.indexOf('.gpx') > -1) {
      filereader.readAsText(file);
    }
    else {
      alert('Not a GPX file!');
    }
  }
  return false;
}

function readerOnLoadEnd(filereader, file) {
  var filename = file.name;
  var fileContents = filereader.result;
  GpxHyperlapseApp.xmlGpx = fileContents;
  $('#pano').html('');

  var gpxWayPoints = $(GpxHyperlapseApp.xmlGpx).find('trkpt');

  var i = Math.floor((gpxWayPoints.length - 1) / 8);

  GpxHyperlapseApp.startPoint = new google.maps.LatLng(
      gpxWayPoints[0].attributes['lat'].value,
      gpxWayPoints[0].attributes['lon'].value);
  GpxHyperlapseApp.endPoint = new google.maps.LatLng(
      gpxWayPoints[gpxWayPoints.length - 1].attributes['lat'].value,
      gpxWayPoints[gpxWayPoints.length - 1].attributes['lon'].value);

  GpxHyperlapseApp.latLngPoints = new Array();
  for (j = 0; j < gpxWayPoints.length; j++) {
    GpxHyperlapseApp.latLngPoints.push(new google.maps.LatLng(
        gpxWayPoints[j].attributes['lat'].value,
        gpxWayPoints[j].attributes['lon'].value));
  }

  loadHyperlapse();
}

function makeDrop(e) {
  e.preventDefault();
  document.getElementById('dropTarget').style.backgroundColor = '#CCCCCC';
}

function leaveDrop(e) {
  e.preventDefault();
  document.getElementById('dropTarget').style.backgroundColor = '#FFFFFF';
}

function loadHyperlapse() {
  if (GpxHyperlapseApp.hyperlapse) {
    GpxHyperlapseApp.hyperlapse.reset();
  }

  GpxHyperlapseApp.hyperlapse =
      new Hyperlapse(document.getElementById('pano'), {
        lookat: GpxHyperlapseApp.startPoint,
        zoom: 2,
        use_lookat: viewModel.use_lookat(),
        // elevation: 100,
        millis: viewModel.millis(),
        max_points: viewModel.max_points()

      });

  GpxHyperlapseApp.hyperlapse.onError = function(e) {
    console.log(e);
  };

  GpxHyperlapseApp.hyperlapse.onRouteComplete = function(e) {
    console.log(e);
    GpxHyperlapseApp.hyperlapse.load();
  };
  // load route coordinates
  GpxHyperlapseApp.hyperlapse.onRouteProgress = function(e) {
    // console.log(e);
    $('#loading').css('visibility', 'visible');
    $('#loading span')
        .html(
            'Loading coordinates ' + e.position + ' of ' +
            viewModel.max_points());
  };

  // load panorama
  GpxHyperlapseApp.hyperlapse.onLoadProgress = function(e) {
    $('#loading span')
        .html(
            'Loading panorama ' + e.position + ' of ' + viewModel.max_points());
    console.log(e);
  };
  // add position marker
  function addMarker(location, map) {
    var marker = new google.maps.Marker({position: location, map: map});
  }

  GpxHyperlapseApp.hyperlapse.onFrame = function(e) {
    // console.log(e);

    $('#slider').slider({
      value: e.position,
      min: 0,
      max: e.max - 1,
      step: 1,
      slide: function(event, ui) {
        GpxHyperlapseApp.hyperlapse.setPosition(ui.value);
        console.log(ui.value);
        // set Marker on map
        console.log(
            GpxHyperlapseApp.hyperlapse.getPointCoor(ui.value).lat() + ',' +
            GpxHyperlapseApp.hyperlapse.getPointCoor(ui.value).lng());
        var map = initialize_map();
        var myLatLng = GpxHyperlapseApp.hyperlapse.getPointCoor(ui.value);
        addMarker(myLatLng, map);
      }
    });
  };

  GpxHyperlapseApp.hyperlapse.onLoadComplete = function(e) {
    $('iframe#youtube').hide();
    $('#controls').show();
    $('#settings').show();
    $('#loading').css('visibility', 'hidden');
    // viewModel.toggleHyperlapseSize();
    GpxHyperlapseApp.hyperlapse.play();
  };

  var directions_service = new google.maps.DirectionsService();

  var route = {
    request: {
      origin: GpxHyperlapseApp.startPoint,
      destination: GpxHyperlapseApp.endPoint,
      latLngPoints: GpxHyperlapseApp.latLngPoints
    }
  };

  GpxHyperlapseApp.hyperlapse.generate(route);
}

function getCookie(cname) {
  var name = cname + '=';
  var ca = document.cookie.split(';');
  for (var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') c = c.substring(1);
    if (c.indexOf(name) != -1) return c.substring(name.length, c.length);
  }
  return '';
}

$(function() {
  /*
  var MAPMYAPI_CLIENT_ID = "ezx6uqtc26h6agp9u5nsydxbbbs2dmm5";
  var MAPMYAPI_AUTHORIZATON_ENDPOINT =
  "https://www.mapmyfitness.com/v7.0/oauth2/authorize/";

  var mapmyapi_code = getCookie("mapmyapi_code");
  if (mapmyapi_code)
  {

  }
  else
  {
      $('a.connectMyMyApi').show();

      var authUrl = MAPMYAPI_AUTHORIZATON_ENDPOINT +
        "?response_type=code" +
        "&client_id=" + MAPMYAPI_CLIENT_ID +
        "&redirect_uri=" + location.protocol + '//' + location.host +
  "/mapmyapiauth/" +
        "&state=activities&approval_prompt=force";

      $("a.connectMyMyApi").attr("href", authUrl);
  }
  */

  var STRAVA_CLIENT_ID = 3822;
  var STRAVA_AUTHORIZATION_ENDPOINT = 'https://www.strava.com/oauth/authorize';
  var strava_code = getCookie('strava_code');
  if (strava_code) {
    $.ajax({
      type: 'POST',
      contentType: 'application/json; charset=utf-8',
      url: 'Strava.svc/Auth',
      data: '{"code": "' + strava_code + '"}',
      dataType: 'json',
      success: function(response) {
        GpxHyperlapseApp.StravaAuth = JSON.parse(response.AuthResult);
        GpxHyperlapseApp.Strava_access_token =
            GpxHyperlapseApp.StravaAuth.access_token;
        GpxHyperlapseApp.Strava_athlete = GpxHyperlapseApp.StravaAuth.athlete;
        GpxHyperlapseApp.Strava_athlete_id =
            GpxHyperlapseApp.StravaAuth.athlete.id;

        $('div.authenticatedStrava').show();

        $('span.user').text(GpxHyperlapseApp.StravaAuth.athlete.firstname);

        loadActivities();
      },
      error: function(message) {
        alert('error has occured');
      }
    });


  } else {
    $('a.connectStrava').show();

    var authUrl = STRAVA_AUTHORIZATION_ENDPOINT + '?response_type=code' +
        '&client_id=' + STRAVA_CLIENT_ID +
        '&redirect_uri=' + location.protocol + '//' + location.host +
        '/stravaauth/' +
        '&state=activities&approval_prompt=force';

    $('a.connectStrava').attr('href', authUrl);
  }
});

function loadActivities() {
  $.getJSON(
      'https://www.strava.com/api/v3/athlete/activities?access_token=' +
          GpxHyperlapseApp.Strava_access_token + '&per_page=100&callback=?',
      function(data) {
        viewModel.stravaActivities(data);
      });
}

function loadStravaActivity(id) {
  $.getJSON(
      'https://www.strava.com/api/v3/activities/' + id +
          '/streams/latlng?access_token=' +
          GpxHyperlapseApp.Strava_access_token + '&callback=?',
      function(data) {
        GpxHyperlapseApp.xmlGpx = data[0];
        $('#pano').html('');

        var maxPoints = data[0].data.length;

        console.log('maxPoints: ' + maxPoints);

        if (maxPoints > viewModel.max_points() * 2) {
          viewModel.max_points(Math.floor(maxPoints / 3));
        } else {
          viewModel.max_points(maxPoints);
        }

        GpxHyperlapseApp.latLngPoints = new Array();
        for (j = 0; j < data[0].data.length; j++) {
          GpxHyperlapseApp.latLngPoints.push(
              new google.maps.LatLng(data[0].data[j][0], data[0].data[j][1]));
        }

        loadHyperlapse();
      });
}


var viewModel = {

  use_lookat: ko.observable(false),
  millis: ko.observable(1000),
  max_points: ko.observable(200),
  stravaActivities: ko.observableArray([]),
  isLoaded: ko.observable(false),
  reloadHyperlapse: function() {
    $('#pano').html('');
    loadHyperlapse();
    GpxHyperlapseApp.isLoaded = false;
    viewModel.isLoaded = false;
  },
  loadStravaHyperlapse: function(activity) {
    loadStravaActivity(activity.id);
    // the next line is required to work around a bug in WebKit (Chrome /
    // Safari)
    location.href = '#';
    location.href = '#pano';
  },
  pauseHyperlapse: function() {
    GpxHyperlapseApp.hyperlapse.pause();
  },
  playHyperlapse: function() {
    GpxHyperlapseApp.hyperlapse.play();
  },
  nextHyperlapse: function() {
    GpxHyperlapseApp.hyperlapse.next();
  },
  prevHyperlapse: function() {
    GpxHyperlapseApp.hyperlapse.prev();
  },
  toggleHyperlapseSize: function() {
    if ($('#controls').css('position') == 'absolute') {
      $('#controls').css('position', '');
      $('canvas').css('position', '');
      $('canvas').css('top', '');
      $('canvas').css('left', '');
      $('canvas').css('width', '');
      $('canvas').css('height', '');
      $('#controls').css('z-index', '');
      $('#controls').css('top', '');
      $('#controls').css('width', '');
      $('#controls').css('left', '');

    } else {
      $('canvas').css('position', 'absolute');
      $('canvas').css('top', window.pageYOffset);
      $('canvas').css('left', 0);
      $('canvas').css('width', document.body.clientWidth);
      $('canvas').css('height', window.innerHeight);
      $('#controls').css('z-index', '100');
      $('#controls').css('position', 'absolute')
      $('#controls').css('top', window.pageYOffset + window.innerHeight - 46);
      $('#controls').css('width', document.body.clientWidth - 16);
      $('#controls').css('left', '0');
    }
  }

};

function init() {
  var dropTarget = document.getElementById('dropTarget');
  dropTarget.addEventListener('dragenter', makeDrop, false);
  dropTarget.addEventListener('dragover', makeDrop, false);
  dropTarget.addEventListener('dragleave', leaveDrop, false);
  dropTarget.addEventListener('drop', dropHandler, false);

  ko.applyBindings(viewModel);

  viewModel.max_points.subscribe(function(newValue) {
    if (GpxHyperlapseApp.hyperlapse)
      GpxHyperlapseApp.hyperlapse.max_points = newValue;
  });

  viewModel.millis.subscribe(function(newValue) {
    if (GpxHyperlapseApp.hyperlapse)
      GpxHyperlapseApp.hyperlapse.millis = newValue;
  });

  // Check for the various File API support.
  if (window.File && window.FileReader && window.FileList && window.Blob) {
    //
  }

  // document.getElementById('files').addEventListener('change',
  // handleFileUpload, false);
  // var offsetPixels = 100;

  /*$(window).scroll(function() {
    if ($('#controls').css('position') == 'absolute') {
      $('canvas').css('top', window.pageYOffset);
      $('#controls').css('top', window.pageYOffset + window.innerHeight - 46);
    }
  });*/
  initialize_map()
}

function initialize_map() {
  var map = new google.maps.Map(
      document.getElementById('map_canvas'),
      {mapTypeId: google.maps.MapTypeId.TERRAIN});

  $.ajax({
    type: 'GET',
    url: '../../Mercury_RouteB_20200427_113553.gpx',
    dataType: 'xml',
    success: function(xml) {
      var points = [];
      var bounds = new google.maps.LatLngBounds();
      $(xml).find('trkpt').each(function() {
        var lat = $(this).attr('lat');
        var lon = $(this).attr('lon');
        var p = new google.maps.LatLng(lat, lon);
        points.push(p);
        bounds.extend(p);
      });

      var poly = new google.maps.Polyline({
        // use your own style here
        path: points,
        strokeColor: '#FF00AA',
        strokeOpacity: .7,
        strokeWeight: 4
      });

      poly.setMap(map);

      // fit bounds to track
      map.fitBounds(bounds);
    }
  });
  return map
}

$(document).ready(function() {
  init();
});
