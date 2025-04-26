import { NextResponse } from 'next/server';
import { getUserByFirebaseUid } from '@/services/userService';
import { getClassById } from '@/services/classService';

// PDF generation library
import PDFDocument from 'pdfkit';

export async function GET(request) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') || 'json'; // 'json', 'csv', or 'pdf'
    const firebaseUid = searchParams.get('uid');
    const classId = searchParams.get('classId');
    
    if (!firebaseUid) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    // Get the MongoDB user document for the Firebase user
    const dbUser = await getUserByFirebaseUid(firebaseUid);
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Check if the user is a faculty or admin
    if (!['faculty', 'hod'].includes(dbUser.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    if (!classId) {
      return NextResponse.json({ error: 'Class ID is required' }, { status: 400 });
    }
    
    // Get the class data with students
    const classData = await getClassById(classId);
    if (!classData) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }
    
    // Prepare student data for export
    const exportData = {
      className: classData.name,
      department: classData.department,
      semester: classData.currentSemester,
      batch: classData.batch || 'N/A',
      students: []
    };
    
    // Format student data
    if (classData.students && classData.students.length > 0) {
      exportData.students = classData.students
        .filter(student => student.status === 'approved') // Only include approved students
        .map(student => {
          const studentObj = student.student;
          return {
            name: studentObj.displayName || 'Unnamed Student',
            rollNo: studentObj.rollNo || 'N/A',
            email: studentObj.email || 'N/A',
            studentId: studentObj.studentId || 'N/A',
            currentSemester: studentObj.currentSemester || exportData.semester || 'N/A',
            joinedOn: student.joinRequestDate ? new Date(student.joinRequestDate).toLocaleDateString() : 'N/A',
            department: studentObj.department || exportData.department || 'N/A'
          };
        });
    }
    
    // Return data based on requested format
    if (format === 'csv') {
      const csvRows = [];
      // const headers = [
      //   { label: 'Name', key: 'name' },
      //   { label: 'Roll No', key: 'rollNo' },
      //   { label: 'Email', key: 'email' },
      //   { label: 'Student ID', key: 'studentId' },
      //   { label: 'Semester', key: 'currentSemester' },
      //   { label: 'Department', key: 'department' },
      //   { label: 'Joined On', key: 'joinedOn' }
      // ];

      const headers = [
        "Name",
        "Roll No",
        "Email",
        "Student ID",
        "Semester",
        "Department",
        "Joined On"
      ];  

      csvRows.push(headers.join(',')); // Add headers to CSV rows
      
      // Create CSV content
      // let csvContent = headers.map(header => `"${header.label}"`).join(',') + '\\n';
      
      exportData.students.forEach(student => {
        const row = [
          `"${student.name}"`, // Enclose in quotes to handle commas in names
          `"${student.rollNo}"`, // Enclose in quotes to handle commas in roll numbers
          `"${student.email}"`, // Enclose in quotes to handle commas in emails
          `"${student.studentId}"`, // Enclose in quotes to handle commas in student IDs
          student.currentSemester,
          student.department,
          student.joinedOn
        ];
        
        csvRows.push(row.join(','));
      });

      const csvContent = csvRows.join('\n'); // Join with actual newlines, not escaped newlines
      console.log('CSV Content:', csvContent); // Debugging line to check CSV content
      // Return CSV data
      return new Response(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${exportData.className}_students.csv"`
        }
      });
    } else if (format === 'pdf') {
      // For PDF generation, we'll use a stream
      const doc = new PDFDocument({
        margin: 25,
        size: 'A4',
        layout: 'portrait',
        font: "public/fonts/Helvetica.ttf"
      });
      
      // Store PDF in memory instead of creating a file
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      
      // Header
      doc.fontSize(18).text(`Student List: ${exportData.className}`, { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(12).text(`Department: ${exportData.department} | Semester: ${exportData.semester} | Batch: ${exportData.batch}`, { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(12).text(`Total Students: ${exportData.students.length}`, { align: 'center' });
      doc.moveDown(1);
      
      // Create table header
      const tableTop = 150;
      const tableHeaders = ['Name', 'Roll No', 'Email', 'Student ID', 'Department'];
      
      // Calculate column widths (based on page width)
      const pageWidth = doc.page.width - 50; // margins of 25 on each side
      const colWidths = [
        pageWidth * 0.20, // Name
        pageWidth * 0.15, // Roll No
        pageWidth * 0.35, // Email
        pageWidth * 0.15, // Student ID
        pageWidth * 0.15  // Department
      ];
      
      let currentX = 30;
      tableHeaders.forEach((header, i) => {
        doc.text(header, currentX, tableTop);
        currentX += colWidths[i];
      });
      
      // Draw header line
      doc.moveTo(30, tableTop + 20)
         .lineTo(doc.page.width - 20, tableTop + 20)
         .stroke();
      
      // Table rows
      let yOffset = tableTop + 30;
      
      exportData.students.forEach((student, i) => {
        // Check if we need a new page
        if (yOffset > doc.page.height - 100) {
          doc.addPage();
          yOffset = 50; // Reset y position
          
          // Repeat header on new page
          currentX = 30;
          tableHeaders.forEach((header, j) => {
            doc.font('Helvetica-Bold').text(header, currentX, yOffset);
            currentX += colWidths[j];
          });
          
          doc.moveTo(30, yOffset + 20)
             .lineTo(doc.page.width - 20, yOffset + 20)
             .stroke();
          
          yOffset += 30;
        }
        
        // Add row data
        currentX = 30;
        
        // Name
        doc.font('Helvetica').text(student.name, currentX, yOffset, {
          width: colWidths[0],
          ellipsis: true
        });
        currentX += colWidths[0];
        
        // Roll No
        doc.text(student.rollNo, currentX, yOffset);
        currentX += colWidths[1];
        
        // Email
        doc.fillColor('blue').text(student.email, currentX, yOffset, {
          width: colWidths[2],
          ellipsis: false, // Set to false to avoid ellipsis for email
          link: `mailto:${student.email}`, // Add mailto link
          underline: true // Underline the email link
        });
        currentX += colWidths[2];
        
        // Student ID
        doc.fillColor('black').text(student.studentId, currentX, yOffset);
        currentX += colWidths[3];
        
        // Department
        doc.text(student.department, currentX, yOffset, {
          width: colWidths[4],
          ellipsis: true
        });
        
        yOffset += 30; // Move down for the next row
        
        // Add row divider
        if (i < exportData.students.length - 1) {
          doc.moveTo(30, yOffset)
             .lineTo(doc.page.width - 20, yOffset)
             .stroke({ opacity: 0.2 });
        }
        
        yOffset += 10;
      });
      
      // Footer
      doc.moveDown(2);
      currentX = 30;
      const today = new Date().toLocaleDateString();
      doc.text(`Report generated on ${today}`,currentX,yOffset,{
        align: 'right',
        // width: doc.page.width - 60 // Adjust width to fit within margins
      });
      
      // End and return the PDF
      doc.end();
      
      return new Promise((resolve) => {
        doc.on('end', () => {
          const buffer = Buffer.concat(chunks);
          resolve(new Response(buffer, {
            status: 200,
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `attachment; filename="${exportData.className}_students.pdf"`
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