const geminiService = require('../services/geminiChatService');

class AgentController {

    static async chat(req, res) {

        try {

            const userId = req.user?.id || "demo";
            const { message } = req.body;

            if (!message) {
                return res.status(400).json({
                    success: false,
                    message: "Message required"
                });
            }

            const userContext = {
                name: req.user?.name || "User",
                balance: 5000,
                monthlyLimit: 5000
            };

            const aiResponse = await geminiService.processMessage(
                userId,
                message,
                userContext
            );

            return res.json({
                success: true,
                data: aiResponse
            });

        } catch (error) {

            console.error("Chat Error:", error);

            return res.status(500).json({
                success: false,
                message: "AI failed"
            });
        }
    }
}

module.exports = AgentController;