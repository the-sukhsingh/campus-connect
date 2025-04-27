'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { createNote } from '@/services/noteServiceClient';
import { getCollegeDepartments, getCollegeClasses } from '@/services/collegeServiceClient';

export default function NoteUploadForm({ onSuccess, collegeId }) {
  const { getIdToken, user } = useAuth();
  const { theme } = useTheme();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [department, setDepartment] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [departments, setDepartments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Load departments when component mounts
  useEffect(() => {
    async function loadDepartments() {
      if (!collegeId) return;

      try {
        setLoadingDepartments(true);
        const token = await getIdToken();
        const response = await getCollegeDepartments(collegeId, token);
        setDepartments(response.departments || []);
      } catch (err) {
        console.error('Error loading departments:', err);
        setError('Failed to load departments');
      } finally {
        setLoadingDepartments(false);
      }
    }

    loadDepartments();
  }, [collegeId, getIdToken]);

  // Load classes when department changes
  useEffect(() => {
    async function loadClasses() {
      if (!collegeId || !department) {
        setClasses([]);
        return;
      }

      try {
        setLoadingClasses(true);
        const token = await getIdToken();
        const response = await getCollegeClasses(collegeId, department, token);
        console.log('Classes:', response.classes);
        setClasses(response.classes || []);
      } catch (err) {
        console.error('Error loading classes:', err);
      } finally {
        setLoadingClasses(false);
      }
    }

    loadClasses();
  }, [collegeId, department, getIdToken]);

  // Handle class selection
  const handleClassChange = (e) => {
    const classId = e.target.value;
    setSelectedClass(classId);
  };

  // Handle drag events
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) {
      setIsDragging(true);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      setFile(droppedFiles[0]);
      // Reset file input element to keep UI consistent
      const fileInput = document.getElementById('file-input');
      if (fileInput) fileInput.value = '';
    }
  };

  // Handle file change
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
  };

  // Add a tag
  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  // Remove a tag
  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  // Handle tag input keypress (add tag on Enter)
  const handleTagKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate required fields
    if (!title || !subject || !department || !file) {
      setError('Please fill in all required fields and select a file.');
      return;
    }

    try {
      setLoading(true);

      // Get Firebase ID token for authentication
      const token = await getIdToken();

      // Prepare note data
      const noteData = {
        title,
        description,
        subject,
        department,
        tags,
        classId: selectedClass || undefined,
      };

      // Upload note
      const result = await createNote(noteData, file, token);

      // Clear form
      setTitle('');
      setDescription('');
      setSubject('');
      setDepartment('');
      setSelectedClass('');
      setFile(null);
      setTags([]);
      setTagInput('');

      // Reset file input
      const fileInput = document.getElementById('file-input');
      if (fileInput) fileInput.value = '';

      // Call success callback
      if (onSuccess) onSuccess(result.note);
    } catch (err) {
      setError(err.message || 'Error uploading note');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`rounded-lg p-6 ${
        theme === 'dark'
          ? 'bg-gray-800 shadow-lg shadow-gray-900/30 text-gray-100'
          : 'bg-white shadow-md shadow-gray-200/50 text-gray-900'
      } transition-colors duration-300`}
    >
      <h2
        className={`text-xl font-serif font-semibold mb-4 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        } transition-colors duration-300 border-b pb-2 ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}
      >
        Upload New Study Material
      </h2>

      {error && (
        <div
          className={`border-l-4 p-4 mb-4 ${
            theme === 'dark'
              ? 'bg-red-900/50 border-red-700 text-red-300'
              : 'bg-red-100 border-red-500 text-red-700'
          } transition-colors duration-300`}
        >
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="title"
            className={`block text-sm font-medium mb-1 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            } transition-colors duration-300`}
          >
            Title{' '}
            <span
              className={`${
                theme === 'dark' ? 'text-red-400' : 'text-red-500'
              }`}
            >
              *
            </span>
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
              theme === 'dark'
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-purple-500 focus:border-purple-500'
                : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
            } transition-colors duration-300`}
            placeholder="Enter note title"
            required
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className={`block text-sm font-medium mb-1 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            } transition-colors duration-300`}
          >
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
              theme === 'dark'
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-purple-500 focus:border-purple-500'
                : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
            } transition-colors duration-300`}
            placeholder="Brief description of the material"
            rows="3"
          />
        </div>

        <div>
          <label
            htmlFor="subject"
            className={`block text-sm font-medium mb-1 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            } transition-colors duration-300`}
          >
            Subject{' '}
            <span
              className={`${
                theme === 'dark' ? 'text-red-400' : 'text-red-500'
              }`}
            >
              *
            </span>
          </label>
          <input
            id="subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
              theme === 'dark'
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-purple-500 focus:border-purple-500'
                : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
            } transition-colors duration-300`}
            placeholder="e.g. Mathematics, Physics"
            required
          />
        </div>

        <div>
          <label
            htmlFor="department"
            className={`block text-sm font-medium mb-1 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            } transition-colors duration-300`}
          >
            Department{' '}
            <span
              className={`${
                theme === 'dark' ? 'text-red-400' : 'text-red-500'
              }`}
            >
              *
            </span>
          </label>
          <select
            id="department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
              theme === 'dark'
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-purple-500 focus:border-purple-500'
                : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
            } transition-colors duration-300`}
            required
            disabled={loadingDepartments}
          >
            <option value="">Select Department</option>
            {departments.map((dept, index) => (
              <option key={index} value={dept}>
                {dept}
              </option>
            ))}
          </select>
          {loadingDepartments && (
            <p
              className={`text-sm mt-1 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              } transition-colors duration-300 flex items-center`}
            >
              <span className="mr-2 inline-block w-3 h-3 border-t-2 border-r-2 rounded-full animate-spin border-current"></span>
              Loading departments...
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="class"
            className={`block text-sm font-medium mb-1 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            } transition-colors duration-300`}
          >
            Class
          </label>
          <select
            id="class"
            value={selectedClass}
            onChange={handleClassChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
              theme === 'dark'
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-purple-500 focus:border-purple-500'
                : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
            } transition-colors duration-300`}
            disabled={loadingClasses || !department}
          >
            <option value="">Select Class</option>
            {classes.map((cls) => (
              <option key={cls._id} value={cls._id}>
                {cls.name} - {cls.currentSemester && `Sem ${cls.currentSemester}`}{' '}
                {cls.course && `(${cls.course})`} {cls.batch && `Batch ${cls.batch}`}
              </option>
            ))}
          </select>
          {loadingClasses && (
            <p
              className={`text-sm mt-1 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              } transition-colors duration-300 flex items-center`}
            >
              <span className="mr-2 inline-block w-3 h-3 border-t-2 border-r-2 rounded-full animate-spin border-current"></span>
              Loading classes...
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="tags"
            className={`block text-sm font-medium mb-1 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            } transition-colors duration-300`}
          >
            Tags
          </label>
          <div className="flex">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={handleTagKeyPress}
              className={`flex-1 px-3 py-2 border rounded-l-md focus:outline-none focus:ring-2 ${
                theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-purple-500 focus:border-purple-500'
                  : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
              } transition-colors duration-300`}
              placeholder="Add tags (Press Enter)"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className={`px-4 py-2 rounded-r-md transition-colors duration-300 ${
                theme === 'dark'
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              Add
            </button>
          </div>
          {tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className={`px-2 py-1 rounded-full text-sm flex items-center ${
                    theme === 'dark'
                      ? 'bg-purple-900/50 text-purple-300'
                      : 'bg-indigo-100 text-indigo-800'
                  } transition-colors duration-300`}
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className={`ml-1 rounded-full ${
                      theme === 'dark'
                        ? 'text-purple-400 hover:text-white'
                        : 'text-indigo-600 hover:text-indigo-800'
                    } transition-colors duration-300 focus:outline-none`}
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div>
          <label
            htmlFor="file-input"
            className={`block text-sm font-medium mb-1 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            } transition-colors duration-300`}
          >
            File{' '}
            <span
              className={`${
                theme === 'dark' ? 'text-red-400' : 'text-red-500'
              }`}
            >
              *
            </span>
          </label>
          <div
            className={`border-2 border-dashed rounded-md p-4 ${
              isDragging
                ? theme === 'dark'
                  ? 'border-purple-500 bg-purple-900/20'
                  : 'border-indigo-500 bg-indigo-100/50'
                : theme === 'dark'
                ? 'bg-gray-700/50 border-gray-600 hover:border-purple-500'
                : 'bg-gray-50 border-gray-300 hover:border-indigo-500'
            } transition-all duration-300`}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="text-center">
              <svg
                className={`mx-auto h-12 w-12 ${
                  isDragging
                    ? theme === 'dark'
                      ? 'text-purple-400'
                      : 'text-indigo-500'
                    : theme === 'dark'
                    ? 'text-gray-500'
                    : 'text-gray-400'
                } transition-colors duration-300`}
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="mt-4 flex text-sm justify-center">
                <label
                  htmlFor="file-input"
                  className={`relative cursor-pointer rounded-md font-medium focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 ${
                    theme === 'dark'
                      ? 'text-purple-400 focus-within:ring-purple-500'
                      : 'text-indigo-600 focus-within:ring-indigo-500'
                  } transition-colors duration-300`}
                >
                  <span>Upload a file</span>
                  <input
                    id="file-input"
                    type="file"
                    onChange={handleFileChange}
                    className="sr-only"
                    required
                  />
                </label>
                <p
                  className={`pl-1 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  } transition-colors duration-300`}
                >
                  or drag and drop
                </p>
              </div>
              <p
                className={`text-xs ${
                  theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                } transition-colors duration-300`}
              >
                PDF, DOC, PPT, or other document files
              </p>
            </div>
            {file && (
              <div
                className={`mt-4 flex items-center justify-between p-2 rounded-md ${
                  theme === 'dark'
                    ? 'bg-gray-800 text-gray-300'
                    : 'bg-gray-100 text-gray-700'
                } transition-colors duration-300`}
              >
                <div className="flex items-center">
                  <svg
                    className={`w-6 h-6 mr-2 ${
                      theme === 'dark' ? 'text-purple-400' : 'text-indigo-500'
                    } transition-colors duration-300`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="truncate max-w-xs">{file.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    document.getElementById('file-input').value = '';
                  }}
                  className={`text-sm ${
                    theme === 'dark'
                      ? 'text-red-400 hover:text-red-300'
                      : 'text-red-500 hover:text-red-700'
                  } transition-colors duration-300`}
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            className={`px-4 py-2 rounded-md transition-colors duration-300 ${
              theme === 'dark'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-700 text-white hover:from-purple-700 hover:to-indigo-800 shadow-md shadow-purple-900/30'
                : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 shadow-md shadow-indigo-200'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              theme === 'dark' ? 'focus:ring-purple-500' : 'focus:ring-indigo-500'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Uploading...
              </span>
            ) : (
              'Upload Note'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}