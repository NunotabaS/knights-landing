var HashEncoder = (function () {
  var HashEncoder = function (policy) {
    this._policy = policy;
    this._values = {};
  };

  HashEncoder.POL_LIST = function (separator) {
    return {
      'encode': function (data) { return data.join(separator); },
      'decode': function (value) { return value.split(separator); }
    }
  }

  HashEncoder.POL_LINEAR = function (separator, keys) {
    return {
      'decode': function (value) {
        var segments = value.split(separator);
        var output = {};
        for (var i = 0; i < keys.length; i++) {
          if (i < segments.length) {
            output[keys[i]] = segments[i];
          }
        }
        return output;
      },
      'encode': function (data) {
        var output = [];
        for (var i = 0; i < keys.length; i++) {
          if (keys[i] in data) {
            output.push(data[keys[i]])
          } else {
            output.push('');
          }
        }
        return output.join(separator);
      }
    };
  }

  HashEncoder.prototype.parse = function () {
    var hashStr = window.location.hash;
    if (hashStr.length === 0) {
      return;
    }
    this._values = this._policy.decode(hashStr.substring(1));
    return this;
  };

  HashEncoder.prototype.get = function (key, defaultValue) {
    if (key in this._values) {
      return this._values[key];
    }
    return defaultValue;
  };

  HashEncoder.prototype.getP = function (policy, key, defaultValue) {
    try {
      return policy.decode(this.get(key, defaultValue));
    } catch (e) {
      return policy.decode(defaultValue);
    }
  };

  HashEncoder.prototype.set = function (key, value) {
    // Navigates the page too!
    this._values[key] = value;
    return this;
  };

  HashEncoder.prototype.setP = function (policy, key, value) {
    this._values[key] = policy.encode(value);
    return this;
  }

  HashEncoder.prototype.encode = function () {
    return '#' + this._policy.encode(this._values);
  };

  return HashEncoder;
})();
