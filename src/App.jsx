// src/App.jsx
import { HashRouter, Routes, Route } from 'react-router-dom';
import MainMenu from './pages/MainMenu';
import Calendario from './pages/Calendario';
import Tareas from './pages/Tareas';
import Examenes from './pages/Examenes';
import Entregas from './pages/Entregas';
import Pomodoro from './pages/Pomodoro';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<MainMenu />} />
        <Route path="/calendario" element={<Calendario />} />
        <Route path="/tareas" element={<Tareas />} />
        <Route path="/examenes" element={<Examenes />} />
        <Route path="/entregas" element={<Entregas />} />
        <Route path="/pomodoro" element={<Pomodoro />} />
      </Routes>
    </HashRouter>
  );
}

export default App;