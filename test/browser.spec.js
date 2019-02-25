'use strict'

const isNode = require('is-node')

// This file will be picked up by webpack into the
// tests bundle and the code here gets run when imported
// into the browser tests index through browser/run.js
if (!isNode) {
  // If in browser, put the fixture keys in local storage
  // so that Keystore can find them
  const keyA = require('./fixtures/keys/identity-keys/userA')
  const keyB = require('./fixtures/keys/identity-keys/userB')
  const keyC = require('./fixtures/keys/identity-keys/userC')
  const keyD = require('./fixtures/keys/identity-keys/userD')
  const keyE = require('./fixtures/keys/signing-keys/0276b51c36dc6a117aef6f8ecaa49c27c309b29bbc97218e21cc0d7c903a21f376')
  const keyF = require('./fixtures/keys/signing-keys/0208290bc83e02be25a65be2e067e4d2ecc55ae88e0c073b5d48887d45e7e0e393')
  const keyG = require('./fixtures/keys/signing-keys/030f4141da9bb4bc8d9cc9a6a01cdf0e8bc0c0f90fd28646f93d0de4e93b723e31')
  const keyH = require('./fixtures/keys/signing-keys/038bef2231e64d5c7147bd4b8afb84abd4126ee8d8335e4b069ac0a65c7be711ce')
  /* global localStorage */
  localStorage.setItem('userA', JSON.stringify(keyA))
  localStorage.setItem('userB', JSON.stringify(keyB))
  localStorage.setItem('userC', JSON.stringify(keyC))
  localStorage.setItem('userD', JSON.stringify(keyD))
  localStorage.setItem('0276b51c36dc6a117aef6f8ecaa49c27c309b29bbc97218e21cc0d7c903a21f376', JSON.stringify(keyE))
  localStorage.setItem('0208290bc83e02be25a65be2e067e4d2ecc55ae88e0c073b5d48887d45e7e0e393', JSON.stringify(keyF))
  localStorage.setItem('030f4141da9bb4bc8d9cc9a6a01cdf0e8bc0c0f90fd28646f93d0de4e93b723e31', JSON.stringify(keyG))
  localStorage.setItem('038bef2231e64d5c7147bd4b8afb84abd4126ee8d8335e4b069ac0a65c7be711ce', JSON.stringify(keyH))
}
