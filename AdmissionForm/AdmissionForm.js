/**
 * Admission form processing functions
 * All hardcoded IDs moved to CONFIG.js
 */


const SHEET_NAME = CONFIG.ADMISSIONS_SHEET_NAME;

/**
 * Saves admission form data to the active spreadsheet sheet and creates audit log entries
 * @param {Object} formData The form data submitted from the HTML client
 * @returns {Object} A success or error response object
 */
function saveToSheet(formData) {
  // Get user ID from (in order of priority):
  // 1. Form data (passed from client)
  // 2. User properties (from login)
  // 3. Fallback to "Anonymous"
  const userIdForAudit = formData.loggedInUserId ||
                       PropertiesService.getUserProperties().getProperty("loggedInUser") ||
                       "Anonymous";

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      createAuditLogEntry("Sheet Not Found Error", userIdForAudit, {
        error: `Sheet '${SHEET_NAME}' not found`,
        formDataSummary: {
          receiptNumber: formData.receipt_number,
          studentName: `${formData.first_name} ${formData.last_name}`
        }
      });
      throw new Error(`Sheet '${SHEET_NAME}' not found`);
    }

    // Validate required fields
    const requiredFields = [
      "receipt_number", "first_name", "last_name", 
      "courseSelect", "totalCourseFees", "guardian_name"
    ];
    
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      createAuditLogEntry("Form Validation Failed", userIdForAudit, {
        reason: `Missing required fields: ${missingFields.join(", ")}`,
        formDataSummary: {
          receiptNumber: formData.receipt_number,
          studentName: `${formData.first_name} ${formData.last_name}`
        }
      });
      return {
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`
      };
    }

    // Prepare full name for logging
    const fullName = [
      formData.first_name,
      formData.middle_name,
      formData.last_name
    ].filter(Boolean).join(" ");

    // Prepare data in sheet column order
    const rowData = [
      new Date(), // Timestamp
      formData.receipt_number || "",
      formData.first_name || "",
      formData.middle_name || "",
      formData.last_name || "",
      formData.courseSelect || "",
      formData.courseDurationText || "",
      formData.totalCourseFees || "",
      formData.guardian_relation || "",
      formData.guardian_name || "",
      formData.agree === 'on' ? 'Agreed' : 'Not Agreed',
      userIdForAudit // Added logged in user ID for tracking
    ];

    // Save to sheet
    sheet.appendRow(rowData);
    const lastRow = sheet.getLastRow();
    
    // Log successful submission
    createAuditLogEntry("Admission Form Submission", userIdForAudit, {
      receiptNumber: formData.receipt_number,
      studentName: fullName,
      course: formData.courseSelect,
      fees: formData.totalCourseFees,
      row: lastRow
    });
    
    return {
      success: true,
      message: "Data saved successfully",
      row: lastRow,
      studentName: fullName
    };
    
  } catch (error) {
    console.error("Error in saveToSheet:", error);
    
    // Log error
    createAuditLogEntry("Admission Form Error", userIdForAudit, {
      error: error.message,
      formDataSummary: {
        receiptNumber: formData.receipt_number,
        studentName: `${formData.first_name} ${formData.last_name}`
      }
    });
    
    return {
      success: false,
      message: error.message
    };
  }
}
