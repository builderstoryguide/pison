# Timetable Viewing and Download Guide

## Overview

The timetable management system now provides comprehensive viewing and download capabilities for generated timetables. This guide explains all the available features and how to use them.

## 🎯 **Available Features**

### **1. Viewing Timetables**
- **Weekly View**: Traditional table format showing all days and time slots
- **Daily View**: Card-based layout showing each day separately
- **List View**: Detailed list format with all periods

### **2. Download Options**
- **CSV Export**: Standard spreadsheet format
- **JSON Export**: Structured data format for integration
- **Print Function**: Print-friendly HTML format

### **3. Enhanced UI**
- **Period Count Badge**: Shows total number of periods
- **Download Button**: Quick access to export options
- **Responsive Design**: Works on all screen sizes

## 📋 **How to View and Download Timetables**

### **Step 1: Generate a Timetable**
1. Go to **Timetable Management** page
2. Select a class from the dropdown
3. Click **"Generate Timetable"** button
4. Wait for the generation to complete

### **Step 2: View the Timetable**
Once a timetable is generated, you can view it in three ways:

#### **Method 1: From the Class Table**
1. Find the class in the **"Class Timetables"** table
2. Click the **three dots (⋮)** in the Actions column
3. Select **"View Timetable"** from the dropdown

#### **Method 2: Select Class Directly**
1. Choose a class from the **"Class"** dropdown
2. The timetable viewer will automatically appear below

### **Step 3: Choose View Format**
The timetable viewer offers three viewing options:

#### **📅 Weekly View (Default)**
- Traditional table format
- Shows all days of the week
- Displays time slots on the left
- Each cell shows subject, teacher, and room

#### **📱 Daily View**
- Card-based layout
- Each day in a separate card
- Shows periods in chronological order
- Better for mobile devices

#### **📝 List View**
- Detailed list format
- Shows all periods in a structured list
- Easy to read and scan

## 📥 **Download Options**

### **1. CSV Export**
**Best for**: Spreadsheet applications, data analysis
- **Format**: Comma-separated values
- **Content**: Day, Time, Subject, Teacher, Room
- **Usage**: Open in Excel, Google Sheets, or similar

**Steps**:
1. Click the **"Download"** button in the timetable viewer
2. Select **"Export as CSV"**
3. File downloads automatically as `timetable_[ClassName].csv`

### **2. JSON Export**
**Best for**: Data integration, APIs, custom applications
- **Format**: Structured JSON data
- **Content**: Complete timetable data with metadata
- **Usage**: Import into other systems, data processing

**Steps**:
1. Click the **"Download"** button in the timetable viewer
2. Select **"Export as JSON"**
3. File downloads as `timetable_[ClassName].json`

**JSON Structure**:
```json
{
  "class": {
    "id": "class-id",
    "name": "Form 1A",
    "level": "Form 1",
    "subsystem": "english",
    "branch": "grammar"
  },
  "periods": [
    {
      "id": "period-id",
      "day": "Monday",
      "startTime": "08:00",
      "endTime": "08:45",
      "subject": "Mathematics",
      "teacher": "Paul Biya Mbeki",
      "room": "Room 101"
    }
  ],
  "generatedAt": "2024-12-01T10:30:00.000Z"
}
```

### **3. Print Function**
**Best for**: Physical copies, sharing with teachers/students
- **Format**: Print-friendly HTML
- **Content**: Formatted table with header information
- **Usage**: Print directly or save as PDF

**Steps**:
1. Click the **"Download"** button in the timetable viewer
2. Select **"Print Timetable"**
3. A new window opens with the formatted timetable
4. Use browser print function (Ctrl+P) to print or save as PDF

## 🎨 **Enhanced UI Features**

### **Period Count Badge**
- Shows the total number of periods in the timetable
- Located in the timetable viewer header
- Helps quickly assess timetable completeness

### **Download Button**
- Prominent download button in the timetable viewer
- Dropdown menu with all export options
- Easy access to all download formats

### **Responsive Design**
- **Desktop**: Full table view with all features
- **Tablet**: Optimized layout with touch-friendly controls
- **Mobile**: Card-based view for better readability

## 🔧 **Technical Details**

### **File Naming Convention**
- **CSV**: `timetable_[ClassName].csv`
- **JSON**: `timetable_[ClassName].json`
- **Print**: Browser print dialog

### **Data Formats**

#### **CSV Format**
```csv
Day,Time,Subject,Teacher,Room
Monday,08:00-08:45,Mathematics,Paul Biya Mbeki,Room 101
Monday,08:45-09:30,English Language,Marie Ngozi,Room 102
```

#### **JSON Format**
```json
{
  "class": { /* class information */ },
  "periods": [ /* array of periods */ ],
  "generatedAt": "ISO timestamp"
}
```

### **Browser Compatibility**
- **Modern Browsers**: Chrome, Firefox, Safari, Edge
- **File Downloads**: Automatic download handling
- **Print Function**: Uses browser's print capabilities

## 🚀 **Best Practices**

### **For Administrators**
1. **Generate timetables** during planning phase
2. **Export CSV** for sharing with teachers
3. **Use Print function** for physical copies
4. **Export JSON** for system integration

### **For Teachers**
1. **View daily schedule** using Daily View
2. **Print timetable** for classroom reference
3. **Download CSV** for personal records

### **For Students/Parents**
1. **Use Weekly View** for overview
2. **Print timetable** for reference
3. **Download formats** for digital access

## 🔍 **Troubleshooting**

### **Common Issues**

#### **Download Not Working**
- **Check browser settings**: Ensure downloads are allowed
- **Check file permissions**: Ensure write access to download folder
- **Try different browser**: Some browsers handle downloads differently

#### **Print Function Issues**
- **Check popup blockers**: Allow popups for the site
- **Use browser print**: Ctrl+P or Cmd+P
- **Save as PDF**: Use browser's "Save as PDF" option

#### **View Not Loading**
- **Refresh page**: Reload the timetable management page
- **Check class selection**: Ensure a class with timetable is selected
- **Check network**: Ensure stable internet connection

### **Performance Tips**
- **Large timetables**: Use Daily View for better performance
- **Multiple downloads**: Download one format at a time
- **Print optimization**: Use landscape mode for wide timetables

## 📞 **Support**

If you encounter issues with timetable viewing or downloading:

1. **Check the troubleshooting section** above
2. **Verify timetable generation** was successful
3. **Test with different browsers** if needed
4. **Contact system administrator** for technical support

The enhanced timetable viewing and download system provides comprehensive access to timetable data in multiple formats, making it easy to share, print, and integrate with other systems.
