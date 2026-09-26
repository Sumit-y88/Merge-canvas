import WhiteboardRoom from "../../../src/screens/WhiteboardRoom";
import RequireAuth from "../../../src/components/RouteGuards";

export default function WhiteboardRoomPage() {
  return <RequireAuth><WhiteboardRoom /></RequireAuth>;
}
