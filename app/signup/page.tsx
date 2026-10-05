import Signup from "../../src/screens/Signup";
import { GuestOnly } from "../../src/components/RouteGuards";

export default function SignupPage() {
  return <GuestOnly><Signup /></GuestOnly>;
}
