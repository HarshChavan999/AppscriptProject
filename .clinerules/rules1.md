a. "AdmissionFormReceipt.html" this is the main admission receipt
b.  DataFlow - First the data is feed in inquiry form then the required data is prefilled in admission form after clicking next the required data is prefilled in cousrepayment

## Changes Made (16/10/2025)
- Modified CoursePayment.html payment input boxes to behave like normal number input boxes without increment/decrement arrows
- Converted number inputs to text inputs with `validateIntegerOnly()` function for better user experience
- All three payment input boxes now use the same validation method: full payment discount, partial payment initial amount, and EMI down payment inputs
- Implemented comprehensive integer validation with full backspace functionality and real-time input filtering
- Fixed input buffering issues to ensure previous characters don't reappear when typing
- All payment input fields now behave identically as normal text inputs with automatic digit-only filtering
