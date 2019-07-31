var Renderable = (function () {
  // Buffered render environment
  function Renderable (width, height, redrawFunction) {
    this._canvas = document.createElement('canvas');
    this._ctx = this._canvas.getContext('2d');

    this._isDirty = false;
    this._redrawFn = redrawFunction;

    this.resize(width, height);
  };

  Renderable.prototype.getDimensions = function () {
    return {
      'width': this._width,
      'height': this._height
    };
  }

  Renderable.prototype.resize = function (width, height) {
    this._width = width;
    this._height = height;
    this._canvas.width = width;
    this._canvas.height = height;
    this._ctx = this._canvas.getContext('2d');
    this._isDirty = true;
  }

  Renderable.prototype.redraw = function () {
    this._redrawFn(this._ctx, this._width, this._height);
    this._isDirty = false;
  };

  Renderable.prototype.render = function (ctx, x, y) {
    if (this._isDirty) {
      this.redraw();
    }
    ctx.drawImage(this._canvas, x, y);
  };

  return Renderable;
})();

var LayoutRenderable = (function () {
  function LayoutRenderable (width, height, renderable) {
    this._child = renderable;

    var childSize = this._child.getDimensions();
    this._xOffset = (width - childSize.width) / 2;
    this._yOffset = (height - childSize.height) / 2;
  }

  LayoutRenderable.prototype.render = function (ctx, x, y) {
    this._child.render(ctx, x + this._xOffset, y + this._yOffset);
  }
  return LayoutRenderable;
})();

var RenderTracker = (function () {
  function Tracker () {
    this._order = [];
    this._tracked = {};
  }

  Tracker.prototype.set = function (name, value) {
    if (this._order.indexOf(name) < 0) {
      this._order.push(name);
    }
    this._tracked[name] = value;
  }

  Tracker.prototype.unset = function (name) {
    this._order = this._order.filter(function (item) {
      return item !== name;
    });
    delete this._tracked[name];
  }

  Tracker.prototype.clear = function () {
    this._order = [];
    this._tracked = {};
  }

  Tracker.prototype.iterate = function (callback) {
    this._order.forEach((function (name) {
      if (name in this._tracked) {
        callback(this._tracked[name]);
      }
    }).bind(this));
  }

  return Tracker;
})();
