
import crypto from "crypto";
import Room from "../models/Room.model.js";
import { clearRoomDocs } from "../realtime/yjsRoomStore.js";

const generateInviteCode = () => {
    return crypto.randomBytes(6).toString("hex");
};

export const canEditRoom = (role) => ["owner", "editor"].includes(role);

export const createRoom = async (name, userId) => {
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

export const joinRoom = async (inviteCode, userId) => {
    const room = await Room.findOne({ inviteCode });

    if (!room) {
        throw new Error("Room not found");
    }

    const alreadyMember = room.collaborators.some(
        (collaborator) => collaborator.user.toString() === userId.toString()
    );

    if (alreadyMember) {
        return room;
    }

    room.collaborators.push({
        user: userId,
        role: room.defaultJoinRole,
    });

    await room.save();
    return room;
};

export const getUserRooms = async (userId) => {
    const rooms = await Room.find({
        "collaborators.user": userId,
    })
        .populate("owner", "name email")
        .populate("collaborators.user", "name email");

    return rooms;
};

export const getRoomById = async (roomId, userId) => {
    const room = await Room.findById(roomId)
        .populate("owner", "name email")
        .populate("collaborators.user", "name email");

    if (!room) {
        throw new Error("Room not found");
    }

    // Ensure the requester is actually a collaborator (or the room is public)
    // before returning data — findById alone doesn't check authorization.
    const isMember = room.collaborators.some(
        (collaborator) => collaborator.user._id.toString() === userId.toString()
    );

    if (!isMember && !room.isPublic) {
        throw new Error("Not authorized to view this room");
    }

    return room;
};

export const saveRoomCanvas = async (roomId, userId, canvasData) => {
    const room = await Room.findById(roomId);
    if (!room) throw new Error("Room not found");

    const collaborator = room.collaborators.find((member) => member.user.toString() === userId.toString());
    if (!collaborator || !canEditRoom(collaborator.role)) {
        throw new Error("You do not have permission to edit this room");
    }

    room.canvasData = canvasData;
    room.canvasSavedAt = new Date();
    await room.save();
    return { savedAt: room.canvasSavedAt };
};

export const updateCollaboratorRole = async (roomId, ownerId, collaboratorId, role) => {
    if (!["editor", "viewer"].includes(role)) throw new Error("Invalid collaborator role");
    const room = await Room.findOne({ _id: roomId, owner: ownerId });
    if (!room) throw new Error("Only the room owner can change roles");
    const collaborator = room.collaborators.find((member) => member.user.toString() === collaboratorId.toString());
    if (!collaborator) throw new Error("Collaborator not found");
    collaborator.role = role;
    await room.save();
    return room;
};

const getOwnedRoom = async (roomId, ownerId) => {
    const room = await Room.findOne({ _id: roomId, owner: ownerId });
    if (!room) throw new Error("Only the room owner can manage this room");
    return room;
};

export const updateRoomSettings = async (roomId, ownerId, settings) => {
    const room = await getOwnedRoom(roomId, ownerId);
    const { name, isPublic, defaultJoinRole } = settings;
    if (name !== undefined) {
        if (typeof name !== "string" || !name.trim()) throw new Error("Room name is required");
        room.name = name.trim();
    }
    if (isPublic !== undefined) {
        if (typeof isPublic !== "boolean") throw new Error("isPublic must be a boolean");
        room.isPublic = isPublic;
    }
    if (defaultJoinRole !== undefined) {
        if (!["editor", "viewer"].includes(defaultJoinRole)) throw new Error("Invalid default join role");
        room.defaultJoinRole = defaultJoinRole;
    }
    await room.save();
    return room;
};

export const regenerateInviteCode = async (roomId, ownerId) => {
    const room = await getOwnedRoom(roomId, ownerId);
    room.inviteCode = generateInviteCode();
    await room.save();
    return room;
};

export const removeCollaborator = async (roomId, ownerId, collaboratorId) => {
    const room = await getOwnedRoom(roomId, ownerId);
    if (collaboratorId.toString() === ownerId.toString()) throw new Error("The room owner cannot be removed");
    const originalLength = room.collaborators.length;
    room.collaborators = room.collaborators.filter((member) => member.user.toString() !== collaboratorId.toString());
    if (room.collaborators.length === originalLength) throw new Error("Collaborator not found");
    await room.save();
    return room;
};

export const leaveRoom = async (roomId, userId) => {
    const room = await Room.findById(roomId);
    if (!room) throw new Error("Room not found");
    if (room.owner.toString() === userId.toString()) throw new Error("The room owner cannot leave; delete the room instead");
    const originalLength = room.collaborators.length;
    room.collaborators = room.collaborators.filter((member) => member.user.toString() !== userId.toString());
    if (room.collaborators.length === originalLength) throw new Error("You are not a collaborator in this room");
    await room.save();
};

export const deleteRoom = async (roomId, ownerId) => {
    await getOwnedRoom(roomId, ownerId);
    await Room.deleteOne({ _id: roomId, owner: ownerId });
    clearRoomDocs(roomId);
};
