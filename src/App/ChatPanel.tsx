import React, { useState } from 'react';
import axios from 'axios';
import useStore from './store'; // Импортируйте хранилище

const ChatPanel: React.FC = () => {
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState<string>('');
  const [openaiResponse, setOpenaiResponse] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('');

  const nodes = useStore((state) => state.nodes); // Получите узлы из хранилища
  const edges = useStore((state) => state.edges); // Получите ребра из хранилища

  const handleSendMessage = async () => {
    setMessages([...messages, 'Processing...']);
    
    if (input.trim() && apiKey.trim()) {
      const userMessage = input;
      setMessages([...messages, `You: ${userMessage}`]);
      setInput('');

      const mindmapState = {
        nodes,
        edges,
      };

      const requestPayload = {
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 
`Ты ассистент, который помогает пользователю работать с MindMap и размышлять над его задачами.
Я передам тебе JSON структуру моей mainmap а ты должен ответить на мои вопросы о ней. Если я попрошу тебя что-то изменить в моей 
maindmap, то ты должен в ответ прислать мне новый JSON полностью со всеми изменениями.
В этом случае присылай только JSON без дополнительного текста и без markdown разметки. Первый символ должен быть {` },
          { role: 'system', content: `Структура MindMap: ${JSON.stringify(mindmapState)}` }, // Добавляем структуру mindmap
          { role: 'user', content: userMessage }
        ],
        
        max_tokens: 4000,
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

        if (response.status === 200) {
          const assistantMessage = response.data.choices[0].message.content;
          setOpenaiResponse(assistantMessage);
        
          try {
            const parsedAssistantMessage = JSON.parse(assistantMessage);
            if (typeof parsedAssistantMessage === 'object') {
              // Обновляем состояние mindmap в хранилище
              useStore.setState({ nodes: parsedAssistantMessage.nodes, edges: parsedAssistantMessage.edges });
            }
            setMessages([...messages, `Assistant: 'Ваш MindMap обновлён'`]);
          } catch (error) {
            // console.error('Error parsing assistant message:', error);
            setMessages([...messages, `Assistant: ${assistantMessage}`]);
          }
        } else {
          console.error('Error: Received non-200 response status', response.status);
          setMessages([...messages, 'Error: Failed to get a valid response from the API.']);
        }
      } catch (error) {
        console.error('Error sending message:', error);
        setMessages([...messages, 'Error: Failed to send the message.']);
      }
    }
  };

  return (
    <div className="chat-panel" style={{ backgroundColor: '#ffffff' }}>
      <input
        type="password"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        placeholder="Enter OpenAI API Key"
      />
      {!apiKey && <div className="error">Please select an API key.</div>}
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
    </div>
  );
};

export default ChatPanel;