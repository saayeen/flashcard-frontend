import { BrowserRouter, Routes, Route } from "react-router-dom";
import Root from "./modules/packages/Root";
import Onboarding from "./modules/onboarding/Onboarding";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Root />} />
        <Route path="/onboarding" element={<Onboarding />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;