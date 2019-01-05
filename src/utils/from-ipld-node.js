const cidToMultihash = (cid) => {
  if (!cid) {
    return cid
  }

  if (Array.isArray(cid)) {
    return cid.map(cidToMultihash)
  }

  return cid.toBaseEncodedString()
}

const fromIpldNode = (dagNode, links) => {
  // Backwards compatibility of old `dab-pb` nodes
  if (typeof dagNode.toJSON === 'function') {
    return JSON.parse(dagNode.toJSON().data)
  }

  const obj = Object.assign({}, dagNode)

  links.forEach((prop) => {
    obj[prop] = cidToMultihash(obj[prop])
  })

  return obj
}

module.exports = fromIpldNode
