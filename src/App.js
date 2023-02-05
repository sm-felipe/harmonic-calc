import logo from './logo.svg';
import './App.css';
import calculateNote from './notes';

function App() {
  return (
    <div>
      A4 = 440hz
        <br />
        A# = {calculateNote(440, 1)}
    </div>
  );
}

export default App;
