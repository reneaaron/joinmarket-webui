import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter } from 'react-router-dom'
// @ts-ignore
import App from './components/App'
// @ts-ignore
import { SettingsProvider } from './context/SettingsContext'
// @ts-ignore
import { WalletProvider } from './context/WalletContext'
// @ts-ignore
import { WebsocketProvider } from './context/WebsocketContext'
// @ts-ignore
import { ServiceInfoProvider } from './context/ServiceInfoContext'
import reportWebVitals from './reportWebVitals'
import 'bootstrap/dist/css/bootstrap.min.css'
import './index.css'
import './i18n/config'

declare global {
  interface JamGlobal {
    PUBLIC_PATH: string
  }

  interface Window {
    JM: JamGlobal
  }
}

ReactDOM.render(
  <React.StrictMode>
    <BrowserRouter basename={window.JM.PUBLIC_PATH}>
      <SettingsProvider>
        <WalletProvider>
          <WebsocketProvider>
            <ServiceInfoProvider>
              <App />
            </ServiceInfoProvider>
          </WebsocketProvider>
        </WalletProvider>
      </SettingsProvider>
    </BrowserRouter>
  </React.StrictMode>,
  document.getElementById('root')
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
