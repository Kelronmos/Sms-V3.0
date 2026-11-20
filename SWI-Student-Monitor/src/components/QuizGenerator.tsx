import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileUp, Zap, CheckCircle2, AlertCircle, 
  Trash2, Plus, Send, Edit3, Save, X
} from 'lucide-react';
import { generateQuizFromNotes, submitQuiz } from '../services/api';

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
}

interface QuizGeneratorProps {
  classId: string;
  teacherId: string;
}

export const QuizGenerator: React.FC<QuizGeneratorProps> = ({ classId, teacherId }) => {
  const [notes, setNotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [questionCount, setQuestionCount] = useState(5);

  const handleGenerate = async () => {
    if (!notes.trim()) return;
    setIsGenerating(true);
    try {
      const generated = await generateQuizFromNotes(notes, questionCount);
      setQuestions(generated);
    } catch (error) {
      alert("Failed to generate quiz. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateQuestion = (index: number, field: keyof Question, value: any) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
  };

  const handleUpdateOption = (qIndex: number, oIndex: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options[oIndex] = value;
    setQuestions(newQuestions);
  };

  const handleSendQuiz = async () => {
    if (questions.length === 0) return;
    try {
      await submitQuiz({
        class_id: classId,
        teacher_id: teacherId,
        title: `Quiz: ${notes.slice(0, 30)}...`,
        questions: questions,
        created_at: new Date().toISOString()
      });
      alert("Quiz sent to students successfully!");
      setQuestions([]);
      setNotes('');
    } catch (error) {
      alert("Failed to send quiz.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-50 p-6 rounded-2xl border border-black/5">
        <h4 className="text-sm font-bold mb-4 flex items-center gap-2">
          <FileUp className="w-4 h-4 text-indigo-500" />
          AI Quiz Generator
        </h4>
        <div className="space-y-4">
          <textarea 
            placeholder="Paste your lesson notes here... AI will generate questions from them."
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-white border border-black/5 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-black resize-none"
          />
          <div className="flex items-center gap-4">
            <div className="flex-1 flex items-center gap-2">
              <span className="text-[10px] font-black uppercase text-slate-400">Questions:</span>
              <input 
                type="number" 
                min="1" 
                max="20" 
                value={questionCount}
                onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                className="w-16 bg-white border border-black/5 rounded-lg px-2 py-1 text-xs font-bold"
              />
            </div>
            <button 
              onClick={handleGenerate}
              disabled={isGenerating || !notes.trim()}
              className="bg-black text-white px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isGenerating ? (
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                >
                  <Zap className="w-4 h-4" />
                </motion.div>
              ) : <Zap className="w-4 h-4" />}
              {isGenerating ? 'Generating...' : 'Generate with AI'}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {questions.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold">Review & Edit Questions</h4>
              <button 
                onClick={() => setQuestions([...questions, { question: 'New Question', options: ['', '', '', ''], correctAnswer: 0 }])}
                className="text-[10px] font-black uppercase text-indigo-600 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Question
              </button>
            </div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {questions.map((q, qIndex) => (
                <motion.div 
                  key={qIndex}
                  layout
                  className="p-6 bg-white border border-black/5 rounded-2xl shadow-sm relative group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      {editingIndex === qIndex ? (
                        <input 
                          value={q.question}
                          onChange={(e) => handleUpdateQuestion(qIndex, 'question', e.target.value)}
                          className="w-full font-bold text-sm bg-slate-50 p-2 rounded-lg border border-black/5"
                        />
                      ) : (
                        <p className="font-bold text-sm">Q{qIndex + 1}: {q.question}</p>
                      )}
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => setEditingIndex(editingIndex === qIndex ? null : qIndex)}
                        className="p-2 hover:bg-slate-100 rounded-lg"
                      >
                        {editingIndex === qIndex ? <Save className="w-4 h-4 text-emerald-500" /> : <Edit3 className="w-4 h-4 text-slate-400" />}
                      </button>
                      <button 
                        onClick={() => setQuestions(questions.filter((_, i) => i !== qIndex))}
                        className="p-2 hover:bg-rose-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4 text-rose-400" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {q.options.map((opt, oIndex) => (
                      <div 
                        key={oIndex}
                        onClick={() => handleUpdateQuestion(qIndex, 'correctAnswer', oIndex)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                          q.correctAnswer === oIndex 
                            ? 'bg-emerald-50 border-emerald-200 ring-1 ring-emerald-500' 
                            : 'bg-slate-50 border-black/5 hover:border-black/10'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-black ${
                          q.correctAnswer === oIndex ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 text-slate-400'
                        }`}>
                          {String.fromCharCode(65 + oIndex)}
                        </div>
                        {editingIndex === qIndex ? (
                          <input 
                            value={opt}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => handleUpdateOption(qIndex, oIndex, e.target.value)}
                            className="flex-1 bg-transparent text-xs font-bold outline-none"
                          />
                        ) : (
                          <span className="text-xs font-bold">{opt}</span>
                        )}
                        {q.correctAnswer === oIndex && <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-auto" />}
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>

            <button 
              onClick={handleSendQuiz}
              className="w-full py-4 bg-emerald-500 text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              Approve & Send Quiz to Class
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
