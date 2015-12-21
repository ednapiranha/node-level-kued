'use strict';

var Kued = function (options) {
  var level = require('level');
  var ttl = require('level-ttl');
  var uuid = require('uuid');
  var Sublevel = require('level-sublevel');
  var concat = require('concat-stream');

  var self = this;
  var TTL = 60000;

  options = options || {};

  this.dbPath = options.dbPath || './db';
  this.queueTTL = parseInt(options.queueTTL, 10) || TTL;
  this.pairTTL = parseInt(options.pairTTL, 10) || TTL;
  this.limit = parseInt(options.limit, 10) || 2;

  if (this.limit < 2) {
    throw new Error('You need a limit greater than 1');
  }

  var db = Sublevel(level(this.dbPath, {
    createIfMissing: true,
    valueEncoding: 'json'
  }));

  this.queued = db.sublevel('queued');
  this.paired = db.sublevel('paired');
  this.items = db.sublevel('items');

  var getQueued = function (next) {
    var rs = self.queued.createReadStream();

    rs.pipe(concat(function (q) {
      next(null, {
        queued: q
      });
    }));

    rs.on('error', function (err) {
      next(err);
    });
  };

  var setPairKey = function (key, item) {
    self.items.put('pairKey!' + item.key, key, { ttl: self.pairTTL }, function (err) {
      if (err) {
        throw err;
      }

      self.queued.del(item.key);
    });
  };

  var addPair = function (origKey, items, next) {
    var key = uuid.v4();
    self.paired.put(key, items, { ttl: self.pairTTL }, function (err) {
      if (err) {
        next(err);
        return;
      }

      items.forEach(function (item) {
        setPairKey(key, item);
      });

      next(null, {
        origKey: origKey,
        pairKey: key
      });
    });
  };

  var getKey = function (key, next) {
    getQueued(function (err, q) {
      if (err) {
        next(err);
        return;
      }

      if (q.queued.length >= self.limit) {
        addPair(key, q.queued, next);
      } else {
        next(null, {
          origKey: key,
          pairKey: false
        });
      }
    });
  };

  this.add = function (value, next) {
    var key = uuid.v4();

    this.queued.put(key, value, { ttl: this.queueTTL }, function (err) {
      if (err) {
        next(err);
        return;
      }

      getKey(key, next);
    });
  };

  this.getPair = function (key, next) {
    this.items.get('pairKey!' + key, function (err, pairKey) {
      if (err || !pairKey) {
        next(new Error('No pairing found'));
        return;
      }

      self.paired.get(pairKey, function (err, pair) {
        if (err || !pair) {
          next(new Error('No pairing found'));
          return;
        }

        next(null, pair);
      });
    });
  };

  this.cancel = function (key, next) {
    var pairKey;

    // kick user out of the queue
    this.queued.del(key);

    this.getPair(key, function (err, pair) {
      if (err) {
        next(err);
        return;
      }

      // kick everything in this pair out of db
      pair.forEach(function (p) {
        self.items.get('pairKey!' + p.key, function (err, pairKey) {
          self.paired.del(pairKey);
          self.items.del(p.key);
        });
      });

      next(null, true);
    });
  };
};

module.exports = Kued;
