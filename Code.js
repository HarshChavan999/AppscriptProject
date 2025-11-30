/************************************************
 * MAIN HTML ENTRY POINT
 ************************************************/

var ss = SpreadsheetApp.getActiveSpreadsheet();
//Heloooo// i am yoooo// i am hitanshu // yooo again //Heloooo// i am yoooo ///sdjkbfjusf


function doGet(e) {
  try {
    return HtmlService.createTemplateFromFile("index").evaluate();
  } catch (error) {
    // Return error message for debugging
    return HtmlService
      .createHtmlOutput("Script error: " + error.toString())
      .setTitle("Error");
  }
}

/************************************************
 * HELPER: Include other .html files if needed
 ************************************************/
function include(filename) {
  return HtmlService.createTemplateFromFile(filename).getRawContent();
}


// function loginUser(loginData) {
//   try {
   
   
//     var sheet = ss.getSheetByName(CONFIG.LOGIN_SHEET_NAME);
//     if (!sheet) return { success: false, error: "LOGIN sheet not found." };

//     var data = sheet.getDataRange().getValues();
    
//     for (var i = 1; i < data.length; i++) {
//       var username = String(data[i][0]).trim();
//       var password = String(data[i][1]).trim();
//       var role = (data[i][2] || "").toString().toLowerCase().trim();
//       var branch = String(data[i][3]).trim();

//       if (username === loginData.username && password === loginData.password) {
//         //  Save session data
//         PropertiesService.getUserProperties().setProperty("loggedInUser", username);
//           createAuditLogEntry("Login Success", username);
//         return {
//   success: true,
//   userName: username,
//   role: role,
//   branch: branch,
//   userId: username   // ✅ This is the ID passed to frontend
// };
//       }
//     }

//     return { success: false, error: "Invalid username or password." };
//   } catch (err) {
//     return { success: false, error: err.toString() };
//   }
// }
function loginUser(loginData) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("LOGIN");
    if (!sheet) return { success: false, error: "LOGIN sheet not found." };

    var data = sheet.getDataRange().getValues();
    
    for (var i = 1; i < data.length; i++) {
      var username = String(data[i][0]).trim();
      var password = String(data[i][1]).trim();
      var role = (data[i][2] || "").toString().toLowerCase().trim();
      var branch = String(data[i][3]).trim();

      if (username === loginData.username && password === loginData.password) {
        // Save session data
        PropertiesService.getUserProperties().setProperty("loggedInUser", username);
        createAuditLogEntry("Login Success", username);
        
        return {
          success: true,
          userName: username,
          role: role,
          branch: branch,
          loggedInUserId: username  // This is the key change - using the correct property name
        };
      }
    }

    return { success: false, error: "Invalid username or password." };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}
function getInquiryAnalyticsData() {
  try {
    var sheet = ss.getSheetByName("INQUIRY FORM");
    if (!sheet) {
      return { error: "INQUIRY FORM sheet not found" };
    }

    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return { data: [], summary: { totalRecords: 0, uniqueCourses: 0, topCourse: "-" } };
    }

    var headers = data[0];
    var resultData = [];
    var courseCounts = {};

    // Find column indices
    var dateIdx = headers.indexOf("Date");
    var aadhaarIdx = headers.indexOf("Aadhaar");
    var fullNameIdx = headers.indexOf("Full Name");
    var qualificationIdx = headers.indexOf("Qualification");
    var phoneIdx = headers.indexOf("Phone");
    var whatsappIdx = headers.indexOf("WhatsApp");
    var parentsNumberIdx = headers.indexOf("Parents Number");
    var emailIdx = headers.indexOf("Email");
    var ageIdx = headers.indexOf("Age");
    var addressIdx = headers.indexOf("Address");
    var interestedCourseIdx = headers.indexOf("Interested Course");
    var inquiryTakenByIdx = headers.indexOf("Inquiry Taken By");
    var branchIdx = headers.indexOf("Branch");

    // Process data rows (start from row 1, but remember row numbers start from 1 in sheets)
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var course = (row[interestedCourseIdx] || "").toString().trim();
      
      if (course) {
        courseCounts[course] = (courseCounts[course] || 0) + 1;
      }

      var rowData = {
        rowNumber: i + 1, // This is the actual row number in the sheet
        date: row[dateIdx] ? Utilities.formatDate(row[dateIdx], Session.getScriptTimeZone(), "yyyy-MM-dd") : "",
        aadhaar: row[aadhaarIdx] || "",
        fullName: row[fullNameIdx] || "",
        qualification: row[qualificationIdx] || "",
        phone: row[phoneIdx] || "",
        whatsapp: row[whatsappIdx] || "",
        parentsNumber: row[parentsNumberIdx] || "",
        email: row[emailIdx] || "",
        age: row[ageIdx] || "",
        address: row[addressIdx] || "",
        interestedCourse: course,
        inquiryTakenBy: row[inquiryTakenByIdx] || "",
        branch: row[branchIdx] || ""
      };
      
      resultData.push(rowData);
    }

    var topCourse = Object.keys(courseCounts).length > 0 
      ? Object.keys(courseCounts).reduce((a, b) => courseCounts[a] > courseCounts[b] ? a : b, "") 
      : "-";

    var summary = {
      totalRecords: resultData.length,
      uniqueCourses: Object.keys(courseCounts).length,
      topCourse: topCourse
    };

    return {
      data: resultData,
      summary: summary
    };
  } catch (error) {
    return { error: error.toString() };
  }
}

/************************************************
 * DROPDOWN: Get dynamic data (sessions, trades, fees types, payment modes)
 ************************************************/
function getDropdownData() {
  try {
    
    var sheet = ss.getSheetByName(CONFIG.DROPDOWN_SHEET_NAME);
    if (!sheet) return { error: "DROPDOWN sheet not found." };

    var data = sheet.getDataRange().getValues();
    // We assume columns:
    // A -> session, B -> trade, C -> feesType, D -> paymentMode
    var sessionSet = {};
    var tradeSet = {};
    var feesTypeSet = {};
    var paymentModeSet = {};

    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var sVal = String(row[0] || "").trim();
      var tVal = String(row[1] || "").trim();
      var fVal = String(row[2] || "").trim();
      var pVal = String(row[3] || "").trim();

      if (sVal) sessionSet[sVal] = true;
      if (tVal) tradeSet[tVal] = true;
      if (fVal) feesTypeSet[fVal] = true;
      if (pVal) paymentModeSet[pVal] = true;
    }

    return {
      sessions: Object.keys(sessionSet).sort(),
      trades: Object.keys(tradeSet).sort(),
      feesTypes: Object.keys(feesTypeSet).sort(),
      paymentModes: Object.keys(paymentModeSet).sort(),
    };
  } catch (err) {
    return { error: err.toString() };
  }
}

/************************************************
 * AUTO-INCREMENT STUDENT ID
 ************************************************/
function getNextStudentId() {
  // We'll parse the STUDENT DATA sheet, find the highest ID that matches ST###, increment
  
  var sheet = ss.getSheetByName(CONFIG.STUDENT_DATA_SHEET_NAME);
  if (!sheet) return { error: "STUDENT DATA sheet not found." };

  var data = sheet.getDataRange().getValues();
  // We'll track something like ST###
  var maxNum = 0;
  for (var i = 1; i < data.length; i++) {
    var id = String(data[i][0] || "").trim(); // column A -> studentId
    var match = id.match(/^ST(\d+)$/i);
    if (match) {
      var num = parseInt(match[1], 10);
      if (num > maxNum) {
        maxNum = num;
      }
    }
  }
  var nextNum = maxNum + 1;
  var nextId = "ST" + String(nextNum).padStart(3, "0"); // e.g. ST001
  return { nextId: nextId };
}

/************************************************
 * AUTO-INCREMENT TRANSACTION ID
 ************************************************/
function getNextTransactionId() {

  var sheet = ss.getSheetByName(CONFIG.FEES_SHEET_NAME);
  if (!sheet) return { error: "FEES sheet not found." };

  var data = sheet.getDataRange().getValues();
  // We'll parse TXN###
  var maxNum = 0;
  for (var i = 1; i < data.length; i++) {
    var txn = String(data[i][4] || "").trim(); // column E -> transactionId
    var match = txn.match(/^TXN(\d+)$/i);
    if (match) {
      var num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }
  var nextNum = maxNum + 1;
  var nextId = "TXN" + String(nextNum).padStart(3, "0"); // e.g. TXN001
  return { nextTxn: nextId };
}

/************************************************
 * FEES: SUBMIT / UPDATE / GET
 ************************************************/
function submitData(formData) {
  try {

    var sheet = ss.getSheetByName(CONFIG.FEES_SHEET_NAME);
    if (!sheet) return "Error: FEES sheet not found.";

    var data = sheet.getDataRange().getValues();
    var sId = formData.studentId.trim();
    var sMonth = (formData.month || "").trim();

    // Check if fees is already paid for the same studentId + month
    for (var i = 1; i < data.length; i++) {
      var rowId = String(data[i][0] || "").trim();
      var rowMonth = String(data[i][2] || "").trim();
      if (rowId === sId && rowMonth === sMonth) {
        return "Error: Fee for this month (" + sMonth + ") is already paid!";
      }
    }

    // If transactionId empty, get next
    var txnId = formData.transactionId.trim();
    if (!txnId) {
      // auto generate
      var nextObj = getNextTransactionId();
      if (nextObj.error) return "Error: " + nextObj.error;
      txnId = nextObj.nextTxn;
    }

    // Append row
    // FEES columns: A->studentId, B->date, C->month, D->session, E->txnId, F->trade, G->studentName,
    // H->fatherName, I->paidAmount, J->paidAmountInWord, K->feesType, L->paymentMode, M->remark, N->userName
    var rowData = [
      sId,
      formData.date,
      sMonth,
      formData.session,
      txnId,
      formData.trade,
      formData.studentName,
      formData.fatherName,
      formData.paidAmount,
      formData.paidAmountInWord,
      formData.feesType,
      formData.paymentMode,
      formData.remark,
      formData.userName,
    ];
    sheet.appendRow(rowData);

    return "Data submitted successfully!";
  } catch (error) {
    return "Error: " + error.toString();
  }
}

/************************************************
 * Inquiry Form: SUBMIT
 ************************************************/
function submitInquiryData(formData2) {
  try {

    var sheet = ss.getSheetByName("INQUIRY FORM");
    if (!sheet) return "Error: Inquiries sheet not found.";

    var data = sheet.getDataRange().getValues();
    var phoneNo = formData2.phoneNo.trim();

    // Check if inquiry already exists with same phone number
    for (var i = 1; i < data.length; i++) {
      var rowPhone = String(data[i][4] || "").trim();
      if (rowPhone === phoneNo) {
        return "Error: Inquiry with this phone number already exists!";
      }
    }

    // Prepare row data
    // Inquiries columns:
    // A->Timestamp, B->Date, C->FullName, D->Qualification, E->PhoneNo,
    // F->WhatsAppNo, G->ParentsNo, H->Email, I->Age, J->Address,
    // K->InterestedCourse, L->InquiryTakenBy, M->Status, N->FollowUpDate,
    // O->Notes, P->AdmissionStatus, Q->AdmissionDate, R->BatchAssigned
    var rowData = [
      new Date(), // Timestamp
      formData2.date, // Date
      formData2.fullName, // Full Name
      formData2.qualification, // Qualification
      phoneNo, // Phone
      formData2.whatsappNo || "", // WhatsApp
      formData2.parentsNo || "", // Parents No
      formData2.email || "", // Email
      formData2.age, // Age
      formData2.address, // Address
      formData2.interestedCourse, // Interested Course
      formData2.inquiryTakenBy,
      formData2.branch, // Inquiry Taken By
      "New Inquiry", // Status
      "", // Follow-up Date
      "", // Notes
      "Not Admitted", // Admission Status
      "", // Admission Date
      "", // Batch Assigned
    ];

    sheet.appendRow(rowData);
    return "Inquiry submitted successfully!";
  } catch (error) {
    return "Error: " + error.toString();
  }
}
/**
 * Admin-only: Update existing fee row
 */
function updateData(formData, userRole) {
  if (!userRole || userRole.toLowerCase() !== "admin") {
    return "Error: You don't have permission to update fee data.";
  }
  try {

    var sheet = ss.getSheetByName(CONFIG.FEES_SHEET_NAME);
    if (!sheet) return "Error: FEES sheet not found.";

    var rowNumber = parseInt(formData.recordRowNumber, 10);
    var sId = formData.studentId.trim();
    var sMonth = (formData.month || "").trim();

    // Check duplicates except the row being updated
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (i + 1 === rowNumber) continue;
      var rowId = String(data[i][0] || "").trim();
      var rowMonth = String(data[i][2] || "").trim();
      if (rowId === sId && rowMonth === sMonth) {
        return "Error: Fee for this month (" + sMonth + ") is already paid!";
      }
    }

    // If transactionId empty => auto generate
    var txnId = formData.transactionId.trim();
    if (!txnId) {
      var nextObj = getNextTransactionId();
      if (nextObj.error) return "Error: " + nextObj.error;
      txnId = nextObj.nextTxn;
    }

    var updatedValues = [
      sId,
      formData.date,
      sMonth,
      formData.session,
      txnId,
      formData.trade,
      formData.studentName,
      formData.fatherName,
      formData.paidAmount,
      formData.paidAmountInWord,
      formData.feesType,
      formData.paymentMode,
      formData.remark,
      formData.userName,
    ];
    sheet
      .getRange(rowNumber, 1, 1, updatedValues.length)
      .setValues([updatedValues]);
    return "Data updated successfully!";
  } catch (error) {
    return "Error: " + error.toString();
  }
}

function getStudentSession(studentId) {
  try {

    var sheet = ss.getSheetByName(CONFIG.STUDENT_DATA_SHEET_NAME);
    if (!sheet) return { error: "STUDENT DATA sheet not found." };

    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === String(studentId).trim()) {
        return {
          session: data[i][1] || "",
          studentName: data[i][2] || "",
          fatherName: data[i][3] || "",
          instituteName: data[i][4] || "",
          trade: data[i][5] || "",
          className: data[i][6] || "",
        };
      }
    }
    return {
      session: "",
      studentName: "",
      fatherName: "",
      instituteName: "",
      trade: "",
      className: "",
    };
  } catch (error) {
    return { error: error.toString() };
  }
}

function getOldFees(studentId) {
  try {

    var sheet = ss.getSheetByName(CONFIG.FEES_SHEET_NAME);
    if (!sheet) return { error: "FEES sheet not found." };

    var data = sheet.getDataRange().getValues();
    var records = [];
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === String(studentId).trim()) {
        var dateVal = data[i][1];
        var dateStr =
          dateVal instanceof Date
            ? Utilities.formatDate(
                dateVal,
                Session.getScriptTimeZone(),
                "yyyy-MM-dd"
              )
            : String(dateVal).trim();
        records.push({
          row: i + 1,
          studentId: data[i][0],
          date: dateStr,
          month: data[i][2],
          session: data[i][3],
          transactionId: data[i][4],
          trade: data[i][5],
          studentName: data[i][6],
          fatherName: data[i][7],
          paidAmount: data[i][8],
        });
      }
    }
    return records;
  } catch (error) {
    return { error: error.toString() };
  }
}

function getRecord(rowNumber) {
  try {
    
    var sheet = ss.getSheetByName("FEES");
    if (!sheet) return { error: "FEES sheet not found." };

    var row = sheet
      .getRange(rowNumber, 1, 1, sheet.getLastColumn())
      .getValues()[0];
    if (row[1] instanceof Date) {
      row[1] = Utilities.formatDate(
        row[1],
        Session.getScriptTimeZone(),
        "yyyy-MM-dd"
      );
    }
    return { values: row };
  } catch (error) {
    return { error: error.toString() };
  }
}

/************************************************
 * STUDENT DATA: ADD / UPDATE / DELETE
 ************************************************/
function addStudentData(studentData, userRole) {
  if (!userRole || userRole.toLowerCase() !== "admin") {
    return "Error: You don't have permission to add new student data.";
  }
  try {
    
    var sheet = ss.getSheetByName("STUDENT DATA");
    if (!sheet) return "Error: STUDENT DATA sheet not found.";

    // If studentId is empty => auto-generate
    var sId = studentData.studentId.trim();
    if (!sId) {
      var nextObj = getNextStudentId();
      if (nextObj.error) return "Error: " + nextObj.error;
      sId = nextObj.nextId; // e.g. ST003
    }

    // STUDENT DATA columns:
    // 0->studentId, 1->session, 2->studentName, 3->fatherName,
    // 4->instituteName, 5->trade, 6->class, 7->totalFees
    var newRow = [
      sId,
      studentData.session,
      studentData.studentName,
      studentData.fatherName,
      studentData.instituteName,
      studentData.trade,
      studentData.className,
      studentData.totalFees,
    ];
    sheet.appendRow(newRow);
    return "Student added successfully!";
  } catch (error) {
    return "Error: " + error.toString();
  }
}

function getStudentList() {
  try {
    
    var sheet = ss.getSheetByName("STUDENT DATA");
    if (!sheet) return { error: "STUDENT DATA sheet not found." };

    var data = sheet.getDataRange().getValues();
    var students = [];
    for (var i = 1; i < data.length; i++) {
      students.push({
        row: i + 1,
        studentId: data[i][0],
        session: data[i][1],
        studentName: data[i][2],
        fatherName: data[i][3],
        instituteName: data[i][4],
        trade: data[i][5],
        className: data[i][6],
        totalFees: data[i][7],
      });
    }
    return students;
  } catch (error) {
    return { error: error.toString() };
  }
}

function updateStudentData(studentData, userRole) {
  if (!userRole || userRole.toLowerCase() !== "admin") {
    return "Error: You don't have permission to update student data.";
  }
  try {
    
    var sheet = ss.getSheetByName("STUDENT DATA");
    if (!sheet) return "Error: STUDENT DATA sheet not found.";

    var rowNumber = parseInt(studentData.row, 10);

    // If user cleared Student ID => re-generate or keep the old? Typically we keep old ID.
    var sId = studentData.studentId.trim();
    if (!sId) {
      var nextObj = getNextStudentId();
      if (nextObj.error) return "Error: " + nextObj.error;
      sId = nextObj.nextId;
    }

    var updatedValues = [
      sId,
      studentData.session,
      studentData.studentName,
      studentData.fatherName,
      studentData.instituteName,
      studentData.trade,
      studentData.className,
      studentData.totalFees,
    ];
    sheet
      .getRange(rowNumber, 1, 1, updatedValues.length)
      .setValues([updatedValues]);
    return "Student updated successfully!";
  } catch (error) {
    return "Error: " + error.toString();
  }
}

function deleteStudentData(rowNumber, userRole) {
  if (!userRole || userRole.toLowerCase() !== "admin") {
    return "Error: You don't have permission to delete student data.";
  }
  try {
    
    var sheet = ss.getSheetByName("STUDENT DATA");
    if (!sheet) return "Error: STUDENT DATA sheet not found.";

    sheet.deleteRow(rowNumber);
    return "Student deleted successfully!";
  } catch (error) {
    return "Error: " + error.toString();
  }
}

/************************************************
 * ANALYTICS (ADMIN ONLY), with optional date range
 ************************************************/
function getAnalyticsData(
  monthFilter,
  feesTypeFilter,
  paymentModeFilter,
  dateFrom,
  dateTo,
  userRole
) {
  if (!userRole || userRole.toLowerCase() !== "admin") {
    return { error: "You don't have permission to view analytics." };
  }

  var analytics = {
    totalPaidFees: 0,
    totalUnpaidFees: 0,
    totalStudents: 0,
    paidStudentsCount: 0,
    unpaidStudentsCount: 0,
    dateWisePaid: {},
    pieData: { paid: 0, unpaid: 0 },
    lineData: {},
  };

  
  var sheetStudents = ss.getSheetByName("STUDENT DATA");
  var sheetFees = ss.getSheetByName("FEES");
  if (!sheetStudents || !sheetFees) {
    return { error: "Sheets not found. Check STUDENT DATA or FEES." };
  }
  var dataStudents = sheetStudents.getDataRange().getValues();
  var dataFees = sheetFees.getDataRange().getValues();

  // Convert dateFrom/dateTo to actual Dates if provided
  var fromDate = null,
    toDate = null;
  if (dateFrom) {
    fromDate = new Date(dateFrom + "T00:00:00"); // parse
  }
  if (dateTo) {
    toDate = new Date(dateTo + "T23:59:59");
  }

  // Build a student map
  var studentMap = {};
  for (var i = 1; i < dataStudents.length; i++) {
    var sId = String(dataStudents[i][0]).trim();
    var sTotal = parseFloat(dataStudents[i][7]) || 0;
    studentMap[sId] = { totalFees: sTotal, sumPaid: 0, hasPaidRow: false };
  }

  for (var j = 1; j < dataFees.length; j++) {
    var row = dataFees[j];
    var feeStudentId = String(row[0] || "").trim();
    var feeDateVal = row[1];
    var feeMonth = String(row[2] || "").trim();
    var feeType = String(row[10] || "").trim();
    var feePayMode = String(row[11] || "").trim();
    var paidAmount = parseFloat(row[8]) || 0;

    // date range check
    if (fromDate || toDate) {
      var actualDate =
        feeDateVal instanceof Date
          ? feeDateVal
          : new Date(feeDateVal + "T00:00:00");
      if (fromDate && actualDate < fromDate) continue;
      if (toDate && actualDate > toDate) continue;
    }
    // month filter
    if (monthFilter && feeMonth !== monthFilter) continue;
    // feesType filter
    if (feesTypeFilter && feeType !== feesTypeFilter) continue;
    // paymentMode filter
    if (paymentModeFilter && feePayMode !== paymentModeFilter) continue;

    if (!isNaN(paidAmount) && paidAmount > 0) {
      analytics.totalPaidFees += paidAmount;

      // accumulate dateWise
      var dateStr =
        feeDateVal instanceof Date
          ? Utilities.formatDate(
              feeDateVal,
              Session.getScriptTimeZone(),
              "yyyy-MM-dd"
            )
          : String(feeDateVal).trim();

      if (!analytics.dateWisePaid[dateStr]) {
        analytics.dateWisePaid[dateStr] = 0;
      }
      analytics.dateWisePaid[dateStr] += paidAmount;
    }

    if (studentMap[feeStudentId]) {
      studentMap[feeStudentId].sumPaid += paidAmount;
      studentMap[feeStudentId].hasPaidRow = true;
    }
  }

  analytics.totalStudents = Object.keys(studentMap).length;
  var sumUnpaid = 0;
  for (var sid in studentMap) {
    var st = studentMap[sid];
    if (st.hasPaidRow) {
      analytics.paidStudentsCount++;
    } else {
      analytics.unpaidStudentsCount++;
      sumUnpaid += st.totalFees;
    }
  }
  analytics.totalUnpaidFees = sumUnpaid;
  analytics.pieData.paid = analytics.totalPaidFees;
  analytics.pieData.unpaid = analytics.totalUnpaidFees;
  analytics.lineData = analytics.dateWisePaid;

  return analytics;
}





/************************************************
 Getting Admission Data
 ************************************************/


function getAnalyticsData2(
  monthFilter,
  feesTypeFilter,
  paymentModeFilter,
  dateFrom,
  dateTo,
  userRole
) {
  if (!userRole || userRole.toLowerCase() !== "admin") {
    return { error: "You don't have permission to view analytics." };
  }

  var analytics = {
    totalPaidFees2: 0,
    totalUnpaidFees2: 0,
    totalStudents2: 0,
    paidStudentsCount2: 0,
    unpaidStudentsCount2: 0,
    dateWisePaid2: {},
    pieData2: { paid: 0, unpaid: 0 },
    lineData2: {},
    totalAdmissions: 0,
    totalInquiry: 0,
  };

  
  var sheetStudents = ss.getSheetByName(CONFIG.ADMISSIONS_SHEET_NAME);
  if (!sheetStudents) {
    return { error: "Sheets not found. Check Admissions sheet." };
  }
  var dataStudents = sheetStudents.getDataRange().getValues();
  
  // Count total admissions (subtract 1 for header row)
  analytics.totalAdmissions = dataStudents.length > 1 ? dataStudents.length - 1 : 0;

  var sheetStudents1 = ss.getSheetByName(CONFIG.INQUIRY_SHEET_NAME);
  if (!sheetStudents1) {
    return { error: "Sheets not found. Check Admissions sheet." };
  }
  var dataStudents1 = sheetStudents1.getDataRange().getValues();
  
  // Count total admissions (subtract 1 for header row)
  analytics.totalInquiry = dataStudents1.length > 1 ? dataStudents1.length - 1 : 0;
  
  // Process payment data if needed
  var sheetFees = ss.getSheetByName("FEES");
  if (!sheetFees) {
    // If we only need admission count, we can return early
    return analytics;
  }
  
  var dataFees = sheetFees.getDataRange().getValues();

  // Convert dateFrom/dateTo to actual Dates if provided
  var fromDate = null,
    toDate = null;
  if (dateFrom) {
    fromDate = new Date(dateFrom + "T00:00:00"); // parse
  }
  if (dateTo) {
    toDate = new Date(dateTo + "T23:59:59");
  }

  // Build a student map - assuming column structure from headers
  var studentMap = {};
  for (var i = 1; i < dataStudents.length; i++) {
    var sId = String(dataStudents[i][1]).trim(); // Receipt Number as ID
    var sTotal = 0;
    
    // Calculate total fees from year columns (index positions may vary based on actual sheet)
    var year1Total = parseFloat(dataStudents[i][9]) || 0;
    var year2Total = parseFloat(dataStudents[i][12]) || 0;
    var year3Total = parseFloat(dataStudents[i][15]) || 0;
    sTotal = year1Total + year2Total + year3Total;
    
    var year1Paid = parseFloat(dataStudents[i][10]) || 0;
    var year2Paid = parseFloat(dataStudents[i][13]) || 0;
    var year3Paid = parseFloat(dataStudents[i][16]) || 0;
    var totalPaid = year1Paid + year2Paid + year3Paid;
    
    studentMap[sId] = { 
      totalFees: sTotal, 
      sumPaid: totalPaid, 
      hasPaidRow: totalPaid > 0 
    };
    
    // Add to analytics totals
    analytics.totalPaidFees2 += totalPaid;
    if (totalPaid > 0) {
      analytics.paidStudentsCount2++;
    } else {
      analytics.unpaidStudentsCount2++;
      analytics.totalUnpaidFees2 += sTotal;
    }
  }

  analytics.totalStudents2 = Object.keys(studentMap).length;
  analytics.pieData2.paid = analytics.totalPaidFees2;
  analytics.pieData2.unpaid = analytics.totalUnpaidFees2;

  return analytics;
}






/************************************************
 * CLASS & MONTH DASHBOARD (ADMIN ONLY)
 ************************************************/
function getClassList() {
  try {
    
    var sheet = ss.getSheetByName("STUDENT DATA");
    if (!sheet) return { error: "STUDENT DATA sheet not found." };

    var data = sheet.getDataRange().getValues();
    var classSet = {};
    for (var i = 1; i < data.length; i++) {
      var cls = String(data[i][6] || "").trim(); // col G
      if (cls) classSet[cls] = true;
    }
    return Object.keys(classSet).sort();
  } catch (err) {
    return { error: err.toString() };
  }
}

function getClassMonthDashboard(selectedClass, selectedMonth, userRole) {
  if (!userRole || userRole.toLowerCase() !== "admin") {
    return { error: "You don't have permission to view dashboard." };
  }
  
  var sheetStudents = ss.getSheetByName("STUDENT DATA");
  var sheetFees = ss.getSheetByName("FEES");
  if (!sheetStudents || !sheetFees) {
    return { error: "Sheets not found (STUDENT DATA or FEES missing)." };
  }

  var dataStudents = sheetStudents.getDataRange().getValues();
  var dataFees = sheetFees.getDataRange().getValues();

  // collect all students in selectedClass
  var studentClassMap = {};
  for (var i = 1; i < dataStudents.length; i++) {
    var sId = String(dataStudents[i][0]).trim();
    var sName = String(dataStudents[i][2] || "");
    var sClass = String(dataStudents[i][6] || "");
    var sTotalFees = parseFloat(dataStudents[i][7]) || 0;

    if (!selectedClass || sClass === selectedClass) {
      studentClassMap[sId] = {
        studentName: sName,
        totalFees: sTotalFees,
        sumPaid: 0,
        hasPaid: false,
      };
    }
  }

  var lineData = {};
  for (var j = 1; j < dataFees.length; j++) {
    var row = dataFees[j];
    var feeStudentId = String(row[0] || "").trim();
    var feeDateVal = row[1];
    var feeMonth = String(row[2] || "").trim();
    var paidAmount = parseFloat(row[8]) || 0;

    if (studentClassMap[feeStudentId]) {
      if (!selectedMonth || feeMonth === selectedMonth) {
        if (paidAmount > 0) {
          studentClassMap[feeStudentId].hasPaid = true;
          studentClassMap[feeStudentId].sumPaid += paidAmount;
          var dateStr =
            feeDateVal instanceof Date
              ? Utilities.formatDate(
                  feeDateVal,
                  Session.getScriptTimeZone(),
                  "yyyy-MM-dd"
                )
              : String(feeDateVal).trim();
          if (!lineData[dateStr]) {
            lineData[dateStr] = 0;
          }
          lineData[dateStr] += paidAmount;
        }
      }
    }
  }

  var studentsArray = [];
  for (var key in studentClassMap) {
    var st = studentClassMap[key];
    studentsArray.push({
      studentId: key,
      studentName: st.studentName,
      totalFees: st.totalFees,
      sumPaid: st.sumPaid,
      hasPaid: st.hasPaid,
    });
  }

  // sort lineData
  var sortedDates = Object.keys(lineData).sort();
  var finalLineData = {};
  sortedDates.forEach(function (d) {
    finalLineData[d] = lineData[d];
  });

  return { students: studentsArray, lineData: finalLineData };
}




// function saveEnrollment(data) {
//   try {
//     const ss = SpreadsheetApp.getActiveSpreadsheet();
//     const sheet = ss.getSheetByName("Enrollments");
    
//     // Get current date and format as dd/mm/yyyy
//     const today = new Date();
//     const session = `${today.getDate()}/${today.getMonth()+1}/${today.getFullYear()}`;
    
//     // Ensure we have required fields
//     if (!data.enrollmentID || !data.studentName) {
//       throw new Error("Missing required enrollment data");
//     }
    
//     sheet.appendRow([
//       data.enrollmentID,  // EnrollmentID (PK)
//       data.studentName,   // StudentID (FK)
//       data.course,  // CounselD (FK) with fallback
//       session,            // Session
//       "Active"            // Status
//     ]);
    
//     return {success: true, message: "Enrollment saved successfully"};
//   } catch (e) {
//     console.error("Save enrollment error:", e);
//     throw new Error("Failed to save enrollment: " + e.toString());
//   }
// }
function saveEnrollment(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(CONFIG.ENROLLMENTS_SHEET_NAME);

    // Create sheet if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet(CONFIG.ENROLLMENTS_SHEET_NAME);
      // Add headers
      sheet.appendRow([
        "Enrollment ID",
        "Student Name",
        "Course",
        "Date",
        "Status"
      ]);
    }

    // Validate data
    if (!data.enrollmentID || !data.studentName) {
      throw new Error("Missing required enrollment data");
    }

    // Check for duplicate enrollment ID
    const existingData = sheet.getDataRange().getValues();
    const existingIds = existingData.slice(1).map(row => row[0]); // Skip header row
    if (existingIds.includes(data.enrollmentID)) {
      throw new Error("Enrollment ID already exists: " + data.enrollmentID);
    }

    // Format date as dd/mm/yyyy
    const today = new Date();
    const formattedDate = `${today.getDate()}/${today.getMonth()+1}/${today.getFullYear()}`;

    // Append to sheet
    sheet.appendRow([
      data.enrollmentID,
      data.studentName,
      data.course || "Not Specified",
      formattedDate,
      "Active"
    ]);

    // Return success with the enrollment ID
    return {
      success: true,
      message: "Enrollment saved successfully",
      enrollmentID: data.enrollmentID
    };

  } catch (e) {
    console.error("Save enrollment error:", e);
    throw new Error("Failed to save enrollment: " + e.message);
  }
}

/************************************************
 * receipt
 ************************************************/




function generateReceiptNumber() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetName = "Receipts";
  let sheet = ss.getSheetByName(sheetName);

  // If the sheet doesn't exist, create it with headers
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(["Receipt No", "Date", "Full Name", "Propose to Pay", "Total Amount", "Paid", "Balance", "Exam Fees", "Received By"]);
  }

  const lastRow = sheet.getLastRow();

  // Determine next receipt number
  let newReceiptNumber = 1; // Starting number
  if (lastRow > 1) {
    const lastReceipt = sheet.getRange(lastRow, 1).getValue(); // Column A
    if (!isNaN(lastReceipt)) {
      newReceiptNumber = parseInt(lastReceipt) + 1;
    }
  }

  return newReceiptNumber.toString().padStart(4, '0'); // Format: 1001, 1002...
}












/************************************************
 * DUE FEES
 ************************************************/
function getDueFeesData(userRole) {
  if (!userRole || userRole.toLowerCase() !== "admin") {
    return { error: "You don't have permission to view Due Fees." };
  }
  
  var sheetStudents = ss.getSheetByName("STUDENT DATA");
  var sheetFees = ss.getSheetByName("FEES");
  if (!sheetStudents || !sheetFees) {
    return { error: "Sheets not found (STUDENT DATA or FEES missing)." };
  }

  var dataStudents = sheetStudents.getDataRange().getValues();
  var dataFees = sheetFees.getDataRange().getValues();

  var studentMap = {};
  for (var i = 1; i < dataStudents.length; i++) {
    var sId = String(dataStudents[i][0] || "").trim();
    var sName = String(dataStudents[i][2] || "").trim();
    var sFather = String(dataStudents[i][3] || "").trim();
    var sClass = String(dataStudents[i][6] || "").trim();
    var sTotal = parseFloat(dataStudents[i][7]) || 0;
    studentMap[sId] = {
      studentName: sName,
      fatherName: sFather,
      className: sClass,
      totalFees: sTotal,
      sumPaid: 0,
    };
  }

  for (var j = 1; j < dataFees.length; j++) {
    var feeId = String(dataFees[j][0] || "").trim();
    var paidAmount = parseFloat(dataFees[j][8]) || 0;
    if (studentMap[feeId]) {
      studentMap[feeId].sumPaid += paidAmount;
    }
  }

  var results = [];
  var totalOverallFees = 0;
  var totalOverallPaid = 0;
  var fullyPaidCount = 0;
  for (var sid in studentMap) {
    var st = studentMap[sid];
    var due = st.totalFees - st.sumPaid;
    results.push({
      studentId: sid,
      studentName: st.studentName,
      fatherName: st.fatherName,
      className: st.className,
      totalFees: st.totalFees,
      sumPaid: st.sumPaid,
      dueFees: due,
    });
    totalOverallFees += st.totalFees;
    totalOverallPaid += st.sumPaid;
    if (due <= 0) {
      fullyPaidCount++;
    }
  }
  var totalDue = totalOverallFees - totalOverallPaid;

  return {
    data: results,
    summary: {
      totalFees: totalOverallFees,
      totalPaid: totalOverallPaid,
      totalDue: totalDue,
      fullyPaidCount: fullyPaidCount,
      totalStudents: Object.keys(studentMap).length,
    },
  };
}



function createAuditLogEntry(action, userId, additionalDetails = {}) {
  const auditLogSheet = ss.getSheetByName(CONFIG.AUDIT_LOG_SHEET_NAME);
  if (!auditLogSheet) {
    console.error("AuditLog sheet not found.");
    return;
  }

  const timestamp = new Date();
  const logId = `LOG-${timestamp.getTime()}-${Math.floor(Math.random() * 10000)}`;
  const detailsString = JSON.stringify(additionalDetails);
  const logRowData = [logId, userId || "Anonymous", action, timestamp, detailsString];

  try {
    auditLogSheet.appendRow(logRowData);
    console.log(`Log: ${logId}, User: ${userId}, Action: ${action}`);
  } catch (e) {
    console.error("Error appending to AuditLog:", e);
  }
}
function serverSideLogout() {
  const loggedInUser = PropertiesService.getUserProperties().getProperty("loggedInUser");
  if (loggedInUser) {
    createAuditLogEntry("Logout", loggedInUser); // <-- This creates the "Logout" entry!
    PropertiesService.getUserProperties().deleteProperty("loggedInUser");
  } else {
    createAuditLogEntry("Logout Attempt (No User)", "Anonymous"); // Optional: log if someone tries to logout when not logged in
  }
  return { success: true }; // Always return a success response to the client
}

/************************************************
 * RECEIPT NUMBER AUTO-GENERATION
 ************************************************/

/**
 * Finds the highest numeric part of a receipt number (e.g., 23 from 'AR-0023')
 * in a specified sheet. It checks the entire column to find the true maximum.
 * @param {string} sheetName The name of the sheet to check.
 * @returns {number} The highest receipt number found, or 0 if none are found.
 */
function findLastReceiptInSheet(sheetName) {
  const receiptColumn = 2; // This corresponds to Column B
  try {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      console.log(`Sheet "${sheetName}" not found. Skipping.`);
      return 0; // If sheet doesn't exist, it has no receipts.
    }

    const lastRow = sheet.getLastRow();
    if (lastRow < 1) {
      return 0; // If sheet is empty, it has no receipts.
    }

    // Get all values in the receipt column to find the last valid entry.
    const columnValues = sheet.getRange(1, receiptColumn, lastRow).getValues();
    let lastNumericPart = 0;

    // Loop through all values to find valid receipt numbers and get the maximum.
    for (let i = 0; i < columnValues.length; i++) {
      const cellValue = columnValues[i][0];
      if (cellValue && typeof cellValue === 'string' && cellValue.startsWith('AR-')) {
        const numericPart = parseInt(cellValue.substring(3), 10);
        if (!isNaN(numericPart) && numericPart > lastNumericPart) {
          lastNumericPart = numericPart;
        }
      }
    }
    return lastNumericPart;

  } catch (e) {
    console.error(`Error processing sheet "${sheetName}": ${e.message}`);
    return 0; // Return 0 in case of an error.
  }
}

/**
 * Gets the next sequential receipt number by checking both 'ADMISSIONF' and 'Inquiries' sheets.
 * This is the function called by the client-side JavaScript.
 * @returns {string} The new formatted receipt number (e.g., "AR-0025").
 */
function getNextReceiptNumber() {
  try {
    // Find the last receipt number from both sheets.
    const lastNumAdmissions = findLastReceiptInSheet(CONFIG.ADMISSIONS_SHEET_NAME);
    const lastNumDf = findLastReceiptInSheet(CONFIG.INQUIRY_SHEET_NAME);

    console.log(`Last number in 'Admissions' sheet: ${lastNumAdmissions}`);
    console.log(`Last number in 'Inquiry' sheet: ${lastNumDf}`);

    // Determine the highest number between the two sheets.
    const latestNum = Math.max(lastNumAdmissions, lastNumDf);
    console.log(`Highest number found across all sheets: ${latestNum}`);

    // Increment to get the new number.
    const newNumericPart = latestNum + 1;

    // Format the new receipt number with four digits (e.g., AR-0001, AR-0024, AR-0155).
    const newReceiptNumber = "AR-" + ("000" + newNumericPart).slice(-4);

    return newReceiptNumber;

  } catch (e) {
    console.error(`A critical error occurred in getNextReceiptNumber: ${e.message}`);
    // Fallback in case of any unexpected error.
    return "AR-0001";
  }
}

/************************************************
 * FEE STRUCT ANALYTICS
 ************************************************/
function getCourseList() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("FeeStructure");
  const data = sheet.getRange(2, 3, sheet.getLastRow() - 1, 1).getValues(); // Column C
  const courses = [...new Set(data.flat())].filter(String);
  return courses;
}

function getFeeStructureData(userRole) {
  if (!userRole || userRole.toLowerCase() !== "admin") {
    return { error: "You don't have permission to view Fee Structure." };
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("FeeStructure");

  // If sheet doesn't exist, create it with headers
  if (!sheet) {
    const newSheet = ss.insertSheet("FeeStructure");
    newSheet.appendRow(["ID", "Name", "Enrollment ID", "Course", "Duration", "Pay Fees", "Total Fees", "Payment Mode", "Timestamp", "User ID"]);

    return {
      data: [],
      summary: {
        totalRecords: 0,
        totalFees: 0,
        averageFees: 0,
        mostCommonPaymentMode: "",
      },
    };
  }

  const data = sheet.getDataRange().getValues();
  const results = [];
  let totalOverallFees = 0;
  const paymentModeCounts = {};

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const id = String(row[0] || "").trim();
    const name = String(row[1] || "").trim();
    const enrollmentId = String(row[2] || "").trim();
    const course = String(row[3] || "").trim();
    const duration = String(row[4] || "").trim();
    const payFees = parseFloat(String(row[5]).replace(/[^\d.-]/g, "")) || 0;
    const totalFees = parseFloat(String(row[6]).replace(/[^\d.-]/g, "")) || 0;
    const payMode = String(row[7] || "").trim();

    results.push({
      id: id,
      name: name,
      enrollmentId: enrollmentId,
      course: course,
      duration: duration,
      payFees: payFees,
      totalFees: totalFees,
      payMode: payMode,
    });

    totalOverallFees += totalFees;

    if (payMode) {
      if (!paymentModeCounts[payMode]) paymentModeCounts[payMode] = 0;
      paymentModeCounts[payMode]++;
    }
  }

  const avgFee = results.length > 0 ? totalOverallFees / results.length : 0;

  let commonMode = "";
  let maxCount = 0;
  for (const mode in paymentModeCounts) {
    if (paymentModeCounts[mode] > maxCount) {
      maxCount = paymentModeCounts[mode];
      commonMode = mode;
    }
  }

  return {
    data: results,
    summary: {
      totalRecords: results.length,
      totalFees: totalOverallFees,
      averageFees: avgFee,
      mostCommonPaymentMode: commonMode,
    },
  };
}



/************************************************
 * ADMISSION STRUCT ANALYTICS
 ************************************************/
function getCourseListFromAdmissions() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("ADMISSIONF");
  const data = sheet.getRange(2, 6, sheet.getLastRow() - 1, 1).getValues(); // Column F
  return [...new Set(data.flat())].filter(String);
}



function getAdmissionAnalyticsData(userRole) {
  if (!userRole || userRole.toLowerCase() !== "admin") {
    return { error: "You don't have permission to view Admission Analytics." };
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("ADMISSIONF");
  if (!sheet) return { error: "ADMISSIONF sheet not found." };

  const data = sheet.getDataRange().getValues();
  if (data.length === 0) return { error: "No data in ADMISSIONF sheet." };

  const headers = data[0];
  let results = [];
  let totalFees = 0;
  let courseCounts = {};

  // Find column indices
  const dateIdx = headers.indexOf("Date") !== -1 ? headers.indexOf("Date") :
                  headers.indexOf("Admission Date") !== -1 ? headers.indexOf("Admission Date") :
                  headers.indexOf("Timestamp") !== -1 ? headers.indexOf("Timestamp") : -1;
  const receiptNumberIdx = headers.indexOf("Receipt Number");
  const enrollmentIdIdx = headers.indexOf("Enrollment ID");
  const firstNameIdx = headers.indexOf("First Name");
  const middleNameIdx = headers.indexOf("Middle Name");
  const lastNameIdx = headers.indexOf("Last Name");
  const courseNameIdx = headers.indexOf("Course Name");
  const courseDurationIdx = headers.indexOf("Course Duration");
  const totalCourseFeesIdx = headers.indexOf("Total Course Fees");
  const guardianRelationIdx = headers.indexOf("Guardian Relation");
  const guardianNameIdx = headers.indexOf("Guardian Name");
  const agreementIdx = headers.indexOf("Agreement");
  const userIdx = headers.indexOf("User");

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const receiptNumber = row[receiptNumberIdx] || "";
    const enrollmentId = row[enrollmentIdIdx] || "";
    const firstName = row[firstNameIdx] || "";
    const middleName = row[middleNameIdx] || "";
    const lastName = row[lastNameIdx] || "";
    const courseName = row[courseNameIdx] || "";
    const courseDuration = row[courseDurationIdx] || "";
    const totalCourseFees = parseFloat(String(row[totalCourseFeesIdx]).replace(/[^\d.-]/g, "")) || 0;
    const guardianRelation = row[guardianRelationIdx] || "";
    const guardianName = row[guardianNameIdx] || "";
    const agreement = row[agreementIdx] || "";
    const user = row[userIdx] || "";

    // Format date if available
    let formattedDate = "";
    if (dateIdx !== -1 && row[dateIdx]) {
      if (row[dateIdx] instanceof Date) {
        formattedDate = Utilities.formatDate(row[dateIdx], Session.getScriptTimeZone(), "yyyy-MM-dd");
      } else {
        formattedDate = row[dateIdx].toString();
      }
    }

    results.push({
      date: formattedDate,
      receiptNumber: receiptNumber,
      enrollmentId: enrollmentId,
      firstName: firstName,
      middleName: middleName,
      lastName: lastName,
      courseName: courseName,
      courseDuration: courseDuration,
      totalCourseFees: totalCourseFees,
      guardianRelation: guardianRelation,
      guardianName: guardianName,
      agreement: agreement,
      user: user
    });

    totalFees += totalCourseFees;
    if (courseName) {
      courseCounts[courseName] = (courseCounts[courseName] || 0) + 1;
    }
  }

  let topCourse = "";
  if (Object.keys(courseCounts).length > 0) {
    topCourse = Object.keys(courseCounts).reduce((a, b) => courseCounts[a] > courseCounts[b] ? a : b);
  }

  return {
    data: results,
    summary: {
      totalRecords: results.length,
      totalFees: totalFees,
      averageFees: results.length > 0 ? totalFees / results.length : 0,
      topCourse: topCourse
    }
  };
}

/************************************************
 * INQUIRY STRUCT ANALYTICS
 ************************************************/
/**
 * Gets course list from inquiry sheet (Inquiries)
 */
function getInquiryAnalyticsData(userRole) {
  try {
    // Check if user has permission
    if (!userRole || userRole.toLowerCase() !== "admin") {
      return { error: "You don't have permission to view Inquiry Analytics." };
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("Inquiries");
    
    if (!sheet) {
      return { error: "Inquiries sheet not found." };
    }

    const data = sheet.getDataRange().getValues();
    
    // Check if there's any data beyond headers
    if (data.length <= 1) {
      return {
        data: [],
        summary: {
          totalRecords: 0,
          uniqueCourses: 0,
          topCourse: "-"
        }
      };
    }

    // Define column indices based on your spreadsheet structure
    const COL_INDICES = {
      DATE: 1,           // Column B (assuming 0-based index)
      AADHAAR: 2,        // Column C
      FULL_NAME: 3,      // Column D
      QUALIFICATION: 4,  // Column E
      PHONE: 5,          // Column F
      WHATSAPP: 6,       // Column G
      PARENTS_NUMBER: 7, // Column H
      EMAIL: 8,          // Column I
      AGE: 9,            // Column J
      ADDRESS: 10,       // Column K
      INTERESTED_COURSE: 11, // Column L (if this exists)
      INQUIRY_BY: 12,    // Column M (if this exists)
      BRANCH: 13,        // Column N (if this exists)
      GENDER: 14         // Column O (if this exists)
    };

    let results = [];
    let courseCounts = {};

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      // Skip empty rows (check if essential fields are empty)
      if (!row[COL_INDICES.FULL_NAME] && !row[COL_INDICES.AADHAAR]) continue;
      
      // Format date properly
      let formattedDate = "";
      if (row[COL_INDICES.DATE]) {
        if (row[COL_INDICES.DATE] instanceof Date) {
          formattedDate = Utilities.formatDate(row[COL_INDICES.DATE], Session.getScriptTimeZone(), "yyyy-MM-dd");
        } else {
          // Handle string dates
          formattedDate = row[COL_INDICES.DATE].toString().split(' ')[0]; // Get only date part
        }
      }

      results.push({
        date: formattedDate,
        aadhaar: row[COL_INDICES.AADHAAR] || "",
        fullName: row[COL_INDICES.FULL_NAME] || "",
        qualification: row[COL_INDICES.QUALIFICATION] || "",
        phone: row[COL_INDICES.PHONE] || "",
        whatsapp: row[COL_INDICES.WHATSAPP] || "",
        parentsNumber: row[COL_INDICES.PARENTS_NUMBER] || "",
        email: row[COL_INDICES.EMAIL] || "",
        age: row[COL_INDICES.AGE] || "",
        address: row[COL_INDICES.ADDRESS] || "",
        interestedCourse: row[COL_INDICES.INTERESTED_COURSE] || "",
        inquiryTakenBy: row[COL_INDICES.INQUIRY_BY] || "",
        branch: row[COL_INDICES.BRANCH] || "",
        gender: row[COL_INDICES.GENDER] || ""
      });

      // Count courses
      const course = row[COL_INDICES.INTERESTED_COURSE];
      if (course) {
        courseCounts[course] = (courseCounts[course] || 0) + 1;
      }
    }

    // Find top course
    let topCourse = "-";
    if (Object.keys(courseCounts).length > 0) {
      topCourse = Object.keys(courseCounts).reduce((a, b) => 
        courseCounts[a] > courseCounts[b] ? a : b
      );
    }

    return {
      data: results,
      summary: {
        totalRecords: results.length,
        uniqueCourses: Object.keys(courseCounts).length,
        topCourse: topCourse
      }
    };
  } catch (error) {
    Logger.log("Error in getInquiryAnalyticsData: " + error.toString());
    return { error: "Error processing data: " + error.toString() };
  }
}

function getCourseListFromInquiries() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Inquiries");
    if (!sheet) return ["Error: Inquiries sheet not found"];
    
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) return ["No data found"];
    
    // Column L (12) - Interested Course (assuming it's column L based on your structure)
    const data = sheet.getRange(2, 12, lastRow - 1, 1).getValues();
    return [...new Set(data.flat())].filter(String);
  } catch (error) {
    return ["Error: " + error.toString()];
  }
}
/************************************************
 * COURSE PAYMENT
 ************************************************/
// function saveCoursePayment(data) {
//   const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("FeeStructure");

//   sheet.appendRow([
//     data.ID,
//     data.Coursepayname,
//     data.coursePaySelect,
//     data.courseDuration,
//     data.coursePayFees,
//     data.totalFees,
//     data.paySelect
//   ]);
// }



// // function saveExamReceipt(data) {
// //   const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("EXAMRECEIPT");

// //   if (!sheet) {
// //     throw new Error("Sheet 'EXAMRECEIPT' not found.");
// //   }

// //   sheet.appendRow([
// //     data.receiptDate1,
// //     data.receiptNumber1,
// //     data.studentName1,
// //     data.courseName1,
// //     parseFloat(data.totalAmount),
// //     data.paymentMode1,
// //     data.receivedBy,
// //     data.branch,
// //     data.agreeTerms ? "Agreed" : "Not Agreed"
// //   ]);
// // }

// function saveReceiptData(data) {
//   const ss = SpreadsheetApp.getActiveSpreadsheet();
//   const sheet = ss.getSheetByName("EXAMRECEIPT");

//   if (!sheet) {
//     throw new Error('Sheet "EXAMRECEIPT" not found!');
//   }

//   sheet.appendRow([
//     data.receiptDate,
//     data.receiptNumber,
//     data.studentName,
//     data.courseName,
//     parseFloat(data.totalAmount),
//     data.paymentMode,
//     // data.receivedBy,
//     // data.branch,
//     data.agreeTerms
//   ]);
// }


/**
 * Saves course payment data to FeeStructure sheet with audit logging
 * @param {Object} data Payment data object
 * @returns {Object} Operation result
 */
function saveCoursePayment(data) {
   const userIdForAudit = data.loggedInUserId ||
                       PropertiesService.getUserProperties().getProperty("loggedInUser") ||
                       "Anonymous";

  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("FeeStructure");
    
    if (!sheet) {
      createAuditLogEntry("Sheet Not Found Error", userIdForAudit, {
        error: "Sheet 'FeeStructure' not found",
        paymentDataSummary: {
          studentId: data.ID,
          courseName: data.coursePaySelect
        }
      });
      throw new Error('Sheet "FeeStructure" not found!');
    }

    // Validate required fields
    const requiredFields = ["ID", "Coursepayname", "coursePaySelect", "coursePayFees"];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      createAuditLogEntry("Payment Validation Failed", userIdForAudit, {
        reason: `Missing required fields: ${missingFields.join(", ")}`,
        paymentDataSummary: {
          studentId: data.ID,
          courseName: data.coursePaySelect
        }
      });
      return {
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`
      };
    }

    // Save payment data
    sheet.appendRow([
      data.ID,
      data.Coursepayname,
      data.enrollmentId,
      data.coursePaySelect,
      data.courseDuration,
      data.coursePayFees,
      data.totalFees,
      data.paySelect,
      new Date(), // Timestamp
      userIdForAudit // Added user who recorded the payment
    ]);
    
    const lastRow = sheet.getLastRow();
    
    // Log successful payment
    createAuditLogEntry("Course Payment Recorded", userIdForAudit, {
      studentId: data.ID,
      studentName: data.Coursepayname,
      course: data.coursePaySelect,
      fees: data.coursePayFees,
      totalFees: data.totalFees,
      paymentType: data.paySelect,
      row: lastRow
    });
    
    return {
      success: true,
      message: "Payment data saved successfully",
      row: lastRow
    };
    
  } catch (error) {
    console.error("Error in saveCoursePayment:", error);
    
    createAuditLogEntry("Payment Processing Error", userIdForAudit, {
      error: error.message,
      paymentDataSummary: {
        studentId: data.ID,
        courseName: data.coursePaySelect
      }
    });
    
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Saves receipt data to EXAMRECEIPT sheet with audit logging
 * @param {Object} data Receipt data object
 * @returns {Object} Operation result
 */
function saveReceiptData(data) {
   const userIdForAudit = data.loggedInUserId ||
                       PropertiesService.getUserProperties().getProperty("loggedInUser") ||
                       "Anonymous";
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("EXAMRECEIPT");

    if (!sheet) {
      createAuditLogEntry("Sheet Not Found Error", userIdForAudit, {
        error: "Sheet 'EXAMRECEIPT' not found",
        receiptDataSummary: {
          receiptNumber: data.receiptNumber,
          studentName: data.studentName
        }
      });
      throw new Error('Sheet "EXAMRECEIPT" not found!');
    }

    // Validate required fields
    const requiredFields = ["receiptNumber", "studentName", "courseName", "totalAmount"];
    const missingFields = requiredFields.filter(field => !data[field]);

    if (missingFields.length > 0) {
      createAuditLogEntry("Receipt Validation Failed", userIdForAudit, {
        reason: `Missing required fields: ${missingFields.join(", ")}`,
        receiptDataSummary: {
          receiptNumber: data.receiptNumber,
          studentName: data.studentName
        }
      });
      return {
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`
      };
    }

    // Parse amount to ensure it's numeric
    const amount = parseFloat(data.totalAmount);
    if (isNaN(amount)) {
      createAuditLogEntry("Receipt Amount Error", userIdForAudit, {
        error: "Invalid amount format",
        receiptDataSummary: {
          receiptNumber: data.receiptNumber,
          amountEntered: data.totalAmount
        }
      });
      return {
        success: false,
        message: "Invalid amount format"
      };
    }

    // Save receipt data
    sheet.appendRow([
      data.receiptDate || new Date(),
      data.receiptNumber,
      data.studentName,
      data.courseName,
      amount,
      data.paymentMode,
      data.agreeTerms === 'on' ? 'Agreed' : 'Not Agreed',
      new Date(), // Timestamp of record creation
      userIdForAudit // Added user who created the receipt
    ]);

    const lastRow = sheet.getLastRow();

    // Log successful receipt creation
    createAuditLogEntry("Receipt Generated", userIdForAudit, {
      receiptNumber: data.receiptNumber,
      studentName: data.studentName,
      courseName: data.courseName,
      amount: amount,
      paymentMode: data.paymentMode,
      row: lastRow
    });

    return {
      success: true,
      message: "Receipt data saved successfully",
      row: lastRow,
      receiptNumber: data.receiptNumber
    };

  } catch (error) {
    console.error("Error in saveReceiptData:", error);

    createAuditLogEntry("Receipt Processing Error", userIdForAudit, {
      error: error.message,
      receiptDataSummary: {
        receiptNumber: data.receiptNumber,
        studentName: data.studentName
      }
    });

    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Saves complete admission receipt data to AdmissionReceipts sheet
 * @param {Object} data Complete workflow data
 * @returns {Object} Operation result
 */
function getInstallmentPaymentsForStudent(receiptNo) {
  console.log("=== getInstallmentPaymentsForStudent START ===");
  console.log("Input receiptNo:", receiptNo);

  try {
    // Get spreadsheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    console.log("Spreadsheet name:", ss.getName());

    // Get or create sheet
    let sheet = ss.getSheetByName("InstallmentPayments");
    if (!sheet) {
      console.log("Creating InstallmentPayments sheet");
      sheet = ss.insertSheet("InstallmentPayments");
      sheet.appendRow([
        "Timestamp",
        "Receipt_No",
        "Student_Name",
        "Enrollment_ID",
        "Course_Name",
        "Installment_Number",
        "Installment_Amount",
        "Payment_Method",
        "Payment_Date",
        "Logged_In_User"
      ]);
    }

    const data = sheet.getDataRange().getValues();
    console.log("Sheet has", data.length, "rows of data");

    const payments = [];
    const searchReceipt = String(receiptNo || "").trim();
    console.log("Searching for receipt:", searchReceipt);

    // Process each row
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const rowReceipt = String(row[1] || "").trim();

      if (rowReceipt === searchReceipt) {
        const payment = {
          timestamp: row[0],
          receiptNo: rowReceipt,
          studentName: String(row[2] || ""),
          enrollmentId: String(row[3] || ""),
          courseName: String(row[4] || ""),
          installmentNumber: parseInt(row[5]) || 0,
          installmentAmount: parseFloat(row[6]) || 0,
          paymentMethod: String(row[7] || ""),
          paymentDate: row[8],
          loggedInUser: String(row[9] || "")
        };
        payments.push(payment);
        console.log("Found payment:", payment);
      }
    }

    console.log("Total payments found:", payments.length);
    console.log("=== getInstallmentPaymentsForStudent END ===");

    return payments;

  } catch (error) {
    console.error("CRITICAL ERROR in getInstallmentPaymentsForStudent:", error);
    console.error("Error details:", error.message);
    console.error("Stack trace:", error.stack);

    // Return empty array on error
    return [];
  }
}

function saveInstallmentPayment(data) {
  const userIdForAudit = PropertiesService.getUserProperties().getProperty("loggedInUser") ||
                       data.loggedInUser ||
                       "Anonymous";

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Create "InstallmentPayments" sheet if it doesn't exist
    let sheet = ss.getSheetByName("InstallmentPayments");
    if (!sheet) {
      sheet = ss.insertSheet("InstallmentPayments");

      // Add headers
      sheet.appendRow([
        "Timestamp",
        "Receipt_No",
        "Student_Name",
        "Enrollment_ID",
        "Course_Name",
        "Installment_Number",
        "Installment_Amount",
        "Payment_Method",
        "Payment_Date",
        "Logged_In_User"
      ]);
    }

    // Check if this installment is already paid for this student
    const existingPayments = getInstallmentPaymentsForStudent(data.receiptNo);
    console.log("Save attempt - ReceiptNo:", data.receiptNo, "Installment:", data.installmentNumber, "Student:", data.studentName);
    console.log("Existing payments for this receipt:", existingPayments);
    const alreadyPaid = existingPayments.some(payment =>
      payment.installmentNumber === parseInt(data.installmentNumber) &&
      payment.studentName === data.studentName
    );

    if (alreadyPaid) {
      return {
        success: false,
        message: "This installment has already been paid"
      };
    }

    // Save installment payment data
    sheet.appendRow([
      new Date(),
      data.receiptNo,
      data.studentName,
      data.enrollmentId,
      data.courseName,
      data.installmentNumber,
      data.installmentAmount,
      data.paymentMethod,
      data.paymentDate,
      userIdForAudit
    ]);

    const lastRow = sheet.getLastRow();

    // Log successful installment payment
    createAuditLogEntry("Installment Payment Recorded", userIdForAudit, {
      receiptNo: data.receiptNo,
      studentName: data.studentName,
      courseName: data.courseName,
      installmentNumber: data.installmentNumber,
      amount: data.installmentAmount,
      row: lastRow
    });

    return {
      success: true,
      message: "Installment payment saved successfully",
      row: lastRow
    };

  } catch (error) {
    console.error("Error in saveInstallmentPayment:", error);

    createAuditLogEntry("Installment Payment Save Error", userIdForAudit, {
      error: error.message,
      receiptNo: data.receiptNo,
      studentName: data.studentName
    });

    return {
      success: false,
      message: error.message
    };
  }
}

function saveAdmissionReceipt(data) {
  const userIdForAudit = PropertiesService.getUserProperties().getProperty("loggedInUser") || "Anonymous";

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // 🔥 CRITICAL: Create "AdmissionReceipts" sheet if it doesn't exist
    let sheet = ss.getSheetByName("AdmissionReceipts");
    if (!sheet) {
      sheet = ss.insertSheet("AdmissionReceipts");

      // Add headers for complete workflow data
      sheet.appendRow([
        "Timestamp",
        "Receipt_Number",
        "Student_Name",
        "Course_Name",
        "Total_Amount",
        "Paid_Amount",
        "Balance",
        "Consent_Text",
        "Guardian_Relation",
        "Guardian_Name",
        "Agree_Status",
        "Full_Name_From_Inquiry",
        "Address",
        "Phone_No",
        "WhatsApp_No",
        "Parents_No",
        "Email",
        "Age",
        "Gender",
        "Qualification",
        "Inquiry_Taken_By",
        "Branch",
        "Logged_In_User"
      ]);
    }

    // Calculate balance
    const totalAmount = isNaN(data.totalAmount) ? parseFloat(data.totalAmount || 0) : data.totalAmount;
    const paidAmount = isNaN(data.paidAmount) ? parseFloat(data.paidAmount || 0) : data.paidAmount;
    const balance = totalAmount - paidAmount;

    // Combine name from admission data or inquiry
    const fullName = data.studentName ||
                    `${data.inquiryData?.firstName || ''} ${data.inquiryData?.middleName || ''} ${data.inquiryData?.lastName || ''}`.trim() ||
                    data.admissionData?.studentName ||
                    "N/A";

    // Append complete workflow data
    sheet.appendRow([
      new Date(), // Timestamp
      data.receiptNumber || "N/A",
      fullName,
      data.courseName || data.admissionData?.courseSelect || "N/A",
      totalAmount,
      paidAmount,
      balance,
      data.consentText || "I am the guardian of the student",
      data.admissionData?.guardianRelation || "N/A",
      data.admissionData?.guardianName || "N/A",
      data.agree ? "Agreed" : "Not Agreed",
      `${data.inquiryData?.firstName || ''} ${data.inquiryData?.middleName || ''} ${data.inquiryData?.lastName || ''}`.trim() || "N/A",
      data.admissionData?.addressLine1 ? `${data.admissionData.addressLine1}${data.admissionData.addressLine2 ? ', ' + data.admissionData.addressLine2 : ''}${data.admissionData.addressLine3 ? ', ' + data.admissionData.addressLine3 : ''}${data.admissionData.pincode ? ', Pincode: ' + data.admissionData.pincode : ''}` : "N/A",
      data.admissionData?.phoneNo || data.inquiryData?.phoneNo || "N/A",
      data.admissionData?.whatsappNo || data.inquiryData?.whatsappNo || "N/A",
      data.admissionData?.parentsNo || data.inquiryData?.parentsNo || "N/A",
      data.admissionData?.email || data.inquiryData?.email || "N/A",
      data.admissionData?.age || data.inquiryData?.age || "N/A",
      data.admissionData?.gender || data.inquiryData?.gender || "N/A",
      data.admissionData?.qualification || data.inquiryData?.qualification || "N/A",
      data.inquiryData?.inquiryTakenBy || "N/A",
      data.admissionData?.branch || data.inquiryData?.branch || "N/A",
      userIdForAudit
    ]);

    const lastRow = sheet.getLastRow();

    // Log successful complete workflow save
    createAuditLogEntry("Complete Admission Receipt Saved", userIdForAudit, {
      receiptNumber: data.receiptNumber,
      studentName: fullName,
      course: data.courseName,
      totalAmount: totalAmount,
      paidAmount: paidAmount,
      balance: balance,
      row: lastRow
    });

    console.log(`AdmissionReceipt saved successfully at row ${lastRow}`);
    return {
      success: true,
      message: "Complete admission receipt saved successfully",
      row: lastRow,
      receiptNumber: data.receiptNumber
    };

  } catch (error) {
    console.error("Error in saveAdmissionReceipt:", error);

    createAuditLogEntry("Admission Receipt Save Error", userIdForAudit, {
      error: error.message,
      dataSummary: {
        receiptNumber: data.receiptNumber,
        studentName: data.studentName || data.admissionData?.studentName || "N/A"
      }
    });

    return {
      success: false,
      message: `Failed to save complete admission receipt: ${error.message}`
    };
  }
}

/**
 * Saves installment data to InstallmentPayments sheet when receipt is generated
 * @param {Object} data Receipt data for generating installments
 * @returns {Object} Operation result
 */
function saveInstallmentDataOnReceiptGeneration(data) {
  const userIdForAudit = PropertiesService.getUserProperties().getProperty("loggedInUser") || "Anonymous";

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Get or create "InstallmentPayments" sheet
    let sheet = ss.getSheetByName(CONFIG.INSTALLMENT_PAYMENTS_SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(CONFIG.INSTALLMENT_PAYMENTS_SHEET_NAME);

      // Add headers matching the column indices
      sheet.appendRow([
        "Timestamp",
        "Enrollment_ID",
        "Student_Name",
        "Course_Name",
        "Payement_Option",
        "Total_Fees_Due",
        "Installment_Number",
        "Amount_Paid",
        "Payment_Method",
        "Payment_Date",
        "Logged_In_User"
      ]);
    }

    // Get installment details from the receipt data
    const enrollmentId = data.enrollmentNo || "";
    const studentName = data.studentName || "";
    const courseName = data.courseName || "";
    const paymentOption = data.paymentType || "full";
    const totalFeesDue = parseFloat(data.totalFee) || 0;
    const installmentCount = parseInt(data.installmentCount) || 1;
    const paymentMethod = data.paymentMethod || "Cash";
    const paymentDate = new Date().toISOString().split('T')[0]; // Today's date

    // Check if installment data already exists for this enrollment ID
    const existingData = sheet.getDataRange().getValues();
    const hasExistingData = existingData.some(row =>
      row[CONFIG.INSTALLMENT_PAYMENTS_LOOKUP.ENROLLMENT_ID_COL] === enrollmentId &&
      row[CONFIG.INSTALLMENT_PAYMENTS_LOOKUP.STUDENT_NAME_COL] === studentName
    );

    if (hasExistingData) {
      // Data already exists, don't create duplicates
      createAuditLogEntry("Installment Data Skipped - Already Exists", userIdForAudit, {
        enrollmentId: enrollmentId,
        studentName: studentName,
        reason: "Installment data already exists for this enrollment"
      });

      return {
        success: true,
        message: "Installment data already exists, skipping creation",
        rows: []
      };
    }

    // Always create a single entry per receipt generation
    const installmentAmount = installmentCount > 1 ? Math.round(totalFeesDue / installmentCount) : totalFeesDue;

    sheet.appendRow([
      new Date(), // Timestamp
      enrollmentId,
      studentName,
      courseName,
      paymentOption,
      totalFeesDue,
      installmentCount, // Installment_Number (count for installments, 1 for full)
      installmentAmount, // Amount_Paid (installment amount or full amount)
      paymentMethod,
      paymentDate,
      userIdForAudit
    ]);

    const lastRow = sheet.getLastRow();

    // Log successful installment data save
    createAuditLogEntry("Installment Data Saved on Receipt Generation", userIdForAudit, {
      enrollmentId: enrollmentId,
      studentName: studentName,
      courseName: courseName,
      paymentOption: paymentOption,
      totalFeesDue: totalFeesDue,
      installmentCount: installmentCount,
      installmentAmount: installmentAmount,
      row: lastRow
    });

    return {
      success: true,
      message: `Installment data saved successfully`,
      rows: [lastRow]
    };

  } catch (error) {
    console.error("Error in saveInstallmentDataOnReceiptGeneration:", error);

    createAuditLogEntry("Installment Data Save Error on Receipt Generation", userIdForAudit, {
      error: error.message,
      dataSummary: {
        enrollmentId: data.enrollmentNo,
        studentName: data.studentName
      }
    });

    return {
      success: false,
      message: `Failed to save installment data: ${error.message}`
    };
  }
}
