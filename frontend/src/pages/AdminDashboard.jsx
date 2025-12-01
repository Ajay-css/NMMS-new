import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../config/axios';
import { useAuth } from '../context/AuthContext';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [answerKeys, setAnswerKeys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    pages: []
  });

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchAnswerKeys();
    }
  }, [user]);

  const fetchAnswerKeys = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin/answer-keys');
      setAnswerKeys(response.data);
    } catch (error) {
      console.error('Error fetching answer keys:', error);
      toast.error('Failed to load answer keys');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) {
      setUploadStatus('Please select at least one page');
      toast.error('Please select at least one page');
      return;
    }
    if (files.length > 20) {
      setUploadStatus('Maximum 20 pages allowed');
      toast.error('Maximum 20 pages allowed');
      return;
    }
    setFormData({ ...formData, pages: files });
    setUploadStatus('');
    toast.success(`${files.length} page${files.length > 1 ? 's' : ''} selected`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.pages.length === 0) {
      setUploadStatus('Please upload at least one page');
      toast.error('Please upload at least one page');
      return;
    }

    if (formData.pages.length > 20) {
      setUploadStatus('Maximum 20 pages allowed');
      toast.error('Maximum 20 pages allowed');
      return;
    }

    setUploading(true);
    setUploadStatus(`Uploading and processing ${formData.pages.length} page${formData.pages.length > 1 ? 's' : ''}... This may take a few minutes.`);
    toast.loading('Processing question paper with AI...', { id: 'upload' });

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('name', formData.name || `Answer Key ${new Date().toLocaleDateString()}`);
      formData.pages.forEach((page, index) => {
        uploadFormData.append('pages', page);
      });

      const response = await api.post('/api/admin/upload-question-paper', uploadFormData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 300000 // 5 minutes timeout for AI processing
      });

      const questionCount = response.data?.answerKey?.totalQuestions || 'multiple';
      setUploadStatus(`✅ Success! AI extracted ${questionCount} questions with text and diagrams.`);
      setFormData({ name: '', pages: [] });
      document.getElementById('file-input').value = '';
      toast.success(`Answer key created with ${questionCount} questions!`, { id: 'upload' });
      fetchAnswerKeys();
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to process question paper';
      setUploadStatus('❌ Error: ' + errorMsg);
      toast.error(errorMsg, { id: 'upload' });
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this answer key?')) return;

    try {
      await api.delete(`/api/admin/answer-keys/${id}`);
      toast.success('Answer key deleted successfully');
      fetchAnswerKeys();
    } catch (error) {
      console.error('Error deleting answer key:', error);
      toast.error('Failed to delete answer key');
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="card text-center">
          <p className="text-red-600">Access denied. Admin only.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
      <div className="mb-4 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-800 mb-2">Admin Dashboard</h1>
        <p className="text-sm sm:text-base text-slate-600">Upload question papers and manage answer keys</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Section */}
        <div className="card">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-4 sm:mb-6">Upload Question Paper</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Answer Key Name (Optional)
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-field"
                placeholder="e.g., NMMS 2024 Answer Key"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Upload Question Paper Pages (1-20 images)
              </label>
              <input
                id="file-input"
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="input-field"
                required
              />
              <p className="mt-2 text-sm text-slate-500">
                Selected: {formData.pages.length} page(s) • Supports JPG, PNG, WebP
              </p>
            </div>

            {uploadStatus && (
              <div className={`p-4 rounded-lg ${
                uploadStatus.includes('✅') 
                  ? 'bg-green-50 border border-green-200 text-green-700' 
                  : uploadStatus.includes('❌')
                  ? 'bg-red-50 border border-red-200 text-red-700'
                  : 'bg-blue-50 border border-blue-200 text-blue-700'
              }`}>
                {uploadStatus}
              </div>
            )}

            <button
              type="submit"
              disabled={uploading || formData.pages.length === 0}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing with AI...
                </>
              ) : 'Upload & Process with AI'}
            </button>
          </form>

          <div className="mt-6 p-4 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-600">
              <strong>How it works:</strong> Upload 1-20 pages of your question paper. 
              Our AI (Gemini 2.5 Flash) will automatically extract questions with text AND diagrams, 
              solve them, and create a complete answer key.
            </p>
          </div>
        </div>

        {/* Answer Keys List */}
        <div className="card">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-4 sm:mb-6">Answer Keys</h2>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          ) : answerKeys.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No answer keys yet</p>
          ) : (
            <div className="space-y-4">
              {answerKeys.map((key) => (
                <div
                  key={key._id}
                  className="p-4 border border-slate-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-slate-800">{key.name}</h3>
                      <p className="text-sm text-slate-600 mt-1">
                        {key.totalQuestions} questions • Created {new Date(key.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(key._id)}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
