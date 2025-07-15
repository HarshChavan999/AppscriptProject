/**
 * Processes the inquiry form data, generates a PDF, and saves/updates data in the Google Sheet.
 * This function handles both new inquiries and updates to existing Aadhar records.
 *
 * @param {Object} formData The form data submitted from the HTML client.
 * @returns {Object} A success or error response object.
 */
function InquiryProcessForm(formData) {
  console.log("InquiryProcessForm: Processing form...");

  const userIdForAudit = formData.loggedInUserId || "Anonymous";
  const ss = SpreadsheetApp.getActiveSpreadsheet(); // Assuming active spreadsheet is the one containing all sheets

  // 1. PDF Folder Setup
  let pdfFolder;
  try {
    pdfFolder = DriveApp.getFolderById(CONFIG.ADMISSIONS_PDF_FOLDER_ID);
  } catch (e) {
    console.error("InquiryProcessForm: PDF folder access error:", e);
    createAuditLogEntry("PDF Folder Access Error", userIdForAudit, {
      error: e.message,
      formDataSummary: {
        aadharNumber: formData.aadharNumber,
        fullName: formData.fullName,
        email: formData.email
      }
    });
    return {
      success: false,
      message: "Cannot access PDF folder. Please check configuration.",
      error: e.message
    };
  }

  // 2. Get the Inquiry Sheet (DF)
  const dfSheet = ss.getSheetByName(CONFIG.INQUIRY_SHEET_NAME);
  if (!dfSheet) {
    console.error("InquiryProcessForm: DF sheet not found.");
    createAuditLogEntry("Sheet Not Found Error", userIdForAudit, {
      reason: `Sheet '${CONFIG.INQUIRY_SHEET_NAME}' missing.`,
      formDataSummary: {
        aadharNumber: formData.aadharNumber,
        fullName: formData.fullName
      }
    });
    return {
      success: false,
      message: `Inquiry sheet '${CONFIG.INQUIRY_SHEET_NAME}' not found.`
    };
  }

  // Combine names for fullName display in PDF and sheet
  formData.fullName = [
    formData.firstName,
    formData.middleName,
    formData.lastName
  ].filter(Boolean).join(" ");

  // Combine address for display in PDF and sheet
  // Note: The sheet will store this combined string in one column based on CONFIG.INQUIRY_COLUMN_INDEX.ADDRESS
  formData.address = [
    formData.addressLine1,
    formData.addressLine2,
    formData.addressLine3,
    `Pincode: ${formData.pincode}`
  ].filter(Boolean).join(", ");


  // 3. HTML Template Processing for PDF
  let htmlContent;
  try {
    // Get the HTML template content
    htmlContent = HtmlService.createTemplateFromFile("ifrom").getContent();

    // Replace placeholders in the HTML content with form data
    // This assumes your 'ifrom.html' has elements with IDs matching your formData keys
    // For example, <span id="fullName"></span> will be replaced by formData.fullName
    Object.keys(formData).forEach(key => {
      // Create a regex to find elements with specific IDs and replace their content
      // This is a more robust way to replace content within specific HTML tags
      const regex = new RegExp(`(<[^>]*id="${key}"[^>]*>)(.*?)(<\\/[^>]*>)`, 's');
      if (regex.test(htmlContent)) {
        htmlContent = htmlContent.replace(regex, `$1${formData[key]}$3`);
      }
    });

  } catch (e) {
    console.error("InquiryProcessForm: HTML template error:", e);
    createAuditLogEntry("HTML Template Error", userIdForAudit, {
      error: e.message,
      formDataSummary: {
        aadharNumber: formData.aadharNumber,
        fullName: formData.fullName
      }
    });
    return {
      success: false,
      message: "Failed to process HTML template for PDF."
    };
  }

  // 4. PDF Generation
  let pdfBlob;
  try {
    pdfBlob = Utilities.newBlob(htmlContent, 'text/html')
      .getAs('application/pdf')
      .setName(`Inquiry_Form_${formData.fullName.replace(/ /g, '_')}_${new Date().getTime()}.pdf`); // Add timestamp for uniqueness
    pdfFolder.createFile(pdfBlob);
    console.log("InquiryProcessForm: PDF generated and saved.");
  } catch (e) {
    console.error("InquiryProcessForm: PDF conversion error:", e);
    createAuditLogEntry("PDF Conversion Error", userIdForAudit, {
      error: e.message,
      formDataSummary: {
        aadharNumber: formData.aadharNumber,
        fullName: formData.fullName
      }
    });
    return {
      success: false,
      message: "PDF generation failed."
    };
  }

  // 5. Data Validation and Sheet Update/Append
  try {
    const requiredFields = [
      "aadharNumber", "fullName", "qualification", "phoneNo", "whatsappNo",
      "parentsNo", "age", "addressLine1", "pincode", "gender",
      "interestedCourse", "inquiryTakenBy", "branch"
    ];

    const missingFields = requiredFields.filter(field => !formData[field]);

    if (missingFields.length > 0) {
      createAuditLogEntry("Form Validation Failed", userIdForAudit, {
        reason: `Missing required fields: ${missingFields.join(", ")}`,
        formDataSummary: {
          aadharNumber: formData.aadharNumber,
          fullName: formData.fullName
        }
      });
      return {
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`
      };
    }

    // Prepare row data array based on CONFIG.INQUIRY_COLUMN_INDEX
    // This array will be used for both appendRow and setValues
    const rowData = [];
    rowData[CONFIG.INQUIRY_COLUMN_INDEX.DATE_FORM] = formData.date;
    rowData[CONFIG.INQUIRY_COLUMN_INDEX.AADHAAR] = formData.aadharNumber;
    rowData[CONFIG.INQUIRY_COLUMN_INDEX.FULL_NAME] = formData.fullName;
    rowData[CONFIG.INQUIRY_COLUMN_INDEX.QUALIFICATION] = formData.qualification;
    rowData[CONFIG.INQUIRY_COLUMN_INDEX.PHONE_NUMBER] = formData.phoneNo;
    rowData[CONFIG.INQUIRY_COLUMN_INDEX.WHATSAPP_NUMBER] = formData.whatsappNo;
    rowData[CONFIG.INQUIRY_COLUMN_INDEX.PARENTS_NUMBER] = formData.parentsNo;
    rowData[CONFIG.INQUIRY_COLUMN_INDEX.EMAIL_ADDRESS] = formData.email;
    rowData[CONFIG.INQUIRY_COLUMN_INDEX.AGE] = formData.age;
    rowData[CONFIG.INQUIRY_COLUMN_INDEX.ADDRESS] = formData.address; // Combined address string
    rowData[CONFIG.INQUIRY_COLUMN_INDEX.INTERESTED_COURSE] = formData.interestedCourse;
    rowData[CONFIG.INQUIRY_COLUMN_INDEX.INQUIRY_TAKEN_BY] = formData.inquiryTakenBy;
    rowData[CONFIG.INQUIRY_COLUMN_INDEX.BRANCH] = formData.branch;
    rowData[CONFIG.INQUIRY_COLUMN_INDEX.FOLLOW_UP_DATE] = ""; // Not from form
    rowData[CONFIG.INQUIRY_COLUMN_INDEX.NOTES] = ""; // Not from form
    rowData[CONFIG.INQUIRY_COLUMN_INDEX.ADMISSION_STATUS] = ""; // Not from form
    rowData[CONFIG.INQUIRY_COLUMN_INDEX.ADMISSION_DATE] = ""; // Not from form
    rowData[CONFIG.INQUIRY_COLUMN_INDEX.BATCH_ASSIGNED] = ""; // Not from form
    rowData[CONFIG.INQUIRY_COLUMN_INDEX.LOGGED_IN_USER_ID] = userIdForAudit;

    // Fill any potential gaps with empty strings if not explicitly set (up to the last defined column)
    const maxColumnIndex = Math.max(...Object.values(CONFIG.INQUIRY_COLUMN_INDEX));
    for (let i = 0; i <= maxColumnIndex; i++) {
      if (rowData[i] === undefined) {
        rowData[i] = "";
      }
    }

    // Check if Aadhar number already exists
    const existingRecordInfo = findAadharRecord(formData.aadharNumber, dfSheet); // Use the helper function
    let message = "";

    if (existingRecordInfo) {
      // Aadhar exists, update the row
      const rowToUpdate = existingRecordInfo.rowIndex + 1; // +1 because sheet rows are 1-indexed
      dfSheet.getRange(rowToUpdate, 1, 1, rowData.length + 1).setValues([[new Date(), ...rowData]]); // Include timestamp
      message = "Aadhar record updated successfully!";
      createAuditLogEntry("Inquiry Form Update", userIdForAudit, {
        aadharNumber: formData.aadharNumber,
        fullName: formData.fullName,
        row: rowToUpdate
      });
    } else {
      // Aadhar is new, append a new row
      dfSheet.appendRow([new Date(), ...rowData]); // Prepend timestamp for new row
      message = "New Aadhar record added successfully!";
      createAuditLogEntry("Inquiry Form Submission", userIdForAudit, {
        aadharNumber: formData.aadharNumber,
        fullName: formData.fullName
      });
    }

    return {
      success: true,
      message: message,
      studentName: formData.fullName
    };

  } catch (e) {
    console.error("InquiryProcessForm: Final write error:", e);
    createAuditLogEntry("Process Form Error", userIdForAudit, {
      error: e.message,
      formDataSummary: {
        aadharNumber: formData.aadharNumber,
        fullName: formData.fullName
      }
    });
    return {
      success: false,
      message: "Failed to save/update data in the sheet.",
      error: e.message
    };
  }
}

/**
 * Checks if an Aadhar number exists in the Inquiry (DF) sheet.
 * This function is called by the frontend on Aadhar input blur.
 *
 * @param {string} aadharNumber The Aadhar number to check.
 * @returns {Object|null} The record object if found, otherwise null.
 */
function checkAadharNumberInquiry(aadharNumber) {
  console.log(`checkAadharNumberInquiry: Checking Aadhar: ${aadharNumber}`);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const dfSheet = ss.getSheetByName(CONFIG.AADHAAR_LOOKUP.SHEET_NAME);

  if (!dfSheet) {
    console.error(`checkAadharNumberInquiry: Sheet '${CONFIG.AADHAAR_LOOKUP.SHEET_NAME}' not found.`);
    throw new Error(`Sheet '${CONFIG.AADHAAR_LOOKUP.SHEET_NAME}' not found.`);
  }

  const data = dfSheet.getDataRange().getValues();
  // Ensure there's at least one row beyond headers if headers exist
  if (data.length <= 1 && data[0][CONFIG.AADHAAR_LOOKUP.AADHAAR_COL] !== "Aadhar") { // Basic check for empty or header-only sheet
      console.log("checkAadharNumberInquiry: Sheet is empty or only has headers.");
      return null;
  }

  // Iterate from the second row (index 1) assuming first row is headers
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    // Use the AADHAAR_LOOKUP.AADHAAR_COL for the correct column index in getValues() array
    if (row[CONFIG.AADHAAR_LOOKUP.AADHAAR_COL] == aadharNumber) {
      console.log(`checkAadharNumberInquiry: Aadhar found at row index: ${i}`);
      // Construct the record object using the lookup column indices
      return {
        rowIndex: i, // Return the 0-based index of the row
        aadhaar: row[CONFIG.AADHAAR_LOOKUP.AADHAAR_COL],
        fullName: row[CONFIG.AADHAAR_LOOKUP.FULL_NAME_COL],
        qualification: row[CONFIG.AADHAAR_LOOKUP.QUALIFICATION_COL],
        phoneNumber: row[CONFIG.AADHAAR_LOOKUP.PHONE_NUMBER_COL],
        whatsappNumber: row[CONFIG.AADHAAR_LOOKUP.WHATSAPP_NUMBER_COL],
        parentsNumber: row[CONFIG.AADHAAR_LOOKUP.PARENTS_NUMBER_COL],
        emailAddress: row[CONFIG.AADHAAR_LOOKUP.EMAIL_ADDRESS_COL],
        age: row[CONFIG.AADHAAR_LOOKUP.AGE_COL],
        // Split the combined address from the sheet back into individual lines for the form
        // This is a heuristic and might need refinement based on how addresses are stored.
        addressLine1: row[CONFIG.AADHAAR_LOOKUP.ADDRESS_COL].split(', ')[0] || '',
        addressLine2: row[CONFIG.AADHAAR_LOOKUP.ADDRESS_COL].split(', ')[1] || '',
        addressLine3: row[CONFIG.AADHAAR_LOOKUP.ADDRESS_COL].split(', ')[2] || '',
        pincode: row[CONFIG.AADHAAR_LOOKUP.ADDRESS_COL].includes('Pincode: ') ? row[CONFIG.AADHAAR_LOOKUP.ADDRESS_COL].split('Pincode: ')[1] : '',
        interestedCourse: row[CONFIG.AADHAAR_LOOKUP.INTERESTED_COURSE_COL],
        inquiryTakenBy: row[CONFIG.AADHAAR_LOOKUP.INQUIRY_TAKEN_BY_COL],
        branch: row[CONFIG.AADHAAR_LOOKUP.BRANCH_COL],
        gender: row[CONFIG.AADHAAR_LOOKUP.GENDER_COL] // Assuming you add GENDER_COL to AADHAAR_LOOKUP in CONFIG
      };
    }
  }
  console.log(`checkAadharNumberInquiry: Aadhar ${aadharNumber} not found.`);
  return null; // Aadhar not found
}

/**
 * Helper function to find an Aadhar record and its row index.
 * Used internally by InquiryProcessForm to avoid redundant sheet reads.
 *
 * @param {string} aadharNumber The Aadhar number to find.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet The sheet to search in.
 * @returns {Object|null} An object containing the record data and its 0-based row index, or null if not found.
 */
function findAadharRecord(aadharNumber, sheet) {
  const data = sheet.getDataRange().getValues();
  const aadharColIndex = CONFIG.AADHAAR_LOOKUP.AADHAAR_COL; // Use lookup index for getValues() array

  for (let i = 1; i < data.length; i++) { // Start from 1 to skip headers
    if (data[i][aadharColIndex] == aadharNumber) {
      const record = {};
      // Map data from sheet row to a structured object using AADHAAR_LOOKUP indices
      record.aadhaar = data[i][CONFIG.AADHAAR_LOOKUP.AADHAAR_COL];
      record.fullName = data[i][CONFIG.AADHAAR_LOOKUP.FULL_NAME_COL];
      record.qualification = data[i][CONFIG.AADHAAR_LOOKUP.QUALIFICATION_COL];
      record.phoneNumber = data[i][CONFIG.AADHAAR_LOOKUP.PHONE_NUMBER_COL];
      record.whatsappNumber = data[i][CONFIG.AADHAAR_LOOKUP.WHATSAPP_NUMBER_COL];
      record.parentsNumber = data[i][CONFIG.AADHAAR_LOOKUP.PARENTS_NUMBER_COL];
      record.emailAddress = data[i][CONFIG.AADHAAR_LOOKUP.EMAIL_ADDRESS_COL];
      record.age = data[i][CONFIG.AADHAAR_LOOKUP.AGE_COL];
      record.address = data[i][CONFIG.AADHAAR_LOOKUP.ADDRESS_COL]; // Combined address
      record.interestedCourse = data[i][CONFIG.AADHAAR_LOOKUP.INTERESTED_COURSE_COL];
      record.inquiryTakenBy = data[i][CONFIG.AADHAAR_LOOKUP.INQUIRY_TAKEN_BY_COL];
      record.branch = data[i][CONFIG.AADHAAR_LOOKUP.BRANCH_COL];
      record.gender = data[i][CONFIG.AADHAAR_LOOKUP.GENDER_COL]; // Assuming this is defined

      return { record: record, rowIndex: i };
    }
  }
  return null;
}

// Helper function for audit logging (make sure this is defined)
// This function needs to be accessible globally in your Apps Script project.
function createAuditLogEntry(eventType, userId, details) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const auditSheet = ss.getSheetByName(CONFIG.AUDIT_LOG_SHEET_NAME);
  if (auditSheet) {
    auditSheet.appendRow([new Date(), eventType, userId, JSON.stringify(details)]);
  } else {
    console.error(`Audit log sheet '${CONFIG.AUDIT_LOG_SHEET_NAME}' not found. Audit entry not logged.`);
  }
}