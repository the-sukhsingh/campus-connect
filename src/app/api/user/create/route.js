import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import UserModel from '@/models/User';
import { auth } from '@/config/firebaseAdmin';
import { getCollegeById } from '@/services/collegeService';
import { getClassById } from '@/services/classService';

// Default faculty password - consistent for all faculty members
const DEFAULT_FACULTY_PASSWORD = "faculty@123";
const DEFAULT_STUDENT_PASSWORD = "student@123"; // Default password for students


export async function POST(request) {
    try {
        await dbConnect();
        const data = await request.json();
        console.log('Received data:', data);

        const uniqueID = Date.now().toString(36) + Math.random().toString(36).substring(2, 7);


        // Validate creator permissions
        if (!data.creatorUid || !data.creatorRole) {
            return NextResponse.json({
                success: false,
                message: 'Creator information is required'
            }, { status: 400 });
        }

        // Only allow hod to create faculty and , faculty to create students
        if (data.creatorRole === 'hod' && data.userData.role !== 'faculty') {
            return NextResponse.json({
                success: false,
                message: 'Only hod can create faculty and hod or faculty can create students'
            }, { status: 403 });
        }
        else if (data.creatorRole === 'faculty' && data.userData.role !== 'student') {
            return NextResponse.json({
                success: false,
                message: 'Only faculty can create students'
            }, { status: 403 });
        }

        const userData = data.userData;
        // Validate required fields
        if (!userData.email || !userData.role || !userData.displayName) {
            return NextResponse.json({
                success: false,
                message: 'Missing required fields: email, role, and displayName are required'
            }, { status: 400 });
        }

        // Set default password based on user type
        let defaultPassword;

        if (userData.role === 'faculty') {
            // For faculty, use a consistent password
            defaultPassword = DEFAULT_FACULTY_PASSWORD;
            if (userData.isLibrarian){
                defaultPassword = 'librarian@123'; // Default password for librarian
                userData.role = 'librarian'; // Set role to librarian
            }
        } else if (userData.role === 'student') {
            // For students, use their rollNo or studentId as password
            if (userData.studentId) {
                defaultPassword = userData.studentId;
            } else if (userData.rollNo) {
                defaultPassword = userData.rollNo;
            } else {
                // Fallback to a random password if no ID is provided
                defaultPassword = DEFAULT_STUDENT_PASSWORD;
            }
        } else {
            // For other roles, generate a random password
            defaultPassword = Math.random().toString(36).slice(-8);
        }


        if(defaultPassword.length < 6) {
            if(userData.role === 'student') {
                defaultPassword = DEFAULT_STUDENT_PASSWORD;
            }
        }

        // Create the user in Firebase first
        const firebaseUser = await auth.createUser({
            email: userData.email.toLowerCase(),
            password: defaultPassword,
            displayName: userData.displayName,
            disabled: false,
        });

        // Create user in our database
        const newUser = new UserModel({
            firebaseUid: firebaseUser.uid,
            email: userData.email.toLowerCase(),
            displayName: userData.displayName,
            role: userData.role,
            department: userData.department || '',
            college: userData.collegeId || null,
            isVerified: true,
            verificationMethod: 'hod',
            collegeStatus: userData.collegeId ? 'linked' : 'notlinked',
            isFirstLogin: true, // Mark as first login
            passwordChanged: false, // Set the password change status to false to force password change
            // Add student-specific fields if present
            rollNo: userData.rollNo || null,
            studentId: userData.studentId || uniqueID, // Use unique ID for studentId if not provided
        });

        const college = await getCollegeById(userData.collegeId);
        if (!college) {
            return NextResponse.json({
                success: false,
                message: 'College not found'
            }, { status: 404 });
        }


        
        if (newUser.role === 'faculty' || newUser.role === 'librarian') {
            // Add the faculty to the college's faculty list
            college.verifiedTeachers.push(newUser._id);
        }

        if (newUser.role === 'student') {
            // Add the student to the college's student listconst classData = await getClassById(userData.classId);
            console.log('Class data:', userData);
            if (!userData.classId) {
                return NextResponse.json({
                    success: false,
                    message: 'Class not found'
                }, { status: 404 });
            };
    
            newUser.class = userData.classId;
            const classData = await getClassById(userData.classId);
            classData.students.push({
                student: newUser._id,
                status: 'approved',
                joinRequestDate: new Date()
            });
            await classData.save();
        }


        await college.save();
        await newUser.save();

        // Set custom claims for role-based access control in Firebase
        await auth.setCustomUserClaims(firebaseUser.uid, {
            role: userData.role
        });

        return NextResponse.json({
            success: true,
            message: 'User created successfully in both Firebase and database',
            user: newUser,
            temporaryPassword: defaultPassword
        });

    } catch (error) {
        console.error('Error creating user:', error);
        return NextResponse.json({
            success: false,
            message: 'Error creating user',
            error: error.message
        }, { status: 500 });
    }
}
