'use strict';

process.env.NODE_ENV = 'test';

var should = require('should');
var child = require('child_process');
var Kued = require('../index');

var q = new Kued({
  dbPath: './test/db',
  queueTTL: 1,
  pairTTL: 1
});

var currKey;

describe('kued', function () {
  after(function () {
    child.exec('rm -rf ./test/db/*');
  });

  describe('.add', function () {
    it('should add two items to the queue', function (done) {
      q.add('test', function (err, key1) {
        should.exist(key1);
        key1.pairKey.should.equal(false); // false pairing key because we only have 1 not 2 items available

        q.add('test2', function (err, key2) {
          should.exist(key2);
          currKey = key2.origKey;
          should.exist(key2.pairKey);
          done();
        });
      });
    });
  });

  describe('.getPair', function () {
    it('should get two items from the queue', function (done) {
      q.getPair(currKey, function (err, keys) {
        should.exist(keys);
        keys.length.should.equal(2);
        done();
      });
    });

    it('should not get any items from the queue because there are not enough', function (done) {
      q.add('test', function (err, key) {
        q.getPair(key.origKey, function (err, k) {
          err.toString().should.equal('Error: No pairing found');
          should.not.exist(k);
          done();
        });
      });
    });
  });

  describe('.cancel', function () {
    it('should cancel items from the queue', function (done) {
      q.add('test2', function (err, key2) {
        should.exist(key2);

        currKey = key2.origKey;

        q.cancel(key2.origKey, function (err, status) {
          should.exist(status);

          q.getPair(currKey, function (err, k) {
            err.toString().should.equal('Error: No pairing found');
            should.not.exist(k);
            done();
          });
        });
      });
    });
  });
});
