import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
    createRoom,
    getMyRooms,
    getRoomById,
    joinRoom,
    saveCanvas,
    changeCollaboratorRole,
    updateSettings,
    regenerateInvite,
    removeRoomCollaborator,
    leave,
    deleteRoom,
} from "../controllers/roomController.js";

const router = express.Router();

// All room routes require a logged-in user
router.use(protect);

router.post("/", createRoom);        // POST   /api/rooms         -> create a new room
router.get("/", getMyRooms);         // GET    /api/rooms         -> list rooms user belongs to
router.get("/:id", getRoomById);     // GET    /api/rooms/:id     -> get one room's details
router.post("/join", joinRoom);      // POST   /api/rooms/join    -> join a room via invite code
router.put("/:id/canvas", saveCanvas); // PUT    /api/rooms/:id/canvas -> persist canvas
router.patch("/:id", updateSettings);
router.post("/:id/invite/regenerate", regenerateInvite);
router.post("/:id/leave", leave);
router.delete("/:id", deleteRoom);
router.patch("/:id/collaborators/:userId/role", changeCollaboratorRole);
router.delete("/:id/collaborators/:userId", removeRoomCollaborator);

export default router;
