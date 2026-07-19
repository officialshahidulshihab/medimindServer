"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const index_1 = __importDefault(require("../src/index"));
const db_1 = require("../src/lib/db");
// Ensure DB is connected before handling requests (cached across invocations)
let isInitialized = false;
async function initialize() {
    if (!isInitialized) {
        await (0, db_1.connectDB)();
        await (0, db_1.syncIndexes)();
        isInitialized = true;
    }
}
async function handler(req, res) {
    await initialize();
    // Delegate to Express
    return new Promise((resolve, reject) => {
        index_1.default(req, res, (err) => {
            if (err)
                return reject(err);
            resolve();
        });
    });
}
