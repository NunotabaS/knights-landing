var Recruits = (function () {
  function Recruits () {
    this.characters = null;
  }

  Recruits.prototype.load = function (characters, ranges) {
    return Promise.all([
      fetch(characters).then(function (resp) {
        if (resp.status !== 200) {
          throw new Error('[Recruits] Web request failed for ' + characters +
            '.\n Status ' + resp.status);
        }
        return resp.json();
      }),
      fetch(ranges).then(function (resp) {
        if (resp.status !== 200) {
          throw new Error('[Recruits] Web request failed for ' + ranges +
            '.\n Status ' + resp.status);
        }
        return resp.json();
      })
    ]).then((function (data) {
      var characters = data[0], ranges = data[1];
      this.characters = characters;
    }).bind(this));
  }

  return Recruits;
})();
