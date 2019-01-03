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

const transformDAGNode = (dagNode) => {
  const entry = JSON.parse(dagNode.data)
  if (entry.v !== 0) {
    throw new Error('This transformation is only for entries with version 0.')
  }
  return entry
}

const fromIpldNode = (dagNode, props) => {

  const obj = dagNode.data ? Object.assign({}, transformDAGNode(dagNode) ) : Object.assign({}, dagNode)

  props.forEach((prop) => {
    obj[prop] = cidToMultihash(obj[prop])
  })

  return obj
}

module.exports = fromIpldNode
