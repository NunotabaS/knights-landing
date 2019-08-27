var Dropdown = (function () {
  function Dropdown(button, list) {
    this._btn = button;
    this._list = list;
    this._isDropped = false;

    this._choices = {};

    this._bind();
  }

  Dropdown.prototype._bind = function () {
    this._btn.addEventListener('click', (function (e) {
      e.preventDefault();
      this.toggle();
    }).bind(this))
  };

  Dropdown.prototype.toggle = function (state) {
    this._isDropped = (typeof state === 'boolean') ? state : !this._isDropped;
    this._list.classList.toggle('show', this._isDropped);
  }

  Dropdown.prototype.addItem = function (id, label, href) {
    if (id in this._choices) {
      throw new Error(`[Dropdown] Add: Item ${id} exists.`);
    }
    var item = document.createElement('a');

    item.addEventListener('click', (function (e) {
      this.toggle(false);
    }).bind(this));

    if (typeof href === 'string') {
      item.setAttribute('href', href);
    } else if (typeof href === 'function') {
      item.addEventListener('click', function (e) {
        e.preventDefault();
        href(e);
      });
    }
    item.innerText = label;
    item.className = 'dropdown-item';

    this._choices[id] = {
      'dom': item
    };
    this._list.appendChild(item);
  };

  Dropdown.prototype.setSelected = function () {

  };
  return Dropdown;
})();
