import React from 'react'
import { useEffect, useState } from 'react'
import * as rb from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import { useSettings } from '../context/SettingsContext'
import Balance from './Balance'
import { useCurrentWallet, useReloadCurrentWalletInfo } from '../context/WalletContext'
import Sprite from './Sprite'
import PageTitle from './PageTitle'
import ToggleSwitch from './ToggleSwitch'
import * as Api from '../libs/JmWalletApi'

const DepositTemplate = ({ title, amount, locktime, ...props }) => {
  const settings = useSettings()

  return (
    <rb.Card {...props}>
      <rb.Card.Body>
        {' '}
        <rb.Card.Title>{title}</rb.Card.Title>
        <rb.Row>
          <rb.Col lg={{ order: 'last' }} className="d-flex align-items-center justify-content-end">
            Amount
            <Balance valueString={amount} convertToUnit={settings.unit} showBalance={settings.showBalance} />
          </rb.Col>
          <rb.Col xs={'auto'}>
            Duration
            {locktime}
          </rb.Col>
        </rb.Row>
      </rb.Card.Body>
    </rb.Card>
  )
}

const dateToLocktime = (date) => `${date.getUTCFullYear()}-${1 + date.getUTCMonth()}`

const LocktimeForm = ({ onChange }) => {
  const { t } = useTranslation()

  const now = new Date()
  const currentYear = now.getUTCFullYear()
  const currentMonth = 1 + now.getUTCMonth() // utc month ranges from [0, 11]

  const [locktimeYear, setLocktimeYear] = useState(currentYear + 1)
  const [locktimeMonth, setLocktimeMonth] = useState(currentMonth)

  useEffect(() => {
    const date = new Date(Date.UTC(locktimeYear, locktimeMonth - 1, 1, 0, 0, 0))
    console.log(date.toLocaleDateString())
    onChange(dateToLocktime(date))
  }, [locktimeYear, locktimeMonth])

  const minMonth = () => {
    if (locktimeYear > currentYear) {
      return 1
    }

    return currentMonth + 1 // can be '13' - which means it never is valid and user must adapt 'year'.
  }

  return (
    <>
      <rb.Form.Group className="mb-4" controlId="locktimeYear">
        <rb.Form.Label form="fidelity-bond-form">{t('fidelity_bond.form_create.label_locktime_year')}</rb.Form.Label>
        <rb.Form.Control
          name="amount"
          type="number"
          value={locktimeYear}
          min={currentYear}
          placeholder={t('fidelity_bond.form_create.placeholder_locktime_year')}
          required
          onChange={(e) => setLocktimeYear(parseInt(e.target.value, 10))}
        />
        <rb.Form.Control.Feedback type="invalid">
          {t('fidelity_bond.form_create.feedback_invalid_locktime_year')}
        </rb.Form.Control.Feedback>
      </rb.Form.Group>
      <rb.Form.Group className="mb-4" controlId="locktimeMonth">
        <rb.Form.Label form="fidelity-bond-form">{t('fidelity_bond.form_create.label_locktime_month')}</rb.Form.Label>
        <rb.Form.Control
          name="amount"
          type="number"
          value={locktimeMonth}
          min={minMonth()}
          max={12}
          placeholder={t('fidelity_bond.form_create.placeholder_locktime_month')}
          required
          onChange={(e) => setLocktimeMonth(parseInt(e.target.value, 10))}
        />
        <rb.Form.Control.Feedback type="invalid">
          {t('fidelity_bond.form_create.feedback_invalid_locktime_month')}
        </rb.Form.Control.Feedback>
      </rb.Form.Group>
    </>
  )
}

const DepositForm = ({ title, accounts, ...props }) => {
  const { t } = useTranslation()
  const now = new Date()
  const year = new Date().getUTCFullYear()
  const month = new Date().getUTCMonth()
  const initialLocktimeDate = new Date(Date.UTC(year + 1, month, 1, 0, 0, 0))

  const settings = useSettings()
  const [amount, setAmount] = useState(null)
  const [locktime, setLocktime] = useState(dateToLocktime(initialLocktimeDate))

  return (
    <rb.Card {...props}>
      <rb.Card.Body>
        <rb.Card.Title>{title}</rb.Card.Title>
        <rb.Form noValidate>
          <LocktimeForm onChange={setLocktime} />
          <rb.Form.Group className="mb-4" controlId="amount">
            <rb.Form.Label form="fidelity-bond-form">{t('send.label_amount')}</rb.Form.Label>
            <rb.Form.Control
              name="amount"
              type="number"
              value={amount}
              className="slashed-zeroes"
              min={100_000}
              placeholder={t('send.placeholder_amount')}
              required
              onChange={(e) => setAmount(parseInt(e.target.value, 10))}
            />
            <rb.Form.Control.Feedback type="invalid">{t('send.feedback_invalid_amount')}</rb.Form.Control.Feedback>
          </rb.Form.Group>
        </rb.Form>
        <rb.Row>
          <rb.Col lg={{ order: 'last' }} className="d-flex align-items-center justify-content-end">
            Amount
            <Balance valueString={`${amount}`} convertToUnit={settings.unit} showBalance={settings.showBalance} />
          </rb.Col>
          <rb.Col xs={'auto'}>
            Duration
            {locktime}
          </rb.Col>
        </rb.Row>
      </rb.Card.Body>
    </rb.Card>
  )
}

export default function FidelityBond() {
  const { t } = useTranslation()
  const settings = useSettings()
  const currentWallet = useCurrentWallet()
  const reloadCurrentWalletInfo = useReloadCurrentWalletInfo()
  const [fidelityBonds, setFidelityBonds] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [alert, setAlert] = useState(null)
  const [infoAlert, setInfoAlert] = useState(null)

  useEffect(() => {
    if (!currentWallet) {
      setAlert({ variant: 'danger', message: t('current_wallet.error_loading_failed') })
      setIsLoading(false)
      return
    }

    const abortCtrl = new AbortController()

    setAlert(null)
    setIsLoading(true)
    setFidelityBonds(null)

    reloadCurrentWalletInfo({ signal: abortCtrl.signal })
      .then((info) => {
        if (info) {
          const timelockedUtxos = info.data.utxos.utxos.filter((utxo) => utxo.locktime)
          setFidelityBonds(timelockedUtxos)
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
    <div className="fidelity-bond">
      <rb.Row>
        <rb.Col>
          <PageTitle title={t('fidelity_bond.title')} subtitle={t('fidelity_bond.subtitle')} />
          <p>
            <a
              href="https://github.com/JoinMarket-Org/joinmarket-clientserver/blob/master/docs/fidelity-bonds.md"
              target="_blank"
              rel="noopener noreferrer"
              className="text-secondary"
            >
              {t('fidelity_bond.read_more')}
            </a>
          </p>

          {isLoading && (
            <div className="d-flex justify-content-center align-items-center">
              <rb.Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
              {t('loading')}
            </div>
          )}
          {alert && <rb.Alert variant={alert.variant}>{alert.message}</rb.Alert>}
          {infoAlert && <rb.Alert variant={infoAlert.variant}>{infoAlert.message}</rb.Alert>}

          <rb.Fade in={fidelityBonds && fidelityBonds.length === 0} mountOnEnter={true} unmountOnExit={true}>
            <>
              <DepositTemplate title="Long Term" amount="123" locktime="2042-01" />
              <DepositTemplate title="Short Term" amount="123" locktime="2042-01" />
              <DepositForm title="form" />
            </>
          </rb.Fade>
        </rb.Col>
      </rb.Row>
    </div>
  )
}
