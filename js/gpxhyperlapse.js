// Be a good client-side citizen and define GpxHyperlapseApp object and locally
// scoped variables
var GpxHyperlapseApp = GpxHyperlapseApp || {};
var currentGpxContents = {
  'points': [],
  'bounds': new google.maps.LatLngBounds()
};

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
    // fill dictionary for map initialization
    currentGpxContents.points.push(new google.maps.LatLng(
        gpxWayPoints[j].attributes['lat'].value,
        gpxWayPoints[j].attributes['lon'].value));
    currentGpxContents.bounds.extend(new google.maps.LatLng(
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
        max_points: viewModel.max_points(),
        gpxContents: currentGpxContents,
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
        var myLatLng = GpxHyperlapseApp.hyperlapse.getPointCoor(ui.value);
        GpxHyperlapseApp.hyperlapse.addMarker(myLatLng);
      }
    });
  };

  GpxHyperlapseApp.hyperlapse.onLoadComplete = function(e) {
    $('#controls').show();
    $('#settings').show();
    $('#loading').css('visibility', 'hidden');
    viewModel.toggleHyperlapseSize();
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
      $('#controls').css('z-index', '');
      $('#controls').css('position', 'absolute')
      $('#controls').css('top', '');
      $('#controls').css('width', '');
      $('#controls').css('left', '');
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
}

$(document).ready(function() {
  init();
});
