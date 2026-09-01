import { NavLink, Route, Routes } from 'react-router-dom';
import { PropertiesProvider } from './context/PropertiesContext';
import Dashboard from './pages/Dashboard';
import Calendar from './pages/Calendar';
import Bookings from './pages/Bookings';
import Properties from './pages/Properties';

export default function App() {
  return (
    <PropertiesProvider>
      <div className="app-shell">
        <header className="app-header">
          <div className="app-brand">🏠 BedBooking2</div>
          <nav className="app-nav">
            <NavLink to="/" end>Arrivi</NavLink>
            <NavLink to="/calendario">Calendario</NavLink>
            <NavLink to="/prenotazioni">Prenotazioni</NavLink>
            <NavLink to="/strutture">Strutture</NavLink>
          </nav>
        </header>
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/calendario" element={<Calendar />} />
            <Route path="/prenotazioni" element={<Bookings />} />
            <Route path="/strutture" element={<Properties />} />
          </Routes>
        </main>
      </div>
    </PropertiesProvider>
  );
}
