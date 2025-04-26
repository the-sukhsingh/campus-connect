import { NextResponse } from 'next/server';
import { getUserByFirebaseUid } from '@/services/userService';
import College from '@/models/College';
import UserModel from '@/models/User';
// PDF generation library
import PDFDocument from 'pdfkit';

export async function GET(request) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') || 'json'; // 'json', 'csv', or 'pdf'
    const firebaseUid = searchParams.get('uid');
    const collegeId = searchParams.get('collegeId');
    
    if (!firebaseUid) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    // Get the MongoDB user document for the Firebase user
    const dbUser = await getUserByFirebaseUid(firebaseUid);
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Check if the user is a HOD or admin
    if (!['hod', 'admin'].includes(dbUser.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    if (!collegeId) {
      return NextResponse.json({ error: 'College ID is required' }, { status: 400 });
    }
    
    // Get the college data with teachers
    const college = await College.findById(collegeId);
    if (!college) {
      return NextResponse.json({ error: 'College not found' }, { status: 404 });
    }
    
    // Get teachers for this college
    const teachers = await UserModel.find({
      collegeId: collegeId,
      role: { $in: ['faculty', 'librarian'] }
    }).sort({ department: 1, displayName: 1 });
    
    // Prepare faculty data for export
    const exportData = {
      collegeName: college.name,
      location: college.location || 'N/A',
      teachers: []
    };
    
    // Format faculty data
    if (teachers && teachers.length > 0) {
      exportData.teachers = teachers.map(teacher => {
        return {
          name: teacher.displayName || 'Unnamed Faculty',
          email: teacher.email || 'N/A',
          department: teacher.department || 'N/A',
          role: teacher.role || 'faculty',
          isLibrarian: teacher.role === 'librarian' ? 'Yes' : 'No',
          joinedOn: teacher.createdAt ? new Date(teacher.createdAt).toLocaleDateString() : 'N/A',
        };
      });
    }
    
    // Return data based on requested format
    if (format === 'csv') {
      const headers = [
        { label: 'Name', key: 'name' },
        { label: 'Email', key: 'email' },
        { label: 'Department', key: 'department' },
        { label: 'Role', key: 'role' },
        { label: 'Is Librarian', key: 'isLibrarian' },
        { label: 'Joined On', key: 'joinedOn' }
      ];
      
      // Create CSV content
      let csvContent = headers.map(header => `"${header.label}"`).join(',') + '\\n';
      
      exportData.teachers.forEach(teacher => {
        const row = headers.map(header => {
          const value = teacher[header.key] != null ? String(teacher[header.key]) : '';
          return `"${value.replace(/"/g, '""')}"`;
        }).join(',');
        csvContent += row + '\\n';
      });
      
      // Return CSV data
      return new Response(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${exportData.collegeName}_faculty.csv"`
        }
      });
    } else if (format === 'pdf') {
      // For PDF generation, we'll use a stream
      const doc = new PDFDocument({
        margin: 50,
        size: 'A4',
        layout: 'landscape',
      });
      
      // Store PDF in memory instead of creating a file
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      
      // Header
      doc.fontSize(18).text(`Faculty List: ${exportData.collegeName}`, { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(12).text(`Location: ${exportData.location}`, { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(12).text(`Total Faculty Members: ${exportData.teachers.length}`, { align: 'center' });
      doc.moveDown(1);
      
      // Create table header
      const tableTop = 150;
      const tableHeaders = ['Name', 'Email', 'Department', 'Role', 'Joined On'];
      
      // Calculate column widths (based on page width)
      const pageWidth = doc.page.width - 100; // margins of 50 on each side
      const colWidths = [
        pageWidth * 0.25, // Name
        pageWidth * 0.25, // Email
        pageWidth * 0.20, // Department
        pageWidth * 0.15, // Role
        pageWidth * 0.15  // Joined On
      ];
      
      let currentX = 50;
      tableHeaders.forEach((header, i) => {
        doc.font('Helvetica-Bold').text(header, currentX, tableTop);
        currentX += colWidths[i];
      });
      
      // Draw header line
      doc.moveTo(50, tableTop + 20)
         .lineTo(doc.page.width - 50, tableTop + 20)
         .stroke();
      
      // Table rows
      let yOffset = tableTop + 30;
      
      exportData.teachers.forEach((teacher, i) => {
        // Check if we need a new page
        if (yOffset > doc.page.height - 100) {
          doc.addPage();
          yOffset = 50; // Reset y position
          
          // Repeat header on new page
          currentX = 50;
          tableHeaders.forEach((header, j) => {
            doc.font('Helvetica-Bold').text(header, currentX, yOffset);
            currentX += colWidths[j];
          });
          
          doc.moveTo(50, yOffset + 20)
             .lineTo(doc.page.width - 50, yOffset + 20)
             .stroke();
          
          yOffset += 30;
        }
        
        // Add row data
        currentX = 50;
        
        // Name
        doc.font('Helvetica').text(teacher.name, currentX, yOffset, {
          width: colWidths[0],
          ellipsis: true
        });
        currentX += colWidths[0];
        
        // Email
        doc.text(teacher.email, currentX, yOffset, {
          width: colWidths[1],
          ellipsis: true
        });
        currentX += colWidths[1];
        
        // Department
        doc.text(teacher.department, currentX, yOffset, {
          width: colWidths[2],
          ellipsis: true
        });
        currentX += colWidths[2];
        
        // Role
        const roleText = teacher.isLibrarian === 'Yes' ? 'Librarian' : 'Faculty';
        doc.text(roleText, currentX, yOffset);
        currentX += colWidths[3];
        
        // Joined On
        doc.text(teacher.joinedOn, currentX, yOffset);
        
        yOffset += 20;
        
        // Add row divider
        if (i < exportData.teachers.length - 1) {
          doc.moveTo(50, yOffset)
             .lineTo(doc.page.width - 50, yOffset)
             .stroke({ opacity: 0.2 });
        }
        
        yOffset += 5;
      });
      
      // Footer
      doc.moveDown(2);
      const today = new Date().toLocaleDateString();
      doc.fontSize(10).text(`Report generated on ${today}`, { align: 'center' });
      
      // End and return the PDF
      doc.end();
      
      return new Promise((resolve) => {
        doc.on('end', () => {
          const buffer = Buffer.concat(chunks);
          resolve(new Response(buffer, {
            status: 200,
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `attachment; filename="${exportData.collegeName}_faculty.pdf"`
            }
          }));
        });
      });
    } else {
      // Default: return JSON
      return NextResponse.json(exportData);
    }
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}