# level-kued

## What this does

This allows you to queue and pair items with the following options:

1. Set a TTL on the queued items and on the paired items
2. Retrieve a pairKey once you are paired with someone else

## Use case

This is useful for if you need to wait for a certain number of users to be in a queue before they can be returned randomly as a group - it must be two more more users.

Let's say you are playing a game and you need 2 players before you can start. You can wait until the queue is ready with at least 2 players and then the system will pair them up accordingly. The paired players will be released from the queue and you can retrieve them by their group key.

## Usage

    var q = new Kued({
      pairDB: './db/paired-db',
      queueDB: './db/queued-db',
      itemsDB: './db/items-db',
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

This returns the key for that particular user. If there are no other users, this key is false.

    {
      origKey: 111,
      pairKey: false
    }

Let's add another user:

    q.add('notjen', function (err, key) {
      if (!err) {
        console.log(key);
      }
    });

Now that there are at least two users, the key returns in the format of:

    {
      origKey: 222,
      pairKey: 333
    }

where origKey is the user key and pairKey is the group key.

## Get your pairing

    q.getPair(key, function (err, pair) {
      if (!err) {
        console.log(pair);
      }
    });

where key is the pairKey (group key).

## Cancel pairing

    q.cancel(key, function (err, status) {
      if (!err) {
        console.log(status);
      }
    });

where key is the user key.

## Tests

    npm test
