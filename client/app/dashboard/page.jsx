import Dashboard from "../../src/screens/Dashboard";
import RequireAuth from "../../src/components/RouteGuards";

export default function DashboardPage() {
  return <RequireAuth><Dashboard /></RequireAuth>;
}
