# level-kued

## What this does

This allows you to queue and pair items with the following options:

1. Set a TTL on the queued items and on the paired items

## Use case

This is useful for if you need to wait for a certain number of users to be in a queue before they can be returned randomly as a group - it must be two more more users.

Let's say you are playing a game and you need 2 players before you can start. You can wait until the queue is ready with at least 2 players and then the system will pair them up accordingly. The paired players will be released from the queue and you can retrieve them by their group key.

## Usage

    var q = new Kued({
      pairDB: './db/paired-db',
      queueDB: './db/queued-db',
      queueTTL: 10000,
      pairTTL: 20000,
      limit: 2
    });

`limit` is what you need the group number to be before they are paired and removed from the queue.

## Add

    q.add('jen', function (err, key) {
      if (!err) {
        console.log(key);
      }
    });

This returns the key for that particular user. If there are no other users, this key is false. Otherwise it is in the format of:

    {
      origKey: 111,
      pairKey: 222
    }

where pairKey is the group key.

## Get your pairing

    q.getPair(key, function (err, pair) {
      if (!err) {
        console.log(pair);
      }
    });

where key is the pairKey.

## Tests

    npm test
