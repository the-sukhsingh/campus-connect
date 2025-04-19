import { NextResponse } from 'next/server';
import { 
  getAllColleges, 
  getAllCollegesAdmin, 
  createCollege, 
  toggleCollegeStatus 
} from '@/services/collegeService';
import { getUserByFirebaseUid } from '@/services/userService';

export async function GET(request) {
  try {
    // Parse search params
    const searchParams = request.nextUrl.searchParams;
    const isAdmin = searchParams.get('hod') === 'true';
    
    // Get colleges (all or active only)
    const colleges = isAdmin 
      ? await getAllCollegesAdmin()
      : await getAllColleges();
    
    return NextResponse.json({ colleges });
  } catch (error) {
    console.error('Error in colleges GET endpoint:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch colleges' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { firebaseUid, collegeData } = await request.json();
    
    if (!firebaseUid || !collegeData) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Verify user is HOD
    const user = await getUserByFirebaseUid(firebaseUid);
    if (!user || user.role !== 'hod') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // Make sure hodId is set in the college data
    if (!collegeData.hodId) {
      collegeData.hodId = firebaseUid;
    }
    
    // Create college
    const college = await createCollege(collegeData, user._id.toString());
    
    return NextResponse.json({ college });
  } catch (error) {
    console.error('Error in colleges POST endpoint:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create college' },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const data = await request.json();
    const { firebaseUid, collegeId, active } = data;
    
    if (!firebaseUid || !collegeId || active === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Verify user is HOD
    const user = await getUserByFirebaseUid(firebaseUid);
    if (!user || user.role !== 'hod') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // Update college status
    const college = await toggleCollegeStatus(collegeId, active);
    
    return NextResponse.json({ college });
  } catch (error) {
    console.error('Error in colleges PATCH endpoint:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update college' },
      { status: 500 }
    );
  }
}