const OllamaAPI = require('./llmapi');
const Database = require('./db');

async function main() {
    const ollama = new OllamaAPI();
    const db = new Database();
    const userId = 'user123';

    try {
        // 创建新的聊天会话
        const session = await db.createSession(
            userId,
            '关于人工智能的讨论',
            'llama2'
        );
        console.log('创建新会话:', session);

        // 第一轮对话
        const prompt1 = '你好，请介绍一下你自己';
        const response1 = await ollama.generate(prompt1, 'llama2');
        
        // 保存用户消息和助手回复
        await db.saveMessage(session.session_id, 'user', prompt1);
        await db.saveMessage(session.session_id, 'assistant', response1.response);

        // 第二轮对话
        const history1 = await db.getChatHistory(session.session_id);
        const prompt2 = '你刚才说的都是真的吗？';
        const response2 = await ollama.generate(prompt2, 'llama2', history1);
        
        await db.saveMessage(session.session_id, 'user', prompt2);
        await db.saveMessage(session.session_id, 'assistant', response2.response);

        // 创建另一个会话
        const session2 = await db.createSession(
            userId,
            '关于编程的讨论',
            'llama2'
        );
        console.log('创建第二个会话:', session2);

        // 在新会话中进行对话
        const prompt3 = '请介绍一下JavaScript';
        const response3 = await ollama.generate(prompt3, 'llama2');
        
        await db.saveMessage(session2.session_id, 'user', prompt3);
        await db.saveMessage(session2.session_id, 'assistant', response3.response);

        // 获取用户的所有会话
        const userSessions = await db.getUserSessions(userId);
        console.log('用户的所有会话:', userSessions);

        // 获取第一个会话的完整历史
        const session1History = await db.getChatHistory(session.session_id);
        console.log('第一个会话的历史:', session1History);

        // 更新会话标题
        await db.updateSessionTitle(session.session_id, '更新后的标题');

        // 删除第二个会话
        await db.deleteSession(session2.session_id);

    } catch (error) {
        console.error('错误:', error);
    }
}

main(); 