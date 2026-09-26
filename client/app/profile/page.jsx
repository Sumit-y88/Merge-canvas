import Profile from "../../src/screens/Profile";
import RequireAuth from "../../src/components/RouteGuards";

export default function ProfilePage() {
  return <RequireAuth><Profile /></RequireAuth>;
}
