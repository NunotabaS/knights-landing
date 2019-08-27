var Stages = (function () {
  function Stages () {
    this.stages = null;
    this.stageList = null;
  }
  Stages.prototype.load = function (stagesfile) {
    return fetch(stagesfile).then(function (resp) {
        if (resp.status !== 200) {
          throw new Error('[Stages] Web request failed for ' + stagesfile +
            '.\n Status ' + resp.status);
        }
        return resp.json();
      }).then((function (data) {
        var stageList = [];
        this.stages = {};
        for (stageName in data['stages']) {
          stage = data['stages'][stageName];
          this.stages[stage['stageId']] = stage;
          stageList.push(stage);
        }
        this.stageList = stageList.sort(function (a, b) {
            var ca = a.code.split('-'), cb = b.code.split('-');
            if (ca[0] > cb[0] || ca[0] < cb[0]) {
              return ca[0] > cb[0] ? 1 : -1;
            } else if (ca.length > 1 && cb.length > 1) {
              try {
                ca[1] = parseInt(ca[1]);
                cb[1] = parseInt(cb[1]);
              } catch(e) {}
              return ca[1] > cb[1] ? 1 : (ca[1] < cb[1] ? -1 : 0);
            }
          }).map(function (stage) {
            return stage.stageId;
          });
      }).bind(this));
  };

  Stages.prototype.get = function (stageId) {
    // Sort the stages
    if (stageId in this.stages) {
      return this.stages[stageId];
    } else {
      throw new Error(`Stage ${stageId} does not exist!`);
    }
  };

  Stages.prototype.iterate = function (fn) {
    this.stageList.forEach(function (stageId) {
      fn(stageId);
    });
  }

  return Stages;
})();
