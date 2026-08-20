import {
    createRoom as createRoomService,
    joinRoom as joinRoomService,
    getUserRooms,
    getRoomById as getRoomByIdService,
    saveRoomCanvas,
    updateCollaboratorRole,
    updateRoomSettings,
    regenerateInviteCode,
    removeCollaborator,
    leaveRoom,
    deleteRoom as deleteRoomService,
} from "../services/roomService.js";
import { validateCanvasData } from "../utils/payloadValidation.js";

export const createRoom = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ message: "Room name is required" });
        }

        const room = await createRoomService(name, req.user._id);
        res.status(201).json(room);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const getMyRooms = async (req, res) => {
    try {
        const rooms = await getUserRooms(req.user._id);
        res.status(200).json(rooms);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const getRoomById = async (req, res) => {
    try {
        const room = await getRoomByIdService(req.params.id, req.user._id);
        res.status(200).json(room);
    } catch (error) {
        const status = error.message === "Not authorized to view this room" ? 403 : 404;
        res.status(status).json({ message: error.message });
    }
};

export const joinRoom = async (req, res) => {
    try {
        const { inviteCode } = req.body;

        if (!inviteCode) {
            return res.status(400).json({ message: "Invite code is required" });
        }

        const room = await joinRoomService(inviteCode, req.user._id);
        res.status(200).json(room);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const saveCanvas = async (req, res) => {
    try {
        validateCanvasData(req.body.canvasData);
        const result = await saveRoomCanvas(req.params.id, req.user._id, req.body.canvasData);
        res.status(200).json(result);
    } catch (error) {
        const status = error.message.includes("permission") ? 403 : 400;
        res.status(status).json({ message: error.message });
    }
};

export const changeCollaboratorRole = async (req, res) => {
    try {
        const room = await updateCollaboratorRole(req.params.id, req.user._id, req.params.userId, req.body.role);
        res.status(200).json(room);
    } catch (error) {
        const status = error.message.includes("owner") ? 403 : 400;
        res.status(status).json({ message: error.message });
    }
};

export const updateSettings = async (req, res) => {
    try {
        const room = await updateRoomSettings(req.params.id, req.user._id, req.body);
        res.status(200).json(room);
    } catch (error) {
        res.status(error.message.includes("owner") ? 403 : 400).json({ message: error.message });
    }
};

export const regenerateInvite = async (req, res) => {
    try {
        const room = await regenerateInviteCode(req.params.id, req.user._id);
        res.status(200).json(room);
    } catch (error) {
        res.status(error.message.includes("owner") ? 403 : 400).json({ message: error.message });
    }
};

export const removeRoomCollaborator = async (req, res) => {
    try {
        const room = await removeCollaborator(req.params.id, req.user._id, req.params.userId);
        res.status(200).json(room);
    } catch (error) {
        res.status(error.message.includes("owner") ? 403 : 400).json({ message: error.message });
    }
};

export const leave = async (req, res) => {
    try {
        await leaveRoom(req.params.id, req.user._id);
        res.status(204).send();
    } catch (error) {
        res.status(error.message.includes("owner") ? 403 : 400).json({ message: error.message });
    }
};

export const deleteRoom = async (req, res) => {
    try {
        await deleteRoomService(req.params.id, req.user._id);
        res.status(204).send();
    } catch (error) {
        res.status(error.message.includes("owner") ? 403 : 400).json({ message: error.message });
    }
};
