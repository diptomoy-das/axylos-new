import './App.css'
import SequencePlayer from './components/SequencePlayer';
import StoryBeats from './components/StoryBeats';

function App() {
  return (
    <div className="app-container">
      
      <main className="scroll-container">
        {/* The sticky player stays on screen as you scroll down the container */}
        <SequencePlayer />
        
        {/* The text overlays that trigger based on scroll percentage of the main container */}
        <StoryBeats />
      </main>
    </div>
  )
}

export default App
