const cidToMultihash = (cid) => {
  if (!cid) {
    return cid
  }

  if (Array.isArray(cid)) {
    return cid.map(cidToMultihash)
  }

  // Ensure backwards compatibility by checking if this is a multihash already
  if (typeof cid === 'string') {
    return cid
  }

  return cid.toBaseEncodedString()
}

const fromIpldNode = (dagNode, props) => {
  const obj = Object.assign({}, dagNode)

  props.forEach((prop) => {
    obj[prop] = cidToMultihash(obj[prop])
  })

  return obj
}

module.exports = fromIpldNode
