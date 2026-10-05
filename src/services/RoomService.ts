import crypto from "crypto";
import type { Types } from "mongoose";
import Room from "../models/Room.model";

export type IdType = string | Types.ObjectId;

const generateInviteCode = (): string => {
  return crypto.randomBytes(6).toString("hex");
};

export const canEditRoom = (role: string): boolean =>
  ["owner", "editor"].includes(role);

export const createRoom = async (name: string, userId: IdType) => {
  const inviteCode = generateInviteCode();

  const room = await Room.create({
    name,
    owner: userId,
    collaborators: [
      {
        user: userId,
        role: "owner",
      },
    ],
    inviteCode,
  });

  return room;
};

export const joinRoom = async (inviteCode: string, userId: IdType) => {
  const room = await Room.findOne({ inviteCode } as any);

  if (!room) {
    throw new Error("Room not found");
  }

  const alreadyMember = room.collaborators.some(
    (collaborator: any) => collaborator.user.toString() === userId.toString()
  );

  if (alreadyMember) {
    return room;
  }

  room.collaborators.push({
    user: userId as any,
    role: room.defaultJoinRole,
  });

  await room.save();
  return room;
};

export const getUserRooms = async (userId: IdType) => {
  const rooms = await Room.find({
    "collaborators.user": userId,
  } as any)
    .populate("owner", "name email")
    .populate("collaborators.user", "name email");

  return rooms;
};

export const getRoomById = async (roomId: IdType, userId: IdType) => {
  const room = await (Room.findById as any)(roomId)
    .populate("owner", "name email")
    .populate("collaborators.user", "name email");

  if (!room) {
    throw new Error("Room not found");
  }

  const isMember = room.collaborators.some(
    (collaborator: any) =>
      (collaborator.user?._id || collaborator.user).toString() === userId.toString()
  );

  if (!isMember && !room.isPublic) {
    throw new Error("Not authorized to view this room");
  }

  return room;
};

export const saveRoomCanvas = async (
  roomId: IdType,
  userId: IdType,
  canvasData: any[]
) => {
  const room = await (Room.findById as any)(roomId);
  if (!room) throw new Error("Room not found");

  const collaborator = room.collaborators.find(
    (member: any) => member.user.toString() === userId.toString()
  );
  if (!collaborator || !canEditRoom(collaborator.role)) {
    throw new Error("You do not have permission to edit this room");
  }

  room.canvasData = canvasData;
  room.canvasSavedAt = new Date();
  await room.save();
  return { savedAt: room.canvasSavedAt };
};

export const updateCollaboratorRole = async (
  roomId: IdType,
  ownerId: IdType,
  collaboratorId: IdType,
  role: string
) => {
  if (!["editor", "viewer"].includes(role))
    throw new Error("Invalid collaborator role");
  const room = await Room.findOne({ _id: roomId, owner: ownerId } as any);
  if (!room) throw new Error("Only the room owner can change roles");
  const collaborator = room.collaborators.find(
    (member: any) => member.user.toString() === collaboratorId.toString()
  );
  if (!collaborator) throw new Error("Collaborator not found");
  collaborator.role = role;
  await room.save();
  return room;
};

const getOwnedRoom = async (roomId: IdType, ownerId: IdType) => {
  const room = await Room.findOne({ _id: roomId, owner: ownerId } as any);
  if (!room) throw new Error("Only the room owner can manage this room");
  return room;
};

export const updateRoomSettings = async (
  roomId: IdType,
  ownerId: IdType,
  settings: { name?: string; isPublic?: boolean; defaultJoinRole?: string }
) => {
  const room = await getOwnedRoom(roomId, ownerId);
  const { name, isPublic, defaultJoinRole } = settings;
  if (name !== undefined) {
    if (typeof name !== "string" || !name.trim())
      throw new Error("Room name is required");
    room.name = name.trim();
  }
  if (isPublic !== undefined) {
    if (typeof isPublic !== "boolean")
      throw new Error("isPublic must be a boolean");
    room.isPublic = isPublic;
  }
  if (defaultJoinRole !== undefined) {
    if (!["editor", "viewer"].includes(defaultJoinRole))
      throw new Error("Invalid default join role");
    room.defaultJoinRole = defaultJoinRole;
  }
  await room.save();
  return room;
};

export const regenerateInviteCode = async (roomId: IdType, ownerId: IdType) => {
  const room = await getOwnedRoom(roomId, ownerId);
  room.inviteCode = generateInviteCode();
  await room.save();
  return room;
};

export const removeCollaborator = async (
  roomId: IdType,
  ownerId: IdType,
  collaboratorId: IdType
) => {
  const room = await getOwnedRoom(roomId, ownerId);
  if (collaboratorId.toString() === ownerId.toString())
    throw new Error("The room owner cannot be removed");
  const originalLength = room.collaborators.length;
  room.collaborators = room.collaborators.filter(
    (member: any) => member.user.toString() !== collaboratorId.toString()
  );
  if (room.collaborators.length === originalLength)
    throw new Error("Collaborator not found");
  await room.save();
  return room;
};

export const leaveRoom = async (roomId: IdType, userId: IdType) => {
  const room = await (Room.findById as any)(roomId);
  if (!room) throw new Error("Room not found");
  if (room.owner.toString() === userId.toString())
    throw new Error("The room owner cannot leave; delete the room instead");
  const originalLength = room.collaborators.length;
  room.collaborators = room.collaborators.filter(
    (member: any) => member.user.toString() !== userId.toString()
  );
  if (room.collaborators.length === originalLength)
    throw new Error("You are not a collaborator in this room");
  await room.save();
};

export const deleteRoom = async (roomId: IdType, ownerId: IdType) => {
  await getOwnedRoom(roomId, ownerId);
  await Room.deleteOne({ _id: roomId, owner: ownerId });
};
