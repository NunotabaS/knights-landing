var Map = (function () {
  var _circle = function (ctx, x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.stroke();
  }

  function Tile(tileData) {
    this.type = tileData['tileKey'];
    this.height = tileData['heightType'];
    this.buildable = tileData['buildableType'];
  }

  Tile.prototype.getEdgeColor = function (ctx) {
    switch(this.type) {
      case 'tile_end':
        return 'rgb(113, 189, 242)';
      case 'tile_start':
      case 'tile_flystart':
        return 'rgb(209, 44, 54)';
      default:
        return ctx.style.fgColor;
    };
  }

  Tile.prototype.getFill = function (ctx) {
    switch(this.type) {
      case 'tile_end':
        return 'rgb(133, 209, 255)';
      case 'tile_start':
      case 'tile_flystart':
        return 'rgb(229, 64, 74)';
      default:
        return ctx.style.bgColor;
    }
  }

  Tile.prototype.renderInside = function (ctx, x, y, w, h) {
    ctx.save();
    if (this.height > 0) {
      // Raised platform, draw inset if standard
      if (this.type === 'tile_flystart') {
        ctx.strokeStyle = 'rgb(255, 140, 150)';
        var r = Math.min(w, h) / 4, d = 1.2 * r;
        _circle(ctx, x + d, y + d, 0.8 * r);
        _circle(ctx, x + w - d, y + d, 0.8 * r);
        _circle(ctx, x + w - d, y + h - d, 0.8 * r);
        _circle(ctx, x + d, y + h - d, 0.8 * r);
        ctx.strokeRect(x + d, y + d, w - 2 * d, h - 2 * d);
      } else {
        var innerW = w - 8, innerH = h - 8, innerX = x + 4, innerY = y + 4;
        ctx.fillStyle = (this.buildable === 0 ? '#94959b' :
          ctx.style.fgColor);
        ctx.fillRect(innerX, innerY, innerW, innerH);
      }
    } else {
      // Ground level
      if (this.type === 'tile_hole') {
        ctx.strokeStyle = '#94959b';
        ctx.lineWidth = 2;
        var r = (Math.min(w, h) - 8) / 2;
        _circle(ctx, x + r + 4, y + r + 4, r);
      } else if (this.buildable === 0) {
        ctx.strokeStyle = '#94959b';
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 10]);
        ctx.strokeRect(x + 4, y + 4, w - 8, h - 8);
      }
    }
    ctx.restore();
  }

  Tile.prototype.draw = function (ctx, x, y, edgeLen) {
    ctx.save();
    ctx.lineWidth = 2;
    ctx.strokeStyle = this.getEdgeColor(ctx);
    ctx.strokeRect(x + 2, y + 2, edgeLen - 8, edgeLen - 8);
    ctx.fillStyle = this.getFill(ctx);
    ctx.fillRect(x + 4, y + 4, edgeLen - 12, edgeLen - 12);

    this.renderInside(ctx, x + 4, y + 4, edgeLen - 12, edgeLen - 12);

    ctx.restore();
  }

  function CharacterOverlay () {
    this.map = map;
    this.tiles = [];
    // Populate the tiles
    for (var i = 0; i < this.map.tileHeight; i++) {
      this.tiles.push([]);
      for (var j = 0; j < this.map.tileWidth; j++) {
        this.tiles[i].push(null);
      }
    }
  }

  CharacterOverlay.prototype.draw = function (i, j, ctx, x, y, edgeLen) {
    if (this.tiles[i][j] !== null) {
      ctx.save();
      ctx.globalAlpha = 0.5;
      this.tiles[i][j].render(ctx, x, y, edgeLen);
      ctx.restore();
    }
  }

  function RouteOverlay (routeData, mapWidth, mapHeight) {
    this.routes = [];
    this.visible = [];
    // Populate the routes
    routeData.forEach((function (route) {
      var record = {}
      if (route === null) {
        record.mode = -1;
        this.routes.push(record);
        return;
      }
      record.mode = route.motionMode;
      record.checkpoints = route.checkpoints.map(function (point) {
        return {
          type: point.type,
          h: mapHeight - point.position.row - 1,
          w: point.position.col
        }
      });
      record.checkpoints.push({
        type: 0,
        h: mapHeight - route.endPosition.row - 1,
        w: route.endPosition.col
      });

      record.start = {
        h: mapHeight - route.startPosition.row - 1,
        w: route.startPosition.col
      }
      this.routes.push(record);
    }).bind(this));
  }

  RouteOverlay.prototype.draw = function (ctx, edgeLen) {
    ctx.globalAlpha = 0.8;
    ctx.strokeStyle = 'rgb(209, 44, 54)';
    ctx.lineWidth = 4;
    this.visible.forEach((function (routeId) {
      ctx.save();
      if (routeId < this.routes.length) {
        var route = this.routes[routeId];
        if (route.mode < 0) {
          return; // We don't support these kinds of routes
        }
        if (route.mode === 1) {
          // Draw air units differently
          ctx.setLineDash([10, 10]);
        }
        ctx.beginPath();
        ctx.moveTo(edgeLen * route.start.w + edgeLen / 2,
          edgeLen * route.start.h + edgeLen / 2);
        route.checkpoints.forEach(function (item) {
          if (item.type !== 0) {
            return; // Other types not supported
          }
          // Go to the center
          ctx.lineTo(edgeLen * item.w + (edgeLen / 2),
            edgeLen * item.h + (edgeLen / 2));
        });
        ctx.stroke();
      }
      ctx.restore();
    }).bind(this));
  }

  function Map(mapData) {
    this.tileWidth = 0;
    this.tileHeight = 0;
    this.tiles = [];

    this._parse(mapData);
    this.characterOverlay = null;
    this.routeOverlay = null;
  }

  Map.CharacterOverlay = CharacterOverlay;
  Map.RouteOverlay = RouteOverlay;

  Map.load = function (mapfile) {
    return fetch(mapfile).then(function (resp) {
      if (resp.status !== 200) {
        throw new Error('[Map] Web request failed for ' + mapfile +
          '.\n Status ' + resp.status);
      }
      return resp.json();
    }).then(function (levelData) {
      var map = new Map(levelData['mapData']);
      // Set up the routes too
      map.routeOverlay = new Map.RouteOverlay(levelData['routes'],
        map.tileWidth, map.tileHeight)
      return map;
    });
  };

  Map.prototype._parse = function (mapData) {
    this.tiles = [];
    this.tileHeight = mapData['map'].length;
    this.tileWidth = mapData['map'][0].length;
    // Create tiles
    for (var h = 0; h < this.tileHeight; h++) {
      this.tiles.push([]);
      for (var w = 0; w < this.tileWidth; w++) {
        var line = this.tiles[this.tiles.length - 1];
        line.push(new Tile(mapData['tiles'][mapData['map'][h][w]]))
      }
    }
  }

  Map.prototype.draw = function (ctx, edgeLen) {
    ctx.save();
    // Render the tiles
    for (var h = 0; h < this.tileHeight; h++) {
      for (var w = 0; w < this.tileWidth; w++) {
        var tileX = edgeLen * w, tileY = edgeLen * h;
        this.tiles[h][w].draw(ctx, tileX, tileY, edgeLen);
      }
    }
    ctx.restore();

    if (this.characterOverlay !== null) {
      ctx.save();
      this.characterOverlay.draw(ctx, edgeLen);
      ctx.restore();
    }

    if (this.routeOverlay !== null) {
      ctx.save();
      this.routeOverlay.draw(ctx, edgeLen);
      ctx.restore();
    }
  }

  Map.prototype.asRenderable = function (x, y, width, height, style) {
    // Figure out the width and height
    var edgeLen = Math.round(Math.min(width / this.tileWidth,
        height / this.tileHeight));

    // Create a render surface for just the map
    var renderable = new Renderable(edgeLen * this.tileWidth,
      edgeLen * this.tileHeight,
      (function (ctx, width, height) {
          ctx.style = style;
          this.draw(ctx, edgeLen);
        }).bind(this));

    // Create a layable
    var layout = new LayoutRenderable(width, height, renderable);
    return layout;
  }
  return Map;
})();
