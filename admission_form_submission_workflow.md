# Admission Form Submission Workflow

## Overview
This document explains the complete workflow that occurs when a student submits the admission form in the Google Apps Script application. The process involves multiple steps including data validation, saving to spreadsheets, generating receipts, and transitioning to course payment.

## Step-by-Step Process

### Step 1: Form Submission Trigger
- **Function**: `AdmissionHandle(event)` in `AdmissionForm/AdmissionHandle.html`
- **Trigger**: User clicks the "Submit" button on the admission form
- **Actions**:
  - Prevents default form submission
  - Disables submit button and shows loading state
  - Handles photo upload (stored in sessionStorage and localStorage)
  - Collects form data into a FormData object
  - Calls `submitFormData()` function

### Step 2: Data Preparation and Validation
- **Function**: `submitFormData()` (part of `AdmissionHandle`)
- **Actions**:
  - Extracts form data from FormData object
  - Constructs full student name from first, middle, and last names
  - Logs form data to console for debugging
  - Calls Google Apps Script `saveToSheet()` function via `google.script.run`

### Step 3: Server-Side Data Processing
- **Function**: `saveToSheet(formData)` in `AdmissionForm/AdmissionForm.js`
- **Input Validation**:
  - Retrieves user ID from form data, user properties, or defaults to "Anonymous"
  - Validates required fields: receipt_number, first_name, last_name, courseSelect, totalCourseFees, guardian_name
  - Returns error response if validation fails

### Step 4: Data Persistence to Spreadsheets
- **ADMISSIONF Sheet Save**:
  - Gets active spreadsheet and ADMISSIONF sheet
  - Generates enrollment ID using `getNextEnrollmentNumber()`
  - Prepares row data in specific column order:
    - Timestamp (Column A)
    - Receipt Number (Column B)
    - Enrollment ID (Column C)
    - First Name, Middle Name, Last Name (Columns D-F)
    - Course Name, Course Duration (Columns G-H)
    - Total Course Fees (Column I)
    - Guardian Relation, Guardian Name (Columns J-K)
    - Agreement Status (Column L)
    - Logged-in User ID (Column M)
  - Appends row to ADMISSIONF sheet

### Step 5: Enrollment Data Save
- **Function**: `saveEnrollment(data)` in `Code.js`
- **Actions**:
  - Creates or gets "Enrollments" sheet with headers: Enrollment ID, Student Name, Course, Date, Status
  - Validates enrollment ID and student name
  - Checks for duplicate enrollment IDs
  - Saves enrollment data with "Active" status
  - Returns success/failure response

### Step 6: Audit Logging
- **Function**: `createAuditLogEntry()` in `Code.js`
- **Actions**:
  - Logs to "AuditLog" sheet with:
    - Unique log ID (timestamp-based)
    - User ID
    - Action type ("Admission Form Submission")
    - Timestamp
    - JSON details (receipt number, enrollment ID, student name, course, fees, row number)

### Step 7: Receipt Generation and Display
- **Function**: `generateAndSaveEnrollment()` in `AdmissionForm/AdmissionHandle.html`
- **Actions**:
  - Calls `getNextEnrollmentNumber()` server-side function
  - On success, calls `loadReceipt(enrollmentID, studentName, course)`
  - Generates HTML receipt with:
    - Institute header with logo
    - Receipt details (number, date, student info)
    - Course and fee information
    - Amount breakdown (Total, Paid, Balance)
    - Enrollment ID display
    - Guardian signature section
  - Shows receipt in modal using `showReceiptModal()`

### Step 8: Navigation to Course Payment
- **Navigation Trigger**: After 1.5 second timeout
- **Function**: `openCoursePayment()` (assumed to be defined elsewhere)
- **Data Transfer**:
  - Stores enrollment ID in sessionStorage and localStorage
  - Stores form data (first_name, middle_name, last_name, receipt_number, courseSelect) in sessionStorage
  - Navigates user to course payment form

## Course Payment Form Workflow

### Overview
After navigating from admission form, the course payment form loads and allows users to configure payment options, installment schedules, and proceed to generate the final admission receipt.

### Step 9: Course Payment Form Initialization
- **Function**: `populateCoursePaymentFromAdmission()` or `populateCoursePaymentFromSavedData()`
- **Data Sources**:
  - `sessionStorage.getItem('first_name')`, `last_name`, `tempText4` (receipt number), `tempText5` (course)
  - `sessionStorage.getItem('enrollmentId')` or `localStorage.getItem('admission_enrollmentId')`
- **Actions**:
  - Pre-fills student name, receipt number, enrollment ID
  - Sets course selection and loads course details
  - Shows payment options section
  - Calls `updateCoursePayDetails()` to populate course fees and duration

### Step 10: Course Details Loading
- **Function**: `updateCoursePayDetails()` (external function)
- **Actions**:
  - Updates course duration display based on selected course
  - Updates annual fees display
  - Calculates and displays total course fees
  - Triggers payment option updates

### Step 11: Payment Options Configuration
- **Payment Types**:
  - **Full Payment**: Single payment for entire course fee with optional discount
  - **Partial Payment**: Initial payment + EMI installments
  - **EMI Payment**: Down payment + monthly installments
- **Functions**:
  - `updateFullPaymentDiscount()` - Calculates discount for full payment
  - `updatePartialPayment()` - Calculates EMI for partial payment
  - `updateEMIPayment()` - Calculates EMI schedule for EMI payment

### Step 12: Installment Schedule Generation
- **Function**: `populateInstallmentSchedule()`
- **Data Sources**:
  - Server-side: `getInstallmentPaymentsForStudent()` - Loads existing payments
  - Client-side: `loadInstallmentSchedule()` - Loads saved schedule
- **Actions**:
  - Checks for existing payment data from server
  - Loads saved installment schedule if available
  - Generates default schedule if no saved data exists
  - Updates payment status for completed installments

### Step 13: Individual Installment Payment Processing
- **Function**: `handleInstallmentPayment(checkbox, statusId, receiptBtnId)`
- **Trigger**: User clicks checkbox to mark installment as paid
- **Actions**:
  - Shows confirmation dialog
  - Calls `ensureInstallmentScheduleSaved()` to save schedule if needed
  - Calls `saveInstallmentPayment()` to record payment
  - Updates UI status to "Paid"
  - Generates receipt via `generateInstallmentReceipt()`

### Step 14: Installment Payment Saving
- **Function**: `saveInstallmentPayment(installmentNumber, amount, checkbox, statusId, receiptBtnId)`
- **Server Call**: `google.script.run.saveInstallmentPayment(formData)`
- **Actions**:
  - Prepares payment data (enrollment ID, amount, payment method, date)
  - Saves to "InstallmentPayments" sheet
  - Updates "FeeStructure" sheet with reduced amount due
  - Updates "InstallmentSchedules" sheet status
  - Generates receipt on success

### Step 15: Proceeding to Admission Receipt
- **Function**: `proceedToAdmissionReceipt()`
- **Trigger**: User clicks "Proceed to Admission Receipt" button
- **Data Collection**:
  - Gets selected payment type and parameters
  - Calculates total fee and installment schedule
  - Merges inquiry, admission, and course payment data
  - Creates `completeReceiptData` object
- **Actions**:
  - Saves installment schedule to "InstallmentSchedules" sheet
  - Stores `completeReceiptData` in sessionStorage
  - Calls `openreceiptFormSection()` to navigate to final receipt

### Step 16: Admission Receipt Generation
- **Function**: `openreceiptFormSection()` and `prefillAdmissionReceipt()`
- **Data Population**:
  - Fills receipt number, date, enrollment ID, student name
  - Sets course information and fee details
  - Generates installment table from custom schedule
  - Pre-fills guardian name and relationship
  - Displays student photo from stored data
- **Installment Table Generation**:
  - `generateInstallmentTables()` - Main function
  - `generateInstallmentTableFromSchedule()` - Uses custom schedule
  - `updateInstallmentStatusFromCoursePayment()` - Updates paid statuses

### Step 17: Final Receipt Actions
- **PDF Download**: `downloadPdfWithHtml2Pdf()` - Generates PDF with receipt and undertaking
- **Print Receipt**: `prepareForPrint()` - Prepares for printing with compact mode if needed
- **Data Saving**: `saveInstallmentDataOnReceiptGeneration()` - Saves final installment data

## Course Payment Data Flow

```
Course Payment Navigation
         ↓
populateCoursePaymentFromAdmission()
├── Prefill form fields
├── Load course details
└── Show payment options
         ↓
Payment Option Selection
├── Full/Partial/EMI configuration
├── Discount calculations
└── Installment schedule generation
         ↓
Individual Payment Processing
├── handleInstallmentPayment()
├── saveInstallmentPayment()
├── Update FeeStructure sheet
└── Generate installment receipt
         ↓
Proceed to Admission Receipt
├── proceedToAdmissionReceipt()
├── Merge all workflow data
├── Save installment schedule
└── Navigate to final receipt
```

## Key Course Payment Functions

### Form Initialization
- `populateCoursePaymentFromAdmission()` - Populates from admission data
- `populateCoursePaymentFromSavedData()` - Loads saved payment details
- `updateCoursePayDetails()` - Updates course fees and duration

### Payment Processing
- `handleInstallmentPayment()` - Processes individual installment payments
- `saveInstallmentPayment()` - Saves payment to sheets and generates receipt
- `ensureInstallmentScheduleSaved()` - Ensures schedule exists before payment
- `generateInstallmentReceipt()` - Creates printable installment receipt

### Schedule Management
- `populateInstallmentSchedule()` - Loads and displays installment schedule
- `generateInstallmentScheduleForPaymentType()` - Creates schedule based on payment type
- `generateInstallmentTableRowsFromScheduleShared()` - Shared table generation function

### Navigation and Finalization
- `proceedToAdmissionReceipt()` - Collects all data and navigates to final receipt
- `openreceiptFormSection()` - Opens admission receipt form
- `prefillAdmissionReceipt()` - Populates final receipt with complete workflow data

## Course Payment Data Storage

### Session Storage Keys
- `first_name`, `last_name`, `tempText4` (receipt), `tempText5` (course) - From admission
- `enrollmentId` - Generated enrollment ID
- `completeReceiptData` - Final merged data for receipt generation

### Spreadsheet Integration
- **FeeStructure**: Fee records with amount due updates
- **InstallmentSchedules**: Saved installment schedules
- **InstallmentPayments**: Individual payment records
- **AdmissionReceipts**: Complete workflow receipts

## Course Payment Error Handling

1. **Missing Enrollment Data**:
   - Falls back to receipt number for identification
   - Shows payment options if no existing payments found

2. **Schedule Loading Failures**:
   - Generates default schedule based on payment type
   - Continues with payment processing

3. **Payment Saving Errors**:
   - Shows error alerts but maintains UI state
   - Allows retry of payment operations

4. **Receipt Generation Failures**:
   - Logs errors but continues with navigation
   - Provides alternative receipt generation options

## Course Payment Security and Validation

- **Input Validation**: Numeric inputs validated for integers only
- **Data Integrity**: Cross-verification between sheets and session data
- **Audit Trail**: All payment operations logged with user ID and timestamps
- **Duplicate Prevention**: Checks for existing payments before processing

### Step 9: Success/Error Handling
- **Success Path**:
  - Updates button to success state
  - Shows alert with enrollment ID
  - Proceeds to receipt generation and course payment navigation
- **Error Path**:
  - Logs error to console
  - Shows error alert to user
  - Re-enables submit button

## Data Flow Diagram

```
Admission Form Submission
         ↓
AdmissionHandle() → submitFormData()
         ↓
google.script.run.saveToSheet()
         ↓
Server-side saveToSheet()
├── Validate form data
├── Generate enrollment ID
├── Save to ADMISSIONF sheet
├── Save to Enrollments sheet
└── Create audit log
         ↓
generateAndSaveEnrollment()
├── Generate receipt HTML
├── Show receipt modal
└── Store enrollment data
         ↓
Navigate to Course Payment
```

## Key Functions Involved

### Client-Side Functions
- `AdmissionHandle(event)` - Main form submission handler
- `submitFormData()` - Data preparation and server call
- `generateAndSaveEnrollment()` - Receipt generation and enrollment save
- `loadReceipt()` - Receipt HTML generation
- `showReceiptModal()` - Modal display logic

### Server-Side Functions
- `saveToSheet(formData)` - Main data persistence function
- `saveEnrollment(data)` - Enrollment record creation
- `getNextEnrollmentNumber()` - Auto-increment enrollment ID
- `createAuditLogEntry()` - Audit trail logging

## Data Storage Locations

### Spreadsheets
- **ADMISSIONF**: Complete admission form data
- **Enrollments**: Enrollment records with status
- **AuditLog**: Action audit trail

### Browser Storage
- **sessionStorage**: Temporary data for form transitions
  - `enrollmentId`: Generated enrollment ID
  - `studentPhoto`: Student photo data
  - Form field values for transfer to course payment
- **localStorage**: Persistent photo storage
  - `admission_studentPhoto`: Backup photo storage

## Error Scenarios and Handling

1. **Validation Failures**:
   - Missing required fields → Error alert and form remains enabled

2. **Sheet Access Errors**:
   - Missing ADMISSIONF sheet → Audit log entry and error response

3. **Duplicate Enrollment IDs**:
   - Checked in saveEnrollment() → Error response

4. **Photo Upload Failures**:
   - Continues with form submission (non-blocking)

5. **Receipt Generation Failures**:
   - Continues with navigation (logs error to console)

## Security Considerations

- User authentication via PropertiesService
- Audit logging for all major actions
- Input validation on both client and server side
- Photo data sanitized and stored securely

## Performance Optimizations

- Asynchronous photo processing
- Modal receipt display (no page reload)
- Delayed navigation allows receipt viewing
- Minimal data transfer between forms

## Integration Points

- **Inquiry Form**: Data flows from inquiry → admission
- **Course Payment**: Admission data transfers to course payment
- **Analytics**: Admission data feeds analytics dashboards
- **Receipt Generation**: Admission data creates printable receipts

This workflow ensures complete data integrity from admission submission through to course payment, with proper audit trails and error handling throughout the process.
