# Sample Files Usage Guide

This directory contains realistic sample files for demonstrating the SignPortal system.

## Directory Structure

```
samples/
├── documents/          # Sample document files
│   ├── Investigation Reports
│   ├── Intelligence Reports
│   ├── Administrative Requests
│   ├── Financial Requests
│   ├── Incident Reports
│   ├── Procurement Documents
│   └── CSV/Excel files
├── attachments/        # Sample attachment files
│   ├── Witness statements
│   ├── Evidence logs
│   ├── CCTV summaries
│   └── Supporting documents
├── data/               # JSON data files for seeding
│   ├── sampleDocuments.json
│   └── sampleWorkflows.json
└── README.md
```

## Sample Documents

### 1. Investigation Report (INV-2024-001)
- **File**: `INV-2024-001_Investigation_Report.txt`
- **Type**: Investigation Report
- **Classification**: Confidential
- **Priority**: Urgent
- **Purpose**: Theft case investigation
- **Uploader**: PO1 Juan Dela Cruz (personnel1@pnp.gov.ph)

### 2. Intelligence Report (INT-2024-002)
- **File**: `INT-2024-002_Intelligence_Report.txt`
- **Type**: Intelligence Report
- **Classification**: Secret
- **Priority**: Priority
- **Purpose**: Intelligence gathering on criminal activities
- **Uploader**: PO2 Maria Santos (personnel2@pnp.gov.ph)

### 3. Administrative Request (ADM-2024-003)
- **File**: `ADM-2024-003_Administrative_Request.txt`
- **Type**: Administrative Request
- **Classification**: For Official Use Only
- **Priority**: Routine
- **Purpose**: Annual leave application
- **Uploader**: PO2 Carlos Reyes (personnel3@pnp.gov.ph)

### 4. Financial Request (FIN-2024-004)
- **File**: `FIN-2024-004_Financial_Request.txt`
- **Type**: Financial Request
- **Classification**: For Official Use Only
- **Priority**: Urgent
- **Purpose**: Q1 2024 operational expenses
- **Uploader**: PO1 Ana Garcia (personnel4@pnp.gov.ph)

### 5. Incident Report (INC-2024-005)
- **File**: `INC-2024-005_Incident_Report.txt`
- **Type**: Incident Report
- **Classification**: Restricted
- **Priority**: Emergency
- **Purpose**: Traffic accident report
- **Uploader**: PO1 Juan Dela Cruz (personnel1@pnp.gov.ph)

### 6. Procurement Request (PROC-2024-006)
- **File**: `PROC-2024-006_Procurement_Request.txt`
- **Type**: Procurement Documents
- **Classification**: For Official Use Only
- **Priority**: Priority
- **Purpose**: Office equipment procurement
- **Uploader**: PMAJ Eduardo Ramirez (operationschief@pnp.gov.ph)

### 7. Budget Report (FIN-2024-007)
- **File**: `FIN-2024-007_Budget_Report.csv`
- **Type**: Financial Request (CSV/Excel)
- **Classification**: For Official Use Only
- **Priority**: Routine
- **Purpose**: Q1 2024 budget summary

### 8. Inventory List (PROC-2024-008)
- **File**: `PROC-2024-008_Inventory_List.csv`
- **Type**: Procurement Documents (CSV/Excel)
- **Classification**: For Official Use Only
- **Priority**: Routine
- **Purpose**: Equipment and supplies inventory

## Sample Attachments

### Supporting Documents
- `Witness_Statement_001.txt` - Witness statement for investigation case
- `Evidence_Photo_Log.txt` - Evidence documentation log
- `CCTV_Summary.txt` - CCTV footage review summary
- `Budget_Justification.txt` - Detailed budget justification

## JSON Data Files

### sampleDocuments.json
Contains metadata for 8 sample documents that can be used to seed the database. Each entry includes:
- Document title
- Purpose
- Office unit
- Case reference number
- Classification level
- Priority
- Deadline
- Notes
- Uploader email
- Filename reference

### sampleWorkflows.json
Contains workflow stage definitions for different document types. Each workflow includes:
- Document ID reference
- Purpose and office unit
- Workflow stages with:
  - Stage name
  - Stage order
  - Required role
  - Assigned user email
  - Signed upload requirement

## Usage Instructions

### Manual Upload
1. Log in to the SignPortal system
2. Navigate to the Documents page
3. Click "Upload Document"
4. Select a file from the `samples/documents/` directory
5. Fill in the metadata form with information from the file
6. Upload any relevant attachments from `samples/attachments/`

### Programmatic Seeding (Future)
The JSON files in `samples/data/` can be used to create a seeding script that:
1. Reads `sampleDocuments.json`
2. Creates documents with associated metadata
3. Creates workflows using `sampleWorkflows.json`
4. Links attachments to appropriate documents

## Demo Scenarios

### Scenario 1: Investigation Workflow
1. Upload `INV-2024-001_Investigation_Report.txt`
2. Add attachments: `Witness_Statement_001.txt`, `Evidence_Photo_Log.txt`, `CCTV_Summary.txt`
3. Follow the approval chain:
   - Section Chief (supervisor1@pnp.gov.ph)
   - Unit Commander (unitcommander1@pnp.gov.ph)
   - Provincial Director (provincialdirector@pnp.gov.ph)
   - Regional Director (regionaldirector@pnp.gov.ph)

### Scenario 2: Financial Request
1. Upload `FIN-2024-004_Financial_Request.txt`
2. Add attachment: `Budget_Justification.txt`
3. Follow the approval chain:
   - Finance Section Chief (supervisor4@pnp.gov.ph)
   - Unit Commander (unitcommander4@pnp.gov.ph)
   - Provincial Director (provincialdirector@pnp.gov.ph)

### Scenario 3: Administrative Request
1. Upload `ADM-2024-003_Administrative_Request.txt`
2. Follow the approval chain:
   - HR Section Chief (supervisor3@pnp.gov.ph)
   - Unit Commander (unitcommander3@pnp.gov.ph)

## Notes

⚠️ **Important**: 
- These are sample/demo files only
- Do not use in production environments
- File contents are fictional and for demonstration purposes only
- Actual file formats (PDF, DOCX, XLSX) should be created from these text templates for full demo experience

## Converting to Actual File Formats

To create actual PDF, DOCX, or XLSX files:
1. **PDF**: Use a PDF generator or print-to-PDF from the text files
2. **DOCX**: Copy content into Microsoft Word and save as DOCX
3. **XLSX**: Open CSV files in Excel and save as XLSX

These conversions will provide a more realistic demo experience with actual file previews in the system.
