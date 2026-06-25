import { BrowserRouter, Routes, Route } from "react-router-dom";
import Root from "./modules/packages/Root";
import Onboarding from "./modules/onboarding/Onboarding";
import Profile from "./modules/profile/Profile";
import CreatePackage from "./modules/packages/CreatePackage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Root />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/packages/new" element={<CreatePackage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;