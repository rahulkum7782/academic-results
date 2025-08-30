// Global variables
let adminVerified = false;
let attendanceActive = false;
let attendanceStartTime = "09:30";
let attendanceEndTime = "10:30";
let lateThreshold = 15;
let currentFingerprintData = null;
let isScanning = false;
let attendanceChart = null;

// Initialize application
function initApp() {
  loadSettings();
  updateDateTime();
  loadDashboard();
  loadStudentsTable();
  loadClassOptions();
  
  // Set current month in reports
  const currentMonth = new Date().getMonth();
  document.getElementById('report-month').value = currentMonth;
  
  // Update time every minute
  setInterval(updateDateTime, 60000);
  setInterval(loadDashboard, 30000);
}

// Load settings from localStorage
function loadSettings() {
  const savedStartTime = localStorage.getItem('attendanceStartTime');
  const savedEndTime = localStorage.getItem('attendanceEndTime');
  const savedThreshold = localStorage.getItem('lateThreshold');
  const savedStatus = localStorage.getItem('attendanceActive');
  
  if (savedStartTime) attendanceStartTime = savedStartTime;
  if (savedEndTime) attendanceEndTime = savedEndTime;
  if (savedThreshold) lateThreshold = parseInt(savedThreshold);
  if (savedStatus) attendanceActive = savedStatus === 'true';
  
  document.getElementById('start-time').value = attendanceStartTime;
  document.getElementById('end-time').value = attendanceEndTime;
  document.getElementById('late-threshold').value = lateThreshold;
  updateAttendanceStatus();
}

// Update date and time display
function updateDateTime() {
  const now = new Date();
  document.getElementById('current-date').textContent = now.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  document.getElementById('current-time').textContent = now.toLocaleTimeString('en-IN');
}

// Tab navigation
function showTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.getElementById(tabId).classList.add('active');

  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`.tab-btn[onclick*="${tabId}"]`).classList.add('active');
  
  // Refresh data when switching to certain tabs
  if (tabId === 'dashboard') loadDashboard();
  if (tabId === 'student') loadStudentsTable();
  if (tabId === 'reports') generateReport();
}

// Admin login
function adminLogin() {
  const password = document.getElementById("admin-pass").value;
  const savedPassword = localStorage.getItem('adminPassword') || 'admin123';
  
  if (password === savedPassword) {
    adminVerified = true;
    document.getElementById("admin-msg").textContent = "✅ Admin login successful!";
    document.getElementById("admin-msg").className = "msg success";
    document.getElementById("admin-panel").style.display = "block";
  } else {
    document.getElementById("admin-msg").textContent = "❌ Incorrect password!";
    document.getElementById("admin-msg").className = "msg error";
    document.getElementById("admin-panel").style.display = "none";
  }
}

// Register fingerprint
function registerFingerprint() {
  const studentId = document.getElementById("student-id").value;
  const name = document.getElementById("student-name").value;
  
  if (!studentId || !name) {
    alert("Please enter Student ID and Name first!");
    return;
  }
  
  // Simulate fingerprint registration process
  document.getElementById("fingerprint-status").textContent = "Place finger on scanner...";
  document.getElementById("fingerprint-status").className = "";
  
  // Simulate multiple readings for better accuracy
  let fingerprintReadings = [];
  
  const registrationProcess = setInterval(() => {
    if (fingerprintReadings.length < 3) {
      const reading = simulateFingerprintReading();
      fingerprintReadings.push(reading);
      document.getElementById("fingerprint-status").textContent = 
        `Reading ${fingerprintReadings.length}/3...`;
    } else {
      clearInterval(registrationProcess);
      
      // Create composite fingerprint template from multiple readings
      const compositeFingerprint = createCompositeTemplate(fingerprintReadings);
      
      // Store fingerprint data
      let fingerprints = JSON.parse(localStorage.getItem('fingerprints') || '{}');
      fingerprints[studentId] = compositeFingerprint;
      localStorage.setItem('fingerprints', JSON.stringify(fingerprints));
      
      document.getElementById("fingerprint-status").textContent = "✅ Registered Successfully";
      document.getElementById("fingerprint-status").className = "success";
      
      // Enable add student button
      setTimeout(() => {
        document.getElementById("fingerprint-status").textContent = "Ready to add student";
      }, 2000);
    }
  }, 1000);
}

// Simulate fingerprint reading from hardware
function simulateFingerprintReading() {
  // This would come from actual fingerprint scanner hardware
  // For simulation, we'll create random fingerprint data
  return {
    pattern: Array.from({length: 100}, () => Math.floor(Math.random() * 2)).join(''),
    quality: Math.random() * 100,
    timestamp: Date.now()
  };
}

// Create composite template from multiple readings
function createCompositeTemplate(readings) {
  // Real systems create a master template from multiple readings
  // This improves matching accuracy
  return {
    pattern: readings[0].pattern, // Use first reading as base
    templates: readings.map(r => r.pattern),
    quality: readings.reduce((sum, r) => sum + r.quality, 0) / readings.length,
    registered: new Date().toISOString(),
    version: "1.0"
  };
}

// Fingerprint matching algorithm
function fingerprintMatch(storedFp, scannedFp) {
  // Real fingerprint matching would use complex pattern recognition
  // Here we simulate matching by comparing patterns with tolerance
  
  // Calculate match percentage (simulated)
  let matchScore = 0;
  const minLength = Math.min(storedFp.pattern.length, scannedFp.pattern.length);
  
  for (let i = 0; i < minLength; i++) {
    if (storedFp.pattern[i] === scannedFp.pattern[i]) {
      matchScore++;
    }
  }
  
  const matchPercentage = (matchScore / minLength) * 100;
  
  // Consider match if above 85% (real systems use 65-80% threshold)
  return matchPercentage > 85;
}

// Add student
function addStudent() {
  if (!adminVerified) {
    document.getElementById("student-add-msg").textContent = "Admin verification required!";
    document.getElementById("student-add-msg").className = "msg error";
    return;
  }
  
  const studentId = document.getElementById("student-id").value;
  const name = document.getElementById("student-name").value;
  const className = document.getElementById("student-class").value;
  const rollNo = document.getElementById("student-roll").value;
  const course = document.getElementById("student-course").value;
  const email = document.getElementById("student-email").value;

  if (!studentId || !name || !className || !rollNo) {
    document.getElementById("student-add-msg").textContent = "Please fill all required fields!";
    document.getElementById("student-add-msg").className = "msg error";
    return;
  }

  // Check if fingerprint is registered
  const fingerprints = JSON.parse(localStorage.getItem('fingerprints') || '{}');
  if (!fingerprints[studentId]) {
    document.getElementById("student-add-msg").textContent = "Please register fingerprint first!";
    document.getElementById("student-add-msg").className = "msg error";
    return;
  }

  // Save student data
  let students = JSON.parse(localStorage.getItem('students') || '{}');
  students[studentId] = {
    name, 
    class: className, 
    rollNo, 
    course,
    email,
    joined: new Date().toISOString()
  };
  localStorage.setItem('students', JSON.stringify(students));
  
  document.getElementById("student-add-msg").textContent = `Student ${name} added successfully!`;
  document.getElementById("student-add-msg").className = "msg success";
  
  // Clear form
  document.getElementById("student-id").value = "";
  document.getElementById("student-name").value = "";
  document.getElementById("student-class").value = "";
  document.getElementById("student-roll").value = "";
  document.getElementById("student-course").value = "";
  document.getElementById("student-email").value = "";
  document.getElementById("fingerprint-status").textContent = "Not Registered";
  document.getElementById("fingerprint-status").className = "";
  
  // Update students table
  loadStudentsTable();
  loadClassOptions();
}

// Set attendance timing
function setAttendanceTiming() {
  attendanceStartTime = document.getElementById('start-time').value;
  attendanceEndTime = document.getElementById('end-time').value;
  
  localStorage.setItem('attendanceStartTime', attendanceStartTime);
  localStorage.setItem('attendanceEndTime', attendanceEndTime);
  
  alert('Attendance timing updated successfully!');
  updateAttendanceTimer();
}

// Toggle attendance status
function toggleAttendance() {
  if (!adminVerified) {
    alert('Admin verification required!');
    return;
  }
  
  attendanceActive = !attendanceActive;
  localStorage.setItem('attendanceActive', attendanceActive.toString());
  
  updateAttendanceStatus();
}

// Update attendance status display
function updateAttendanceStatus() {
  const statusElem = document.getElementById('current-status');
  const buttonElem = document.getElementById('toggle-attendance');
  
  if (attendanceActive) {
    statusElem.textContent = 'Active';
    statusElem.className = 'status-active';
    buttonElem.innerHTML = '<i class="fas fa-stop"></i> Stop Attendance';
    buttonElem.className = 'btn-danger';
  } else {
    statusElem.textContent = 'Inactive';
    statusElem.className = 'status-inactive';
    buttonElem.innerHTML = '<i class="fas fa-play"></i> Start Attendance';
    buttonElem.className = 'btn-primary';
  }
}

// Update attendance timer display
function updateAttendanceTimer() {
  const now = new Date();
  const currentTime = now.toTimeString().substring(0, 5);
  const statusElem = document.getElementById('attendance-status-text');
  const timeElem = document.getElementById('attendance-time');
  
  timeElem.textContent = `${attendanceStartTime} - ${attendanceEndTime}`;
  
  if (!attendanceActive) {
    statusElem.textContent = 'Attendance Not Active';
    statusElem.className = 'status-inactive';
    return;
  }
  
  if (currentTime < attendanceStartTime) {
    statusElem.textContent = 'Attendance Not Started';
    statusElem.className = 'status-pending';
  } else if (currentTime >= attendanceStartTime && currentTime <= attendanceEndTime) {
    statusElem.textContent = 'Attendance in Progress';
    statusElem.className = 'status-active';
  } else {
    statusElem.textContent = 'Attendance Closed';
    statusElem.className = 'status-closed';
  }
}

// Start fingerprint scanning
function startFingerprintScan() {
  if(!adminVerified){
    document.getElementById("student-msg").textContent="Admin verification required!";
    document.getElementById("scanner-status").textContent = "Admin required";
    return;
  }
  
  if(!attendanceActive){
    document.getElementById("student-msg").textContent="Attendance is not active!";
    document.getElementById("scanner-status").textContent = "Inactive";
    return;
  }
  
  const now = new Date();
  
  // Convert times to minutes for comparison
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [startHour, startMinute] = attendanceStartTime.split(':').map(Number);
  const startMinutes = startHour * 60 + startMinute;
  const [endHour, endMinute] = attendanceEndTime.split(':').map(Number);
  const endMinutes = endHour * 60 + endMinute;
  
  // Check if current time is within attendance window
  if(currentMinutes < startMinutes){
    document.getElementById("student-msg").textContent=`Attendance starts at ${attendanceStartTime}`;
    document.getElementById("scanner-status").textContent = "Not started";
    return;
  }
  
  if(currentMinutes > endMinutes){
    document.getElementById("student-msg").textContent=`Attendance ended at ${attendanceEndTime}`;
    document.getElementById("scanner-status").textContent = "Ended";
    return;
  }
  
  if (isScanning) {
    document.getElementById("student-msg").textContent = "Already scanning!";
    return;
  }
  
  isScanning = true;
  document.getElementById("student-msg").textContent = "Scanning fingerprint...";
  document.getElementById("scanner-status").textContent = "Scanning...";
  
  // Visual feedback for scanning
  const scanner = document.getElementById("scanner");
  scanner.classList.add("scanning");
  
  // Simulate fingerprint scanning and matching
  setTimeout(() => {
    document.getElementById("scanner-status").textContent = "Matching...";
    
    setTimeout(() => {
      simulateFingerprintScan();
    }, 1500);
  }, 2000);
}

// Simulate fingerprint scan
function simulateFingerprintScan() {
  const fingerprints = JSON.parse(localStorage.getItem('fingerprints') || '{}');
  const fingerprintIds = Object.keys(fingerprints);
  
  if (fingerprintIds.length === 0) {
    document.getElementById("student-msg").textContent = "No fingerprints registered!";
    document.getElementById("scanner-status").textContent = "No fingerprints";
    isScanning = false;
    resetScanner();
    return;
  }
  
  // Get actual fingerprint data from scanner (simulated)
  const scannedFingerprint = simulateFingerprintReading();
  
  // Find matching fingerprint
  let matchedStudentId = null;
  
  for (const studentId in fingerprints) {
    const storedFingerprint = fingerprints[studentId];
    
    // Real fingerprint matching algorithm simulation
    if (fingerprintMatch(storedFingerprint, scannedFingerprint)) {
      matchedStudentId = studentId;
      break;
    }
  }
  
  if (matchedStudentId) {
    // Mark attendance for matched student
    markAttendanceByStudentId(matchedStudentId);
  } else {
    document.getElementById("student-msg").textContent = "Fingerprint not recognized!";
    document.getElementById("scanner-status").textContent = "Not recognized";
    isScanning = false;
    resetScanner();
  }
}

// Mark attendance by student ID
function markAttendanceByStudentId(studentId) {
  const students = JSON.parse(localStorage.getItem('students') || '{}');
  const student = students[studentId];
  
  if(!student){
    document.getElementById("student-msg").textContent="Student not found!";
    isScanning = false;
    resetScanner();
    return;
  }
  
  // Check if already marked today
  const today = new Date().toLocaleDateString();
  const records = JSON.parse(localStorage.getItem('attendanceRecords') || '[]');
  const alreadyMarked = records.find(record => 
    record.student_id === studentId && record.date === today
  );
  
  if(alreadyMarked){
    document.getElementById("student-msg").textContent="Attendance already marked today!";
    isScanning = false;
    resetScanner();
    return;
  }
  
  // Determine status (on-time or late) - FIXED LOGIC
  const now = new Date();
  
  // Convert attendance start time to Date object for comparison
  const [startHour, startMinute] = attendanceStartTime.split(':').map(Number);
  const startTime = new Date();
  startTime.setHours(startHour, startMinute, 0, 0);
  
  let status = 'On Time';
  
  // Compare current time with start time
  if(now > startTime){
    const lateMinutes = Math.floor((now - startTime) / 60000);
    if(lateMinutes > lateThreshold){
      status = 'Late';
    }
  }
  
  // If current time is before start time, still mark as On Time
  if(now < startTime){
    status = 'On Time';
  }
  
  // Create record
  const record = {
    student_id: studentId,
    name: student.name,
    class: student.class,
    check_in: now.toLocaleString(),
    status: status,
    date: today,
    timestamp: now.getTime()
  };
  
  records.push(record);
  localStorage.setItem('attendanceRecords', JSON.stringify(records));
  
  document.getElementById("student-msg").textContent=`Attendance marked for ${student.name} (${status})`;
  document.getElementById("scanner-status").textContent = "Success";
  showConfirmation(record, student);
  loadRecords();
  loadSummary();
  loadDashboard();
  
  isScanning = false;
  resetScanner();
}

// Reset scanner UI
function resetScanner() {
  const scanner = document.getElementById("scanner");
  scanner.classList.remove("scanning");
  
  // Reset scanner status after delay
  setTimeout(() => {
    document.getElementById("scanner-status").textContent = "Ready";
  }, 2000);
}

// Load students table
function loadStudentsTable() {
  const students = JSON.parse(localStorage.getItem('students') || '{}');
  const fingerprints = JSON.parse(localStorage.getItem('fingerprints') || '{}');
  const tableBody = document.getElementById("students-table").querySelector("tbody");
  
  tableBody.innerHTML = "";
  
  for (const studentId in students) {
    const student = students[studentId];
    const hasFingerprint = fingerprints[studentId] ? "✅ Registered" : "❌ Not Registered";
    
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${studentId}</td>
      <td>${student.name}</td>
      <td>${student.class}</td>
      <td>${student.rollNo}</td>
      <td>${student.course || '-'}</td>
      <td>${hasFingerprint}</td>
      <td>
        <button onclick="viewStudent('${studentId}')" class="btn-secondary"><i class="fas fa-eye"></i></button>
        <button onclick="editStudent('${studentId}')" class="btn-secondary"><i class="fas fa-edit"></i></button>
        <button onclick="deleteStudent('${studentId}')" class="btn-danger"><i class="fas fa-trash"></i></button>
      </td>
    `;
    
    tableBody.appendChild(row);
  }
}

// Load class options for filters
function loadClassOptions() {
  const students = JSON.parse(localStorage.getItem('students') || '{}');
  const classSelect = document.getElementById('report-class');
  const classes = new Set();
  
  // Clear existing options except the first one
  while (classSelect.options.length > 1) {
    classSelect.remove(1);
  }
  
  // Add classes from students
  Object.values(students).forEach(student => {
    if (student.class) classes.add(student.class);
  });
  
  // Add class options
  classes.forEach(className => {
    const option = document.createElement('option');
    option.value = className;
    option.textContent = className;
    classSelect.appendChild(option);
  });
}

// Load dashboard statistics
function loadDashboard() {
  try {
    const today = new Date().toLocaleDateString();
    const records = JSON.parse(localStorage.getItem('attendanceRecords') || '[]');
    const todayRecords = records.filter(record => record.date === today);
    
    const students = JSON.parse(localStorage.getItem('students') || '{}');
    const totalStudents = Object.keys(students).length;
    
    const present = todayRecords.length;
    const onTime = todayRecords.filter(record => record.status === 'On Time').length;
    const late = todayRecords.filter(record => record.status === 'Late').length;
    
    // Update dashboard cards
    document.getElementById("total-students").textContent = totalStudents;
    document.getElementById("present-today").textContent = present;
    document.getElementById("ontime-today").textContent = onTime;
    document.getElementById("late-today").textContent = late;
    
    // Update chart if it exists
    updateAttendanceChart();
  } catch(err) {
    console.error("Error loading dashboard:", err);
  }
}

// Update attendance chart
function updateAttendanceChart() {
  const ctx = document.getElementById('attendance-chart');
  if (!ctx) return;
  
  const records = JSON.parse(localStorage.getItem('attendanceRecords') || '[]');
  const students = JSON.parse(localStorage.getItem('students') || '{}');
  
  // Get last 7 days data
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    last7Days.push(date.toLocaleDateString());
  }
  
  const attendanceData = last7Days.map(date => {
    const dayRecords = records.filter(record => record.date === date);
    return dayRecords.length;
  });
  
  const totalStudents = Object.keys(students).length;
  const percentageData = attendanceData.map(count => 
    totalStudents > 0 ? Math.round((count / totalStudents) * 100) : 0
  );
  
  // Destroy previous chart if exists
  if (attendanceChart) {
    attendanceChart.destroy();
  }
  
  // Create new chart
  attendanceChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: last7Days.map(date => {
        const d = new Date(date);
        return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
      }),
      datasets: [
        {
          label: 'Attendance Percentage',
          data: percentageData,
          borderColor: '#667eea',
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Students Present',
          data: attendanceData,
          borderColor: '#28a745',
          backgroundColor: 'rgba(40, 167, 69, 0.1)',
          fill: true,
          tension: 0.4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Weekly Attendance Trend'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: totalStudents > 0 ? Math.max(...attendanceData) + 5 : 10,
          ticks: {
            callback: function(value) {
              return value + (this.scale.max <= 100 ? '%' : '');
            }
          }
        }
      }
    }
  });
}

// Generate report
function generateReport() {
  const month = parseInt(document.getElementById('report-month').value);
  const classFilter = document.getElementById('report-class').value;
  
  const records = JSON.parse(localStorage.getItem('attendanceRecords') || '[]');
  const students = JSON.parse(localStorage.getItem('students') || '{}');
  
  // Filter records by month and class
  const filteredRecords = records.filter(record => {
    const recordDate = new Date(record.date);
    const recordMonth = recordDate.getMonth();
    const recordYear = recordDate.getFullYear();
    const currentYear = new Date().getFullYear();
    
    return recordMonth === month && recordYear === currentYear &&
           (classFilter === '' || record.class === classFilter);
  });
  
  // Calculate attendance for each student
  const studentAttendance = {};
  
  for (const studentId in students) {
    const student = students[studentId];
    
    if (classFilter && student.class !== classFilter) continue;
    
    const studentRecords = filteredRecords.filter(record => record.student_id === studentId);
    const presentDays = studentRecords.length;
    
    studentAttendance[studentId] = {
      name: student.name,
      class: student.class,
      presentDays: presentDays,
      totalDays: filteredRecords.length > 0 ? new Set(filteredRecords.map(r => r.date)).size : 0,
      percentage: presentDays > 0 ? Math.round((presentDays / studentAttendance[studentId].totalDays) * 100) : 0
    };
  }
  
  // Update report summary
  const totalStudents = Object.keys(studentAttendance).length;
  const totalPresent = Object.values(studentAttendance).reduce((sum, student) => sum + student.presentDays, 0);
  const avgPercentage = totalStudents > 0 ? Math.round(totalPresent / totalStudents) : 0;
  
  document.getElementById("report-total").textContent = totalStudents;
  document.getElementById("report-present").textContent = totalPresent;
  document.getElementById("report-percentage").textContent = `${avgPercentage}%`;
  
  // Update report table
  const tableBody = document.getElementById("report-table").querySelector("tbody");
  tableBody.innerHTML = "";
  
  for (const studentId in studentAttendance) {
    const student = studentAttendance[studentId];
    const status = student.percentage >= 75 ? "Good" : "Low";
    
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${studentId}</td>
      <td>${student.name}</td>
      <td>${student.class}</td>
      <td>${student.presentDays}</td>
      <td>${student.totalDays}</td>
      <td>${student.percentage}%</td>
      <td><span class="status-${status.toLowerCase()}">${status}</span></td>
    `;
    
    tableBody.appendChild(row);
  }
}

// Student view function
function viewStudent(studentId) {
  const students = JSON.parse(localStorage.getItem('students') || '{}');
  const student = students[studentId];
  const records = JSON.parse(localStorage.getItem('attendanceRecords') || '[]');
  
  if (!student) return;
  
  // Calculate attendance stats
  const studentRecords = records.filter(record => record.student_id === studentId);
  const presentDays = studentRecords.length;
  const totalDays = records.length > 0 ? new Set(records.map(r => r.date)).size : 0;
  const percentage = presentDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
  
  // Update modal
  document.getElementById("modal-name").textContent = student.name;
  document.getElementById("modal-id").textContent = studentId;
  document.getElementById("modal-class").textContent = student.class;
  document.getElementById("modal-roll").textContent = student.rollNo;
  document.getElementById("modal-course").textContent = student.course || '-';
  document.getElementById("modal-total").textContent = totalDays;
  document.getElementById("modal-present").textContent = presentDays;
  document.getElementById("modal-percentage").textContent = `${percentage}%`;
  
  // Show modal
  document.getElementById("student-modal").style.display = "block";
}

// Close modal
function closeModal() {
  document.getElementById("student-modal").style.display = "none";
}

// Close support modal
function closeSupportModal() {
  document.getElementById("support-modal").style.display = "none";
}

// Contact support
function contactSupport() {
  document.getElementById("support-modal").style.display = "block";
}

// Send support message
function sendSupportMessage() {
  const message = document.getElementById("support-message").value;
  
  if (!message) {
    alert("Please enter your message!");
    return;
  }
  
  alert("Thank you for your message! We will contact you soon.");
  document.getElementById("support-message").value = "";
  closeSupportModal();
}

// Change admin password
function changePassword() {
  const newPassword = document.getElementById('new-password').value;
  
  if (newPassword.length < 6) {
    alert('Password must be at least 6 characters long!');
    return;
  }
  
  localStorage.setItem('adminPassword', newPassword);
  alert('Password changed successfully!');
  document.getElementById('new-password').value = '';
}

// Set late threshold
function setLateThreshold() {
  const threshold = parseInt(document.getElementById('late-threshold').value);
  
  if (isNaN(threshold) || threshold < 1) {
    alert('Please enter a valid number!');
    return;
  }
  
  lateThreshold = threshold;
  localStorage.setItem('lateThreshold', threshold.toString());
  alert('Late threshold updated successfully!');
}

// Backup data
function backupData() {
  const data = {
    students: JSON.parse(localStorage.getItem('students') || '{}'),
    fingerprints: JSON.parse(localStorage.getItem('fingerprints') || '{}'),
    attendance: JSON.parse(localStorage.getItem('attendanceRecords') || '[]'),
    settings: {
      startTime: localStorage.getItem('attendanceStartTime'),
      endTime: localStorage.getItem('attendanceEndTime'),
      threshold: localStorage.getItem('lateThreshold')
    }
  };
  
  const dataStr = JSON.stringify(data);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  
  const exportFileDefaultName = `attendance_backup_${new Date().toISOString().split('T')[0]}.json`;
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
  
  alert('Data backed up successfully!');
}

// Restore data
function restoreData() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  
  input.onchange = e => {
    const file = e.target.files[0];
    const reader = new FileReader();
    
    reader.onload = function(e) {
      try {
        const data = JSON.parse(e.target.result);
        
        if (confirm('Are you sure you want to restore data? This will overwrite current data.')) {
          localStorage.setItem('students', JSON.stringify(data.students || {}));
          localStorage.setItem('fingerprints', JSON.stringify(data.fingerprints || {}));
          localStorage.setItem('attendanceRecords', JSON.stringify(data.attendance || []));
          
          if (data.settings) {
            localStorage.setItem('attendanceStartTime', data.settings.startTime || '09:00');
            localStorage.setItem('attendanceEndTime', data.settings.endTime || '09:30');
            localStorage.setItem('lateThreshold', data.settings.threshold || '15');
          }
          
          alert('Data restored successfully!');
          location.reload();
        }
      } catch (error) {
        alert('Error restoring data: Invalid file format');
      }
    };
    
    reader.readAsText(file);
  };
  
  input.click();
}

// Clear all data
function clearAllData() {
  if (confirm('Are you sure you want to clear all data? This cannot be undone!')) {
    localStorage.clear();
    alert('All data has been cleared!');
    location.reload();
  }
}

// Export report
function exportReport() {
  alert('PDF export feature would be implemented here with a PDF library like jsPDF');
}

// Search students
function searchStudents() {
  const searchTerm = document.getElementById('student-search').value.toLowerCase();
  const table = document.getElementById('students-table');
  const rows = table.getElementsByTagName('tr');
  
  for (let i = 1; i < rows.length; i++) {
    const cells = rows[i].getElementsByTagName('td');
    let found = false;
    
    for (let j = 0; j < cells.length; j++) {
      if (cells[j].textContent.toLowerCase().includes(searchTerm)) {
        found = true;
        break;
      }
    }
    
    rows[i].style.display = found ? '' : 'none';
  }
}

// Initialize app on load
window.onload = function() {
  initApp();
};