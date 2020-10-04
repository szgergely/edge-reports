// @flow

import type {SwapFuncParams} from './checkSwapService'
const { checkSwapService } = require('./checkSwapService.js')
const js = require('jsonfile')
const confFileName = './config.json'
const config = js.readFileSync(confFileName)

const SIDESHIFT_CACHE = './cache/sishRaw.json'

async function doSideshift (swapFuncParams: SwapFuncParams) {
  return checkSwapService(fetchSideshift,
    SIDESHIFT_CACHE,
    'sish',
    swapFuncParams)
}

async function fetchSideshift (swapFuncParams: SwapFuncParams) {
  if (!swapFuncParams.useCache) {
    console.log('Fetching Sideshift...')
  }
  let diskCache = { txs: []}
  try {
    diskCache = js.readFileSync(SIDESHIFT_CACHE)
  } catch (e) {
    console.log(e)
  }
}

module.exports = { doSideshift }
