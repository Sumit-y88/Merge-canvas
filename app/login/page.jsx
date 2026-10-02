import Login from "../../src/screens/Login";
import { GuestOnly } from "../../src/components/RouteGuards";

export default function LoginPage() {
  return <GuestOnly><Login /></GuestOnly>;
}
