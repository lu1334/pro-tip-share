import { useEffect } from 'react'
import { AppRouter } from './app/AppRouter'
import { useAuthStore } from './store/authStore'
import './App.css'

function App() {
  const bootstrapSession = useAuthStore((state) => state.bootstrapSession)

  useEffect(() => {
    void bootstrapSession()
  }, [bootstrapSession])

  return <AppRouter />
}

export default App
