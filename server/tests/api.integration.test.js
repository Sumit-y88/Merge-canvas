import assert from "node:assert/strict";
import test, { after, before, beforeEach } from "node:test";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import app from "../src/app.js";
import User from "../src/models/User.model.js";
import Room from "../src/models/Room.model.js";

let mongo;
let owner;
let editor;
let ownerToken;
let editorToken;
let room;

const signup = async (name, email) => {
    const response = await request(app).post("/api/auth/signup").send({ name, email, password: "password123" });
    assert.equal(response.status, 201);
    return response.body;
};

before(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
});

beforeEach(async () => {
    await User.deleteMany({});
    await Room.deleteMany({});
    owner = await signup("Owner", "owner@example.com");
    editor = await signup("Editor", "editor@example.com");
    ownerToken = owner.accessToken;
    editorToken = editor.accessToken;
    const roomResponse = await request(app).post("/api/rooms").set("Authorization", `Bearer ${ownerToken}`).send({ name: "Integration room" });
    assert.equal(roomResponse.status, 201);
    room = roomResponse.body;
    const joinResponse = await request(app).post("/api/rooms/join").set("Authorization", `Bearer ${editorToken}`).send({ inviteCode: room.inviteCode });
    assert.equal(joinResponse.status, 200);
});

after(async () => {
    await mongoose.disconnect();
    await mongo.stop();
});

test("authenticated users can create and load a room", async () => {
    const response = await request(app).get(`/api/rooms/${room._id}`).set("Authorization", `Bearer ${editorToken}`);
    assert.equal(response.status, 200);
    assert.equal(response.body.name, "Integration room");
    assert.equal(response.body.canvasData.length, 0);
});

test("missing or invalid access tokens are rejected with 401", async () => {
    const missingToken = await request(app).get("/api/rooms");
    assert.equal(missingToken.status, 401);
    assert.equal(missingToken.body.message, "Not authorized, no token");

    const invalidToken = await request(app)
        .get("/api/rooms")
        .set("Authorization", "Bearer invalid-token");
    assert.equal(invalidToken.status, 401);
    assert.equal(invalidToken.body.message, "Not authorized, token failed");
});

test("editors can persist canvas data", async () => {
    const canvasData = [{ id: "shape-1", type: "rectangle", x: 10, y: 20, width: 100, height: 50 }];
    const save = await request(app).put(`/api/rooms/${room._id}/canvas`).set("Authorization", `Bearer ${editorToken}`).send({ canvasData });
    assert.equal(save.status, 200);

    const loaded = await request(app).get(`/api/rooms/${room._id}`).set("Authorization", `Bearer ${ownerToken}`);
    assert.deepEqual(loaded.body.canvasData, canvasData);
});

test("viewers cannot persist canvas data", async () => {
    const promote = await request(app).patch(`/api/rooms/${room._id}/collaborators/${editor.user.id}/role`).set("Authorization", `Bearer ${ownerToken}`).send({ role: "viewer" });
    assert.equal(promote.status, 200);

    const save = await request(app).put(`/api/rooms/${room._id}/canvas`).set("Authorization", `Bearer ${editorToken}`).send({ canvasData: [] });
    assert.equal(save.status, 403);
});

test("owners can update settings and regenerate invite codes", async () => {
    const originalInviteCode = room.inviteCode;
    const settings = await request(app)
        .patch(`/api/rooms/${room._id}`)
        .set("Authorization", `Bearer ${ownerToken}`)
        .send({ name: "Renamed room", isPublic: true, defaultJoinRole: "viewer" });
    assert.equal(settings.status, 200);
    assert.equal(settings.body.name, "Renamed room");
    assert.equal(settings.body.isPublic, true);
    assert.equal(settings.body.defaultJoinRole, "viewer");

    const regenerated = await request(app)
        .post(`/api/rooms/${room._id}/invite/regenerate`)
        .set("Authorization", `Bearer ${ownerToken}`);
    assert.equal(regenerated.status, 200);
    assert.notEqual(regenerated.body.inviteCode, originalInviteCode);
});

test("members can leave and owners can remove or delete rooms", async () => {
    const leave = await request(app)
        .post(`/api/rooms/${room._id}/leave`)
        .set("Authorization", `Bearer ${editorToken}`);
    assert.equal(leave.status, 204);

    const ownerLeave = await request(app)
        .post(`/api/rooms/${room._id}/leave`)
        .set("Authorization", `Bearer ${ownerToken}`);
    assert.equal(ownerLeave.status, 403);

    const secondEditor = await signup("Second editor", "second@example.com");
    await request(app).post("/api/rooms/join").set("Authorization", `Bearer ${secondEditor.accessToken}`).send({ inviteCode: room.inviteCode });
    const remove = await request(app)
        .delete(`/api/rooms/${room._id}/collaborators/${secondEditor.user.id}`)
        .set("Authorization", `Bearer ${ownerToken}`);
    assert.equal(remove.status, 200);

    const deletion = await request(app)
        .delete(`/api/rooms/${room._id}`)
        .set("Authorization", `Bearer ${ownerToken}`);
    assert.equal(deletion.status, 204);
});
