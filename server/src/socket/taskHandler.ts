import { Server, Socket } from 'socket.io';

export const setupTaskHandlers = (io: Server, socket: Socket): void => {
  // Join workspace room for live Kanban updates
  socket.on('join-workspace', (workspaceId: string) => {
    socket.join(`workspace:${workspaceId}`);
  });

  socket.on('leave-workspace', (workspaceId: string) => {
    socket.leave(`workspace:${workspaceId}`);
  });

  // Relay live task update across workspace members
  socket.on('task-updated', (data: { workspaceId: string; task: any }) => {
    socket.to(`workspace:${data.workspaceId}`).emit('task-updated', data.task);
  });
};
