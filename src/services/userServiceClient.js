"use client";

export async function getUserByFirebaseUid(uid) {
  try {
    const response = await fetch(`/api/user/firebase/${uid}`);
    if (!response.ok) {
      throw new Error('Failed to fetch user');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
}

export async function getUserByEmail(email) {
  try {
    const response = await fetch(`/api/user?email=${encodeURIComponent(email)}`);
    if (!response.ok) {
      throw new Error('Failed to fetch user');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching user by email:', error);
    throw error;
  }
}

export async function getUserById(id) {
  try {
    const response = await fetch(`/api/user/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch user');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    throw error;
  }
}

export async function getUsersByCollege(collegeId, role) {
  try {
    const url = role 
      ? `/api/user/college?collegeId=${collegeId}&role=${role}` 
      : `/api/user/college?collegeId=${collegeId}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching users by college:', error);
    throw error;
  }
}

export async function getPendingApprovalUsers(collegeId) {
  try {
    const response = await fetch(`/api/user/college?collegeId=${collegeId}&pendingApproval=true`);
    if (!response.ok) {
      throw new Error('Failed to fetch pending users');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching pending approval users:', error);
    throw error;
  }
}

export async function updateUserProfile(id, userData) {
  try {
    const response = await fetch(`/api/user/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update user profile');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}

export async function verifyUserInvite(inviteCode, email) {
  try {
    const response = await fetch('/api/verification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inviteCode, email }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to verify invite');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error verifying invite:', error);
    throw error;
  }
}

export async function linkStudentWithCollege(collegeId, studentId, department) {
  try {
    const response = await fetch('/api/user/college', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ collegeId, studentId, department }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to link with college');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error linking with college:', error);
    throw error;
  }
}