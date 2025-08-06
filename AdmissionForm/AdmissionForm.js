// function AdmissionProcessForm(formData) {
//   console.log("Processing admission form...");



//   // ✅ Ensure consistent, traceable user ID from login
//   const userIdForAudit = formData.loggedInUserId && formData.loggedInUserId.trim() !== "" 
//     ? formData.loggedInUserId.trim() 
//     : "Anonymous";

//   const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.ADMISSIONS_SHEET_NAME);

//   if (!sheet) {
//     console.error("Admissions sheet not found.");
//     createAuditLogEntry("Sheet Not Found Error", userIdForAudit, {
//       reason: "Admissions sheet is missing in the spreadsheet."
//     });
//     return { success: false, message: "Admissions sheet not found." };
//   }

//   const requiredFields = [
//     "student_name", "courseSelect", "receipt_number", "courseFeeees",
//     "payment_method", "courseYears", "guardian_name", "guardian_relation"
//   ];
//   const missingFields = requiredFields.filter((field) => !formData[field]);

//   if (missingFields.length > 0) {
//     const msg = `Missing required fields for admission: ${missingFields.map(f => f.replace(/_/g, ' ')).join(", ")}.`;
//     createAuditLogEntry("Form Validation Failed", userIdForAudit, {
//       missingFields,
//       formDataSummary: { student: formData.student_name || "N/A" }
//     });
//     return { success: false, message: msg };
//   }

//   if (!formData.agree) {
//     createAuditLogEntry("Terms Not Agreed", userIdForAudit, {
//       student: formData.student_name,
//       reason: "Terms and conditions not agreed."
//     });
//     return {
//       success: false,
//       message: "Please agree to the terms and conditions to proceed with admission."
//     };
//   }

//   try {
    
//     let html = HtmlService.createHtmlOutputFromFile("aAdmission").getContent();



//     Object.keys(formData).forEach(key => {
//       const regex = new RegExp(`(<div[^>]*id="${key}"[^>]*>)(.*?)(</div>)`, 's');
//       const value = formData[key] || '';
//       if (key === 'agree') {
//         html = html.replace(`<span id="${key}"></span>`, `<span id="${key}">${value ? 'Agreed to Terms & Conditions' : 'Did NOT Agree'}</span>`);
//       } else if (regex.test(html)) {
//         html = html.replace(regex, `$1${value}$3`);
//       }
//     });



  
//     const numYears = parseInt(formData.courseYears, 10) || 1;

//     for (let i = 1; i <= 3; i++) {
//       const id = `year${i}_payment_details`;
//       if (i <= numYears) {

//         const yearContent = `
//           <p><strong>Year ${i}:</strong> Total: ₹ ${formData[`year${i}_total`] || 'N/A'}, 
//           Paid: ₹ ${formData[`year${i}_paid`] || 'N/A'}, 
//           Due: ₹ ${formData[`year${i}_due`] || 'N/A'}, 
//           Installments: ${formData[`year${i}_installments`] || 'N/A'}</p>
//         `;

//         html = html.replace(
//           `<div id="${id}" class="year-payment-sub-section" style="display: none;"></div>`,
//           `<div id="${id}" class="year-payment-sub-section" style="display: block;">${yearContent}</div>`
//         );
//       } else {

//         html = html.replace(
//           new RegExp(`(<div[^>]*id="${id}"[^>]*>)(.*?)(</div>)`, 's'),
//           `<div id="${id}" class="year-payment-sub-section" style="display: none;"></div>`
//         );
//       }
//     }

//     const pdfBlob = Utilities.newBlob(html, 'text/html', 'Admission.html')
//       .getAs('application/pdf')
//       .setName(`Admission_Receipt_${formData.student_name.replace(/[^a-zA-Z0-9]/g, '_')}_${userIdForAudit}_${new Date().toLocaleDateString('en-IN').replace(/\//g, '-')}.pdf`);
//     const pdfFolder = DriveApp.getFolderById(CONFIG.ADMISSIONS_PDF_FOLDER_ID);
//     const pdfFile = pdfFolder.createFile(pdfBlob);

    
    
//     const rowData = [
//       new Date(),
//       formData.receipt_number || '',
//       formData.student_name || '',
//       formData.courseSelect || '',
//       formData.coursePeriod || '',
//       formData.courseFeeees || '',
//       formData.payment_type || '',
//       formData.payment_method || '',
      
//       formData.courseYears || '',

//       formData.year1_total || '',
//       formData.year1_paid || '',
//       formData.year1_due || '',
//       formData.year1_installments || '',

//       formData.year2_total || '',
//       formData.year2_paid || '',
//       formData.year2_due || '',
//       formData.year2_installments || '',

//       formData.year3_total || '',
//       formData.year3_paid || '',
//       formData.year3_due || '',
//       formData.year3_installments || '',

//       formData.guardian_relation || '',
//       formData.guardian_name || '',
//       formData.agree ? 'Yes' : 'No'
//     ];
//     sheet.appendRow(rowData);

//     createAuditLogEntry("Admission Form Submission", userIdForAudit, {
//       student: formData.student_name,
//       receiptNumber: formData.receipt_number,
//       course: formData.courseSelect,
//       branch: formData.branch || "N/A"
//     });
//     return {
//       success: true,
//       message: "Admission form submitted and receipt generated successfully!",
//       studentName: formData.student_name,
//       receiptNumber: formData.receipt_number,
//       pdfLink: pdfFile.getUrl()
//     };

//   } catch (e) {
//     console.error("Error in AdmissionProcessForm:", e.message);
//     createAuditLogEntry("Admission Processing Error", userIdForAudit, {
//       error: e.message,
//       formDataSummary: { student: formData.student_name || "N/A" }
//     });
//     return {
//       success: false,
//       message: "An error occurred while processing your admission form.",
//       error: e.message
//     };
//   }
// }

// const SPREADSHEET_ID = "1qfJIzcvO_1pNTZYEBOmVXoEL1QYbSpK32grjEXKKAZk"; // Your Sheet ID
// const SHEET_NAME = "ADMISSIONF"; // Your Sheet Name

// function saveToSheet(formData) {
//   try {
//     const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
//     const sheet = ss.getSheetByName("ADMISSIONF");
    
//     if (!sheet) {
//       throw new Error("Sheet 'ADMISSIONF' not found");
//     }

//     // Prepare data in sheet column order
//     const rowData = [
//       new Date(),
//       formData.receipt_number || "",
//       formData.first_name || "",
//       formData.middle_name || "",
//       formData.last_name || "",
//       formData.courseSelect || "",
//       formData.courseDurationText || "",
//       formData.totalCourseFees || "",
//       formData.guardian_relation || "",
//       formData.guardian_name || "",
//       formData.agree === 'on' ? 'Agreed' : 'Not Agreed'
//     ];

//     sheet.appendRow(rowData);
    
//     return {
//       success: true,
//       message: "Data saved successfully",
//       row: sheet.getLastRow()
//     };
    
//   } catch (error) {
//     console.error("Error in saveToSheet:", error);
//     return {
//       success: false,
//       message: error.message
//     };
//   }
// }


const SPREADSHEET_ID = "12-WAcBELTFuV-mP0CXGtVq4bPhrHXB8fyo73_O01oZg";
const SHEET_NAME = "ADMISSIONF";

/**
 * Saves admission form data to the sheet and creates audit log entries
 * @param {Object} formData The form data submitted from the HTML client
 * @returns {Object} A success or error response object
 */
function saveToSheet(formData) {
  const userIdForAudit = formData.loggedInUserId || "Anonymous";
  
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
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

