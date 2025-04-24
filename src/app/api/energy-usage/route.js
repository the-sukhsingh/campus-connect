import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import EnergyUsage from '@/models/EnergyUsage';
import { auth } from 'firebase-admin';
import { getUserByFirebaseUid } from '@/services/userService';

export async function POST(request) {
  try {
    await dbConnect();
    const searchParams = request.nextUrl.searchParams;
    const uid = searchParams.get('uid');
    
    const dbUser = await getUserByFirebaseUid(uid);

    // Verify HOD role
    if (!dbUser || dbUser.role !== 'hod') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const data = await request.json();
    
    // Create new energy usage record
    const energyUsage = await EnergyUsage.create({
      ...data,
      college: dbUser.college._id,
      submittedBy: dbUser._id
    });

    return NextResponse.json({ success: true, energyUsage });
  } catch (error) {
    console.error('Error in energy usage API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    await dbConnect();
    const searchParams = request.nextUrl.searchParams;
    const uid = searchParams.get('uid');
    
    const dbUser = await getUserByFirebaseUid(uid);
    
    // Verify HOD role
    if (!dbUser || dbUser.role !== 'hod') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }


    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build query
    const query = { college: dbUser.college._id };
    if (startDate || endDate) {
      query.startDate = {};
      if (startDate) query.startDate.$gte = new Date(startDate);
      if (endDate) query.startDate.$lte = new Date(endDate);
    }

    // Fetch energy usage records
    const energyUsages = await EnergyUsage.find(query)
      .sort({ startDate: -1 })
      .populate('submittedBy', 'displayName email');

    return NextResponse.json({ energyUsages });
  } catch (error) {
    console.error('Error in energy usage API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await dbConnect();
    const searchParams = request.nextUrl.searchParams;
    const uid = searchParams.get('uid');
    
    const dbUser = await getUserByFirebaseUid(uid);
    
    // Verify HOD role
    if (!dbUser || dbUser.role !== 'hod') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const data = await request.json();
    const { id, ...updateData } = data;

    // Update energy usage record
    const energyUsage = await EnergyUsage.findOneAndUpdate(
      { _id: id, college: dbUser.college._id },
      updateData,
      { new: true }
    );

    if (!energyUsage) {
      return NextResponse.json({ error: 'Energy usage record not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, energyUsage });
  } catch (error) {
    console.error('Error in energy usage API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await dbConnect();
    const dbUser = await getFirebaseUserFromHeader(request);
    
    // Verify HOD role
    if (!dbUser || dbUser.role !== 'hod') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Delete energy usage record
    const energyUsage = await EnergyUsage.findOneAndDelete({
      _id: id,
      college: dbUser.college._id
    });

    if (!energyUsage) {
      return NextResponse.json({ error: 'Energy usage record not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in energy usage API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}