import { Navigate } from "react-router-dom";
import { hasSeenOnboarding } from "../onboarding/Onboarding";
import Home from "./Home";

export default function Root() {
  if (!hasSeenOnboarding()) {
    return <Navigate to="/onboarding" replace />;
  }
  return <Home />;
}