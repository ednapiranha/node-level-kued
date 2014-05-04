'use strict';

var Kued = function (options) {
  var level = require('level');
  var ttl = require('level-ttl');
  var uuid = require('uuid');
  var Sublevel = require('level-sublevel');
  var concat = require('concat-stream');

  var queuedList = [];
  var self = this;

  options = options || {};


  this.dbPath = options.db || './db';
  this.ttl = parseInt(options.ttl, 10) || 1000;
  this.limit = parseInt(options.limit, 10) || 2;
  this.queued = Sublevel(level(this.dbPath, {
    createIfMissing: true,
    valueEncoding: 'json'
  }));

  var getQueued = function (next) {
    var rs = self.queued.createReadStream({
      limit: self.limit
    });

    rs.pipe(concat(function (q) {
      next(null, {
        queued: q
      });
    }));

    rs.on('error', function (err) {
      next(err);
    });
  };

  this.add = function (value, next) {
    getQueued(function (err, q) {
      if (err) {
        next(err);
        return;
      }

      queued.put('queued!' + uuid.v4(), value, { ttl: self.ttl }, function (err) {
        if (err) {
          next(err);
          return;
        }

        next(null, key);
      });
    });
  };

  this.release = function () {
    getQueued(function (err, q) {
      if (err) {
        next(err);
        return;
      }

      if (q.length < self.limit) {
        next(new Error('Not enough in the queue to match the minimum limit'));
        return;
      }

      next(null, q);
    });
  };
};

module.exports = Kued;
