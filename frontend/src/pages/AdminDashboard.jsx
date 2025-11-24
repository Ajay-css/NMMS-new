import { useState, useEffect } from 'react';
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
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length !== 4) {
      setUploadStatus('Please select exactly 4 pages');
      return;
    }
    setFormData({ ...formData, pages: files });
    setUploadStatus('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.pages.length !== 4) {
      setUploadStatus('Please upload exactly 4 pages');
      return;
    }

    setUploading(true);
    setUploadStatus('Uploading and processing... This may take a few minutes.');

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('name', formData.name || `Answer Key ${new Date().toLocaleDateString()}`);
      formData.pages.forEach((page, index) => {
        uploadFormData.append('pages', page);
      });

      const response = await api.post('/api/admin/upload-question-paper', uploadFormData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setUploadStatus('✅ Question paper processed successfully! AI has detected questions and generated answer key.');
      setFormData({ name: '', pages: [] });
      document.getElementById('file-input').value = '';
      fetchAnswerKeys();
    } catch (error) {
      setUploadStatus('❌ Error: ' + (error.response?.data?.message || 'Failed to upload'));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this answer key?')) return;

    try {
      await api.delete(`/api/admin/answer-keys/${id}`);
      fetchAnswerKeys();
    } catch (error) {
      console.error('Error deleting answer key:', error);
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
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-800 mb-2">Admin Dashboard</h1>
        <p className="text-slate-600">Upload question papers and manage answer keys</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Section */}
        <div className="card">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">Upload Question Paper</h2>
          
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
                Upload 4 Pages (PDF or Images)
              </label>
              <input
                id="file-input"
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="input-field"
                required
              />
              <p className="mt-2 text-sm text-slate-500">
                Selected: {formData.pages.length} file(s)
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
              disabled={uploading || formData.pages.length !== 4}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Processing with AI...' : 'Upload & Process with AI'}
            </button>
          </form>

          <div className="mt-6 p-4 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-600">
              <strong>How it works:</strong> Upload 4 pages of the question paper. 
              Our AI will automatically detect questions and options, search for correct answers, 
              and create an answer key with 100 questions.
            </p>
          </div>
        </div>

        {/* Answer Keys List */}
        <div className="card">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">Answer Keys</h2>
          
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

