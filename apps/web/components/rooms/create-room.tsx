"use client";

import { Button } from "@call/ui/components/button";
import { useRouter } from "next/navigation";

function generateRoomId() {
  const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

const CreateRoom = () => {
  const router = useRouter();

  const handleStartMeeting = () => {
    const roomId = generateRoomId();
    router.push(`/r/${roomId}`);
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Button onClick={handleStartMeeting}>Start Call</Button>
    </div>
  );
};

export default CreateRoom;
