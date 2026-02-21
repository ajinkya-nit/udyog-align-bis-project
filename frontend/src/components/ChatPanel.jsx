import React, { useState } from 'react';
import { Send, UploadCloud, FileText, CheckCircle2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const ChatPanel = ({ sessionData, setSessionData }) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! I am your AI Compliance Consultant for BIS certification. To get started, please tell me what product you manufacture, and upload your Factory Quality Manual or testing logs if you have them."
    }
  ]);
  const [input, setInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [fileUrl, setFileUrl] = useState(null);
  const [uploadedDocumentText, setUploadedDocumentText] = useState('');

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input; // capture before reset
    setInput('');
    
    try {
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: currentInput,
          chatHistory: messages,
          fileUrl: fileUrl,
          uploadedDocumentText: uploadedDocumentText,
          productName: sessionData.productName // passed for context if already known
        })
      });
      const data = await response.json();
      
      if (!response.ok) {
         setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ Error: ${data.error || 'Failed to analyze'}` }]);
         return;
      }
      
      setMessages(prev => [...prev, { role: 'assistant', content: data.aiMessage || "I've updated your dashboard based on that information." }]);
      
      // Update Split-screen dashboard with ground truth from AI Engine
      if (data.isCode) {
        setSessionData(prev => ({
          ...prev,
          isCode: data.isCode,
          readinessScore: data.readinessScore !== undefined ? data.readinessScore : prev.readinessScore,
          subsidyCategory: data.subsidyCategory || prev.subsidyCategory,
          checklist: data.checklist || prev.checklist,
          productName: prev.productName || currentInput // Do not overwrite with subsequent chat messages
        }));
      }
    } catch (error) {
      console.error('Error communicating with AI Auditor:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Could not connect to the Backend API. Make sure node server is running.' }]);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append('document', file);
    
    try {
      const response = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) throw new Error('Upload failed');
      const data = await response.json();
      
      setIsUploading(false);
      setFileUrl(data.fileUrl);
      if (data.extractedText) {
        setUploadedDocumentText(data.extractedText);
      }
      setMessages(prev => [
        ...prev, 
        { role: 'user', content: `[Uploaded File: ${file.name}]` },
        { role: 'assistant', content: `File securely uploaded. Please type your product name (e.g. "Ceiling fan" or "LED Bulb") and I will cross-reference your manual with the official standards.` }
      ]);
      
    } catch (error) {
      setIsUploading(false);
      console.error('Upload Error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Failed to upload file via Cloudinary. Ensure environment keys are set.' }]);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 flex flex-col pb-32">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${msg.role === 'user' ? 'bg-primary-600 text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none border border-gray-200'}`}>
              <div className="prose prose-sm font-medium leading-relaxed max-w-none prose-p:my-1">
                <ReactMarkdown>
                  {msg.content}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {isUploading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl rounded-bl-none p-4 w-48 flex items-center space-x-3 text-gray-500 font-medium">
               <div className="w-4 h-4 rounded-full border-2 border-primary-500 border-t-transparent animate-spin"></div>
               <span>Analyzing doc...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 w-full p-4 bg-white border-t border-gray-100 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)]">
        
        {/* File Upload Banner Component */}
        {fileUrl && (
          <div className="mb-3 flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-2 px-3 text-sm text-green-700">
            <div className="flex items-center space-x-2">
              <CheckCircle2 size={16} />
              <span className="font-semibold">Document Active</span>
            </div>
          </div>
        )}

        <div className="flex items-end space-x-2">
          <label className="flex-shrink-0 cursor-pointer p-3 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-colors">
            <UploadCloud size={24} />
            <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.txt,.docx" />
          </label>
          
          <div className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-200 transition-all">
            <textarea 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="E.g., We make ceiling fans. Also here is our quality manual..."
              className="w-full bg-transparent border-0 focus:ring-0 p-4 text-gray-700 resize-none max-h-32 min-h-[56px]"
              rows={1}
            />
          </div>
          
          <button 
            onClick={handleSend}
            disabled={!input.trim()}
            className="flex-shrink-0 p-4 bg-primary-600 text-white rounded-2xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-primary-500/30 transition-all"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
