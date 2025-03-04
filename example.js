const OllamaAPI = require('./llmapi');

async function main() {
    const ollama = new OllamaAPI();

    try {
        // 列出可用的模型
        console.log('Available models:');
        const models = await ollama.listModels();
        console.log(models);

        // 生成文本
        const response = await ollama.generate('你好，请介绍一下你自己', 'llama2');
        console.log('Generated response:', response);
    } catch (error) {
        console.error('Error:', error);
    }
}

main(); 