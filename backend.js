import React, { useState } from 'react';
import { Search, Upload, FileText } from 'lucide-react';

const FormUploadSystem = () => {
  const [files, setFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (event) => {
    setFiles(Array.from(event.target.files));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(droppedFiles);
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await fetch('http://localhost:8000/upload/', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      alert('Files uploaded successfully!');
      setFiles([]);
      handleSearch(searchQuery); // Refresh search results
    } catch (error) {
      alert('Error uploading files');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSearch = async (query) => {
    try {
      const response = await fetch(`http://localhost:8000/search/?query=${query}`);
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const handleDownload = async (fileId) => {
    try {
      window.open(`http://localhost:8000/download/${fileId}`);
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Form Upload System</h1>
      
      {/* Upload Section */}
      <div className="mb-8">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-500'}`}
        >
          <input
            type="file"
            onChange={handleFileChange}
            multiple
            className="hidden"
            id="fileInput"
          />
          <label htmlFor="fileInput" className="cursor-pointer">
            <Upload className="mx-auto mb-4 text-gray-400" size={48} />
            <p className="text-gray-500">
              {isDragging ? 'Drop the files here' : 'Drag and drop files here, or click to select files'}
            </p>
          </label>
        </div>
        
        {files.length > 0 && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Selected Files:</h3>
            <ul className="space-y-2">
              {files.map((file, index) => (
                <li key={index} className="flex items-center space-x-2">
                  <FileText size={20} className="text-gray-500" />
                  <span>{file.name}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
            >
              {isUploading ? 'Uploading...' : 'Upload Files'}
            </button>
          </div>
        )}
      </div>

      {/* Search Section */}
      <div className="mb-8">
        <div className="flex space-x-4 mb-4">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg pr-10"
            />
            <Search className="absolute right-3 top-2.5 text-gray-400" size={20} />
          </div>
          <button
            onClick={() => handleSearch(searchQuery)}
            className="bg-gray-800 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
          >
            Search
          </button>
        </div>

        {/* Search Results */}
        <div className="bg-white rounded-lg shadow">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">File Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Upload Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {searchResults.map((file) => (
                <tr key={file.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">{file.original_name}</td>
                  <td className="px-6 py-4">{new Date(file.upload_date).toLocaleString()}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDownload(file.id)}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {searchResults.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No files found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
