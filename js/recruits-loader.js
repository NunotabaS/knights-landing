var Recruits = (function () {
  function Character (id, phase, level, aff) {
    this.id = id;
    this.phase = phase;
    this.level = level;
    this.affection = aff;

    this._nameCh = null;
    this._nameEn = null;
    this._profession = null;
    this._rarity = -1;
    this._range = null;
  }

  Character.prototype.populate = function (recruits) {
    try {
      var char = recruits.get(this.id);
      this._nameCh = char['name'];
      this._nameEn = char['appellation'];
      this._profession = char['profession'];
      this._rarity = char['rarity'] + 1;
      this._range = recruits.getRange(this.id, this.phase);
    } catch (e) {}
  }

  function Range (rangedef) {
    this._direction = rangedef.direction;
    this._grid = rangedef.grids;
  }

  /**
   * Returns new range object that conforms to the new direction
   **/
  Range.prototype.conformDirection = function (direction) {
    // Figure out how many clockwise rotations we need
    var rotations = (direction - this._direction + 4) % 4;
    var grid = this._grid;
    while (rotations > 0) {
      // Apply a clockwise rotation
      grid = grid.map(function (item) {
        return {
          'row': item.col,
          'col': - item.row
        }
      });
      rotations --;
    }
    return new Range({
      'direction': direction,
      'grids': grid
    });
  }

  Range.prototype.asCells = function (row, col) {
    return this._grid.map(function (item) {
      return {
        'row': item.row + row,
        'col': item.col + col
      }
    });
  }

  function Recruits () {
    this._deckElement = null;
    this._hand = [];
    this._dragging = null;

    this.characters = null;
    this.ranges = null;
    this.professions = {};
  }

  Recruits.prototype.setDeck = function (deckElement) {
    this._deckElement = deckElement;
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
      this.ranges = {};
      // Load professions
      for (var id in characters) {
        if (!(characters[id].profession in this.professions)) {
          this.professions[characters[id].profession] = [];
        }
        this.professions[characters[id].profession].push(id);
      }
      // Load ranges
      for (var rangeId in ranges) {
        this.ranges[rangeId] = new Range(ranges[rangeId]);
      }
    }).bind(this));
  }

  Recruits.prototype.get = function (id) {
    if (this.characters === null) {
      throw new Error(`[Recruits] Char list null. Did you load?`);
    }
    if (Array.isArray(id)) {
      return id.map((function (_id) {
          return this.get(_id);
        }).bind(this));
    }
    if (id in this.characters) {
      return this.characters[id];
    } else {
      throw new Error(`Character id=${id} not found!`);
    }
  }

  Recruits.prototype.getRange = function (id, phase) {
    if (this.characters === null || this.ranges === null) {
      throw new Error(`[Recruits] Range or char list null. Did you load?`);
    }
    var data = this.get(id);
    if (Array.isArray(data)) {
      return data.map((function (character) {
          character.phases[phase]['rangeId'];
          return this.ranges[rangeId];
        }).bind(this));
    } else {
      if (phase >= data.phases.length) {
        throw new Error(
          `Character ${id} has ${data.phase.length} phase(s). N:${phase}`);
      }
      var rangeId = data.phases[phase]['rangeId'];
      return this.ranges[rangeId];
    }
  }

  Recruits.prototype.find = function (search) {
    var found = [];
    for (var id in this.characters) {
      search = search.toLowerCase();
      if (id.toLowerCase().indexOf(search) >= 0) {
        found.push(id);
        continue;
      }
      var nameCh = this.characters[id].name.toLowerCase(),
        nameEn = this.characters[id].appellation.toLowerCase(),
        prof = this.characters[id].profession.toLowerCase();
      if (prof === 'token' || prof === 'trap') {
        prof = 'ps:' + prof;
      } else {
        prof = 'p:' + prof;
      }
      if (nameCh.indexOf(search) >= 0 || nameEn.indexOf(search) >= 0) {
        found.push(id);
        continue;
      }
      if (prof.trim().startsWith(search.trim())) {
        found.push(id);
        continue;
      }
    }
    return found;
  }

  Recruits.prototype.iterate = function (fn) {
    for (var id in this.characters) {
      fn(id);
    }
  }

  Recruits.prototype.getHandCharacter = function (charId) {
    var chars = this._hand.filter(function (chara) {
      return chara.id === charId;
    });
    return chars.length === 0 ? null : chars[0];
  }

  Recruits.prototype.addToHand = function (charId, phase, level, aff) {
    // Make sure the chara exists
    if (!(charId in this.characters)) {
      throw new Error(`[Recruits] Deck: Character ${charId} not found.`);
    }
    if (this._hand.length >= 12) {
      throw new Error(`[Recruits] Deck: Hand Full!`);
    }
    var exists = !this._hand.every(function (chara) {
      return chara.id !== charId;
    });
    if (exists) {
      throw new Error(`Character ${charId} already in hand!`);
    }
    var chara = new Character(charId, phase, level, aff);
    chara.populate(this);
    this._hand.push(chara);
    return chara;
  }

  Recruits.prototype.renderHand = function () {
    if (this._deckElement != null) {
      // Clear the children
      this._deckElement.innerHTML = '';
      for (var i = 0; i < this._hand.length; i++) {
        var char = this._hand[i];
        var card = document.createElement('div');
        card.className = `card p-${char._profession.toLowerCase()}`;
        card.setAttribute('draggable', 'true');
        card.addEventListener('dragstart', (function (self, character) {
          return function () {
            self._dragging = character;
          };
        })(this, char))
        card.addEventListener('dragend', (function (self, character) {
          return function () {
            self._dragging = null;
          };
        })(this, char));
        card.innerText = char._nameEn;

        this._deckElement.appendChild(card);
      }
    }
  }

  return Recruits;
})();
