(function () {
  var $ = function (e) { return document.getElementById(e); };

  var URL_FORMAT = {
    'keys': ['level', 'wave', 'placement'],
    'parsers': {
      'level': HashEncoder.POL_LINEAR('_', ['group', 'id']),
      'wave': HashEncoder.POL_LIST('|'),
      'placement': HashEncoder.POL_LINEAR('-', [])
    },
    'defaults': {
      'level': 'camp_01',
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

  // Game Data
  var recruits = new Recruits();
  var stages = new Stages();
  var map = null;

  // Status
  var _ready = false;

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
    var stage = `${config.group}_${config.id}`;
    var stageUrl = `res/maps/${config.group}/level_${stage}.json`;

    // Get the stage metadata
    try {
      var currentStage = stages.get(stage);
      $('dropdownMenuLink').innerText =
        `${currentStage.code}: ${currentStage.name}`;
    } catch (e) {
      $('dropdownMenuLink').innerText = '???';
    }

    // Load the level data
    return Map.load(stageUrl).then(function (loadedMap) {
      map = loadedMap;
      var filter = hasher.getP(URL_FORMAT.parsers['wave'],
        'wave', '').filter(function(t){return t !== '';}).map(function (t){
          return parseInt(t);
        });
      map.routeOverlay.visible = filter;
      tracker.set('map', map.asRenderable(0, 0, 1280, 720, STYLE));
    }).catch(function (e) {
      alert(e);
      window.location.hash = '#';
      window.location.reload();
      throw e;
    });
  }

  function _populateUI() {

  }

  function _main() {
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
  }

  function _makeAvailable() {
    window.map = map;
    window.recruits = recruits;
    window.stages = stages;
  }

  window.addEventListener('load', function () {
    // Setup the stage
    Promise.all([
      recruits.load('res/characters.json', 'res/range.json'),
      stages.load('res/stages.json')
    ]).then(function () {
      // Create the list
      _populateUI();
      _main();
    }).then(function () {
      return reloadLevel().then(function () {
        _makeAvailable();
      });
    })
  });

  window.addEventListener('hashchange', function () {
    reloadLevel().then(function () {
      _makeAvailable();
    });
  });
})();
