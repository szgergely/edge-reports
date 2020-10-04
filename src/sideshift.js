// @flow

import type {StandardTx, SwapFuncParams} from './checkSwapService'

const {checkSwapService} = require('./checkSwapService.js')
const js = require('jsonfile')
const fetch = require('node-fetch')

const confFileName = './config.json'
const config = js.readFileSync(confFileName)

const SIDESHIFT_CACHE = './cache/SSAIRAW.json'
const PAGE_LIMIT = 500

type SideShiftTransaction = {
  quoteId: string,
  depositAddress: {
    address: string
  },
  depositAsset: string,
  depositMin: number,
  depositMax: number,
  settleAddress: {
    address: string
  },
  settleAsset: string,
  settleAmount: number,
  createdAt: string
}

async function doSideshift(swapFuncParams: SwapFuncParams) {
  return checkSwapService(fetchSideshift,
    SIDESHIFT_CACHE,
    'SSAI',
    swapFuncParams)
}

async function fetchSideshift(swapFuncParams: SwapFuncParams) {
  if (!swapFuncParams.useCache) {
    console.log('Fetching Sideshift...')
  }
  let diskCache = {txs: []}
  try {
    diskCache = js.readFileSync(SIDESHIFT_CACHE)
  } catch (e) {
    console.log(e)
  }

  const newTransactions: StandardTx[] = []
  let offset = 0

  while (1 && !swapFuncParams.useCache) {
    try {
      const url = `https://sideshift.ai/api/v1/affiliate/completedOrders?limit=${PAGE_LIMIT}&offset=${offset}&affiliateId=${config.sideShiftAffiliateId}`
      const options = {
        method: 'GET',
        headers: {
          'affiliateSecret': `${config.sideShiftAffiliateSecret}` // TODO: figure out how to authenticate with affiliateSecret
        }
      }

      const transactions: SideShiftTransaction[] = await fetch(url, options)
        .then(response => response.json())

      for (const tx of transactions) {
        const timestamp = new Date(tx.createdAt).getTime() / 1000
        const ssaiTx: StandardTx = {
          status: 'complete',
          inputTXID: tx.quoteId,
          inputAddress: tx.depositAddress.address,
          inputCurrency: tx.depositAsset.toUpperCase(),
          inputAmount: tx.depositMin, // TODO: or depositMax?
          outputAddress: tx.settleAddress.address,
          outputCurrency: tx.settleAsset.toUpperCase(),
          outputAmount: tx.settleAmount, // TODO: outputAmount is string, but settleAmount is number
          timestamp
        }
        newTransactions.push(ssaiTx)
      }

      if (transactions.length < PAGE_LIMIT) {
        break
      }
    } catch (e) {
      break
    }
    if (offset > 1500) {
      break
    }
    offset += PAGE_LIMIT
  }
  return {
    diskCache,
    newTransactions
  }
}

module.exports = {doSideshift}
