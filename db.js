const { Pool } = require('pg');

class Database {
    constructor() {
        this.pool = new Pool({
            user: 'postgres',
            host: 'localhost',
            database: 'chat_history',
            password: 'your_password', // 请修改为您的密码
            port: 5432,
        });
        this.initDatabase();
    }

    async initDatabase() {
        const client = await this.pool.connect();
        try {
            // 创建聊天会话表
            await client.query(`
                CREATE TABLE IF NOT EXISTS chat_sessions (
                    session_id SERIAL PRIMARY KEY,
                    user_id VARCHAR(255),
                    title VARCHAR(255),
                    model_name VARCHAR(255),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);

            // 创建聊天消息表
            await client.query(`
                CREATE TABLE IF NOT EXISTS chat_messages (
                    message_id SERIAL PRIMARY KEY,
                    session_id INTEGER REFERENCES chat_sessions(session_id),
                    role VARCHAR(50),
                    content TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);

            // 创建索引以提高查询性能
            await client.query(`
                CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
                CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
            `);

            console.log('数据库初始化成功');
        } catch (error) {
            console.error('数据库初始化错误:', error);
        } finally {
            client.release();
        }
    }

    // 创建新的聊天会话
    async createSession(userId, title, modelName) {
        const client = await this.pool.connect();
        try {
            const result = await client.query(
                `INSERT INTO chat_sessions (user_id, title, model_name)
                 VALUES ($1, $2, $3)
                 RETURNING *`,
                [userId, title, modelName]
            );
            return result.rows[0];
        } catch (error) {
            console.error('创建会话错误:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    // 保存聊天消息
    async saveMessage(sessionId, role, content) {
        const client = await this.pool.connect();
        try {
            const result = await client.query(
                `INSERT INTO chat_messages (session_id, role, content)
                 VALUES ($1, $2, $3)
                 RETURNING *`,
                [sessionId, role, content]
            );

            // 更新会话的更新时间
            await client.query(
                `UPDATE chat_sessions 
                 SET updated_at = CURRENT_TIMESTAMP 
                 WHERE session_id = $1`,
                [sessionId]
            );

            return result.rows[0];
        } catch (error) {
            console.error('保存消息错误:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    // 获取会话的聊天历史
    async getChatHistory(sessionId, limit = 10) {
        const client = await this.pool.connect();
        try {
            const result = await client.query(
                `SELECT * FROM chat_messages 
                 WHERE session_id = $1 
                 ORDER BY created_at ASC 
                 LIMIT $2`,
                [sessionId, limit]
            );
            return result.rows;
        } catch (error) {
            console.error('获取聊天历史错误:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    // 获取用户的所有会话
    async getUserSessions(userId) {
        const client = await this.pool.connect();
        try {
            const result = await client.query(
                `SELECT * FROM chat_sessions 
                 WHERE user_id = $1 
                 ORDER BY updated_at DESC`,
                [userId]
            );
            return result.rows;
        } catch (error) {
            console.error('获取用户会话错误:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    // 删除会话及其所有消息
    async deleteSession(sessionId) {
        const client = await this.pool.connect();
        try {
            // 首先删除所有相关消息
            await client.query(
                'DELETE FROM chat_messages WHERE session_id = $1',
                [sessionId]
            );
            // 然后删除会话
            await client.query(
                'DELETE FROM chat_sessions WHERE session_id = $1',
                [sessionId]
            );
        } catch (error) {
            console.error('删除会话错误:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    // 更新会话标题
    async updateSessionTitle(sessionId, newTitle) {
        const client = await this.pool.connect();
        try {
            const result = await client.query(
                `UPDATE chat_sessions 
                 SET title = $1, updated_at = CURRENT_TIMESTAMP 
                 WHERE session_id = $2 
                 RETURNING *`,
                [newTitle, sessionId]
            );
            return result.rows[0];
        } catch (error) {
            console.error('更新会话标题错误:', error);
            throw error;
        } finally {
            client.release();
        }
    }
}

module.exports = Database; 