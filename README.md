# ipfs-log

An append-only log on IPFS. 

`ipfs-log` is a partially ordered linked list of [IPFS](https://github.com/ipfs/ipfs) hashes where each entry in the log points to all known heads (a head is a node that is not referenced by other nodes in the log).

### Use cases
- Track a version of a file
- Create a feed of IPFS hashes
- Messaging
- CRDTs

*Originally created for, and currently used in, [orbit-db](https://github.com/haadcode/orbit-db) - a KV-store and Event Log on IPFS*


### Install
```
npm install ipfs-log
```

### Usage
See `./examples` for more.

```javascript
const Log = require('ipfs-log');

Log.create(ipfs, 'A')
  .then((log) => {
    log.add('one').then((node) => {
      console.log('Node:', node.hash, node.payload);
    });
  })
  .catch((err) => console.error(err));
```

### Tests
```
npm install
npm test
```

### API
```javascript
const Log = require('ipfs-log');
```

### Class methods

All class methods take an `ipfs-api` instance as the first parameter. See https://github.com/ipfs/js-ipfs-api for documentation.

```javascript
const ipfs = require('ipfs-api')();
```

#### create(ipfs, id, [items])
Create a log. Returns a `Promise` that resolves to a `Log` instance.

```javascript
const ipfs = require('ipfs-api')();
Log.create(ipfs, 'id').then((log) => console.log(log));
```

#### getIpfsHash(ipfs, log)
Get the IPFS hash of this log. Returns a `Promise` that resolves to an IPFS `hash`.

```javascript
Log.getIpfsHash(ipfs, log).then((hash) => console.log(hash));
```

#### fromIpfsHash(ipfs, hash)
Create a log from an IPFS hash. Returns a `Promise` that resolves to a `Log` instance.

```javascript
Log.fromIpfsHash(ipfs, hash).then((log) => console.log(log));
```

#### fromSnapshot(ipfs, snapshot)
Create a log from a log snapshot. Returns a `Promise` that resolves a `Log` instance.

```javascript
Log.create(ipfs, 'id').then((log) => {
  // Add items to the log    
});

const snapshot = log.snapshot;

Log.fromSnapshot(ipfs, snapshot).then((log) => console.log(log));
```


### Instance methods
#### add(data)
Add a log entry. Returns the added `node`.

```javascript
log.add({ some: 'data' });
log.add('text');
// log1.items ==> [{ some: 'data' },  'text']
```

#### join(other)
Joins the log with `other` log. Fetches history up to 256 items, ie. items that are not in this log but referred to in items in `other`.

```javascript
// log1.items ==> ['A', 'B']
// log2.items ==> ['C', 'D']

log1.join(log2);
// log1.items ==> ['A', 'B', 'C', 'D']
```

#### clear()
Empties the log.

#### items
Returns all items in the log.
```javascript
const items = log.items;
// items ==> ['A', 'B', 'C']
```

#### snapshot
Returns items in the current batch. Current batch are the items in the log that have been added after the latest sync with another log.

```javascript
const snapshot = log.snapshot;
// snapshot ==> { id: 'log id', items: ['A', 'B', 'C']}
```

### TODO
- Node.js Stream API
- Support for encrypting the hashes
- Support for payload encryption
