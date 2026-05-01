import Hero from './components/Hero'
import LiveDemo from './components/LiveDemo'
import Navbar from './components/Navbar'
import { Analytics } from '@vercel/analytics/react'

function App() {
  return (
    <>
      <Hero onDemoClick={() => document.getElementById('live-demo')?.scrollIntoView({ behavior: 'smooth' })} />
      <LiveDemo />
      <Navbar />
      <Analytics />
    </>
  )
}

export default App