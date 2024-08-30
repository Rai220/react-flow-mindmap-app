import React, { useState } from 'react';
import axios from 'axios';
import useStore from './store'; // Импортируйте хранилище

const ChatPanel: React.FC = () => {
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState<string>('');
  const [openaiResponse, setOpenaiResponse] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('');
  const [mindmap, setMindmap] = useState<string>(''); // Новое состояние для mindmap

  const nodes = useStore((state) => state.nodes); // Получите узлы из хранилища
  const edges = useStore((state) => state.edges); // Получите ребра из хранилища

  const handleSendMessage = async () => {
    if (input.trim() && apiKey.trim()) {
      const userMessage = input;
      setMessages([...messages, `You: ${userMessage}`]);
      setInput('');

      const mindmapState = {
        nodes,
        edges,
      };

      const requestPayload = {
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'Ты ассистент, который помогает пользователю работать с MindMap и размышлять над его задачами.' },
          { role: 'system', content: `Структура MindMap: ${JSON.stringify(mindmapState)}` }, // Добавляем структуру mindmap
          { role: 'user', content: userMessage }
        ],
        max_tokens: 150,
      };

      console.log('Request Payload:', JSON.stringify(requestPayload, null, 2)); // Логируем текст запроса

      try {
        const response = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          requestPayload,
          {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        const assistantMessage = response.data.choices[0].message.content;
        setMessages([...messages, `Assistant: ${assistantMessage}`]);
        setOpenaiResponse(assistantMessage);
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  };

  return (
    <div className="chat-panel">
      <input
        type="password"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        placeholder="Enter OpenAI API Key"
      />
      <div className="messages">
        {messages.map((msg, index) => (
          <div key={index} className="message">
            {msg}
          </div>
        ))}
      </div>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type a message"
      />
      <button onClick={handleSendMessage}>Send</button>
      {/* <div className="openai-response">
        <h3>OpenAI Response:</h3>
        <p>{openaiResponse}</p>
      </div> */}
    </div>
  );
};

export default ChatPanel;