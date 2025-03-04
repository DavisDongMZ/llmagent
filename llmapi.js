const axios = require('axios');

class OllamaAPI {
    constructor(baseURL = 'http://localhost:11434', maxTokens = 128000) {
        this.baseURL = baseURL;
        this.maxTokens = maxTokens;
    }

    // 估算文本的 token 数量（简单估算，每个中文字符约2个token，英文单词约1.3个token）
    estimateTokens(text) {
        const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
        const englishWords = text.replace(/[\u4e00-\u9fa5]/g, '').split(/\s+/).length;
        return Math.ceil(chineseChars * 2 + englishWords * 1.3);
    }

    // 处理聊天历史，确保不超过 token 限制
    processChatHistory(chatHistory, currentPrompt) {
        let totalTokens = this.estimateTokens(currentPrompt);
        const processedHistory = [];
        
        // 从最新的消息开始处理
        for (let i = chatHistory.length - 1; i >= 0; i--) {
            const chat = chatHistory[i];
            const chatTokens = this.estimateTokens(chat.prompt + chat.model_response);
            
            // 如果添加这条消息会超过限制，就停止添加
            if (totalTokens + chatTokens > this.maxTokens) {
                break;
            }
            
            totalTokens += chatTokens;
            processedHistory.unshift(chat); // 添加到开头
        }
        
        return processedHistory;
    }

    async generate(prompt, model = 'llama2', chatHistory = [], options = {}) {
        try {
            // 处理聊天历史，确保不超过 token 限制
            const processedHistory = this.processChatHistory(chatHistory, prompt);
            
            // 构建包含历史记录的完整提示
            let fullPrompt = '';
            
            // 添加历史对话
            if (processedHistory.length > 0) {
                fullPrompt += '之前的对话历史：\n';
                processedHistory.forEach((chat, index) => {
                    fullPrompt += `用户: ${chat.prompt}\n`;
                    fullPrompt += `助手: ${chat.model_response}\n`;
                });
            }
            
            // 添加当前提示
            fullPrompt += `\n用户: ${prompt}\n助手: `;

            const response = await axios.post(`${this.baseURL}/api/generate`, {
                model,
                prompt: fullPrompt,
                ...options
            });
            return response.data;
        } catch (error) {
            console.error('Error calling Ollama:', error.message);
            throw error;
        }
    }

    async listModels() {
        try {
            const response = await axios.get(`${this.baseURL}/api/tags`);
            return response.data;
        } catch (error) {
            console.error('Error listing models:', error.message);
            throw error;
        }
    }

    async pullModel(modelName) {
        try {
            const response = await axios.post(`${this.baseURL}/api/pull`, {
                name: modelName
            });
            return response.data;
        } catch (error) {
            console.error('Error pulling model:', error.message);
            throw error;
        }
    }
}

module.exports = OllamaAPI;
