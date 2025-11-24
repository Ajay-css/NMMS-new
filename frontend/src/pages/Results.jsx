import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../config/axios';
import { useAuth } from '../context/AuthContext';

const Results = () => {
  const { user } = useAuth();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedResult, setSelectedResult] = useState(null);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/scanner/results');
      setResults(response.data);
    } catch (error) {
      console.error('Error fetching results:', error);
      toast.error('Failed to load scan results');
    } finally {
      setLoading(false);
    }
  };

  const viewDetails = async (id) => {
    try {
      const response = await api.get(`/api/scanner/results/${id}`);
      setSelectedResult(response.data);
    } catch (error) {
      console.error('Error fetching result details:', error);
      toast.error('Failed to load result details');
    }
  };

  const closeDetails = () => {
    setSelectedResult(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-800 mb-2">Scan Results</h1>
        <p className="text-slate-600">View all scanned OMR sheet results</p>
      </div>

      {loading ? (
        <div className="card text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      ) : results.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-slate-500">No scan results yet</p>
        </div>
      ) : (
        <>
          <div className="card mb-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Student Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Answer Key</th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-700">Score</th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-700">Percentage</th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-700">Date</th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result) => (
                    <tr key={result._id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4">{result.studentName}</td>
                      <td className="py-3 px-4">{result.answerKeyId?.name || 'N/A'}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-semibold">{result.correctAnswers}</span>
                        <span className="text-slate-500"> / {result.totalQuestions}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`font-semibold ${
                          result.percentage >= 80 ? 'text-green-600' :
                          result.percentage >= 60 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {result.percentage.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-sm text-slate-600">
                        {new Date(result.scannedAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => viewDetails(result._id)}
                          className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Result Details Modal */}
      {selectedResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-800">Result Details</h2>
              <button
                onClick={closeDetails}
                className="text-slate-500 hover:text-slate-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">{selectedResult.correctAnswers}</div>
                  <div className="text-sm text-green-700">Correct</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-red-600">{selectedResult.wrongAnswers}</div>
                  <div className="text-sm text-red-700">Wrong</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">{selectedResult.totalQuestions}</div>
                  <div className="text-sm text-blue-700">Total</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-600">{selectedResult.percentage.toFixed(1)}%</div>
                  <div className="text-sm text-purple-700">Score</div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4">Answer Breakdown</h3>
                <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                  {selectedResult.answers.map((answer, index) => (
                    <div
                      key={index}
                      className={`p-2 rounded text-center text-xs ${
                        answer.isCorrect
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      <div className="font-semibold">Q{answer.questionNumber}</div>
                      <div className="mt-1">
                        {answer.selectedAnswer || 'N/A'} / {answer.correctAnswer}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Results;

