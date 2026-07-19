"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const index_1 = __importDefault(require("../src/index"));
const db_1 = require("../src/lib/db");
// Connection is cached across warm serverless invocations
let isReady = false;
async function handler(req, res) {
    if (!isReady) {
        await (0, db_1.connectDB)();
        await (0, db_1.syncIndexes)();
        isReady = true;
    }
    return new Promise((resolve, reject) => {
        index_1.default(req, res, (err) => {
            if (err)
                return reject(err);
            resolve();
        });
    });
}
