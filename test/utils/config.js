module.exports = {
  timeout: 30000,
  testKeysPath: './test/fixtures/keys',
  defaultIpfsConfig: {
    repo: './ipfs/ipfs-log/tests/daemon',
    start: true,
    EXPERIMENTAL: {
      pubsub: true
    },
    config: {
      Addresses: {
        API: '/ip4/127.0.0.1/tcp/0',
        Swarm: ['/ip4/0.0.0.0/tcp/0'],
        Gateway: '/ip4/0.0.0.0/tcp/0'
      },
      Bootstrap: [],
      Discovery: {
        MDNS: {
          Enabled: true,
          Interval: 1
        },
        webRTCStar: {
          Enabled: false
        }
      }
    }
  },
  daemon1: {
    repo: './ipfs/ipfs-log/tests/daemon1',
    start: true,
    EXPERIMENTAL: {
      pubsub: true
    },
    config: {
      Addresses: {
        API: '/ip4/127.0.0.1/tcp/0',
        Swarm: ['/ip4/0.0.0.0/tcp/0'],
        Gateway: '/ip4/0.0.0.0/tcp/0'
      },
      Bootstrap: [],
      Discovery: {
        MDNS: {
          Enabled: true,
          Interval: 1
        },
        webRTCStar: {
          Enabled: false
        }
      }
    }
  },
  daemon2: {
    repo: './ipfs/ipfs-log/tests/daemon2',
    start: true,
    EXPERIMENTAL: {
      pubsub: true
    },
    config: {
      Addresses: {
        API: '/ip4/127.0.0.1/tcp/0',
        Swarm: ['/ip4/0.0.0.0/tcp/0'],
        Gateway: '/ip4/0.0.0.0/tcp/0'
      },
      Bootstrap: [],
      Discovery: {
        MDNS: {
          Enabled: true,
          Interval: 1
        },
        webRTCStar: {
          Enabled: false
        }
      }
    }
  }
}
