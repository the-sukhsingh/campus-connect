import { NextResponse } from 'next/server';
import { getUserByFirebaseUid } from '@/services/userService';
import { getPreviousAttendance, getSubjectAttendanceSummary } from '@/services/attendanceService';
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
    const subject = searchParams.get('subject');
    
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
    
    if (!classId || !subject) {
      return NextResponse.json({ error: 'Class ID and subject are required' }, { status: 400 });
    }
    
    // Get the class data
    const classData = await getClassById(classId);
    if (!classData) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }
    
    // Get attendance data
    const attendanceRecords = await getPreviousAttendance(classId, subject);
    const attendanceSummary = await getSubjectAttendanceSummary(classId, subject);
    
    // Prepare data for export
    const exportData = {
      className: classData.name,
      department: classData.department,
      semester: classData.currentSemester,
      subject: subject,
      records: []
    };
    
    // Create a map of student IDs to student objects
    const studentMap = new Map();
    
    // Go through each record to build a complete student list with attendance status
    attendanceRecords.forEach(record => {
      const dateStr = new Date(record.date).toLocaleDateString();
      
      record.attendanceRecords.forEach(studentRecord => {
        const studentId = studentRecord.student._id.toString();
        
        if (!studentMap.has(studentId)) {
          studentMap.set(studentId, {
            id: studentId,
            name: studentRecord.student.displayName || 'Unnamed Student',
            rollNo: studentRecord.student.rollNo || 'N/A',
            email: studentRecord.student.email || 'N/A',
            attendance: {}
          });
        }
        
        // Add attendance for this date
        const student = studentMap.get(studentId);
        student.attendance[dateStr] = studentRecord.status;
      });
    });
    
    // Convert to array and calculate statistics
    const students = Array.from(studentMap.values());
    students.forEach(student => {
      // Find attendance stats for this student
      const stats = attendanceSummary.studentStats.find(
        stat => stat._id.toString() === student.id
      );
      
      if (stats) {
        student.present = stats.present || 0;
        student.absent = stats.absent || 0;
        student.late = stats.late || 0;
        student.total = (stats.present || 0) + (stats.absent || 0) + (stats.late || 0);
        student.percentage = student.total > 0 
          ? Math.round(((stats.present + stats.late) / student.total) * 100) 
          : 0;
      } else {
        student.present = 0;
        student.absent = 0;
        student.late = 0;
        student.total = 0;
        student.percentage = 0;
      }
    });
    
    exportData.records = students;
    exportData.dates = attendanceRecords.map(record => new Date(record.date).toLocaleDateString());
    exportData.totalClasses = attendanceSummary.totalClasses || 0;
    exportData.lastMarkedDate = attendanceSummary.lastMarkedDate 
      ? new Date(attendanceSummary.lastMarkedDate).toLocaleDateString() 
      : 'Never';
    
    // Return data based on requested format
    if (format === 'csv') {
      const csvRows = [];
      
      // Add header row
      const header = ['Name', 'Roll No', 'Email', 'Present', 'Absent', 'Late', 'Attendance %'];
      // Add date columns
      exportData.dates.forEach(date => header.push(`${date}`));
      csvRows.push(header.join(','));
      
      // Add data rows
      exportData.records.forEach(student => {
        const row = [
          `"${student.name}"`,
          `"${student.rollNo}"`,
          `"${student.email}"`,
          student.present,
          student.absent,
          student.late,
          `${student.percentage}%`
        ];
        
        // Add status for each date
        exportData.dates.forEach(date => {
          const status = student.attendance[date] || 'absent';
          row.push(`"${status}"`);
        });
        
        csvRows.push(row.join(','));
      });
      
      // Return CSV data
      const csvContent = csvRows.join('\\n');
      return new Response(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${exportData.className}_${exportData.subject}_attendance.csv"`
        }
      });
    } else if (format === 'pdf') {
      // For PDF generation, we'll use a stream
      const doc = new PDFDocument({
        margin: 50,
        size: 'A4',
        layout: 'landscape',
        font: "Helvetica",
      });
      
      // Store PDF in memory instead of creating a file
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      
      // Header
      doc.fontSize(18).text(`Attendance Report: ${exportData.className} - ${exportData.subject}`, { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(12).text(`Department: ${exportData.department} | Semester: ${exportData.semester} | Total Classes: ${exportData.totalClasses}`, { align: 'center' });
      doc.moveDown(1);
      
      // Create table header
      const tableTop = 150;
      const tableHeaders = ['Name', 'Roll No', 'Present', 'Absent', 'Late', 'Total %'];
      
      // Calculate column widths (based on page width)
      const pageWidth = doc.page.width - 100; // margins of 50 on each side
      const colWidths = [
        pageWidth * 0.25, // Name
        pageWidth * 0.15, // Roll No
        pageWidth * 0.15, // Present
        pageWidth * 0.15, // Absent
        pageWidth * 0.15, // Late
        pageWidth * 0.15  // Total %
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
      
      exportData.records.forEach((student, i) => {
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
        doc.font('Helvetica').text(student.name, currentX, yOffset, {
          width: colWidths[0], 
          ellipsis: true
        });
        currentX += colWidths[0];
        
        // Roll No
        doc.text(student.rollNo, currentX, yOffset);
        currentX += colWidths[1];
        
        // Present
        doc.text(student.present.toString(), currentX, yOffset);
        currentX += colWidths[2];
        
        // Absent
        doc.text(student.absent.toString(), currentX, yOffset);
        currentX += colWidths[3];
        
        // Late
        doc.text(student.late.toString(), currentX, yOffset);
        currentX += colWidths[4];
        
        // Total %
        doc.text(`${student.percentage}%`, currentX, yOffset);
        
        yOffset += 20;
        
        // Add row divider
        if (i < exportData.records.length - 1) {
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
              'Content-Disposition': `attachment; filename="${exportData.className}_${exportData.subject}_attendance.pdf"`
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