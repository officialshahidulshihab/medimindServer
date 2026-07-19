import { Request, Response } from 'express';
import { SymptomSession } from '../models/SymptomSession';
import { SessionTurn, Role } from '../models/SessionTurn';
import { HealthDocument } from '../models/HealthDocument';
import { UserHealthProfile } from '../models/UserHealthProfile';
import { runSymptomAgent } from '../ai/symptom-agent';
import { runDocumentIntelligence } from '../ai/document-intelligence';
import { runDrugInteractionCheck } from '../ai/drug-interaction';
import { DrugCheck } from '../models/DrugCheck';

export const handleSymptomChat = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { sessionId, userMessage } = req.body;

    if (!sessionId || !userMessage) {
      res.status(400).json({ success: false, message: 'sessionId and userMessage are required' });
      return;
    }

    const session = await SymptomSession.findOne({ _id: sessionId, userId });
    if (!session) {
      res.status(404).json({ success: false, message: 'Session not found' });
      return;
    }

    // Load user's health profile for AI context
    const profile = await UserHealthProfile.findOne({ userId });
    let profileContext = '';
    if (profile) {
      profileContext = `User Profile: Age ${profile.age || 'Unknown'}, Gender ${profile.gender || 'Unknown'}, Allergies: ${profile.allergies.join(', ')}, Chronic Conditions: ${profile.chronicConditions.join(', ')}, Medications: ${profile.currentMedications.join(', ')}.`;
    }

    // Get previous turns
    const pastTurns = await SessionTurn.find({ sessionId }).sort({ turnIndex: 1 });
    
    // Save user message
    const turnIndex = pastTurns.length;
    await SessionTurn.create({
      sessionId,
      role: Role.User,
      content: userMessage,
      turnIndex
    });

    // Run AI
    const history = pastTurns.map(t => ({ role: t.role, content: t.content }));
    
    // Prepend profile context to the first system message equivalent or pass within user message context, 
    // the symptom agent handles standard history. We can inject it into the agent directly or prepend to user message.
    // For simplicity, appending it seamlessly into the user message context strictly for the AI processing if it's the first turn, or the agent can handle it.
    // We will just let the agent use the raw history. The agent uses a system prompt. I'll modify the symptom-agent to accept profileContext if needed, 
    // but the spec says "Load user's health profile to give AI context". I'll format the userMessage with it if it's the first turn.
    const messageForAi = turnIndex === 0 && profileContext ? `[Context for AI: ${profileContext}]\n\n${userMessage}` : userMessage;

    const aiResponseText = await runSymptomAgent(history, messageForAi);

    // Save AI response
    await SessionTurn.create({
      sessionId,
      role: Role.Assistant,
      content: aiResponseText,
      turnIndex: turnIndex + 1
    });

    res.status(200).json({ success: true, data: aiResponseText });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error processing AI chat' });
  }
};

export const analyzeDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { documentId } = req.body;

    const doc = await HealthDocument.findOne({ _id: documentId, userId });
    if (!doc) {
      res.status(404).json({ success: false, message: 'Document not found' });
      return;
    }

    // Pass both fileUrl AND fileName so MIME type detection works
    const aiResult = await runDocumentIntelligence(doc.fileUrl, doc.fileName);

    // Update document
    doc.aiSummary = aiResult.summary;
    doc.extractedData = aiResult.extractedData;
    doc.abnormalFlags = aiResult.abnormalFlags;
    doc.actionItems = aiResult.actionItems;
    await doc.save();

    res.status(200).json({ success: true, data: doc });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error analyzing document' });
  }
};

export const checkDrugs = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { medications } = req.body;

    if (!medications || !Array.isArray(medications) || medications.length === 0) {
      res.status(400).json({ success: false, message: 'Medications array is required' });
      return;
    }

    const result = await runDrugInteractionCheck(medications);

    const check = await DrugCheck.create({
      userId,
      medications: result.resolvedMedications.map(r => r.generic),
      interactionMatrix: result.interactionMatrix,
      dangerFlags: result.dangerFlags,
      overallRiskLevel: result.overallRiskLevel
    });

    res.status(200).json({ 
      success: true, 
      data: {
        ...result,
        resolvedMedications: result.resolvedMedications
      } 
    });
  } catch (error: any) {
    if (error.message?.startsWith('INVALID_MEDICATIONS:')) {
      const invalidList = error.message.replace('INVALID_MEDICATIONS:', '').split(',');
      res.status(400).json({
        success: false,
        code: 'INVALID_MEDICATIONS',
        invalidMedications: invalidList,
        message: `These don't appear to be real medications: ${invalidList.join(', ')}`
      });
      return;
    }
    res.status(500).json({ success: false, message: error.message || 'Error checking drugs' });
  }
};
