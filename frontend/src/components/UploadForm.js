import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const UploadForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [file, setFile] = useState(null);
  const [sourceLanguage, setSourceLanguage] = useState('auto');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const onDrop = useCallback(acceptedFiles => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setError(null);
    }
  }, []);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/epub+zip': ['.epub'],
      'text/plain': ['.txt'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1
  });
  
  const handleUpload = async () => {
    if (!file) {
      setError(t('upload.noFileSelected'));
      return;
    }
    
    setLoading(true);
    setError(null);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('source_language', sourceLanguage);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/translation/upload-book', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.status === 201) {
        // Перехід на сторінку вибору опцій перекладу з ID книги
        navigate(`/translate/${response.data.book_id}`);
      }
    } catch (err) {
      setError(err.response?.data?.error || t('upload.uploadFailed'));
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="card">
      <div className="hex-icon">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
        </svg>
      </div>
      
      <h2 className="text-center">{t('upload.title')}</h2>
      <p className="text-center">{t('upload.description')}</p>
      
      <div className="form-group">
        <label>{t('upload.sourceLanguage')}</label>
        <select 
          className="form-input"
          value={sourceLanguage}
          onChange={(e) => setSourceLanguage(e.target.value)}
        >
          <option value="auto">{t('upload.autoDetect')}</option>
          <option value="uk">{t('languages.ukrainian')}</option>
          <option value="en">{t('languages.english')}</option>
          <option value="de">{t('languages.german')}</option>
          <option value="es">{t('languages.spanish')}</option>
          <option value="fr">{t('languages.french')}</option>
        </select>
      </div>
      
      <div {...getRootProps({ className: 'dropzone' })}>
        <input {...getInputProps()} />
        {
          isDragActive ?
            <p>{t('upload.dropHere')}</p> :
            <p>{t('upload.dragOrClick')}</p>
        }
      </div>
      
      {file && (
        <div className="file-info">
          <p><strong>{t('upload.selectedFile')}:</strong> {file.name}</p>
          <p><strong>{t('upload.fileSize')}:</strong> {(file.size / 1024 / 1024).toFixed(2)} MB</p>
        </div>
      )}
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="text-center mt-4">
        <button 
          className="button primary"
          onClick={handleUpload}
          disabled={loading || !file}
        >
          {loading ? t('common.loading') : t('upload.uploadButton')}
        </button>
      </div>
    </div>
  );
};

export default UploadForm;