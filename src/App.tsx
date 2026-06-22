import { BrowserRouter, Routes, Route } from "react-router-dom";
import Root from "./modules/packages/Root";
import Onboarding from "./modules/onboarding/Onboarding";
import Profile from "./modules/profile/Profile";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Root />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;