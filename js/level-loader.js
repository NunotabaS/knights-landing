var Level = (function () {
  function Level (map, waves, presetChars) {
    this.map = map;
    this.waves = waves;
    this.presetChars = presetChars;

    // Figure out the max emission time
    this._maxEmitTime = -1;
    this.waves.forEach((function (w) {
      if (w.time > this._maxEmitTime) {
        this._maxEmitTime = w.time;
      }
    }).bind(this));
  };

  Level.load = function (levelfile) {
    return fetch(levelfile).then(function (resp) {
      if (resp.status !== 200) {
        throw new Error('[Level] Web request failed for ' + levelfile +
          '.\n Status ' + resp.status);
      }
      return resp.json();
    }).then(function (levelData) {
      // Load the wave data
      var emissions = [];
      var chars = [];
      if (levelData['predefines'] !== null &&
        'characterInsts' in levelData['predefines']) {

        chars = levelData['predefines']['characterInsts'];
      }

      // Populate the emissions
      if ('waves' in levelData) {
        var offset = 0;
        levelData['waves'].forEach(function (w) {
          offset += w['preDelay'];
          w['fragments'].forEach(function (frag) {
            frag['actions'].forEach(function (action) {
              emissions.push({
                'time': offset + action['preDelay'],
                'enemy': action['key'],
                'interval': action['interval'],
                'count': action['count'],
                'route': action['routeIndex'],
                'type': action['actionType']
              });
            });
          })
        });
        emissions = emissions.sort(function (a, b) {
          return a.time > b.time ? 1 : (a.time < b.time ? -1 : 0);
        })
      }

      return Map.load(levelData['mapData']).then((function (map) {
        var level = new Level(map, emissions, chars);
        // Set up the map overlays
        if (map.routeOverlay !== null) {
          map.routeOverlay.setRoutes(levelData['routes']);
        }
        // Set up the existing characters on the field
        if (chars.length > 0) {

        }
        return level;
      }).bind(this));
    });
  };

  Level.prototype.findRoutes = function (t) {
    if (t < 0) {
      return [];
    }
    var lowRange = -1, highRange = this._maxEmitTime;
    this.waves.forEach(function (emitted) {
      if (emitted.time <= t) {
        lowRange = Math.max(lowRange, emitted.time);
      } else {
        highRange = Math.min(highRange, emitted.time);
      }
    });
    return this.waves.filter(function (w) {
      return w.time >= lowRange && w.time < highRange;
    });
  };

  return Level;
})();
