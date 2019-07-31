(function () {
  var $ = function (e) { return document.getElementById(e); };

  var URL_FORMAT = {
    'keys': ['level', 'wave', 'placement'],
    'parsers': {
      'level': HashEncoder.POL_LINEAR(':', ['group', 'id']),
      'wave': HashEncoder.POL_LIST('|'),
      'placement': HashEncoder.POL_LINEAR('-', [])
    },
    'defaults': {
      'level': 'camp:01',
      'wave': '',
      'placement': ''
    }
  };

  var STYLE = {
    'bgColor': '#34353b',
    'fgColor': '#f1f1f1'
  };

  var tracker = new RenderTracker();
  var hasher = new HashEncoder(HashEncoder.POL_LINEAR(',', URL_FORMAT.keys));
  var _map = null;
  var renderFrame = function (context) {
    // Draw the background
    context.fillStyle = STYLE.bgColor;
    context.fillRect(0, 0, 1280, 720);

    // Render the field
    tracker.iterate((function (renderable) {
      context.save();
      renderable.render(context, 0, 0);
      context.restore();
    }).bind(this));
  }

  var reloadLevel = function () {
    // Force a re-fetch
    hasher.parse();
    var config = hasher.getP(URL_FORMAT.parsers['level'], 'level',
      URL_FORMAT.defaults['level']);
    var url = `res/${config.group}/level_${config.group}_${config.id}.json`;

    // Load the level data
    fetch(url).then(function (resp) {
      if (resp.status !== 200) {
        throw new Error('Web request failed for ' + url +
          '.\n Status ' + resp.status);
      }
      return resp.json();
    }).then(function (levelData) {
      map = new Map(levelData['mapData']);

      // Load the overlays
      map.routeOverlay = new Map.RouteOverlay(
        levelData['routes'], map.tileWidth, map.tileHeight);
      var filter = hasher.getP(URL_FORMAT.parsers['wave'],
        'wave', '').filter(function(t){return t !== '';}).map(function (t){
          return parseInt(t);
        });
      map.routeOverlay.visible = filter;

      tracker.set('map', map.asRenderable(0, 0, 1280, 720, STYLE));
      window.map = map;
    }).catch(function (e) {
      alert(e);
      throw e;
    });
  }

  window.addEventListener('load', function () {
    // Set up an raf main loop
    var context = $('main').getContext('2d');

    // Setup the frame animations
    var _frame = function () {
      renderFrame(context);
      window.requestAnimationFrame(_frame);
    };
    _frame();

    // Setup event dispatchers
    $('main').addEventListener('mousemove', function (e) {
      //console.log(e.offsetX, e.offsetY);
    });
    $('main').addEventListener('click', function (e) {

    });
    reloadLevel();
  });

  window.addEventListener('hashchange', function () {
    reloadLevel();
  })
})();
