/**
 * Admission form processing functions
 * All hardcoded IDs moved to CONFIG.js
 */

// Local CONFIG object for AdmissionForm.js
const CONFIG_ADMISSION = {
  ADMISSIONS_SHEET_NAME: 'ADMISSIONF',
  AUDIT_LOG_SHEET_NAME: 'AuditLog'
};

const SHEET_NAME = CONFIG_ADMISSION.ADMISSIONS_SHEET_NAME;

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

    // Generate enrollment ID
    const enrollmentId = getNextEnrollmentNumber();

    // Prepare data in sheet column order
    const rowData = [
      new Date(), // Timestamp
      formData.receipt_number || "",
      enrollmentId, // Enrollment ID
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

    // Save enrollment data to Enrollments sheet
    try {
      const enrollmentResponse = saveEnrollment({
        enrollmentID: enrollmentId,
        studentName: fullName,
        course: formData.courseSelect
      });
      if (!enrollmentResponse.success) {
        console.warn("Warning: Failed to save enrollment data:", enrollmentResponse.message);
        // Don't fail the whole submission for this
      }
    } catch (enrollmentError) {
      console.error("Error saving enrollment:", enrollmentError);
    }

    // Update inquiry status to "Admitted" if we can identify the inquiry
    try {
      updateInquiryAdmissionStatus(formData, userIdForAudit);
    } catch (inquiryUpdateError) {
      console.error("Warning: Failed to update inquiry status:", inquiryUpdateError);
      // Don't fail the admission for this
    }

    // Log successful submission
    createAuditLogEntry("Admission Form Submission", userIdForAudit, {
      receiptNumber: formData.receipt_number,
      enrollmentId: enrollmentId,
      studentName: fullName,
      course: formData.courseSelect,
      fees: formData.totalCourseFees,
      row: lastRow
    });

    return {
      success: true,
      message: "Data saved successfully",
      row: lastRow,
      studentName: fullName,
      enrollmentId: enrollmentId
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

/**
 * Updates the admission status in the inquiry sheet when admission is completed
 * @param {Object} formData The admission form data
 * @param {string} userIdForAudit The user ID for auditing
 */
function updateInquiryAdmissionStatus(formData, userIdForAudit) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const inquirySheet = ss.getSheetByName("INQUIRY FORM");

    if (!inquirySheet) {
      console.warn("INQUIRY FORM sheet not found, cannot update admission status");
      return;
    }

    const inquiryData = inquirySheet.getDataRange().getValues();
    if (inquiryData.length <= 1) {
      console.warn("No inquiry data found");
      return;
    }

    // Get headers to find column indices
    const headers = inquiryData[0];
    const phoneIdx = headers.indexOf("Phone");
    const aadhaarIdx = headers.indexOf("Aadhaar");
    const fullNameIdx = headers.indexOf("Full Name");
    const admissionStatusIdx = headers.indexOf("Admission Status");
    const admissionDateIdx = headers.indexOf("Admission Date");

    if (admissionStatusIdx === -1) {
      console.warn("Admission Status column not found in inquiry sheet");
      return;
    }

    // Get form data for matching
    const admissionPhone = formData.phoneNo || "";
    const admissionAadhaar = formData.aadhaarNumber || "";
    const admissionFullName = [
      formData.first_name,
      formData.middle_name,
      formData.last_name
    ].filter(Boolean).join(" ");

    // Find matching inquiry row
    for (let i = 1; i < inquiryData.length; i++) {
      const row = inquiryData[i];
      const inquiryPhone = String(row[phoneIdx] || "").trim();
      const inquiryAadhaar = String(row[aadhaarIdx] || "").trim();
      const inquiryFullName = String(row[fullNameIdx] || "").trim();

      // Match by phone number first (most reliable), then Aadhaar, then name
      let isMatch = false;

      if (admissionPhone && inquiryPhone === admissionPhone) {
        isMatch = true;
      } else if (admissionAadhaar && inquiryAadhaar === admissionAadhaar) {
        isMatch = true;
      } else if (admissionFullName && inquiryFullName === admissionFullName) {
        isMatch = true;
      }

      if (isMatch) {
        // Update admission status and date
        const rowNumber = i + 1; // +1 because sheet rows are 1-indexed

        inquirySheet.getRange(rowNumber, admissionStatusIdx + 1).setValue("Admitted");

        if (admissionDateIdx !== -1) {
          inquirySheet.getRange(rowNumber, admissionDateIdx + 1).setValue(new Date());
        }

        // Log the update
        createAuditLogEntry("Inquiry Status Updated", userIdForAudit, {
          inquiryRow: rowNumber,
          studentName: admissionFullName,
          newStatus: "Admitted",
          matchedBy: admissionPhone ? "phone" : admissionAadhaar ? "aadhaar" : "name"
        });

        console.log(`Updated inquiry status to Admitted for row ${rowNumber}`);
        break; // Update only the first match
      }
    }

  } catch (error) {
    console.error("Error updating inquiry admission status:", error);
    // Log the error but don't throw - admission should still succeed
    createAuditLogEntry("Inquiry Status Update Error", userIdForAudit, {
      error: error.message,
      studentName: `${formData.first_name} ${formData.last_name}`
    });
  }
}
