(function () {
  var $ = function (e) { return document.getElementById(e); };
  var _shuf = function (array) {
    for (var i = array.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }
    return array;
  }

  var URL_FORMAT = {
    'keys': ['level', 'wave', 'placement'],
    'parsers': {
      'level': HashEncoder.POL_LINEAR('_', ['group', 'id']),
      'wave': HashEncoder.POL_LIST('|'),
      'placement': HashEncoder.POL_LIST(';')
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
  var currentMap = null;
  var currentLevel = null;

  var renderFrame = function (context) {
    // Clear the background
    context.clearRect(0, 0, 1280, 720);

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
    var folder = config.group === 'sub' ? 'main' : config.group;
    var stageUrl = `res/maps/${folder}/level_${stage}.json`;

    // Get the stage metadata
    try {
      var currentStage = stages.get(stage);
      $('stage-selector').innerText =
        `${currentStage.code}: ${currentStage.name}`;
    } catch (e) {
      $('stage-selector').innerText = '???';
    }

    // Reset the slider
    $('wave-selector').value = -0.1;

    // Load the level data
    return Level.load(stageUrl).then(function (level) {
      $('wave-selector').setAttribute('max', level._maxEmitTime + 0.1);
      tracker.set('map', level.map.asRenderable(0, 0, 1280, 720, STYLE));
      currentMap = level.map;
      currentLevel = level;
    }).catch(function (e) {
      alert(e);
      window.location.hash = '';
      window.location.reload();
      throw e;
    });
  }

  function _populateUI(stageSelector) {
    // Bind the deck
    recruits.setDeck($('deck'));
    // Add the stages
    stages.iterate(function (stageId) {
      var stage = stages.get(stageId);
      var linker = hasher.clone();
      linker.set('level', stageId);

      stageSelector.addItem(stageId,
        `${stage.code}: ${stage.name}`, linker.encode());
    });
    // Randomly put some ops in hand
    _shuf(recruits.find('p:')).slice(0, 12).forEach(function (id) {
      recruits.addToHand(id, 1, 1, 100);
      recruits.renderHand();
    });
    // Bind the slider event
    $('wave-selector').addEventListener('input', function (e) {
      var val = typeof e.target.value === 'number' ? e.target.value :
        parseFloat(e.target.value);
      if (currentLevel !== null && currentMap !== null) {
        if (currentMap.routeOverlay !== null) {
          currentMap.routeOverlay.visible =
            currentLevel.findRoutes(val).map(function (r) {
              return r['route'];
            });
          console.log(currentMap.routeOverlay.visible);
          var mapRenderable = tracker.get('map');
          if (typeof mapRenderable !== 'undefined' && mapRenderable !== null) {
            mapRenderable.invalidate();
          }
        }
      }
    });
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
    $('main').addEventListener('dragover', function (e) {
      var mapRenderable = tracker.get('map');
      if (typeof mapRenderable === 'undefined' || mapRenderable === null) {
        return;
      }
      var pos = mapRenderable.deref(e.offsetX, e.offsetY);
      var cell = map.deref(pos, 1280, 720);
      var operator = recruits._dragging;
      if (operator !== null) {
        currentMap.areaOverlay.removeOverlay(operator.id + '_self');
        currentMap.areaOverlay.addOverlay(operator.id + '_self',
          null, cell.direction, cell, '#ffff00');
        currentMap.areaOverlay.removeOverlay(operator.id);
        currentMap.areaOverlay.addOverlay(operator.id,
          operator._range, cell.direction, cell);
      }
      mapRenderable.invalidate();
    });
    $('main').addEventListener('click', function (e) {

    });
  }

  function _makeAvailable() {
    window.map = currentMap;
    window.level = currentLevel;
    window.recruits = recruits;
    window.stages = stages;
    window.tracker = tracker;
    window.placeFromHand = function (charId, row, col) {
      var char = recruits.getHandCharacter(charId);
      currentMap.areaOverlay.addOverlay(charId,
        char._range, 1, {'row': row, 'col': col});
      tracker.invalidate();
    }
  }

  window.addEventListener('load', function () {
    // Bind the UI elements
    var stageSelector = new Dropdown($('stage-selector'), $('stage-list'));

    // Setup the stage
    Promise.all([
      recruits.load('res/characters.json', 'res/range.json'),
      stages.load('res/stages.json')
    ]).then(function () {
      // Create the list
      _populateUI(stageSelector);
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
