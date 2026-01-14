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
exports.getCharts = exports.getStats = void 0;
const analyticsService = __importStar(require("../services/analytics.service"));
const getStats = async (req, res) => {
    try {
        const stats = await analyticsService.getDashboardStats();
        res.json({ success: true, data: stats });
    }
    catch (error) {
        console.error("Stats Error:", error);
        res.status(500).json({ success: false, message: "Failed to load dashboard stats" });
    }
};
exports.getStats = getStats;
const getCharts = async (req, res) => {
    try {
        const chartData = await analyticsService.getFinancialChartData();
        res.json({ success: true, data: chartData });
    }
    catch (error) {
        console.error("Chart Error:", error);
        res.status(500).json({ success: false, message: "Failed to load charts" });
    }
};
exports.getCharts = getCharts;
