import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Curtain } from './components/Curtain';
import Home from './pages/Home';
import About from './pages/About';
import Process from './pages/Process';
import Join from './pages/Join';

export default function App() {
  return (
    <>
      <Curtain />
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/process" element={<Process />} />
          <Route path="/join" element={<Join />} />
        </Routes>
      </Layout>
    </>
  );
}
