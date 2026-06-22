import { Navigate } from "react-router-dom";
import { hasSeenOnboarding } from "./Onboarding";

export default function OnboardingGate() {
  if (hasSeenOnboarding()) {
    return <Navigate to="/" replace />;
  }
  return <Navigate to="/onboarding" replace />;
}