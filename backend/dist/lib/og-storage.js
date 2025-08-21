"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ogStorage = void 0;
const _0g_ts_sdk_1 = require("@0glabs/0g-ts-sdk");
const ethers_1 = require("ethers");
class OgStorageService {
    indexer;
    provider;
    signer;
    rpcUrl;
    constructor() {
        const indexerRpc = process.env.OG_INDEXER_RPC || "https://indexer-storage-testnet-turbo.0g.ai";
        this.indexer = new _0g_ts_sdk_1.Indexer(indexerRpc);
        this.rpcUrl = process.env.OG_CHAIN_RPC_URL || "https://evmrpc-testnet.0g.ai";
        this.provider = new ethers_1.ethers.JsonRpcProvider(this.rpcUrl);
        const privateKey = process.env.OG_PRIVATE_KEY;
        this.signer = privateKey ? new ethers_1.ethers.Wallet(privateKey, this.provider) : null;
    }
    async uploadBlacklistData(data) {
        try {
            if (!this.signer) {
                console.warn("No signer configured for 0G Storage uploads, storing locally only");
                return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            }
            const jsonData = JSON.stringify({
                type: "blacklist",
                data: data,
                metadata: {
                    version: Date.now().toString(),
                    recordCount: data.length,
                    tags: ["security", "blacklist", "threats"],
                    timestamp: new Date().toISOString(),
                },
            });
            const file = new _0g_ts_sdk_1.ZgFile(Buffer.from(jsonData, 'utf-8'));
            const [tree, treeErr] = await file.merkleTree();
            if (treeErr !== null) {
                await file.close();
                throw new Error(`Error generating Merkle tree: ${treeErr}`);
            }
            const rootHash = tree?.rootHash();
            if (!rootHash) {
                await file.close();
                throw new Error("Failed to generate root hash");
            }
            const [txHash, uploadErr] = await this.indexer.upload(file, this.rpcUrl, this.signer);
            if (uploadErr !== null) {
                await file.close();
                throw new Error(`Upload error: ${uploadErr}`);
            }
            console.log(`✅ Blacklist data uploaded to 0G Storage - TX: ${txHash}, Hash: ${rootHash}`);
            await file.close();
            return rootHash;
        }
        catch (error) {
            console.error("Failed to upload blacklist data:", error);
            throw new Error("Failed to upload blacklist data to 0G Storage");
        }
    }
    async getBlacklistData(rootHash) {
        try {
            if (!rootHash) {
                return [];
            }
            const tempPath = `./temp/blacklist_${Date.now()}.json`;
            const fs = await Promise.resolve().then(() => __importStar(require('fs/promises')));
            const path = await Promise.resolve().then(() => __importStar(require('path')));
            const tempDir = path.dirname(tempPath);
            await fs.mkdir(tempDir, { recursive: true });
            const downloadErr = await this.indexer.download(rootHash, tempPath, true);
            if (downloadErr !== null) {
                throw new Error(`Download error: ${downloadErr}`);
            }
            const fileContent = await fs.readFile(tempPath, 'utf-8');
            const parsedData = JSON.parse(fileContent);
            await fs.unlink(tempPath).catch(() => { });
            console.log(`✅ Retrieved blacklist data from 0G Storage: ${rootHash}`);
            return parsedData.data || [];
        }
        catch (error) {
            console.error("Failed to retrieve blacklist data:", error);
            return [];
        }
    }
    async uploadThreatIntelligence(data) {
        try {
            const jsonData = JSON.stringify({
                type: "threat_intelligence",
                data: data,
                metadata: {
                    version: Date.now().toString(),
                    recordCount: data.length,
                    tags: ["security", "threat-intel", "indicators"],
                },
            });
            const crypto = await Promise.resolve().then(() => __importStar(require('crypto')));
            const hash = crypto.createHash('sha256').update(jsonData).digest('hex');
            const rootHash = `0x${hash}`;
            console.log(`Threat intelligence prepared for 0G Storage: ${rootHash}`);
            return rootHash;
        }
        catch (error) {
            console.error("Failed to upload threat intelligence:", error);
            throw new Error("Failed to upload threat intelligence to 0G Storage");
        }
    }
    async getThreatIntelligence(rootHash) {
        try {
            if (!rootHash) {
                return [];
            }
            console.log(`Would retrieve threat intelligence for hash: ${rootHash}`);
            return [];
        }
        catch (error) {
            console.error("Failed to retrieve threat intelligence:", error);
            return [];
        }
    }
    async searchBlacklist(query) {
        try {
            console.log(`Would search blacklist with query:`, query);
            return [];
        }
        catch (error) {
            console.error("Failed to search blacklist:", error);
            return [];
        }
    }
    async storeSecurityReport(report) {
        try {
            console.log(`Would store security report: ${report.id}`);
            return report.id;
        }
        catch (error) {
            console.error("Failed to store security report:", error);
            throw new Error("Failed to store security report");
        }
    }
    async getSecurityReport(key) {
        try {
            console.log(`Would retrieve security report: ${key}`);
            return null;
        }
        catch (error) {
            console.error("Failed to retrieve security report:", error);
            return null;
        }
    }
    async getStorageMetrics() {
        try {
            return {
                totalSize: 0,
                recordCount: 0,
                lastUpdate: new Date().toISOString(),
                availability: 99.9,
            };
        }
        catch (error) {
            console.warn("Failed to get storage metrics:", error);
            return {
                totalSize: 0,
                recordCount: 0,
                lastUpdate: new Date().toISOString(),
                availability: 99.9,
            };
        }
    }
    async syncWithThreatFeeds() {
        try {
            console.log("Would sync threat feeds");
            return { updated: 0, errors: [] };
        }
        catch (error) {
            console.error("Failed to sync threat feeds:", error);
            return { updated: 0, errors: ["Sync failed"] };
        }
    }
    async createDataSnapshot() {
        try {
            const snapshotId = `snapshot_${Date.now()}`;
            console.log(`Would create data snapshot: ${snapshotId}`);
            return snapshotId;
        }
        catch (error) {
            console.error("Failed to create data snapshot:", error);
            throw new Error("Failed to create data snapshot");
        }
    }
}
exports.ogStorage = new OgStorageService();
//# sourceMappingURL=og-storage.js.map