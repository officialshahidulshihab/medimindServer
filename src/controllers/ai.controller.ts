import { Request, Response } from "express";
import type { FilterQuery } from "../types/mongoose.js";
import { SymptomSession, ISymptomSession } from "../models/SymptomSession.js";
import { SessionTurn, ISessionTurn, Role } from "../models/SessionTurn.js";
import { HealthDocument, IHealthDocument } from "../models/HealthDocument.js";
import {
  UserHealthProfile,
  IUserHealthProfile,
} from "../models/UserHealthProfile.js";
import { runSymptomAgent } from "../ai/symptom-agent.js";
import { runDocumentIntelligence } from "../ai/document-intelligence.js";
import { runDrugInteractionCheck } from "../ai/drug-interaction.js";
import { DrugCheck } from "../models/DrugCheck.js";

export const handleSymptomChat = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { sessionId, userMessage } = req.body;

    if (!sessionId || !userMessage) {
      res
        .status(400)
        .json({
          success: false,
          message: "sessionId and userMessage are required",
        });
      return;
    }

    const session = await SymptomSession.findOne({
      _id: sessionId,
      userId,
    } as FilterQuery<ISymptomSession>);
    if (!session) {
      res.status(404).json({ success: false, message: "Session not found" });
      return;
    }

    const profile = await UserHealthProfile.findOne({
      userId,
    } as FilterQuery<IUserHealthProfile>);
    let profileContext = "";
    if (profile) {
      profileContext = `User Profile: Age ${profile.age || "Unknown"}, Gender ${profile.gender || "Unknown"}, Allergies: ${profile.allergies.join(", ")}, Chronic Conditions: ${profile.chronicConditions.join(", ")}, Medications: ${profile.currentMedications.join(", ")}.`;
    }

    const pastTurns = await SessionTurn.find({
      sessionId,
    } as FilterQuery<ISessionTurn>).sort({ turnIndex: 1 });

    const turnIndex = pastTurns.length;
    await SessionTurn.create({
      sessionId,
      role: Role.User,
      content: userMessage,
      turnIndex,
    });

    const history = pastTurns.map((t) => ({
      role: t.role,
      content: t.content,
    }));
    const messageForAi =
      turnIndex === 0 && profileContext
        ? `[Context for AI: ${profileContext}]\n\n${userMessage}`
        : userMessage;

    const aiResponseText = await runSymptomAgent(history, messageForAi);

    await SessionTurn.create({
      sessionId,
      role: Role.Assistant,
      content: aiResponseText,
      turnIndex: turnIndex + 1,
    });

    res.status(200).json({ success: true, data: aiResponseText });
  } catch (error: any) {
    res
      .status(500)
      .json({
        success: false,
        message: error.message || "Error processing AI chat",
      });
  }
};

export const analyzeDocument = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { documentId } = req.body;

    const doc = await HealthDocument.findOne({
      _id: documentId,
      userId,
    } as FilterQuery<IHealthDocument>);
    if (!doc) {
      res.status(404).json({ success: false, message: "Document not found" });
      return;
    }

    const aiResult = await runDocumentIntelligence(doc.fileUrl, doc.fileName);

    doc.aiSummary = aiResult.summary;
    doc.extractedData = aiResult.extractedData;
    doc.abnormalFlags = aiResult.abnormalFlags;
    doc.actionItems = aiResult.actionItems;
    await doc.save();

    res.status(200).json({ success: true, data: doc });
  } catch (error: any) {
    res
      .status(500)
      .json({
        success: false,
        message: error.message || "Error analyzing document",
      });
  }
};

export const checkDrugs = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { medications } = req.body;

    if (
      !medications ||
      !Array.isArray(medications) ||
      medications.length === 0
    ) {
      res
        .status(400)
        .json({ success: false, message: "Medications array is required" });
      return;
    }

    const result = await runDrugInteractionCheck(medications);

    await DrugCheck.create({
      userId,
      medications: result.resolvedMedications.map((r) => r.generic),
      interactionMatrix: result.interactionMatrix,
      dangerFlags: result.dangerFlags,
      overallRiskLevel: result.overallRiskLevel,
    });

    res.status(200).json({
      success: true,
      data: {
        ...result,
        resolvedMedications: result.resolvedMedications,
      },
    });
  } catch (error: any) {
    if (error.message?.startsWith("INVALID_MEDICATIONS:")) {
      const invalidList = error.message
        .replace("INVALID_MEDICATIONS:", "")
        .split(",");
      res.status(400).json({
        success: false,
        code: "INVALID_MEDICATIONS",
        invalidMedications: invalidList,
        message: `These don't appear to be real medications: ${invalidList.join(", ")}`,
      });
      return;
    }
    res
      .status(500)
      .json({
        success: false,
        message: error.message || "Error checking drugs",
      });
  }
};
