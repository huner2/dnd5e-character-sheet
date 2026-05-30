import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {
  ColorSchemeScript,
  MantineProvider,
  localStorageColorSchemeManager,
} from '@mantine/core'
import '@mantine/core/styles.css'
import {
  clearChunkReloadAttempts,
  installChunkLoadRecovery,
} from './chunkLoadRecovery'
import './index.scss'
import App from './App.tsx'

installChunkLoadRecovery()

const COLOR_SCHEME_STORAGE_KEY = 'dnd5e-character-sheet-color-scheme'

clearChunkReloadAttempts()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ColorSchemeScript
      defaultColorScheme="light"
      localStorageKey={COLOR_SCHEME_STORAGE_KEY}
    />
    <MantineProvider
      defaultColorScheme="light"
      colorSchemeManager={localStorageColorSchemeManager({
        key: COLOR_SCHEME_STORAGE_KEY,
      })}
    >
      <App />
    </MantineProvider>
  </StrictMode>,
)
