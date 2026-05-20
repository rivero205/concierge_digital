import { GuestProvider } from './context/GuestContext'
import ConciergeView from './components/ConciergeView'

export default function App() {
  return (
    <GuestProvider>
      <ConciergeView />
    </GuestProvider>
  )
}
