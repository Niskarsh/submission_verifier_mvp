import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { OpenAI } from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { z } from 'zod';
import './ChatSection.css';

// Zod schemas to validate the tasks array returned by OpenAI.
const TaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  taskDescription: z.string(),
});
const TasksSchema = z.object({
  tasks: z.array(TaskSchema)
});

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

function ChatSection({ figmaFile, selectedSkillsets }) {
  const [tasks, setTasks] = useState([]);
  const [tasksFetched, setTasksFetched] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Build the initial prompt using provided Figma file and selected skillsets.
  const initialPrompt = `
You are an automated verifier tasked with assessing a submitter's claimed skillsets based on their provided submission, which may include links (e.g., to a Figma file) and other resources. Given a specific submission and a list of skillsets to test, your responsibilities are as follows:

1. Generate a series of tasks that the submitter must complete. Each task should be directly related to the submission and designed to thoroughly evaluate the corresponding claimed skillsets.
2. Ensure that the combined set of tasks comprehensively covers all the claimed skillsets.
3. Maintain the overall conversation context even if the submitter engages in additional dialogue between tasks.

Figma file link: ${figmaFile}

Skillsets selected: ${selectedSkillsets.join(', ')}
`;

  // Helper to format tasks into Markdown for the chat conversation.
  const formatTasks = (tasksArray) => {
    return tasksArray
      .map(
        (task, index) =>
          `${index + 1}. **${task.title}**\n${task.taskDescription}`
      )
      .join('\n\n');
  };

  // Fetch tasks using the openai package when component mounts.
  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      try {
        const completion = await openai.beta.chat.completions.parse({
          model: 'o3-mini',
          messages: [
            { role: 'system', content: 'You are an automated verifier.' },
            { role: 'user', content: initialPrompt }
          ],
          // No temperature parameter
          response_format: zodResponseFormat(TasksSchema, 'tasks'),
        });
        const parsedResponse = completion.choices[0].message.parsed;
        const fetchedTasks = parsedResponse.tasks.map(task => ({
          ...task,
          completed: false,
        }));
        setTasks(fetchedTasks);
        setTasksFetched(true);
        // Instead of displaying the initial prompt, display the formatted tasks as the assistant's first message.
        setChatMessages([{ sender: 'assistant', text: formatTasks(fetchedTasks) }]);
      } catch (error) {
        console.error('Error fetching tasks:', error);
        setChatMessages([{ sender: 'assistant', text: 'Something went wrong while fetching tasks.' }]);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [figmaFile, selectedSkillsets, initialPrompt]);

  // Handle sending a new chat message with streaming response.
  const handleChatSend = async () => {
    if (!chatInput.trim()) return;
    // Add user's message.
    const newUserMessage = { sender: 'user', text: chatInput };
    const updatedMessages = [...chatMessages, newUserMessage];
    setChatMessages(updatedMessages);
    setChatInput('');
  
    // Add a temporary assistant message that will stream content.
    setChatMessages(prev => [...prev, { sender: 'assistant', text: '' }]);
  
    try {
      setLoading(true);
      // Construct payload ensuring each message has a non-null content.
      const payloadMessages = updatedMessages
        .concat([{ sender: 'assistant', text: '' }])
        .map(msg => ({
          role: msg.sender === 'user' ? 'user' : (msg.sender === 'assistant' ? 'assistant' : 'system'),
          content: msg.text || '',
        }));
  
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: payloadMessages,
          stream: true,
        }),
      });
  
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
  
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let done = false;
      let assistantMessage = '';
      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value);
        // Process each line from the stream
        const lines = chunkValue.split('\n').filter(line => line.trim() !== '');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '').trim();
            if (dataStr === '[DONE]') {
              done = true;
              break;
            }
            try {
              const parsed = JSON.parse(dataStr);
              // Append token to assistant message (if available)
              const token = parsed.choices[0].delta?.content || '';
              assistantMessage += token;
              // Update the last assistant message in chatMessages.
              setChatMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = { sender: 'assistant', text: assistantMessage };
                return newMessages;
              });
            } catch (e) {
              console.error('Error parsing stream chunk:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error streaming chat message:', error);
      // Replace the temporary message with an error fallback.
      setChatMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = { sender: 'assistant', text: 'Something went wrong' };
        return newMessages;
      });
    } finally {
      setLoading(false);
    }
  };
  

  // Mark a task as completed.
  const markTaskCompleted = (taskId) => {
    setTasks(prev =>
      prev.map(task => task.id === taskId ? { ...task, completed: true } : task)
    );
  };

  return (
    <div className="chat-section-container">
      {/* Left sidebar: Tasks */}
      <div className="chat-sidebar">
        <h3>Tasks</h3>
        {!tasksFetched ? (
          <div className="loading-spinner">Loading tasks...</div>
        ) : (
          tasks.map(task => (
            <div key={task.id} className="task-panel">
              <div className="task-text">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {`**${task.title}**`}
                </ReactMarkdown>
              </div>
              <button onClick={() => markTaskCompleted(task.id)} disabled={task.completed}>
                {task.completed ? 'Completed' : 'Task Completed'}
              </button>
            </div>
          ))
        )}
      </div>

      {/* Main chat area */}
      <div className="chat-main-area">
        <div className="chat-messages">
          {chatMessages.map((msg, idx) => (
            <div key={idx} className={`chat-message ${msg.sender}`}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {msg.text}
              </ReactMarkdown>
            </div>
          ))}
        </div>
        <div className="chat-input-area">
          <input
            type="text"
            placeholder="Type your message..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleChatSend()}
          />
          <button onClick={handleChatSend} disabled={loading}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatSection;
