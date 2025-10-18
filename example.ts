import React, { useState, useEffect } from 'react';
import { Volume2, X, Clock, Users, CheckCircle, Lightbulb, MessageSquare, TrendingUp, Sparkles, ChevronRight, Mic, ArrowRight } from 'lucide-react';

export default function LuminaApp() {
  // Onboarding states
  const [stage, setStage] = useState('welcome'); // welcome, studentCount, voiceReg, topicIntro, discussion
  const [studentCount, setStudentCount] = useState(4);
  const [registeredStudents, setRegisteredStudents] = useState([]);
  const [currentRegistering, setCurrentRegistering] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  
  // Discussion states
  const [aiWantsToSpeak, setAiWantsToSpeak] = useState(false);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const [notes, setNotes] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(900);
  const [currentSpeaker, setCurrentSpeaker] = useState('');
  const [discussionDepth, setDiscussionDepth] = useState(0);
  
  const [topicsDiscussed] = useState([
    { name: 'Sea Level Rise', confidence: 85 },
    { name: 'Economic Impact', confidence: 72 },
    { name: 'Infrastructure', confidence: 58 }
  ]);

  const discussionTopic = "How does climate change disproportionately affect coastal communities, and what solutions can help them adapt?";

  // Simulate speaker changes
  useEffect(() => {
    if (stage === 'discussion' && registeredStudents.length > 0) {
      const interval = setInterval(() => {
        setCurrentSpeaker(registeredStudents[Math.floor(Math.random() * registeredStudents.length)]);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [stage, registeredStudents]);

  // Demo: AI intervention
  useEffect(() => {
    if (stage === 'discussion') {
      const timer = setTimeout(() => {
        setAiWantsToSpeak(true);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [stage]);

  // Countdown timer
  useEffect(() => {
    if (stage === 'discussion' && timeRemaining > 0) {
      const interval = setInterval(() => {
        setTimeRemaining(prev => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [stage, timeRemaining]);

  // Simulate depth increasing
  useEffect(() => {
    if (stage === 'discussion') {
      const interval = setInterval(() => {
        setDiscussionDepth(prev => Math.min(100, prev + 1));
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [stage]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDepthColor = () => {
    if (discussionDepth < 30) return 'from-lime-200 to-green-200';
    if (discussionDepth < 60) return 'from-teal-300 to-cyan-300';
    return 'from-sky-500 to-blue-500';
  };

  const getDepthLabel = () => {
    if (discussionDepth < 30) return 'Surface';
    if (discussionDepth < 60) return 'Developing';
    if (discussionDepth < 80) return 'Deep';
    return 'Synthesizing';
  };

  const handleStudentCountNext = () => {
    setStage('voiceReg');
    setCurrentRegistering(0);
  };

  const handleVoiceRegistration = () => {
    setIsRecording(true);
    // Simulate recording
    setTimeout(() => {
      const studentName = `Student ${currentRegistering + 1}`;
      setRegisteredStudents([...registeredStudents, studentName]);
      setIsRecording(false);
      
      if (currentRegistering + 1 < studentCount) {
        setCurrentRegistering(currentRegistering + 1);
      } else {
        setStage('topicIntro');
      }
    }, 2000);
  };

  const handleStartDiscussion = () => {
    setStage('discussion');
    setCurrentSpeaker(registeredStudents[0]);
  };

  const handleLetAISpeak = () => {
    setAiWantsToSpeak(false);
    setAiSpeaking(true);
    setAiMessage(`We've heard some great ideas from ${registeredStudents[0]} and ${registeredStudents[1]}. ${registeredStudents[2]} and ${registeredStudents[3]}, I'd love to hear your perspectives too. What are your thoughts on how climate change affects coastal communities?`);
    setTimeout(() => {
      setAiSpeaking(false);
    }, 8000);
  };

  const handleDismiss = () => {
    setAiWantsToSpeak(false);
  };

  // WELCOME SCREEN
  if (stage === 'welcome') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-lime-50 via-green-50 to-teal-50 p-6 flex items-center justify-center">
        <div className="max-w-2xl w-full">
          <div className="bg-white/90 backdrop-blur-sm border border-lime-200 rounded-3xl shadow-2xl p-12 text-center">
            <div className="mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-teal-400 to-sky-500 rounded-2xl mx-auto flex items-center justify-center mb-4">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-5xl font-bold text-slate-900 mb-3">Lumina</h1>
              <p className="text-lg text-slate-600">AI-Powered Discussion Facilitator</p>
            </div>
            
            <div className="my-8 p-6 bg-lime-50 rounded-2xl border border-lime-200">
              <p className="text-slate-700 leading-relaxed">
                Welcome! Lumina helps your group have meaningful discussions by providing smart facilitation, 
                tracking participation, and ensuring everyone's voice is heard.
              </p>
            </div>

            <button
              onClick={() => setStage('studentCount')}
              className="bg-gradient-to-r from-teal-500 to-sky-500 hover:from-teal-600 hover:to-sky-600 text-white px-8 py-4 rounded-xl font-semibold transition-all transform hover:scale-105 flex items-center gap-2 mx-auto shadow-lg"
            >
              Get Started
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // STUDENT COUNT SCREEN
  if (stage === 'studentCount') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-lime-50 via-green-50 to-teal-50 p-6 flex items-center justify-center">
        <div className="max-w-2xl w-full">
          <div className="bg-white/90 backdrop-blur-sm border border-lime-200 rounded-3xl shadow-2xl p-12">
            <div className="text-center mb-8">
              <Users className="w-12 h-12 text-teal-600 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Group Size</h2>
              <p className="text-slate-600">How many students are in this discussion group?</p>
            </div>

            <div className="flex items-center justify-center gap-6 mb-8">
              <button
                onClick={() => setStudentCount(Math.max(2, studentCount - 1))}
                className="w-12 h-12 bg-lime-100 hover:bg-lime-200 rounded-full text-slate-700 font-bold text-xl transition-colors"
              >
                -
              </button>
              <div className="text-6xl font-bold text-slate-900">{studentCount}</div>
              <button
                onClick={() => setStudentCount(Math.min(8, studentCount + 1))}
                className="w-12 h-12 bg-lime-100 hover:bg-lime-200 rounded-full text-slate-700 font-bold text-xl transition-colors"
              >
                +
              </button>
            </div>

            <div className="text-center text-sm text-slate-500 mb-8">
              Recommended: 2-6 students per group
            </div>

            <button
              onClick={handleStudentCountNext}
              className="w-full bg-gradient-to-r from-teal-500 to-sky-500 hover:from-teal-600 hover:to-sky-600 text-white px-8 py-4 rounded-xl font-semibold transition-all transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg"
            >
              Next: Voice Registration
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // VOICE REGISTRATION SCREEN
  if (stage === 'voiceReg') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-lime-50 via-green-50 to-teal-50 p-6 flex items-center justify-center">
        <div className="max-w-2xl w-full">
          <div className="bg-white/90 backdrop-blur-sm border border-lime-200 rounded-3xl shadow-2xl p-12">
            <div className="text-center mb-8">
              <Mic className="w-12 h-12 text-teal-600 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Voice Registration</h2>
              <p className="text-slate-600">Student {currentRegistering + 1} of {studentCount}</p>
            </div>

            <div className="mb-8">
              <div className="flex justify-center mb-6">
                {Array.from({ length: studentCount }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full mx-1 ${
                      i < registeredStudents.length
                        ? 'bg-teal-500'
                        : i === currentRegistering
                        ? 'bg-lime-400'
                        : 'bg-slate-200'
                    }`}
                  />
                ))}
              </div>

              <div className="p-8 bg-lime-50 rounded-2xl border border-lime-200 text-center">
                {!isRecording ? (
                  <>
                    <p className="text-slate-700 mb-6">
                      Please say your name clearly when you press the button below. 
                      This helps Lumina identify who's speaking during the discussion.
                    </p>
                    <button
                      onClick={handleVoiceRegistration}
                      className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-8 py-4 rounded-full font-semibold transition-all transform hover:scale-105 flex items-center gap-3 mx-auto shadow-lg"
                    >
                      <Mic className="w-6 h-6" />
                      Press & Say Your Name
                    </button>
                  </>
                ) : (
                  <>
                    <div className="w-24 h-24 bg-red-500 rounded-full mx-auto mb-4 flex items-center justify-center animate-pulse">
                      <Mic className="w-12 h-12 text-white" />
                    </div>
                    <p className="text-slate-700 font-semibold text-lg">Recording...</p>
                    <p className="text-slate-500 text-sm mt-2">Speak clearly</p>
                  </>
                )}
              </div>
            </div>

            {registeredStudents.length > 0 && (
              <div className="text-center">
                <p className="text-sm text-slate-500 mb-2">Registered:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {registeredStudents.map((name, i) => (
                    <span key={i} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm border border-green-200">
                      ✓ {name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // TOPIC INTRODUCTION SCREEN
  if (stage === 'topicIntro') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-lime-50 via-green-50 to-teal-50 p-6 flex items-center justify-center">
        <div className="max-w-3xl w-full">
          <div className="bg-white/90 backdrop-blur-sm border border-lime-200 rounded-3xl shadow-2xl p-12">
            <div className="text-center mb-8">
              <MessageSquare className="w-12 h-12 text-teal-600 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Discussion Topic</h2>
              <p className="text-slate-600">Here's what you'll be discussing today</p>
            </div>

            <div className="mb-8 p-8 bg-gradient-to-br from-lime-50 to-green-50 rounded-2xl border border-green-200">
              <p className="text-2xl text-slate-800 leading-relaxed font-medium">
                {discussionTopic}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="p-4 bg-teal-50 rounded-xl border border-teal-200 text-center">
                <Clock className="w-6 h-6 text-teal-600 mx-auto mb-2" />
                <div className="text-sm text-slate-600">Duration</div>
                <div className="text-xl font-bold text-slate-900">15 minutes</div>
              </div>
              <div className="p-4 bg-sky-50 rounded-xl border border-sky-200 text-center">
                <Users className="w-6 h-6 text-sky-600 mx-auto mb-2" />
                <div className="text-sm text-slate-600">Participants</div>
                <div className="text-xl font-bold text-slate-900">{studentCount} students</div>
              </div>
            </div>

            <div className="mb-8 p-6 bg-lime-50 rounded-xl border border-lime-200">
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-teal-600" />
                Discussion Tips
              </h3>
              <ul className="space-y-2 text-slate-700 text-sm">
                <li>• Share your thoughts - there are no wrong answers</li>
                <li>• Listen actively to your peers</li>
                <li>• Build on each other's ideas</li>
                <li>• Lumina will help keep the conversation balanced</li>
              </ul>
            </div>

            <button
              onClick={handleStartDiscussion}
              className="w-full bg-gradient-to-r from-teal-500 to-sky-500 hover:from-teal-600 hover:to-sky-600 text-white px-8 py-4 rounded-xl font-semibold transition-all transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg"
            >
              Start Discussion
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // MAIN DISCUSSION INTERFACE
  return (
    <div className="min-h-screen bg-gradient-to-br from-lime-50 via-green-50 to-teal-50 p-6 relative overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-200 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-200 rounded-full filter blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-4">
            <div className="bg-white/90 backdrop-blur-sm border border-lime-200 rounded-2xl shadow-lg p-6 relative overflow-hidden">
              <div className="absolute top-6 right-6 flex items-center gap-2 bg-lime-100 backdrop-blur-sm px-4 py-2 rounded-full border border-lime-300">
                <Clock className="w-4 h-4 text-blue-700" />
                <span className={`text-sm font-semibold ${timeRemaining < 300 ? 'text-blue-600' : 'text-slate-800'}`}>
                  {formatTime(timeRemaining)}
                </span>
              </div>

              <div className="pr-32">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-medium text-slate-600">Discussion Prompt</span>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 leading-relaxed">
                  {discussionTopic}
                </h1>
              </div>

              <div className="mt-6 pt-6 border-t border-green-100">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-5 h-5 text-teal-600" />
                    <span className="text-sm text-slate-600">Speaking:</span>
                    <span className="text-sm font-semibold text-slate-800 bg-green-100 px-3 py-1 rounded-full border border-green-200">
                      {currentSpeaker}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {aiWantsToSpeak && (
              <div className="bg-gradient-to-r from-lime-200 to-green-200 border-2 border-green-300 rounded-2xl shadow-lg p-6 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-3 border border-green-300">
                      <Volume2 className="w-6 h-6 text-teal-700" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 mb-1 flex items-center gap-2">
                        AI Facilitator wants to speak
                        <Sparkles className="w-4 h-4 text-teal-600" />
                      </div>
                      <div className="text-sm text-slate-700">
                        Let's make sure everyone has a chance to share their thoughts
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={handleLetAISpeak}
                      className="bg-gradient-to-r from-teal-500 to-sky-500 hover:from-teal-600 hover:to-sky-600 text-white px-6 py-3 rounded-xl font-semibold transition-all transform hover:scale-105 flex items-center gap-2 shadow-md"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Let AI Speak
                    </button>
                    <button
                      onClick={handleDismiss}
                      className="bg-white/80 hover:bg-white text-slate-700 px-4 py-3 rounded-xl transition-all border border-green-300"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {aiSpeaking && (
              <div className="bg-gradient-to-r from-teal-200 to-cyan-200 border-2 border-teal-300 rounded-2xl shadow-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-3 border border-teal-300">
                    <Volume2 className="w-6 h-6 text-sky-700" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      AI Facilitator is speaking
                      <span className="text-xs bg-white/70 text-slate-700 px-3 py-1 rounded-full border border-teal-200">
                        🎧 Listen
                      </span>
                    </div>
                    <div className="text-slate-800 leading-relaxed text-lg">
                      "{aiMessage}"
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white/90 backdrop-blur-sm border border-lime-200 rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-teal-600" />
                  Group Notes
                </h2>
                <span className="text-xs text-slate-600">Collaborative workspace</span>
              </div>
              
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Jot down key points and ideas here...

💡 Main impacts discussed
🌊 Solutions explored  
❓ Questions to investigate further"
                className="w-full h-64 p-4 bg-lime-50 border border-lime-200 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-transparent resize-none text-slate-800 placeholder-slate-400"
              />
              
              <div className="mt-3 flex justify-between text-xs text-slate-500">
                <span>Everyone can edit</span>
                <span>{notes.length} characters</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white/90 backdrop-blur-sm border border-lime-200 rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-teal-600" />
                  Discussion Depth
                </h3>
                <span className="text-xs text-slate-600">{discussionDepth}%</span>
              </div>
              
              <div className="space-y-3">
                <div className="h-3 bg-lime-100 rounded-full overflow-hidden border border-lime-200">
                  <div 
                    className={`h-full bg-gradient-to-r ${getDepthColor()} transition-all duration-1000 rounded-full shadow-sm`}
                    style={{ width: `${discussionDepth}%` }}
                  />
                </div>
                
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Surface</span>
                  <span>Analysis</span>
                  <span>Synthesis</span>
                </div>
                
                <div className="text-center">
                  <span className="inline-block px-4 py-2 bg-lime-100 rounded-full text-sm font-medium text-slate-700 border border-lime-200">
                    {getDepthLabel()}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-sm border border-lime-200 rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  Key Topics
                </h3>
              </div>
              
              <div className="space-y-2">
                {topicsDiscussed.map((topic, index) => (
                  <div key={index} className="flex items-center gap-2 group hover:bg-lime-50 p-2 rounded-lg transition-colors">
                    <ChevronRight className="w-4 h-4 text-teal-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex-1">
                      <div className="text-sm text-slate-800">{topic.name}</div>
                      <div className="w-full bg-lime-100 rounded-full h-1 mt-1 border border-lime-200">
                        <div 
                          className="h-full bg-teal-500 rounded-full transition-all duration-500"
                          style={{ width: `${topic.confidence}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 text-xs text-slate-500 text-center">
                AI-detected discussion themes
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-sm border border-lime-200 rounded-2xl shadow-lg p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900">12</div>
                  <div className="text-xs text-slate-600">Questions Asked</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900">3</div>
                  <div className="text-xs text-slate-600">Key Insights</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-600 inline-block px-4 py-2 rounded-full bg-white/70 border border-lime-200">
            💡 Your AI facilitator is actively supporting your discussion
          </p>
        </div>
      </div>
    </div>
  );
}