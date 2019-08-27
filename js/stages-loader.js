var Stages = (function () {
  function Stages () {
    this.stages = null;
  }
  Stages.prototype.load = function (stagesfile) {
    return fetch(stagesfile).then(function (resp) {
        if (resp.status !== 200) {
          throw new Error('[Stages] Web request failed for ' + stagesfile +
            '.\n Status ' + resp.status);
        }
        return resp.json();
      }).then((function (data) {
        this.stages = {}
        for (stageName in data['stages']) {
          stage = data['stages'][stageName]
          this.stages[stage['stageId']] = stage;
        }
      }).bind(this));
  };

  Stages.prototype.get = function (stageId) {
    if (stageId in this.stages) {
      return this.stages[stageId];
    } else {
      throw new Error('Stage ' + stageId + ' does not exist!');
    }
  }

  return Stages;
})();
