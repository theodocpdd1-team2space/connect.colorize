export function resetRuntimeRoom(roomId: string) {
  const runtime = (globalThis as any).__easycomRoomRuntime;
  if (runtime?.resetRoomSession) {
    runtime.resetRoomSession(roomId);
    return true;
  }
  return false;
}

export function endRuntimeRoom(roomId: string) {
  const runtime = (globalThis as any).__easycomRoomRuntime;
  if (runtime?.endRoomSession) {
    runtime.endRoomSession(roomId);
    return true;
  }
  return false;
}
