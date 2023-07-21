import cors from 'cors';
import express from 'express';
import { reclaimprotocol } from "@reclaimprotocol/reclaim-sdk";
import dotenv from 'dotenv';
import { ethers } from 'ethers';
// import contractABI from './smart-contracts/ZodiaCoin.json';
import { MongoClient } from 'mongodb';

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const reclaim = new reclaimprotocol.Reclaim();

dotenv.config();
const dbUsername = process.env.DB_USER;
const dbPassword = process.env.DB_PWD;

// Connect to MongoDB Atlas. Use other DB if needed.
const mongoUri = `mongodb+srv://${dbUsername}:${dbPassword}@cluster0.elv9kur.mongodb.net/`;
const client = new MongoClient(mongoUri, { monitorCommands: true });

const callbackBase = `http://192.168.0.130:${port}`; // Modify this to get from environment
const callbackUrl = `${callbackBase}/callback`

app.use((req, res, next) => {
    console.log('[Backend] -- Endpoint called: ', req.url);
    next();
});

app.get("/request-proofs", async (req, res) => {
    try {
        const db = client.db();
        const callbackCollection = db.collection('zodiacoin');
        const request = reclaim.requestProofs({
            title: "ZodiaCoin",
            baseCallbackUrl: callbackUrl,
            requestedProofs: [
                new reclaim.CustomProvider({
                    provider: 'uidai-dob',
                    payload: {}
                }),
            ],
        });
        const reclaimUrl = await request.getReclaimUrl();
        const {callbackId, template, id} = request;
        console.log("[B-Request-P -- TEMP] -- CallbackId: ", callbackId);
        console.log("[B-Request-P -- TEMP] -- Template: ", template);
        console.log("[B-Request-P -- TEMP] -- Id: ", id);
        console.log("[B-Request-P -- TEMP] -- ReclaimUrl: ", reclaimUrl);
        await callbackCollection.insertOne({callbackId: callbackId, proofs: []});
        res.status(200).json({reclaimUrl, callbackId, template, id});
    }
    catch (error) {
        console.error("[B-Request-P -- Catch] -- Error requesting proofs:\n", error);
        res.status(500).json({error: "Failed to request proofs"});
    }
    return;
});

app.use(express.text({ type: "*/*" }));
app.post("/callback/", async (req, res) => {
    try {
        const {id: callbackId} = req.query;
        console.log("[Callback -- TEMP] -- CallbackId from RW: ", callbackId);
        console.log("[Callback -- TEMP] -- Body from RW: ", req.body);
        const { proofs } = JSON.parse(decodeURIComponent(req.body));
        console.log("[Callback -- TEMP] -- Proofs: ", proofs);

        const onChainClaimIds = reclaim.getOnChainClaimIdsFromProofs(proofs); // Remove these later
        console.log("[Callback -- TEMP] -- onChainClaimIds: ", onChainClaimIds);
        const isProofCorrect = await reclaim.verifyCorrectnessOfProofs(callbackId as string, proofs);
        console.log("[Callback -- TEMP] -- is Proof Correct? ", isProofCorrect);

        res.json({msg: "Callback received at backend. Check your application."});

        const db = client.db();
        const callbackCollection = db.collection('zodiacoin');

        const entry = await callbackCollection.findOne({callbackId: callbackId});
        if (!entry) {
            console.log(callbackId, " not found in the database");
            throw new Error(`${callbackId} not found in the database.`);
            // return false;
        }

        const result = await callbackCollection.updateOne({callbackId: callbackId}, {$set: {callbackId: callbackId, proofs: proofs}});
        if (result.matchedCount === 0) {
            console.log(callbackId, " not found in the database");
            throw new Error(`${callbackId} not found in the database.`);
        }
        console.log(result);
    }
    catch (error) {
        console.log("[Callback -- TEMP] -- Error: ", error);
    }
    return;
});

app.get("/get-proofs/", async (req, res) => {
    try {
        const {id: callbackId} = req.query;
        const db = client.db();
        const callbackCollection = db.collection('zodiacoin');
        const entry = await callbackCollection.findOne({callbackId: callbackId});
        if (!entry) {
            console.log(callbackId, " not found in the database");
            throw new Error(`${callbackId} not found in the database.`);
            // return 0;
        }
        res.status(200).json(entry.proofs);
    }
    catch (error) {
        console.error("[Get-Proofs -- TEMP] -- Error: ", error);
        res.status(500).json({msg: "DB not Connected/web3 error"});
    }
    return;
});

// Start the Express.js App
app.listen(port, async () => {
    try {
        await client.connect();
        console.log('Connected to mongoDB.');
    } catch (error) {
        console.error('Exiting. Failed to connect to mongoDB with error:', error, );
        process.exit(1);
    }
    console.log(`Express server is listening on port ${port}`)
});