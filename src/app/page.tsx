import { ControlRoomProvider } from "@/context/ControlRoomContext";
import { ControlRoomDashboard } from "@/components/ControlRoomDashboard";

export default function Home() {
  return (
    <ControlRoomProvider>
      <ControlRoomDashboard />
    </ControlRoomProvider>
  );
}
