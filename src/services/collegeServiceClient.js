"use client";

/**
 * Get college departments
 * @param {string} collegeId - The ID of the college
 * @returns {Promise<Array>} - List of departments
 */
export async function getCollegeDepartments(collegeId, token) {
  try {
    const response = await fetch(`/api/colleges/${collegeId}/departments`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch departments');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching departments:', error);
    throw error;
  }
}

/**
 * Get college classes
 * @param {string} collegeId - The ID of the college
 * @param {string} department - Optional department filter
 * @returns {Promise<Array>} - List of classes
 */
export async function getCollegeClasses(collegeId, department = null, token) {
  try {
    let url = `/api/colleges/${collegeId}/classes`;
    if (department) {
      url += `?department=${encodeURIComponent(department)}`;
    }
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch classes');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching classes:', error);
    throw error;
  }
}