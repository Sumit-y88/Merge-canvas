import assert from "node:assert/strict";
import test, { after, before, beforeEach } from "node:test";
import http from "http";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { io as createClient } from "socket.io-client";
import { Server } from "socket.io";
import * as Y from "yjs";
import app from "../src/app.js";
import Room from "../src/models/Room.model.js";
import User from "../src/models/User.model.js";
import { configureSocketServer } from "../src/realtime/socketServer.js";
import { clearRoomDocs } from "../src/realtime/yjsRoomStore.js";
import { canvasToYDoc } from "../src/realtime/yjsRoomStore.js";

let mongo;
let httpServer;
let ioServer;
let socketUrl;
let owner;
let editor;
let viewer;
let room;

const signup = async (name, email) => {
    const response = await request(app)
        .post("/api/auth/signup")
        .send({ name, email, password: "password123" });
    assert.equal(response.status, 201);
    return response.body;
};

const connectSocket = async (token, roomId) => {
    const socket = createClient(socketUrl, {
        autoConnect: false,
        auth: { token },
        transports: ["websocket"],
    });
    await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("Socket connection timed out")), 3000);
        socket.once("connect", () => {
            clearTimeout(timer);
            socket.emit("room:join", roomId, (result) => {
                if (!result?.ok) reject(new Error(result?.message || "Room join failed"));
                else resolve();
            });
        });
        socket.once("connect_error", reject);
        socket.connect();
    });
    return socket;
};

const emitWithAck = (socket, event, payload) => new Promise((resolve) => socket.emit(event, payload, resolve));

const waitForEvent = (socket, event, timeout = 3000) => new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timed out waiting for ${event}`)), timeout);
    socket.once(event, (payload) => {
        clearTimeout(timer);
        resolve(payload);
    });
});

before(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());

    httpServer = http.createServer(app);
    ioServer = new Server(httpServer, { cors: { origin: true, credentials: true } });
    configureSocketServer(ioServer);
    await new Promise((resolve) => httpServer.listen(0, "127.0.0.1", resolve));
    socketUrl = `http://127.0.0.1:${httpServer.address().port}`;
});

beforeEach(async () => {
    clearRoomDocs();
    await User.deleteMany({});
    await Room.deleteMany({});
    owner = await signup("Owner", "owner-realtime@example.com");
    editor = await signup("Editor", "editor-realtime@example.com");
    viewer = await signup("Viewer", "viewer-realtime@example.com");

    const created = await request(app)
        .post("/api/rooms")
        .set("Authorization", `Bearer ${owner.accessToken}`)
        .send({ name: "Realtime room" });
    assert.equal(created.status, 201);
    room = created.body;

    const editorJoin = await request(app)
        .post("/api/rooms/join")
        .set("Authorization", `Bearer ${editor.accessToken}`)
        .send({ inviteCode: room.inviteCode });
    assert.equal(editorJoin.status, 200);
    const viewerJoin = await request(app)
        .post("/api/rooms/join")
        .set("Authorization", `Bearer ${viewer.accessToken}`)
        .send({ inviteCode: room.inviteCode });
    assert.equal(viewerJoin.status, 200);
});

after(async () => {
    clearRoomDocs();
    ioServer.close();
    await new Promise((resolve) => httpServer.close(resolve));
    await mongoose.disconnect();
    await mongo.stop();
});

test("broadcasts canvas snapshots to other room members", async () => {
    const ownerSocket = await connectSocket(owner.accessToken, room._id);
    const editorSocket = await connectSocket(editor.accessToken, room._id);
    const canvasData = [{ id: "shape-1", type: "rectangle", x: 10, y: 20, width: 100, height: 50 }];

    const received = waitForEvent(ownerSocket, "canvas:snapshot");
    const result = await emitWithAck(editorSocket, "canvas:snapshot", { roomId: room._id, canvasData });
    assert.equal(result.ok, true);
    assert.deepEqual((await received).canvasData, canvasData);

    const persisted = await Room.findById(room._id).select("canvasData yjsState");
    assert.deepEqual(persisted.canvasData, canvasData);
    assert.ok(persisted.yjsState?.length);
    ownerSocket.close();
    editorSocket.close();
});

test("switching rooms removes the socket from its previous room", async () => {
    const ownerSocket = await connectSocket(owner.accessToken, room._id);
    const editorSocket = await connectSocket(editor.accessToken, room._id);
    const secondRoom = await request(app)
        .post("/api/rooms")
        .set("Authorization", `Bearer ${owner.accessToken}`)
        .send({ name: "Second room" });
    assert.equal(secondRoom.status, 201);

    const leftPresence = waitForEvent(editorSocket, "presence:left");
    const joinResult = await emitWithAck(ownerSocket, "room:join", secondRoom.body._id);
    assert.equal(joinResult.ok, true);
    assert.equal((await leftPresence).userId, owner.user.id);

    let receivedOldRoomUpdate = false;
    ownerSocket.once("canvas:snapshot", () => { receivedOldRoomUpdate = true; });
    const updateResult = await emitWithAck(editorSocket, "canvas:snapshot", {
        roomId: room._id,
        canvasData: [{ id: "old-room-shape", type: "rectangle", x: 0, y: 0, width: 10, height: 10 }],
    });
    assert.equal(updateResult.ok, true);
    await new Promise((resolve) => setTimeout(resolve, 150));
    assert.equal(receivedOldRoomUpdate, false);
    ownerSocket.close();
    editorSocket.close();
});

test("broadcasts Yjs updates and persists their canvas state", async () => {
    const ownerSocket = await connectSocket(owner.accessToken, room._id);
    const editorSocket = await connectSocket(editor.accessToken, room._id);
    const doc = new Y.Doc();
    canvasToYDoc(doc, [{ id: "line-1", type: "line", x: 0, y: 0, x2: 80, y2: 80 }], "local");
    const update = Y.encodeStateAsUpdate(doc);

    const received = waitForEvent(ownerSocket, "yjs:update");
    const result = await emitWithAck(editorSocket, "yjs:update", { roomId: room._id, update: Buffer.from(update).toString("base64") });
    assert.equal(result.ok, true);
    assert.equal(typeof (await received).update, "string");

    const persisted = await Room.findById(room._id).select("canvasData");
    assert.equal(persisted.canvasData[0].id, "line-1");
    editorSocket.close();
    ownerSocket.close();
});

test("viewers cannot publish canvas snapshots", async () => {
    const ownerSocket = await connectSocket(owner.accessToken, room._id);
    const viewerSocket = await connectSocket(viewer.accessToken, room._id);
    const canvasData = [{ id: "blocked", type: "ellipse", x: 5, y: 5, width: 20, height: 20 }];
    let received = false;
    ownerSocket.on("canvas:snapshot", () => { received = true; });

    const result = await emitWithAck(viewerSocket, "canvas:snapshot", { roomId: room._id, canvasData });
    assert.equal(result.ok, false);
    await new Promise((resolve) => setTimeout(resolve, 150));
    assert.equal(received, false);

    const persisted = await Room.findById(room._id).select("canvasData");
    assert.deepEqual(persisted.canvasData, []);
    viewerSocket.close();
    ownerSocket.close();
});

test("public-room non-members can join live sessions as viewers", async () => {
    await request(app)
        .patch(`/api/rooms/${room._id}`)
        .set("Authorization", `Bearer ${owner.accessToken}`)
        .send({ isPublic: true });
    const outsider = await signup("Public viewer", "public-viewer-realtime@example.com");
    const ownerSocket = await connectSocket(owner.accessToken, room._id);
    const outsiderSocket = await connectSocket(outsider.accessToken, room._id);
    const canvasData = [{ id: "public-shape", type: "rectangle", x: 12, y: 18, width: 40, height: 30 }];

    const received = waitForEvent(outsiderSocket, "canvas:snapshot");
    const result = await emitWithAck(ownerSocket, "canvas:snapshot", { roomId: room._id, canvasData });
    assert.equal(result.ok, true);
    assert.deepEqual((await received).canvasData, canvasData);

    const publicViewerWrite = await emitWithAck(outsiderSocket, "canvas:snapshot", {
        roomId: room._id,
        canvasData: [...canvasData, { id: "blocked", type: "line", x: 0, y: 0, x2: 10, y2: 10 }],
    });
    assert.equal(publicViewerWrite.ok, false);
    ownerSocket.close();
    outsiderSocket.close();
});

test("rejects unauthenticated socket connections", async () => {
    const socket = createClient(socketUrl, { autoConnect: false, auth: { token: "invalid-token" }, transports: ["websocket"] });
    const error = await new Promise((resolve) => {
        socket.once("connect_error", resolve);
        socket.connect();
    });
    assert.match(error.message, /Unauthorized/);
    socket.close();
});
