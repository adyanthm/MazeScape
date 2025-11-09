"use client"

interface GameReviewProps {
  playerScore: number
  playerTime: number
  playerCoins: number
  aiScore: number
  aiTime: number
  aiCoins: number
  onClose: () => void
  onStartReplay: () => void
}

export default function GameReview({
  playerScore,
  playerTime,
  playerCoins,
  aiScore,
  aiTime,
  aiCoins,
  onClose,
  onStartReplay
}: GameReviewProps) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 rounded-xl border-4 border-black p-8 max-w-2xl w-full shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-black text-black">🤖 AI GHOST REPLAY</h2>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg border-2 border-black"
          >
            CLOSE
          </button>
        </div>

        {/* Score Comparison */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Your Run Card */}
          <div className="relative overflow-hidden rounded-2xl border-4 border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 shadow-xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16"></div>
            <div className="relative p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-2xl shadow-lg">
                  👤
                </div>
                <h3 className="text-2xl font-black text-blue-700 tracking-tight">YOUR RUN</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-bold text-gray-600 uppercase tracking-wide">Score</span>
                  <span className="text-4xl font-black text-blue-600">{playerScore}</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-bold text-gray-600 uppercase tracking-wide">Time</span>
                  <span className="text-2xl font-bold text-gray-800">{playerTime.toFixed(2)}s</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-bold text-gray-600 uppercase tracking-wide">Coins</span>
                  <span className="text-2xl font-bold text-gray-800">{playerCoins}/8</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Optimal Run Card */}
          <div className="relative overflow-hidden rounded-2xl border-4 border-green-500 bg-gradient-to-br from-green-50 to-green-100 shadow-xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full -mr-16 -mt-16"></div>
            <div className="relative p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-2xl shadow-lg">
                  🏆
                </div>
                <h3 className="text-2xl font-black text-green-700 tracking-tight">OPTIMAL RUN</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-bold text-gray-600 uppercase tracking-wide">Score</span>
                  <span className="text-4xl font-black text-green-600">{aiScore}</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-bold text-gray-600 uppercase tracking-wide">Time</span>
                  <span className="text-2xl font-bold text-gray-800">{aiTime.toFixed(2)}s</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-bold text-gray-600 uppercase tracking-wide">Coins</span>
                  <span className="text-2xl font-bold text-gray-800">{aiCoins}/8</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Analysis */}
        <div className="relative overflow-hidden rounded-2xl border-4 border-purple-500 bg-gradient-to-br from-purple-50 to-purple-100 shadow-xl p-6 mb-6">
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500/10 rounded-full -ml-20 -mb-20"></div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-xl shadow-lg">
                📊
              </div>
              <h3 className="text-xl font-black text-purple-700 tracking-tight">PERFORMANCE ANALYSIS</h3>
            </div>
            <div className="space-y-3 text-base font-medium text-gray-800">
              {aiScore > playerScore ? (
                <p className="text-red-600 font-bold text-lg">⚠️ The optimal run scored {aiScore - playerScore} more points!</p>
              ) : aiScore === playerScore ? (
                <p className="text-green-600 font-bold text-lg">🎉 Perfect! You matched the optimal score!</p>
              ) : (
                <p className="text-green-600 font-bold text-lg">🏆 Incredible! You beat the optimal run by {playerScore - aiScore} points!</p>
              )}
              <p className="text-gray-700 leading-relaxed">The optimal run collected <span className="font-bold text-gray-900">{aiCoins} coins</span> in <span className="font-bold text-gray-900">{aiTime.toFixed(1)}s</span>.</p>
              <p className="text-gray-700 leading-relaxed">Watch the side-by-side replay to see both runs simultaneously!</p>
            </div>
          </div>
        </div>

        {/* Start Replay Button */}
        <button
          onClick={onStartReplay}
          className="group relative w-full px-8 py-5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-black text-xl rounded-2xl border-4 border-purple-800 shadow-2xl transform transition-all hover:scale-105 hover:shadow-purple-500/50"
        >
          <div className="flex items-center justify-center gap-3">
            <span className="text-3xl group-hover:animate-pulse">👻</span>
            <span className="tracking-wide">WATCH SIDE-BY-SIDE REPLAY</span>
          </div>
        </button>
        
        <p className="text-sm text-gray-600 text-center mt-4 font-medium">
          <span className="inline-block px-3 py-1 bg-blue-100 rounded-full text-blue-700 mr-2">Your Run (Left)</span>
          <span className="text-gray-400">vs</span>
          <span className="inline-block px-3 py-1 bg-green-100 rounded-full text-green-700 ml-2">Optimal Run (Right)</span>
        </p>
      </div>
    </div>
  )
}
