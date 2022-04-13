export const ACCOUNTS = [0, 1, 2, 3, 4]
export const BTC = 'BTC'
export const SATS = 'sats'

export const serialize = (form) => Object.fromEntries(new FormData(form).entries())

export const walletDisplayName = (name) => name.replace('.jmdat', '')

export const displayDate = (string) => new Date(string).toLocaleString()

export const btcToSats = (value) => Math.round(parseFloat(value) * 100000000)

export const satsToBtc = (value) => parseInt(value, 10) / 100000000

export const NOOP = () => {}

export const accountBalanceBreakdown = (walletInfo, accountNumber) => {
  if (!walletInfo || !walletInfo.data.display.walletinfo.accounts || !walletInfo.data.utxos.utxos) {
    return null
  }

  const filtered = walletInfo.data.display.walletinfo.accounts.filter((account) => {
    return parseInt(account.account, 10) === accountNumber
  })

  if (filtered.length !== 1) {
    return null
  }

  const utxosByAccount = walletInfo.data.utxos.utxos.reduce((acc, utxo) => {
    acc[utxo.mixdepth] = acc[utxo.mixdepth] || []
    acc[utxo.mixdepth].push(utxo)
    return acc
  }, {})
  const accountUtxos = utxosByAccount[accountNumber] || []
  const frozenOrLockedUtxos = accountUtxos.filter((utxo) => utxo.frozen || utxo.locktime)
  const balanceFrozenOrLocked = frozenOrLockedUtxos.reduce((acc, utxo) => acc + utxo.value, 0)

  return {
    totalBalance: btcToSats(filtered[0].account_balance),
    frozenOrLockedBalance: balanceFrozenOrLocked,
  }
}

export const copyToClipboard = async (text, fallbackInputField) => {
  const copyToClipboardFallback = (inputField) =>
    new Promise((resolve, reject) => {
      inputField.select()
      const success = document.execCommand && document.execCommand('copy')
      inputField.blur()
      success ? resolve(success) : reject(new Error('Value could not be copied to clipboard'))
    })

  // `navigator.clipboard` might not be available, e.g. on sites served over plain `http`.
  if (!navigator.clipboard) {
    return copyToClipboardFallback(fallbackInputField)
  }

  // might not work on iOS.
  return navigator.clipboard.writeText(text).catch(() => copyToClipboardFallback(fallbackInputField))
}
