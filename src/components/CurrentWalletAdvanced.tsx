import React, { useState, useEffect } from 'react'
import * as rb from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
// @ts-ignore
import DisplayAccounts from './DisplayAccounts'
// @ts-ignore
import DisplayAccountUTXOs from './DisplayAccountUTXOs'
// @ts-ignore
import DisplayUTXOs from './DisplayUTXOs'
// @ts-ignore
import { useCurrentWallet, useCurrentWalletInfo, useReloadCurrentWalletInfo } from '../context/WalletContext'
import styles from './CurrentWalletAdvanced.module.css'

type Utxos = any[]
type Alert = { message: string; variant: string }

export default function CurrentWalletAdvanced() {
  const { t } = useTranslation()
  const currentWallet = useCurrentWallet()
  const walletInfo = useCurrentWalletInfo()
  const reloadCurrentWalletInfo = useReloadCurrentWalletInfo()
  const [fidelityBonds, setFidelityBonds] = useState<Utxos | null>(null)
  const [utxos, setUtxos] = useState<Utxos | null>(null)
  const [showUTXO, setShowUTXO] = useState(false)
  const [alert, setAlert] = useState<Alert | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!currentWallet) {
      setAlert({ variant: 'danger', message: t('current_wallet.error_loading_failed') })
      setIsLoading(false)
      return
    }

    const abortCtrl = new AbortController()

    setAlert(null)
    setIsLoading(true)

    reloadCurrentWalletInfo({ signal: abortCtrl.signal })
      .then((info) => {
        if (info && !abortCtrl.signal.aborted) {
          const unspentOutputs = info.data.utxos.utxos
          setUtxos(unspentOutputs)

          const lockedOutputs = unspentOutputs.filter((utxo) => utxo.locktime)
          setFidelityBonds(lockedOutputs)
        }
      })
      .catch((err) => {
        const message = err.message || t('current_wallet.error_loading_failed')
        !abortCtrl.signal.aborted && setAlert({ variant: 'danger', message })
      })
      .finally(() => !abortCtrl.signal.aborted && setIsLoading(false))

    return () => abortCtrl.abort()
  }, [currentWallet, reloadCurrentWalletInfo, t])

  return (
    <div>
      {alert && <rb.Alert variant={alert.variant}>{alert.message}</rb.Alert>}
      {isLoading && (
        <div>
          {[...new Array(5)].map((a, index) => (
            <rb.Placeholder
              key={index}
              as="div"
              animation="wave"
              className={styles['current-wallet-placeholder-container']}
            >
              <rb.Placeholder xs={12} className={styles['current-wallet-placeholder']} />
            </rb.Placeholder>
          ))}
        </div>
      )}
      {!isLoading && walletInfo && (
        <DisplayAccounts accounts={walletInfo.data.display.walletinfo.accounts} className="mb-4" />
      )}
      {!!fidelityBonds?.length && (
        <div className="mt-5 mb-3 pe-3">
          <h5>{t('current_wallet_advanced.title_fidelity_bonds')}</h5>
          <DisplayUTXOs utxos={fidelityBonds} className="pe-2" />
        </div>
      )}
      <>
        <rb.Button
          variant="outline-dark"
          disabled={isLoading}
          onClick={() => {
            setShowUTXO(!showUTXO)
          }}
          className={isLoading ? 'mt-3 mb-3 pe-auto' : 'mb-3'}
        >
          {showUTXO ? t('current_wallet_advanced.button_hide_utxos') : t('current_wallet_advanced.button_show_utxos')}
        </rb.Button>
        <rb.Fade in={showUTXO} mountOnEnter={true} unmountOnExit={true}>
          <div>
            {utxos && utxos.length === 0 ? (
              <rb.Alert variant="info">{t('current_wallet_advanced.alert_no_utxos')}</rb.Alert>
            ) : (
              <DisplayAccountUTXOs utxos={utxos} className="mt-3" />
            )}
          </div>
        </rb.Fade>
      </>
    </div>
  )
}
