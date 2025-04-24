'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { createNote } from '@/services/noteServiceClient';
import { getCollegeDepartments, getCollegeClasses } from '@/services/collegeServiceClient';

export default function NoteUploadForm({ onSuccess, collegeId }) {
  const { getIdToken, user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [department, setDepartment] = useState('');
  const [semester, setSemester] = useState('');
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
    
    if (classId) {
      const selectedClassObj = classes.find(c => c._id === classId);
      if (selectedClassObj) {
        // Auto-fill semester from the selected class
        setSemester(selectedClassObj.currentSemester);
      }
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
    setTags(tags.filter(tag => tag !== tagToRemove));
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
        semester,
        tags,
        classId: selectedClass || undefined
      };

      // Upload note
      const result = await createNote(noteData, file, token);

      // Clear form
      setTitle('');
      setDescription('');
      setSubject('');
      setDepartment('');
      setSemester('');
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
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Upload New Note</h2>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            rows="3"
          />
        </div>

        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
            Subject <span className="text-red-500">*</span>
          </label>
          <input
            id="subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
            Department <span className="text-red-500">*</span>
          </label>
          <select
            id="department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
          {loadingDepartments && <p className="text-sm text-gray-500 mt-1">Loading departments...</p>}
        </div>

        <div>
          <label htmlFor="class" className="block text-sm font-medium text-gray-700 mb-1">
            Class
          </label>
          <select
            id="class"
            value={selectedClass}
            onChange={handleClassChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={loadingClasses || !department}
          >
            <option value="">All Classes (Department-wide)</option>
            {classes.map((cls) => (
              <option key={cls._id} value={cls._id}>
                {cls.name} - {cls.currentSemester && `Sem ${cls.currentSemester}`} {cls.course && `(${cls.course})`} {cls.batch && `Batch ${cls.batch}`}
              </option>
            ))}
          </select>
          {loadingClasses && <p className="text-sm text-gray-500 mt-1">Loading classes...</p>}
        </div>

        <div>
          <label htmlFor="semester" className="block text-sm font-medium text-gray-700 mb-1">
            Semester
          </label>
          <select
            id="semester"
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select Semester</option>
            <option value="1">1st Semester</option>
            <option value="2">2nd Semester</option>
            <option value="3">3rd Semester</option>
            <option value="4">4th Semester</option>
            <option value="5">5th Semester</option>
            <option value="6">6th Semester</option>
            <option value="7">7th Semester</option>
            <option value="8">8th Semester</option>
          </select>
        </div>

        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
            Tags
          </label>
          <div className="flex">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={handleTagKeyPress}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Add tags (Press Enter)"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="px-4 py-2 bg-indigo-600 text-white rounded-r-md hover:bg-indigo-700"
            >
              Add
            </button>
          </div>
          {tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm flex items-center"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 text-indigo-600 hover:text-indigo-800"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="file-input" className="block text-sm font-medium text-gray-700 mb-1">
            File <span className="text-red-500">*</span>
          </label>
          <input
            id="file-input"
            type="file"
            onChange={handleFileChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
          <p className="mt-1 text-sm text-gray-500">
            Upload PDF, DOC, PPT, or other document files
          </p>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-gray-400"
            disabled={loading}
          >
            {loading ? 'Uploading...' : 'Upload Note'}
          </button>
        </div>
      </form>
    </div>
  );
}