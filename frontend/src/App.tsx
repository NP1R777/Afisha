import Modal from 'react-modal';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { UserProvider } from './addition/context';
import Layout from './addition/layout';
import './index.css';
import Account from './pages/account';
import Events from './pages/events';
import Frame from './pages/master';
import Organizer from './pages/organizer';
import { setDefaultOptions } from 'date-fns';
import { ru } from 'date-fns/locale/ru';

setDefaultOptions({ locale: ru });

Modal.setAppElement('#root');

function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route path="/" element={<Frame />} />
            <Route path="/event/:eventId" element={<Events />} />
            <Route path="/account" element={<Account />} />
            <Route path="/organizer" element={<Organizer/>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </UserProvider>
  );
}

export default App;
