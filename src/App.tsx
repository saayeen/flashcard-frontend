import { BrowserRouter, Routes, Route } from "react-router-dom";
import Root from "./modules/packages/Root";
import Onboarding from "./modules/onboarding/Onboarding";
import Profile from "./modules/profile/Profile";
import CreatePackage from "./modules/packages/CreatePackage";
import PackageDetail from "./modules/packages/PackageDetail";
import StudyScreen from "./modules/study/StudyScreen";
import Folders from "./modules/folders/Folders";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Root />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/packages/new" element={<CreatePackage />} />
        <Route path="/packages/:id" element={<PackageDetail />} />
        <Route path="/packages/:id/study" element={<StudyScreen />} />
        <Route path="/folders" element={<Folders />} />
        <Route path="/folders/:id" element={<Folders />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;