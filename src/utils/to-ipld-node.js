const multihashToCborLink = (multihash) => {
  if (!multihash) {
    return multihash
  }

  if (Array.isArray(multihash)) {
    return multihash.map(multihashToCborLink)
  }

  return { '/': multihash }
}

const toIpldNode = (obj, props) => {
  const dagNode = Object.assign({}, obj)

  props.forEach((prop) => {
    dagNode[prop] = multihashToCborLink(dagNode[prop])
  })

  return dagNode
}

module.exports = toIpldNode
