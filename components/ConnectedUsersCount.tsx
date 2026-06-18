"use client";

import { useEffect, useState } from "react";
import { getSocket, resetSocket } from "@/lib/socketClient";
import StatusCard from "./StatusCard";

type ConnectedUsersCountProps = {
  recommendedUsers: number;
};

export default function ConnectedUsersCount({ recommendedUsers }: ConnectedUsersCountProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const socket = getSocket();
    socket.connect();
    socket.on("server-ready", (state) => {
      setCount(Number(state.connectedUsers || 0));
    });
    socket.on("public-status", (state) => {
      setCount(Number(state.connectedUsers || 0));
    });

    return () => {
      socket.off("server-ready");
      socket.off("public-status");
      resetSocket();
    };
  }, []);

  return <StatusCard label="Crew Online" value={count} helper={`Recommended ${recommendedUsers} active crew`} />;
}
