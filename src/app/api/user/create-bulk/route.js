import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { getAuth } from 'firebase-admin/auth';
import { auth } from '@/config/firebaseAdmin';
import admin from 'firebase-admin';
import Class from '@/models/Class';
import College from '@/models/College';

// Initialize Firebase Admin if not already initialized
try {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }),
    });
} catch (error) {
    if (!/already exists/.test(error.message)) {
        console.error("Firebase admin initialization error", error.stack);
    }
}

export async function POST(request) {
    await dbConnect();
    const firebaseAuth = getAuth();

    try {
        const { creatorUid, creatorRole, students } = await request.json();
        console.log('Request body:', { creatorUid, creatorRole, students });
        // Validate input
        if (!creatorUid) {
            return NextResponse.json({ message: 'Creator ID is required' }, { status: 400 });
        }

        if (!students || !Array.isArray(students) || students.length === 0) {
            return NextResponse.json({ message: 'No students provided' }, { status: 400 });
        }

        // Check if creator is authorized (admin, hod, or faculty)
        if (!['admin', 'hod', 'faculty'].includes(creatorRole)) {
            return NextResponse.json({ message: 'Unauthorized to create student accounts' }, { status: 403 });
        }

        // Get creator user from database to verify role and affiliations
        const creatorUser = await User.findOne({ firebaseUid: creatorUid });
        if (!creatorUser) {
            return NextResponse.json({ message: 'Creator not found' }, { status: 404 });
        }

        // For each student, verify class and college access permissions
        if (creatorRole === 'faculty' || creatorRole === 'hod') {
            for (const student of students) {
                if (student.classId) {
                    const classDoc = await Class.findById(student.classId);
                    if (!classDoc) {
                        return NextResponse.json({ message: `Class not found: ${student.classId}` }, { status: 404 });
                    }

                    // Verify the creator has access to this class
                    if (classDoc.teacher.toString() !== creatorUser._id.toString() &&
                        creatorUser.role !== 'admin' &&
                        !(creatorRole === 'hod' && classDoc.collegeId && creatorUser.collegeId &&
                            classDoc.collegeId.toString() === creatorUser.collegeId.toString())) {
                        return NextResponse.json({ message: 'You do not have permission to add students to this class' }, { status: 403 });
                    }
                }

                if (student.collegeId) {
                    const college = await College.findById(student.collegeId);
                    if (!college) {
                        return NextResponse.json({ message: `College not found: ${student.collegeId}` }, { status: 404 });
                    }

                    // For faculty or HOD, validate they belong to the same college
                    if (creatorRole === 'faculty' || creatorRole === 'hod') {
                        if (!creatorUser.collegeId || creatorUser.collegeId.toString() !== student.collegeId.toString()) {
                            return NextResponse.json({ message: 'You do not have permission to add students to this college' }, { status: 403 });
                        }
                    }
                }
            }
        }

        // Process each student
        const createdUsers = [];
        const errors = [];

        for (const student of students) {
            try {
                // Validate required fields
                if (!student.email || !student.displayName) {
                    errors.push({ email: student.email, error: 'Email and name are required' });
                    continue;
                }

                // Check if user already exists in Firebase
                try {
                    const existingFirebaseUser = await firebaseAuth.getUserByEmail(student.email);
                    if (existingFirebaseUser) {
                        errors.push({ email: student.email, error: 'User already exists in the system' });
                        continue;
                    }
                } catch (error) {
                    // User doesn't exist, which is what we want
                    if (error.code !== 'auth/user-not-found') {
                        errors.push({ email: student.email, error: `Firebase error: ${error.message}` });
                        continue;
                    }
                }

                // Check if email already exists in MongoDB
                const existingUser = await User.findOne({ email: student.email.toLowerCase() });
                if (existingUser) {
                    errors.push({ email: student.email, error: 'User already exists in the database' });
                    continue;
                }

                let defaultPassword = student.rollNo.toString() || student.studentId.toString() || 'student@123';
                console.log('Default password:', defaultPassword);
                // Check if the default password is strong enough (at least 6 characters)
                console.log("typeof defaultPassword", typeof defaultPassword);

                if (defaultPassword.length < 6) {
                    defaultPassword = 'student@123'; // Fallback password
                }

                // Create Firebase user
                const userRecord = await auth.createUser({
                            email: student.email.toLowerCase(),
                            password: defaultPassword,
                            displayName: student.displayName,
                            disabled: false,
                        });

                // Set custom claims
                await firebaseAuth.setCustomUserClaims(userRecord.uid, {
                    role: 'student'
                });

                // Create MongoDB user with additional fields
                const newUser = new User({
                    firebaseUid: userRecord.uid,
                    email: student.email.toLowerCase(),
                    displayName: student.displayName,
                    role: 'student',
                    rollNo: student.rollNo || '',
                    department: student.department || '',
                    studentId: student.studentId || Date.now().toString(36) + Math.random().toString(36).substring(2, 7),
                    class: student.classId,
                    createdBy: creatorUser._id,
                    ...(student.classId && { classId: student.classId }),
                    ...(student.collegeId && { collegeId: student.collegeId }),
                    isVerified: true,
                    verificationMethod: creatorRole,
                    collegeStatus: student.collegeId ? 'linked' : 'notlinked',
                    isFirstLogin: true,
                    passwordChanged: false,
                    profileCompleted: false,
                });

                await newUser.save();

                // If a class ID is provided, add the student to the class
                if (student.classId) {
                    const classDoc = await Class.findById(student.classId);
                    if (classDoc) {
                        // Check if student is already in the class
                        const existingStudent = classDoc.students.find(
                            (s) => s.student && s.student.toString() === newUser._id.toString()
                        );

                        if (!existingStudent) {
                            classDoc.students.push({
                                student: newUser._id,
                                status: 'approved',
                                joinRequestDate: new Date()
                            });
                            await classDoc.save();
                        }
                    }
                }

                // Generate password reset link for the user to set their initial password
                const passwordResetLink = await firebaseAuth.generatePasswordResetLink(student.email);

                // TODO: Send email with password reset link
                // This would typically involve using an email service like SendGrid or similar

                createdUsers.push({
                    uid: userRecord.uid,
                    email: student.email,
                    displayName: student.displayName,
                    passwordResetLink // In production, this should not be returned but just sent via email
                });
            } catch (error) {
                console.error(`Error processing student ${student.email}:`, error);
                errors.push({ email: student.email, error: error.message || 'Failed to create student' });
            }
        }

        return NextResponse.json({
            message: `Created ${createdUsers.length} out of ${students.length} student accounts`,
            users: createdUsers,
            errors: errors.length > 0 ? errors : undefined
        });
    } catch (error) {
        console.error('Error creating bulk student accounts:', error);
        return NextResponse.json({ message: error.message || 'Internal server error' }, { status: 500 });
    }
}