import { useState, useEffect, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import toast from 'react-hot-toast';
import api from '../config/axios';
import { useAuth } from '../context/AuthContext';

const Scanner = () => {
  const { user } = useAuth();
  const [answerKeys, setAnswerKeys] = useState([]);
  const [selectedAnswerKey, setSelectedAnswerKey] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [studentName, setStudentName] = useState('');
  const [facingMode, setFacingMode] = useState('environment'); // 'user' or 'environment'
  const webcamRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [scanStatus, setScanStatus] = useState('Ready to scan');
  const [isProcessing, setIsProcessing] = useState(false);
  const scanIntervalRef = useRef(null);

  useEffect(() => {
    fetchAnswerKeys();
    return () => {
      // Cleanup interval on unmount
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, []);

  const fetchAnswerKeys = async () => {
    try {
      const response = await api.get('/api/admin/answer-keys');
      setAnswerKeys(response.data);
      if (response.data.length > 0) {
        setSelectedAnswerKey(response.data[0]._id);
      } else {
        toast.error('No answer keys found. Please upload a question paper first.');
      }
    } catch (error) {
      console.error('Error fetching answer keys:', error);
      toast.error('Failed to load answer keys');
    }
  };

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    return imageSrc;
  }, []);

  const processScan = useCallback(async (imageData) => {
    if (!selectedAnswerKey || !imageData) {
      return;
    }

    // Prevent multiple simultaneous scans
    if (isProcessing) {
      return;
    }

    setIsProcessing(true);
    setScanStatus('Processing OMR sheet...');

    try {
      const response = await api.post('/api/scanner/scan', {
        imageData,
        answerKeyId: selectedAnswerKey,
        studentName: studentName || 'Anonymous'
      });

      setResult(response.data.result);
      setScanning(false);
      setScanStatus('Scan completed!');
      toast.success(`Scan completed! Score: ${response.data.result.percentage.toFixed(1)}%`);

      // Stop auto-scanning after successful scan
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }
    } catch (error) {
      console.error('Scan error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to process OMR sheet';

      // Check if it's an unidentified object error
      if (errorMessage.includes('Unidentified object')) {
        setScanStatus('⚠️ Unidentified object detected - Position OMR sheet');
        toast.error(errorMessage, { duration: 2000 });
      } else {
        setScanStatus('Scanning... Position OMR sheet in view');
        // Only show error toast for significant errors
        if (error.response?.status !== 400) {
          toast.error(errorMessage, { duration: 2000 });
        }
      }
      // Continue scanning on error - don't stop the process
    } finally {
      setIsProcessing(false);
    }
  }, [selectedAnswerKey, studentName]);

  // Auto-scan function that runs continuously
  useEffect(() => {
    if (scanning && selectedAnswerKey) {
      setScanStatus('Scanning... Position OMR sheet in view');

      // Start auto-scanning every 2 seconds (only if not currently processing)
      scanIntervalRef.current = setInterval(() => {
        // Only scan if not currently processing a previous scan
        if (!isProcessing) {
          const imageData = capture();
          if (imageData) {
            processScan(imageData);
          }
        }
      }, 2000); // Scan every 2 seconds

      return () => {
        if (scanIntervalRef.current) {
          clearInterval(scanIntervalRef.current);
          scanIntervalRef.current = null;
        }
      };
    } else {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }
    }
  }, [scanning, selectedAnswerKey, capture, processScan, isProcessing]);


  const resetScan = () => {
    setResult(null);
    setScanning(false);
    setScanStatus('Ready to scan');
    setIsProcessing(false);
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
      <div className="mb-4 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-800 mb-2">OMR Scanner</h1>
        <p className="text-sm sm:text-base text-slate-600">Scan OMR sheets and get instant results</p>
      </div>

      {!result ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Scanner Section */}
          <div className="card">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-4 sm:mb-6">Scan OMR Sheet</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Select Answer Key
                </label>
                <select
                  value={selectedAnswerKey}
                  onChange={(e) => setSelectedAnswerKey(e.target.value)}
                  className="input-field"
                  disabled={loading}
                >
                  <option value="">Select an answer key</option>
                  {answerKeys.map((key) => (
                    <option key={key._id} value={key._id}>
                      {key.name} ({key.totalQuestions} questions)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Student Name (Optional)
                </label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="input-field"
                  placeholder="Enter student name"
                  disabled={loading}
                />
              </div>

              {/* Webcam Scanner */}
              <div className="relative">
                <div className="border-2 border-slate-300 rounded-lg overflow-hidden bg-slate-900 relative">
                  {scanning ? (
                    <>
                      <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        videoConstraints={{
                          facingMode: facingMode
                        }}
                        className="w-full h-auto"
                      />
                      {/* Scanning overlay */}
                      <div className="absolute top-2 left-2 right-2 sm:top-4 sm:left-4 sm:right-4">
                        <div className={`p-2 sm:p-3 rounded-lg ${isProcessing
                            ? 'bg-blue-500 text-white'
                            : 'bg-green-500 text-white'
                          }`}>
                          <div className="flex items-center justify-center space-x-2">
                            {isProcessing ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-2 border-white border-t-transparent"></div>
                                <span className="font-semibold text-xs sm:text-sm">Processing...</span>
                              </>
                            ) : (
                              <>
                                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full animate-pulse"></div>
                                <span className="font-semibold text-xs sm:text-sm">Scanning...</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="aspect-video bg-slate-800 flex items-center justify-center">
                      <p className="text-white">Click "Start Scanning" to begin</p>
                    </div>
                  )}
                </div>

                {/* Scan Status */}
                {scanning && (
                  <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <p className="text-sm text-slate-700 text-center font-medium">
                      {scanStatus}
                    </p>
                  </div>
                )}

                <div className="mt-4 flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3">
                  {!scanning ? (
                    <button
                      onClick={() => {
                        setScanning(true);
                        setScanStatus('Ready to scan');
                      }}
                      className="btn-primary w-full sm:w-auto"
                      disabled={loading || !selectedAnswerKey}
                    >
                      Start Scanning
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setScanning(false);
                          setScanStatus('Ready to scan');
                          if (scanIntervalRef.current) {
                            clearInterval(scanIntervalRef.current);
                            scanIntervalRef.current = null;
                          }
                        }}
                        className="btn-secondary w-full sm:w-auto"
                        disabled={isProcessing}
                      >
                        Stop Scanning
                      </button>
                      <button
                        onClick={() => setFacingMode(facingMode === 'user' ? 'environment' : 'user')}
                        className="btn-secondary w-full sm:w-auto"
                        disabled={isProcessing}
                      >
                        Switch Camera
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="card">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-4 sm:mb-6">Instructions</h2>
            <div className="space-y-4 text-slate-600">
              <div className="flex items-start space-x-3">
                <span className="text-primary-600 font-bold">1.</span>
                <p>Select an answer key from the dropdown</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-primary-600 font-bold">2.</span>
                <p>Optionally enter the student's name</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-primary-600 font-bold">3.</span>
                <p>Click "Start Scanning" to activate the camera</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-primary-600 font-bold">4.</span>
                <p>Position the OMR sheet in front of the camera</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-primary-600 font-bold">5.</span>
                <p>The system will automatically scan every 2 seconds</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-primary-600 font-bold">6.</span>
                <p>Results will appear automatically when OMR sheet is detected</p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Tip:</strong> Ensure good lighting and place the OMR sheet flat.
                The system automatically processes the sheet - just hold it steady in front of the camera!
              </p>
            </div>

            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>Auto-Scan Mode:</strong> The scanner continuously captures and processes images.
                No need to click any buttons - just position the OMR sheet and wait for results!
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-800 mb-2">Scan Results</h2>
            <p className="text-slate-600">Student: {result.studentName}</p>
          </div>

          {/* Score Card */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-4 sm:p-6 rounded-xl text-center">
              <div className="text-2xl sm:text-3xl font-bold">{result.correctAnswers}</div>
              <div className="text-xs sm:text-sm opacity-90">Correct</div>
            </div>
            <div className="bg-gradient-to-br from-red-500 to-red-600 text-white p-4 sm:p-6 rounded-xl text-center">
              <div className="text-2xl sm:text-3xl font-bold">{result.wrongAnswers}</div>
              <div className="text-xs sm:text-sm opacity-90">Wrong</div>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 sm:p-6 rounded-xl text-center">
              <div className="text-2xl sm:text-3xl font-bold">{result.totalQuestions}</div>
              <div className="text-xs sm:text-sm opacity-90">Total</div>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-4 sm:p-6 rounded-xl text-center">
              <div className="text-2xl sm:text-3xl font-bold">{result.percentage.toFixed(1)}%</div>
              <div className="text-xs sm:text-sm opacity-90">Score</div>
            </div>
          </div>

          {/* Detailed Results */}
          <div className="mb-6">
            <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-3 sm:mb-4">Answer Details</h3>
            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-1.5 sm:gap-2 max-h-96 overflow-y-auto">
              {result.answers.map((answer, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg text-center text-sm ${answer.isCorrect
                      ? 'bg-green-100 text-green-800 border border-green-300'
                      : 'bg-red-100 text-red-800 border border-red-300'
                    }`}
                  title={`Q${answer.questionNumber}: Selected ${answer.selectedAnswer || 'N/A'}, Correct ${answer.correctAnswer}`}
                >
                  <div className="font-semibold">Q{answer.questionNumber}</div>
                  <div className="text-xs mt-1">
                    {answer.selectedAnswer || 'N/A'} / {answer.correctAnswer}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <button onClick={resetScan} className="btn-primary">
              Scan Another Sheet
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Scanner;

