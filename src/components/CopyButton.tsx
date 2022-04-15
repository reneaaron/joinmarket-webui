import React, { useState, useEffect, useRef } from 'react'
import * as rb from 'react-bootstrap'
// @ts-ignore
import { copyToClipboard, NOOP } from '../utils'
// @ts-ignore
import Sprite from './Sprite'

interface CopyButtonProps {
  value: string
  text: string
  successText: string
  onSuccess: (val: string) => void
  onError: (e: Error) => void
  successTextTimeout: number
}

export default function CopyButton({
  value,
  text,
  successText = text,
  onSuccess = NOOP,
  onError = NOOP,
  successTextTimeout = 1_500,
}: CopyButtonProps) {
  const valueFallbackInputRef = useRef<HTMLInputElement>(null)
  const [showValueCopiedConfirmation, setShowValueCopiedConfirmation] = useState(false)
  const [valueCopiedFlag, setValueCopiedFlag] = useState(0)

  useEffect(() => {
    if (valueCopiedFlag < 1) return

    setShowValueCopiedConfirmation(true)
    const timer = setTimeout(() => {
      setShowValueCopiedConfirmation(false)
    }, successTextTimeout)

    return () => clearTimeout(timer)
  }, [valueCopiedFlag, successTextTimeout])

  return (
    <>
      <rb.Button
        variant="outline-dark"
        data-bs-toggle="tooltip"
        data-bs-placement="left"
        onClick={() => {
          copyToClipboard(value, valueFallbackInputRef.current).then(
            () => {
              setValueCopiedFlag((current) => current + 1)
              onSuccess(value)
            },
            (e: Error) => {
              onError(e)
            }
          )
        }}
      >
        {showValueCopiedConfirmation ? (
          <>
            {successText}
            <Sprite color="green" symbol="checkmark" className="ms-1" width="20" height="20" />
          </>
        ) : (
          <>{text}</>
        )}
      </rb.Button>
      <input
        readOnly
        aria-hidden
        ref={valueFallbackInputRef}
        value={value}
        style={{
          position: 'absolute',
          left: '-9999px',
          top: '-9999px',
        }}
      />
    </>
  )
}
