# ipfs-log

> An append-only log on IPFS.

`ipfs-log` is a *partially ordered linked list* of [IPFS](https://github.com/ipfs/ipfs) objects. 

This module provides a data-agnostic transport mechanism using IPFS with the ability to traverse the history. Every entry in the log is saved in IPFS and each points to a hash of previous entry(ies). Logs can be forked and joined back together.

```
entry0 <-- entry1 <-- entry2 ...
```

The module works in **Node.js** and **Browsers**.

## Use cases
- CRDTs
- Database operations log
- Feed of data
- Track a version of a file
- Messaging

*Originally created for, and currently used in, [orbit-db](https://github.com/haadcode/orbit-db) - a distributed peer-to-peer database on IPFS*

## Install
```
npm install ipfs-log
```

## Usage

See [examples](https://github.com/haadcode/ipfs-log/tree/master/examples) for more details.

### Quick Example
```javascript
const IPFS = require('ipfs')
const Log  = require('ipfs-log');

const ipfs = new IPFS();
const log  = new Log(ipfs, 'A');

log.add({ some: 'data' })
  .then(() => log.add('text'))
  .then(() => console.log(log.items))

// [Entry {
//    payload: { some: 'data' },
//    hash: 'QmYiefTHzCLNroCfKw7YTUy9Yo53sCfwzyU5p7SBBxTcmD',
//    next: [] 
//  },
//  Entry {
//    payload: 'text',
//    hash: 'QmdNFpoyXLNdR8Wx5LYZBLcXH8aAEopSMnnubWLn4AciCZ',
//    next: [ 'QmYiefTHzCLNroCfKw7YTUy9Yo53sCfwzyU5p7SBBxTcmD' ] 
//  }]
```

### Node.js
```javascript
const IPFS = require('ipfs')
const Log  = require('ipfs-log');

const log = new Log(new IPFS(), 'A', 'db name', { maxHistory: 1000 });

log.add('one')
  .then((entry1) => {
    console.log('Entry1:', entry1.hash, entry1.payload);
    return log.add('two');
  })
  .then((entry2) => {
    console.log('Entry2:', entry2.hash, entry2.payload);
    console.log('Entry2.next:', entry2.next[0]); // == entry1.hash
  });
```

### Browser
*The distribution package for browsers is located in [dist/ipfslog.min.js](https://github.com/haadcode/ipfs-log/tree/master/dist)*

```html
<html>
  <head>
    <meta charset="utf-8">
  </head>
  <body>
    <script type="text/javascript" src="../../dist/ipfslog.min.js" charset="utf-8"></script>
    <script type="text/javascript" src="../../node_modules/ipfs/dist/index.js" charset="utf-8"></script>
    <script type="text/javascript">
      const ipfs = new window.Ipfs();
      const log = new Log(ipfs, 'A')
      log.add('one')
        .then((entry1) => {
          console.log('Entry1:', entry1.hash, entry1.payload, entry1);
          return log.add('two')
        })
        .then((entry2) => {
          console.log('Entry2:', entry2.hash, entry2.payload, entry2);
          console.log("Entry2.next:", entry2.next[0]);
        });
    </script>
  </body>
</html>
```

#### Building the examples

```
npm install
npm run build
```

## API

### Log
```javascript
const Log = require('ipfs-log');
```

#### Instance methods
##### constructor(ipfs, id, [name], [options])
Create a log. The first argument is an `ipfs` instance which can be of type `js-ipfs` or `js-ipfs-api`. See https://github.com/ipfs/js-ipfs-api for IPFS api documentation.

```javascript
const ipfs = require('ipfs')(); // ipfs javascript implementation
// Or
const ipfs = require('ipfs-api')(); // local ipfs daemon (go-ipfs)

const log = new Log(ipfs, 'userid', 'name of the log');
```

`ipfs` is an instance of IPFS (`ipfs` or `ipfs-api`)

`id` is a unique log identifier. Usually this should be a user id or similar.

`name` is the name of the log for convenience purposes.

`options` are the following:
```javscript
{
  maxHistory: 1000 // number of item to fetch at sync
}
```

##### add(data)
Add a log entry. The new entry gets the references to previous entries automatically. Returns a *Promise* that resolves to the added `Entry`.

`data` can be any type of data: Number, String, Object, etc. It can also be an instance of [Entry](https://github.com/haadcode/ipfs-log/blob/master/examples/entry.js).

```javascript
log.add({ some: 'data' })
  .then(() => log.add('text'))
  .then(() => console.log(log.items))

// [Entry {
//    payload: { some: 'data' },
//    hash: 'QmYiefTHzCLNroCfKw7YTUy9Yo53sCfwzyU5p7SBBxTcmD',
//    next: [] 
//  },
//  Entry {
//    payload: 'text',
//    hash: 'QmdNFpoyXLNdR8Wx5LYZBLcXH8aAEopSMnnubWLn4AciCZ',
//    next: [ 'QmYiefTHzCLNroCfKw7YTUy9Yo53sCfwzyU5p7SBBxTcmD' ] 
//  }]
```

##### join(other)
Joins the log with `other` log. Fetches history up to `options.maxHistory` items, ie. items that are not in this log but referred to in items in `other`. Returns a *Promise* that resolves to an `Array` of items that were added.

```javascript
// log1.items ==> ['A', 'B', 'C']
// log2.items ==> ['C', 'D', 'E']

log1.join(log2).then((added) => console.log(added)); // ==> ['D', 'E']

// log1.items ==> ['A', 'B', 'C', 'D', 'E']
```

##### items
Returns an `Array` of all items in the log.

```javascript
const items = log.items;
// items ==> ['A', 'B', 'C']
```

##### snapshot
Returns a *snapshot* of the log with items in the current batch. Current batch are the items in the log that have been added locally after the latest join with another log.

```javascript
const snapshot = log.snapshot;
// snapshot ==> { id: 'log id', items: ['A', 'B', 'C']}
```

#### Class methods

All class methods take an `ipfs` instance as the first parameter. The ipfs can be of `js-ipfs` or `js-ipfs-api`. See https://github.com/ipfs/js-ipfs-api for IPFS api documentation.

```javascript
const ipfs = require('ipfs')(); // js-ipfs
// Or
const ipfs = require('ipfs-api')(); // local ipfs daemon
```

*See [Instance methods](https://github.com/haadcode/ipfs-log#instance-methods) on how to use the log instance*

##### getIpfsHash(ipfs, log)
Get the IPFS hash of this log. Returns a `Promise` that resolves to an IPFS `hash`.

```javascript
Log.getIpfsHash(ipfs, log).then((hash) => console.log(hash));
// ==> 'Qm...abc123'
```

##### fromIpfsHash(ipfs, hash)
Create a log from an IPFS hash. Returns a `Promise` that resolves to a `Log` instance.

```javascript
Log.fromIpfsHash(ipfs, hash).then((log) => console.log(log));
// ==> instance of Log
```

### Entry

**TODO: document [Entry](https://github.com/haadcode/ipfs-log/blob/master/examples/entry.js).**

## Tests
```
npm install
npm test
```

## Build
The build script will build the distribution file for browsers.
```
npm run build
```

## TODO
- Node.js Stream API
- Support for encrypting the hashes
- Support for payload encryption
