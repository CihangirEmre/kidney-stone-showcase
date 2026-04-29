import Hero from './components/Hero'
import LiveDemo from './components/LiveDemo'
import Navbar from './components/Navbar'

function App() {
  return (
    <>
      <Hero onDemoClick={() => document.getElementById('live-demo')?.scrollIntoView({ behavior: 'smooth' })} />
      <LiveDemo />
      <Navbar />
    </>
  )
}

export default App