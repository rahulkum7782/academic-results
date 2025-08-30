from flask import Flask, jsonify, request, send_from_directory
import datetime
import os
import json
from flask_cors import CORS

app = Flask(__name__, static_folder=".", static_url_path="", template_folder=".")
CORS(app)  # Enable CORS for all routes

# In-memory storage (replace with database in production)
attendance_records = []
students = {}
fingerprints = {}  # fingerprint_id -> student_id mapping

@app.route('/')
def home():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

# ✅ Mark attendance
@app.route('/mark', methods=['POST'])
def mark_attendance():
    try:
        data = request.json
        student_id = str(data.get("student_id"))
        password = data.get("password")
        
        # Check admin password
        if password != "1234":
            return jsonify({"status": "error", "message": "Invalid admin password"})
        
        # Check if student exists
        if student_id not in students:
            return jsonify({"status": "error", "message": "Student not found"})
        
        timestamp = datetime.datetime.now()
        check_in_time = timestamp.strftime("%Y-%m-%d %H:%M:%S")
        date_str = timestamp.strftime("%Y-%m-%d")
        
        # Check if already marked today
        for record in attendance_records:
            if record['student_id'] == student_id and record['date'] == date_str:
                return jsonify({"status": "error", "message": "Attendance already marked today"})
        
        # Determine status (on-time or late)
        # For demo purposes, we'll consider before 9:00 AM as on time
        status = "On Time"
        if timestamp.hour >= 9 and timestamp.minute > 0:
            status = "Late"
        
        record = {
            "student_id": student_id,
            "name": students[student_id]["name"],
            "class": students[student_id]["class"],
            "check_in": check_in_time,
            "status": status,
            "date": date_str
        }
        
        attendance_records.append(record)
        
        return jsonify({
            "status": "success", 
            "message": "Attendance marked", 
            "student_id": student_id,
            "name": students[student_id]["name"],
            "class_name": students[student_id]["class"],
            "check_in": check_in_time,
            "status_type": status,
            "total_days": len([r for r in attendance_records if r['student_id'] == student_id])
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

# ✅ Add student
@app.route('/add_student', methods=['POST'])
def add_student():
    try:
        data = request.json
        student_id = str(data.get("student_id"))
        name = data.get("name")
        class_name = data.get("class")
        roll_no = data.get("roll_no")
        fingerprint_id = data.get("fingerprint_id")
        
        students[student_id] = {
            "name": name,
            "class": class_name,
            "roll_no": roll_no
        }
        
        if fingerprint_id:
            fingerprints[fingerprint_id] = student_id
        
        return jsonify({"status": "success", "message": "Student added successfully"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

# ✅ Get attendance records
@app.route('/records', methods=['GET'])
def get_records():
    try:
        date_filter = request.args.get('date')
        class_filter = request.args.get('class')
        
        filtered_records = attendance_records
        
        if date_filter:
            filtered_records = [r for r in filtered_records if r['date'] == date_filter]
        
        if class_filter:
            filtered_records = [r for r in filtered_records if r['class'] == class_filter]
        
        # Format for frontend table
        table_data = []
        for record in filtered_records:
            table_data.append([
                record['student_id'],
                record['check_in'],
                record['status'],
                f"{record['name']} ({record['class']})"
            ])
        
        return jsonify(table_data)
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

# ✅ Get summary
@app.route('/summary', methods=['GET'])
def get_summary():
    try:
        date_str = datetime.datetime.now().strftime("%Y-%m-%d")
        
        today_records = [r for r in attendance_records if r['date'] == date_str]
        total = len(students)
        present = len(today_records)
        ontime = len([r for r in today_records if r['status'] == 'On Time'])
        late = len([r for r in today_records if r['status'] == 'Late'])
        absent = total - present
        
        return jsonify({
            "date": datetime.datetime.now().strftime("%Y-%m-%d"),
            "total": total,
            "present": present,
            "ontime": ontime,
            "late": late,
            "absent": absent
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

# ✅ Export records
@app.route('/export_records', methods=['GET'])
def export_records():
    try:
        date_filter = request.args.get('date')
        class_filter = request.args.get('class')
        
        filtered_records = attendance_records
        
        if date_filter:
            filtered_records = [r for r in filtered_records if r['date'] == date_filter]
        
        if class_filter:
            filtered_records = [r for r in filtered_records if r['class'] == class_filter]
        
        # Create CSV content
        csv_content = "Student ID,Name,Class,Check-in,Status\n"
        for record in filtered_records:
            csv_content += f"{record['student_id']},{record['name']},{record['class']},{record['check_in']},{record['status']}\n"
        
        return jsonify({"csv": csv_content})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

# ✅ Reset all records
@app.route('/reset', methods=['POST'])
def reset_records():
    try:
        global attendance_records
        attendance_records = []
        return jsonify({"status": "success", "message": "All records cleared"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

# ✅ Get all students
@app.route('/students', methods=['GET'])
def get_students():
    try:
        return jsonify(students)
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

# ✅ Backup data
@app.route('/backup', methods=['GET'])
def backup_data():
    try:
        data = {
            "students": students,
            "fingerprints": fingerprints,
            "attendance": attendance_records,
            "backup_date": datetime.datetime.now().isoformat()
        }
        return jsonify({"status": "success", "data": data})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

# ✅ Restore data
@app.route('/restore', methods=['POST'])
def restore_data():
    try:
        data = request.json
        global students, fingerprints, attendance_records
        
        students = data.get("students", {})
        fingerprints = data.get("fingerprints", {})
        attendance_records = data.get("attendance", [])
        
        return jsonify({"status": "success", "message": "Data restored successfully"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

if __name__ == '__main__':
    # Add some demo students
    students["101"] = {"name": "Rahul Kumar", "class": "10A", "roll_no": "1"}
    students["102"] = {"name": "Priya Singh", "class": "10A", "roll_no": "2"}
    students["103"] = {"name": "Amit Sharma", "class": "10B", "roll_no": "1"}
    students["104"] = {"name": "Sneha Patel", "class": "10B", "roll_no": "2"}
    
    # Add demo fingerprints
    fingerprints["fp101"] = "101"
    fingerprints["fp102"] = "102"
    fingerprints["fp103"] = "103"
    fingerprints["fp104"] = "104"
    
    print("Starting College Attendance System Server...")
    print("Access the system at: http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)