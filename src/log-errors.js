'use strict'

const IPFSNotDefinedError = () => new Error('IPFS instance not defined')
const LogNotDefinedError = () => new Error('Log instance not defined')
const NotALogError = () => new Error('Given argument is not an instance of Log')
const CannotJoinWithDifferentId = () => new Error('Can\'t join logs with different IDs')
const GteOrLteNotDefinedError =
  () => new Error('Either the lte or gte option must be passed to log.iterator')

module.exports = {
  IPFSNotDefinedError: IPFSNotDefinedError,
  LogNotDefinedError: LogNotDefinedError,
  NotALogError: NotALogError,
  CannotJoinWithDifferentId: CannotJoinWithDifferentId,
  GteOrLteNotDefinedError: GteOrLteNotDefinedError
}
