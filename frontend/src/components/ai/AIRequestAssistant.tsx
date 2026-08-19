import React, { useState } from 'react';
import { Sparkles, ArrowRight, Loader2, MapPin, Clock, Wallet } from 'lucide-react';
import { aiApi } from '../../services';
import type { AIAnalysis } from '../../types';

interface AIRequestAssistantProps {
  onAnalysisComplete: (data: AIAnalysis) => void;
}

export const AIRequestAssistant: React.FC<AIRequestAssistantProps> = ({ onAnalysisComplete }) => {
  const [text, setText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || text.length < 5) {
      setError('Lütfen en az 5 karakterlik bir açıklama yazın.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const data = await aiApi.analyzeRequest(text);
      if (data.detected) {
        onAnalysisComplete(data);
        setText('');
      } else {
        setError('Ne demek istediğinizi tam anlayamadık. Lütfen biraz daha detaylı yazar mısınız?');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Bir hata oluştu, lütfen tekrar deneyin.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-1 shadow-lg overflow-hidden">
      <div className="bg-white rounded-xl p-6 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-10 -mt-10 opacity-50 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl -ml-10 -mb-10 opacity-50 pointer-events-none"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">AI ile Hızlı Talep Oluştur</h3>
              <p className="text-sm text-gray-500">Kendi cümlelerinizle neye ihtiyacınız olduğunu anlatın, formu biz dolduralım.</p>
            </div>
          </div>

          <form onSubmit={handleAnalyze} className="relative">
            <textarea
              className={`w-full p-4 pr-16 bg-gray-50 border rounded-xl resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${
                error ? 'border-red-300' : 'border-gray-200'
              }`}
              rows={3}
              placeholder="Örnek: Yarın öğleden sonra Kadıköy'de bozulan kombimi tamir ettirmek istiyorum. Acil!"
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                if (error) setError(null);
              }}
              disabled={isAnalyzing}
            />
            
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
              <button
                type="submit"
                disabled={isAnalyzing || text.length < 5}
                className="flex items-center justify-center p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed shadow-sm"
              >
                {isAnalyzing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <ArrowRight className="w-5 h-5" />
                )}
              </button>
            </div>
          </form>

          {error && (
            <p className="mt-2 text-sm text-red-500 font-medium flex items-center gap-1">
              <span>⚠️</span> {error}
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-500">
            <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-md">
              <MapPin className="w-3 h-3" /> Konum algılama
            </span>
            <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-md">
              <Clock className="w-3 h-3" /> Zaman tahmini
            </span>
            <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-md">
              <Wallet className="w-3 h-3" /> Kategori eşleştirme
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
