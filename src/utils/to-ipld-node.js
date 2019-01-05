const dagPB = require('ipld-dag-pb')
const pify = require('pify')

const createDagNode = pify(dagPB.DAGNode.create)

const multihashToCborLink = (multihash) => {
  if (!multihash) {
    return multihash
  }

  if (Array.isArray(multihash)) {
    return multihash.map(multihashToCborLink)
  }

  return { '/': multihash }
}

const toIpldNode = (obj, links) => {
  // Backwards compatibility of old `dab-pb` nodes
  if (obj.v === 0) {
    return createDagNode(Buffer.from(JSON.stringify(obj)))
  }

  const dagNode = Object.assign({}, obj)

  links.forEach((prop) => {
    dagNode[prop] = multihashToCborLink(dagNode[prop])
  })

  return dagNode
}

module.exports = toIpldNode
