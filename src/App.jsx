import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Check, Clock, Home, Briefcase, Heart, Dumbbell, X, Sparkles } from 'lucide-react';

export default function TodoApp() {
  // State variables - simple!
  const [tasks, setTasks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('work');
  const [filterCategory, setFilterCategory] = useState('all');
  const [loading, setLoading] = useState(false);

  // Load tasks jab app start ho
  useEffect(() => {
    loadTasksFromStorage();
  }, []);

  // Storage se tasks load karna
  async function loadTasksFromStorage() {
    try {
      const result = await window.storage.get('my-tasks');
      if (result && result.value) {
        setTasks(JSON.parse(result.value));
      }
    } catch (error) {
      console.log('No saved tasks');
    }
  }

  // Storage mein tasks save karna
  async function saveTasksToStorage(newTasks) {
    try {
      await window.storage.set('my-tasks', JSON.stringify(newTasks));
      setTasks(newTasks);
    } catch (error) {
      console.log('Could not save');
    }
  }

  // AI se task analyze karna
  async function analyzeTask(title, desc, category) {
    try {
      const prompt = `Task: ${title}\nDescription: ${desc}\nCategory: ${category}\n\nAnalyze and return ONLY JSON (no markdown):\n{"priority": "high/medium/low", "time": "15m/30m/1h/2h", "severity": "CRITICAL/MEDIUM/LOW"}`;
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 500,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      const data = await response.json();
      const text = data.content[0].text.replace(/```json|```/g, '').trim();
      return JSON.parse(text);
    } catch (error) {
      return { priority: 'medium', time: '30m', severity: 'MEDIUM' };
    }
  }

  // Naya task add karna
  async function addTask() {
    if (!taskTitle.trim()) return;
    
    setLoading(true);
    
    // AI analysis
    const aiResult = await analyzeTask(taskTitle, taskDescription, selectedCategory);
    
    // Naya task object
    const newTask = {
      id: Date.now(),
      title: taskTitle,
      description: taskDescription,
      category: selectedCategory,
      priority: aiResult.priority,
      time: aiResult.time,
      severity: aiResult.severity,
      completed: false
    };

    // Add to list
    const updatedTasks = [...tasks, newTask];
    await saveTasksToStorage(updatedTasks);
    
    // Reset form
    setTaskTitle('');
    setTaskDescription('');
    setSelectedCategory('work');
    setShowModal(false);
    setLoading(false);
  }

  // Task complete karna
  async function toggleComplete(taskId) {
    const updatedTasks = tasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    await saveTasksToStorage(updatedTasks);
  }

  // Task delete karna
  async function deleteTask(taskId) {
    const updatedTasks = tasks.filter(task => task.id !== taskId);
    await saveTasksToStorage(updatedTasks);
  }

  // Filter tasks
  const filteredTasks = filterCategory === 'all' 
    ? tasks 
    : tasks.filter(task => task.category === filterCategory);

  const pendingTasks = filteredTasks.filter(t => !t.completed);
  const completedTasks = filteredTasks.filter(t => t.completed);

  // Get current time and date
  const now = new Date();
  const currentTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50">
      {/* Header */}
      <div className="bg-white shadow-sm px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div>
            <div className="flex items-center gap-2 text-sm text-orange-600 mb-1">
              <Clock className="w-4 h-4" />
              <span>{currentDay}, {currentTime}</span>
            </div>
            <h1 className="text-2xl font-bold text-orange-900">
              Let's Plan Your Day!
            </h1>
            <p className="text-sm text-orange-600">
              You have {pendingTasks.length} tasks for today
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-6 py-6 pb-32">
        {/* Add Task Button */}
        <button
          onClick={() => setShowModal(true)}
          className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all mb-6 flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-full p-2">
              <Plus className="w-6 h-6" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-lg">Add New Task</div>
              <div className="text-sm text-orange-100">
                Let AI help prioritize and estimate duration
              </div>
            </div>
          </div>
          <Sparkles className="w-6 h-6 text-yellow-200 group-hover:scale-110 transition-transform" />
        </button>

        {/* Category Filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <CategoryButton 
            active={filterCategory === 'all'} 
            onClick={() => setFilterCategory('all')}
            label="All Tasks"
            count={tasks.length}
          />
          <CategoryButton 
            active={filterCategory === 'work'} 
            onClick={() => setFilterCategory('work')}
            icon={Briefcase}
            label="Work"
            count={tasks.filter(t => t.category === 'work').length}
          />
          <CategoryButton 
            active={filterCategory === 'selfcare'} 
            onClick={() => setFilterCategory('selfcare')}
            icon={Heart}
            label="Self Care"
            count={tasks.filter(t => t.category === 'selfcare').length}
          />
          <CategoryButton 
            active={filterCategory === 'exercise'} 
            onClick={() => setFilterCategory('exercise')}
            icon={Dumbbell}
            label="Exercise"
            count={tasks.filter(t => t.category === 'exercise').length}
          />
          <CategoryButton 
            active={filterCategory === 'home'} 
            onClick={() => setFilterCategory('home')}
            icon={Home}
            label="Home"
            count={tasks.filter(t => t.category === 'home').length}
          />
        </div>

        {/* Today's Tasks */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            Today's Tasks ({pendingTasks.length})
          </h2>
          {pendingTasks.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No pending tasks! Add one to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingTasks.map(task => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  onToggle={toggleComplete}
                  onDelete={deleteTask}
                />
              ))}
            </div>
          )}
        </div>

        {/* Completed Tasks */}
        {completedTasks.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              Completed ({completedTasks.length})
            </h2>
            <div className="space-y-3">
              {completedTasks.map(task => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  onToggle={toggleComplete}
                  onDelete={deleteTask}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer - Powered by Yumtech */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 py-4 z-20">
        <div className="max-w-2xl mx-auto px-6">
          <div className="text-center">
            <p className="text-sm text-gray-500 font-medium">
              Powered by <span className="text-orange-600 font-bold">Yumtech</span> ✨
            </p>
          </div>
        </div>
      </div>

      {/* Add Task Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Add New Task</h2>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full p-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Task Title */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Task Title
              </label>
              <input
                type="text"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="What needs to be done?"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Description */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                placeholder="Add more details..."
                rows="3"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              />
            </div>

            {/* Category Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Category
              </label>
              <div className="grid grid-cols-4 gap-2">
                <CategorySelect 
                  icon={Briefcase} 
                  label="Work" 
                  value="work"
                  selected={selectedCategory === 'work'}
                  onClick={() => setSelectedCategory('work')}
                />
                <CategorySelect 
                  icon={Heart} 
                  label="Self Care" 
                  value="selfcare"
                  selected={selectedCategory === 'selfcare'}
                  onClick={() => setSelectedCategory('selfcare')}
                />
                <CategorySelect 
                  icon={Dumbbell} 
                  label="Exercise" 
                  value="exercise"
                  selected={selectedCategory === 'exercise'}
                  onClick={() => setSelectedCategory('exercise')}
                />
                <CategorySelect 
                  icon={Home} 
                  label="Home" 
                  value="home"
                  selected={selectedCategory === 'home'}
                  onClick={() => setSelectedCategory('home')}
                />
              </div>
            </div>

            {/* AI Info */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex gap-3">
              <Sparkles className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-800">
                AI will automatically prioritize this task and estimate how long it will take based on your description and category.
              </p>
            </div>

            {/* Add Button */}
            <button
              onClick={addTask}
              disabled={loading || !taskTitle.trim()}
              className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 text-white py-4 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Analyzing...' : 'Add Task'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Task Card Component
function TaskCard({ task, onToggle, onDelete }) {
  const categoryInfo = {
    work: { icon: Briefcase, color: 'bg-orange-500' },
    selfcare: { icon: Heart, color: 'bg-amber-500' },
    exercise: { icon: Dumbbell, color: 'bg-orange-600' },
    home: { icon: Home, color: 'bg-yellow-600' }
  };

  const priorityColor = {
    high: 'border-l-red-500',
    medium: 'border-l-orange-400',
    low: 'border-l-yellow-400'
  };

  const Icon = categoryInfo[task.category].icon;

  return (
    <div className={`bg-white rounded-xl shadow-sm border-l-4 ${priorityColor[task.priority]} p-4 hover:shadow-md transition-shadow ${task.completed ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={() => onToggle(task.id)}
          className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
            task.completed 
              ? 'bg-green-500 border-green-500' 
              : 'border-orange-300 hover:border-orange-500'
          }`}
        >
          {task.completed && <Check className="w-4 h-4 text-white" />}
        </button>

        {/* Content */}
        <div className="flex-1">
          <h3 className={`font-semibold text-gray-800 mb-1 ${task.completed ? 'line-through' : ''}`}>
            {task.title}
          </h3>
          {task.description && (
            <p className="text-sm text-gray-600 mb-2">{task.description}</p>
          )}
          
          <div className="flex items-center gap-2 flex-wrap">
            {/* Category */}
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${categoryInfo[task.category].color} text-white`}>
              <Icon className="w-3 h-3" />
              {task.category}
            </span>
            
            {/* Time */}
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-md text-xs text-gray-700">
              <Clock className="w-3 h-3" />
              {task.time}
            </span>
            
            {/* Severity */}
            <span className={`px-2 py-1 rounded-md text-xs font-medium ${
              task.severity === 'CRITICAL' ? 'bg-red-100 text-red-700' :
              task.severity === 'MEDIUM' ? 'bg-orange-100 text-orange-700' :
              'bg-yellow-100 text-yellow-700'
            }`}>
              {task.severity}
            </span>
          </div>
        </div>

        {/* Delete */}
        <button
          onClick={() => onDelete(task.id)}
          className="flex-shrink-0 text-gray-400 hover:text-red-500 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Category Button Component
function CategoryButton({ icon: Icon, label, active, onClick, count }) {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 px-4 py-2 rounded-xl font-medium text-sm transition-all ${
        active 
          ? 'bg-orange-500 text-white shadow-md' 
          : 'bg-white text-gray-600 hover:bg-gray-50'
      }`}
    >
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4" />}
        <span>{label}</span>
        <span className={`text-xs ${active ? 'text-orange-100' : 'text-gray-400'}`}>
          ({count})
        </span>
      </div>
    </button>
  );
}

// Category Select Component
function CategorySelect({ icon: Icon, label, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
        selected 
          ? 'border-orange-500 bg-orange-50' 
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <Icon className={`w-6 h-6 ${selected ? 'text-orange-500' : 'text-gray-400'}`} />
      <span className={`text-xs font-medium ${selected ? 'text-orange-600' : 'text-gray-600'}`}>
        {label}
      </span>
    </button>
  );
}