export interface Tool {
  id: string;
  category: string;
  title: string;
  description: string;
  keywords?: string[];
}

/**
 * Central tool registry. Every published tool must have a working
 * client implementation registered in src/components/tools/registry.tsx.
 */
export const TOOLS: Tool[] = [
  // ─── PDF Tools ───────────────────────────────────────────────
  { id: "pdf-to-jpg", category: "pdf-tools", title: "PDF to JPG", description: "Turn each page of a PDF into a high-quality JPG image you can download individually or all at once." },
  { id: "pdf-to-png", category: "pdf-tools", title: "PDF to PNG", description: "Export PDF pages as crisp PNG images with a transparent-friendly format, rendered at your chosen resolution." },
  { id: "jpg-to-pdf", category: "pdf-tools", title: "JPG to PDF", description: "Combine one or many JPG photos into a single PDF with page sizes, orientation and margins you control." },
  { id: "png-to-pdf", category: "pdf-tools", title: "PNG to PDF", description: "Convert PNG images into a polished PDF document, keeping full quality for screenshots and graphics." },
  { id: "webp-to-pdf", category: "pdf-tools", title: "WEBP to PDF", description: "Bundle modern WEBP images into a PDF document without first converting them by hand." },
  { id: "image-to-pdf", category: "pdf-tools", title: "Image to PDF", description: "Mix JPG, PNG and WEBP images in any order and merge them into one tidy PDF file." },
  { id: "merge-pdf", category: "pdf-tools", title: "Merge PDF", description: "Join several PDF documents into one file, arranging pages in exactly the order you want." },
  { id: "split-pdf", category: "pdf-tools", title: "Split PDF", description: "Cut a PDF into separate documents by page ranges or extract every page as its own file." },
  { id: "compress-pdf", category: "pdf-tools", title: "Compress PDF", description: "Shrink PDF file size by resampling embedded images, with a quality level you choose." },
  { id: "rotate-pdf", category: "pdf-tools", title: "Rotate PDF", description: "Rotate selected pages or a whole PDF by 90, 180 or 270 degrees and save the result permanently." },
  { id: "reorder-pages", category: "pdf-tools", title: "Reorder PDF Pages", description: "Drag pages into a new sequence visually and rebuild the PDF in that order." },
  { id: "delete-pages", category: "pdf-tools", title: "Delete PDF Pages", description: "Remove unwanted pages from a PDF by picking them visually or typing page ranges." },
  { id: "watermark-pdf", category: "pdf-tools", title: "Watermark PDF", description: "Stamp text like DRAFT or CONFIDENTIAL across every page with adjustable size, opacity and placement." },
  { id: "add-page-numbers", category: "pdf-tools", title: "Add Page Numbers", description: "Insert page numbers into a PDF with your choice of position, starting number and format." },
  { id: "pdf-viewer", category: "pdf-tools", title: "PDF Viewer", description: "Open and read a PDF privately in your browser with continuous scrolling and page navigation." },
  { id: "pdf-text-extractor", category: "pdf-tools", title: "PDF Text Extractor", description: "Pull all selectable text out of a PDF, page by page, ready to copy or download as TXT." },
  { id: "pdf-to-docx", category: "pdf-tools", title: "PDF to DOCX", description: "Extract the text of a PDF into an editable Word document. Layout is reflowed as flowing text, not pixel-perfect." },
  { id: "pdf-to-txt", category: "pdf-tools", title: "PDF to TXT", description: "Convert a PDF into a plain text file with page markers, ideal for indexing and quick reading." },
  { id: "pdf-to-excel", category: "pdf-tools", title: "PDF to Excel", description: "Detect table-like text lines in a PDF and export them as an Excel workbook for further editing." },
  { id: "pdf-to-powerpoint", category: "pdf-tools", title: "PDF to PowerPoint", description: "Place each PDF page as a full-slide image inside a PowerPoint deck you can present anywhere." },
  { id: "text-to-pdf", category: "pdf-tools", title: "Text to PDF", description: "Turn plain or Markdown-style text into a cleanly typeset PDF with adjustable font size and margins." },
  { id: "image-to-docx", category: "pdf-tools", title: "Image to DOCX", description: "Insert one or more images into a Word document, one per page or sized to fit, ready to download." },
  { id: "word-to-pdf", category: "pdf-tools", title: "Word to PDF", description: "Convert .docx files to PDF in your browser, preserving headings, paragraphs, lists and embedded images." },
  { id: "pdf-metadata-viewer", category: "pdf-tools", title: "PDF Metadata Viewer", description: "Inspect a PDF's title, author, creation date, page count and other internal details without uploading it." },

  // ─── Image Tools ─────────────────────────────────────────────
  { id: "image-compressor", category: "image-tools", title: "Image Compressor", description: "Shrink JPG, PNG and WEBP files with a quality slider and see the before/after size instantly." },
  { id: "compress-to-20kb", category: "image-tools", title: "Compress Image to 20 KB", description: "Squeeze any photo down to 20 KB or less for strict form uploads, adjusting quality automatically." },
  { id: "compress-to-50kb", category: "image-tools", title: "Compress Image to 50 KB", description: "Hit a 50 KB target size for online applications by auto-tuning compression until it fits." },
  { id: "compress-to-100kb", category: "image-tools", title: "Compress Image to 100 KB", description: "Compress images to 100 KB with automatic quality search, perfect for portal submissions." },
  { id: "compress-to-200kb", category: "image-tools", title: "Compress Image to 200 KB", description: "Reduce photos to 200 KB while keeping them looking good, using smart iterative compression." },
  { id: "image-resizer", category: "image-tools", title: "Image Resizer", description: "Resize images to exact pixel dimensions or a percentage, with optional aspect-ratio locking." },
  { id: "image-cropper", category: "image-tools", title: "Image Cropper", description: "Crop images freely or to standard ratios like 1:1 and 16:9 and download the trimmed result." },
  { id: "jpg-to-png", category: "image-tools", title: "JPG to PNG", description: "Convert JPG photos into PNG format, useful when you need lossless quality or transparency later." },
  { id: "png-to-jpg", category: "image-tools", title: "PNG to JPG", description: "Convert PNG images to JPG to cut file size, with a white background applied where transparency existed." },
  { id: "webp-to-jpg", category: "image-tools", title: "WEBP to JPG", description: "Turn WEBP images into universally supported JPG files that open in any software." },
  { id: "jpg-to-webp", category: "image-tools", title: "JPG to WEBP", description: "Convert JPG to the modern WEBP format for dramatically smaller files at similar quality." },
  { id: "png-to-webp", category: "image-tools", title: "PNG to WEBP", description: "Convert PNG images to WEBP, preserving transparency while shrinking the download size." },
  { id: "passport-photo-maker", category: "image-tools", title: "Passport Photo Maker", description: "Crop a portrait to standard passport sizes (35×45 mm and more) with guides and a print sheet layout." },
  { id: "signature-resizer", category: "image-tools", title: "Signature Resizer", description: "Resize and compress a scanned signature to the small dimensions forms usually demand." },
  { id: "image-rotator", category: "image-tools", title: "Image Rotator", description: "Rotate or flip any image by exact degrees or simple quarter turns and save the corrected version." },
  { id: "image-to-base64", category: "image-tools", title: "Image to Base64", description: "Encode an image as a Base64 data URI ready to paste into CSS, HTML or JSON." },
  { id: "base64-to-image", category: "image-tools", title: "Base64 to Image", description: "Decode a Base64 string back into a viewable, downloadable image file." },
  { id: "svg-to-png", category: "image-tools", title: "SVG to PNG", description: "Rasterise SVG graphics to PNG at 1×, 2× or 4× scale for use in places SVG is not accepted." },
  { id: "image-color-picker", category: "image-tools", title: "Image Color Picker", description: "Load an image and pick any pixel to get its HEX, RGB and HSL colour values." },
  { id: "favicon-generator", category: "image-tools", title: "Favicon Generator", description: "Create a complete favicon set (16, 32, 48, 180, 192, 512 px) from one square source image." },
  { id: "image-metadata-viewer", category: "image-tools", title: "Image Metadata Viewer", description: "Read the EXIF and PNG metadata embedded in your images — dimensions, camera, dates and more." },
  { id: "image-ocr", category: "image-tools", title: "Image OCR", description: "Extract typed text from photos and scans using on-device OCR — nothing is uploaded to any server." },

  // ─── QR Tools ────────────────────────────────────────────────
  { id: "qr-code-generator", category: "qr-tools", title: "QR Code Generator", description: "Create a QR code for any text or link with adjustable size, colours and error-correction level." },
  { id: "qr-code-scanner", category: "qr-tools", title: "QR Code Scanner", description: "Decode a QR code from an uploaded image or paste, entirely inside your browser." },
  { id: "camera-qr-scanner", category: "qr-tools", title: "Camera QR Scanner", description: "Scan QR codes live with your device camera — the stream is processed locally and never sent anywhere." },
  { id: "url-qr-generator", category: "qr-tools", title: "URL QR Generator", description: "Make a QR code that opens any web link when scanned, ready for print or screen." },
  { id: "wifi-qr-generator", category: "qr-tools", title: "Wi-Fi QR Generator", description: "Generate a QR code guests can scan to join your Wi-Fi network without typing the password." },
  { id: "whatsapp-qr-generator", category: "qr-tools", title: "WhatsApp QR Generator", description: "Create a QR code that opens a WhatsApp chat with a given number, optionally pre-filled with a message." },
  { id: "contact-qr-generator", category: "qr-tools", title: "Contact QR Generator", description: "Build a vCard QR code so people can save your full contact details with one scan." },
  { id: "email-qr-generator", category: "qr-tools", title: "Email QR Generator", description: "Generate a QR code that composes an email to your address with subject and body pre-filled." },
  { id: "phone-qr-generator", category: "qr-tools", title: "Phone QR Generator", description: "Make a QR code that dials a phone number the moment it is scanned." },
  { id: "barcode-generator", category: "qr-tools", title: "Barcode Generator", description: "Create EAN-13, EAN-8, UPC, CODE-128 and CODE-39 barcodes as downloadable PNG images." },
  { id: "barcode-scanner", category: "qr-tools", title: "Barcode Scanner", description: "Read the value and symbology of a barcode from an uploaded photo, processed on-device." },

  // ─── Network Tools ───────────────────────────────────────────
  { id: "what-is-my-ip", category: "network-tools", title: "What Is My IP", description: "See your public IPv4 or IPv6 address instantly, with a one-click copy button." },
  { id: "ipv4-lookup", category: "network-tools", title: "IPv4 Lookup", description: "Look up the country, city, ISP and network behind any IPv4 address." },
  { id: "ipv6-lookup", category: "network-tools", title: "IPv6 Lookup", description: "Resolve the geolocation and ownership details of any IPv6 address." },
  { id: "ip-geolocation", category: "network-tools", title: "IP Geolocation", description: "Find where an IP address is located on a map, including latitude, longitude and timezone." },
  { id: "ip-validator", category: "network-tools", title: "IP Validator", description: "Check whether a string is a valid IPv4 or IPv6 address and see its parsed form." },
  { id: "subnet-calculator", category: "network-tools", title: "Subnet Calculator", description: "Enter an IP and mask to get network, broadcast, wildcard, host range and usable host count." },
  { id: "cidr-calculator", category: "network-tools", title: "CIDR Calculator", description: "Convert CIDR notation into masks, ranges and host counts, and see the binary breakdown." },
  { id: "ip-range-calculator", category: "network-tools", title: "IP Range Calculator", description: "Expand an IP start and end into the full range, total addresses and implied CIDR blocks." },
  { id: "dns-lookup", category: "network-tools", title: "DNS Lookup", description: "Query A, AAAA, MX, TXT, NS, CNAME and SOA records for any domain via public DNS resolvers." },
  { id: "dns-propagation-checker", category: "network-tools", title: "DNS Propagation Checker", description: "Compare a record across Google and Cloudflare resolvers to see whether a DNS change has spread." },
  { id: "domain-rdap-lookup", category: "network-tools", title: "Domain RDAP Lookup", description: "Fetch registration data for a domain — registrar, dates and status — via the modern RDAP protocol." },
  { id: "asn-lookup", category: "network-tools", title: "ASN Lookup", description: "Identify the autonomous system, network name and prefix behind an IP address." },
  { id: "isp-lookup", category: "network-tools", title: "ISP Lookup", description: "Find out which internet provider serves an IP address and which organisation owns the range." },
  { id: "url-parser", category: "network-tools", title: "URL Parser", description: "Break any URL into protocol, host, port, path, query parameters and hash, cleanly labelled." },

  // ─── Developer Tools ─────────────────────────────────────────
  { id: "json-formatter", category: "developer-tools", title: "JSON Formatter", description: "Pretty-print messy JSON with chosen indentation and syntax highlighting." },
  { id: "json-validator", category: "developer-tools", title: "JSON Validator", description: "Validate JSON against the spec and pinpoint the exact line and column of any error." },
  { id: "json-minifier", category: "developer-tools", title: "JSON Minifier", description: "Strip whitespace from JSON to the smallest valid payload and see bytes saved." },
  { id: "xml-formatter", category: "developer-tools", title: "XML Formatter", description: "Indent and normalise XML documents so nested tags are easy to read." },
  { id: "html-formatter", category: "developer-tools", title: "HTML Formatter", description: "Re-indent HTML markup into a clean, consistent tree structure." },
  { id: "css-formatter", category: "developer-tools", title: "CSS Formatter", description: "Expand minified CSS into readable rules, one declaration per line." },
  { id: "javascript-formatter", category: "developer-tools", title: "JavaScript Formatter", description: "Re-indent JavaScript code with bracket-aware formatting for quick readability passes." },
  { id: "html-minifier", category: "developer-tools", title: "HTML Minifier", description: "Collapse whitespace and comments in HTML to ship smaller pages." },
  { id: "css-minifier", category: "developer-tools", title: "CSS Minifier", description: "Remove spaces, comments and final semicolons from CSS to cut bytes." },
  { id: "javascript-minifier", category: "developer-tools", title: "JavaScript Minifier", description: "Strip comments and unnecessary whitespace from JavaScript before quick testing." },
  { id: "base64-encoder", category: "developer-tools", title: "Base64 Encoder", description: "Encode text (or a file) to Base64 with full Unicode support." },
  { id: "base64-decoder", category: "developer-tools", title: "Base64 Decoder", description: "Decode Base64 strings back into readable text or a downloadable file." },
  { id: "url-encoder", category: "developer-tools", title: "URL Encoder", description: "Percent-encode text for safe use in URLs and query strings." },
  { id: "url-decoder", category: "developer-tools", title: "URL Decoder", description: "Decode percent-encoded URLs and query strings back into plain text." },
  { id: "uuid-generator", category: "developer-tools", title: "UUID Generator", description: "Generate RFC 4122 v4 UUIDs in bulk using the browser's cryptographic random source." },
  { id: "password-generator", category: "developer-tools", title: "Password Generator", description: "Create strong random passwords with configurable length and character sets, generated locally." },
  { id: "sha-256-generator", category: "developer-tools", title: "SHA-256 Generator", description: "Hash text or files with SHA-256 using the browser's native Web Crypto API." },
  { id: "sha-384-generator", category: "developer-tools", title: "SHA-384 Generator", description: "Produce SHA-384 digests of text or files directly in your browser." },
  { id: "sha-512-generator", category: "developer-tools", title: "SHA-512 Generator", description: "Compute SHA-512 hashes locally with the Web Crypto API — no data leaves your device." },
  { id: "regex-tester", category: "developer-tools", title: "Regex Tester", description: "Test regular expressions against sample text with live match highlighting and groups." },
  { id: "jwt-decoder", category: "developer-tools", title: "JWT Decoder", description: "Decode JWT header and payload claims and inspect expiry times — verification stays local." },
  { id: "html-previewer", category: "developer-tools", title: "HTML Previewer", description: "Render HTML snippets in a sandboxed iframe so nothing can touch the parent page." },
  { id: "css-gradient-generator", category: "developer-tools", title: "CSS Gradient Generator", description: "Design linear and radial gradients visually and copy the ready-to-use CSS." },
  { id: "meta-tag-generator", category: "developer-tools", title: "Meta Tag Generator", description: "Generate Open Graph and Twitter card meta tags by filling in a simple form." },
  { id: "robots-txt-generator", category: "developer-tools", title: "Robots.txt Generator", description: "Build a robots.txt file with allow/disallow rules, crawl delays and a sitemap reference." },
  { id: "sitemap-generator", category: "developer-tools", title: "Sitemap Generator", description: "Paste a list of URLs and produce a valid XML sitemap with lastmod and priority options." },

  // ─── Text Tools ──────────────────────────────────────────────
  { id: "word-counter", category: "text-tools", title: "Word Counter", description: "Count words, characters, sentences and reading time as you type or paste." },
  { id: "character-counter", category: "text-tools", title: "Character Counter", description: "Count characters with and without spaces, plus line and paragraph totals, live." },
  { id: "sentence-counter", category: "text-tools", title: "Sentence Counter", description: "Count sentences in any text using abbreviation-aware sentence boundary detection." },
  { id: "paragraph-counter", category: "text-tools", title: "Paragraph Counter", description: "Count paragraphs and average their length for essays, articles and reports." },
  { id: "case-converter", category: "text-tools", title: "Case Converter", description: "Switch text between UPPERCASE, lowercase, Title Case, Sentence case, camelCase and snake_case." },
  { id: "text-reverser", category: "text-tools", title: "Text Reverser", description: "Reverse characters, words or line order in any text with one click each." },
  { id: "duplicate-line-remover", category: "text-tools", title: "Duplicate Line Remover", description: "Delete repeated lines, optionally case-insensitively, and see how many were removed." },
  { id: "extra-space-remover", category: "text-tools", title: "Extra Space Remover", description: "Collapse double spaces, strip trailing whitespace and tidy blank lines in one pass." },
  { id: "text-sorter", category: "text-tools", title: "Text Sorter", description: "Sort lines alphabetically, by length, or numerically, in ascending or descending order." },
  { id: "lorem-ipsum-generator", category: "text-tools", title: "Lorem Ipsum Generator", description: "Generate classic placeholder paragraphs, sentences or words for design mock-ups." },
  { id: "slug-generator", category: "text-tools", title: "Slug Generator", description: "Turn any title into a clean, URL-safe slug with your preferred separator." },
  { id: "diff-checker", category: "text-tools", title: "Diff Checker", description: "Compare two texts line by line with highlighted additions and deletions." },
  { id: "markdown-editor", category: "text-tools", title: "Markdown Editor", description: "Write Markdown and see it rendered live side by side, then copy the HTML output." },
  { id: "html-entity-encoder", category: "text-tools", title: "HTML Entity Encoder", description: "Convert special characters into safe HTML entities to display code on web pages." },
  { id: "html-entity-decoder", category: "text-tools", title: "HTML Entity Decoder", description: "Turn HTML entities like &amp; and &#39; back into their original characters." },

  // ─── Calculators ─────────────────────────────────────────────
  { id: "percentage-calculator", category: "calculators", title: "Percentage Calculator", description: "Solve the three classic percentage problems: X% of Y, X is what % of Y, and % change." },
  { id: "age-calculator", category: "calculators", title: "Age Calculator", description: "Calculate exact age in years, months and days from any date of birth." },
  { id: "date-difference", category: "calculators", title: "Date Difference", description: "Count days, weeks, months and years between two dates, inclusive or exclusive." },
  { id: "time-duration", category: "calculators", title: "Time Duration", description: "Add or subtract hours and minutes from a start time, or measure a span between two times." },
  { id: "gpa-calculator", category: "calculators", title: "GPA Calculator", description: "Compute semester GPA from courses, credits and grades on the 4.0 scale." },
  { id: "cgpa-calculator", category: "calculators", title: "CGPA Calculator", description: "Combine multiple semesters into a cumulative GPA, weighted by credit hours." },
  { id: "grade-calculator", category: "calculators", title: "Grade Calculator", description: "Work out the overall grade and what you need on the final exam to hit your target." },
  { id: "discount-calculator", category: "calculators", title: "Discount Calculator", description: "See the final price and money saved for any percentage or fixed-amount discount." },
  { id: "profit-margin-calculator", category: "calculators", title: "Profit Margin Calculator", description: "Calculate cost, revenue, profit, margin and markup from any two inputs." },
  { id: "loan-calculator", category: "calculators", title: "Loan Calculator", description: "Estimate monthly payments and total interest for any loan amount, rate and term." },
  { id: "emi-calculator", category: "calculators", title: "EMI Calculator", description: "Compute the fixed monthly instalment for a loan with a full amortisation summary." },
  { id: "simple-interest-calculator", category: "calculators", title: "Simple Interest Calculator", description: "Calculate simple interest and the final amount from principal, rate and time." },
  { id: "compound-interest-calculator", category: "calculators", title: "Compound Interest Calculator", description: "See compound growth with yearly, monthly or daily compounding and a year-by-year table." },
  { id: "unit-converter", category: "calculators", title: "Unit Converter", description: "Convert length, weight, temperature, area, volume, speed and data size in one place." },
  { id: "currency-converter", category: "calculators", title: "Currency Converter", description: "Convert between world currencies using the free European Central Bank daily reference rates." },
  { id: "time-zone-converter", category: "calculators", title: "Time Zone Converter", description: "Convert a time between cities and time zones using the browser's IANA zone database." },
  { id: "salary-calculator", category: "calculators", title: "Salary Calculator", description: "Convert an annual salary into monthly, weekly, daily and hourly equivalents." },

  // ─── Data Tools ──────────────────────────────────────────────
  { id: "csv-to-json", category: "data-tools", title: "CSV to JSON", description: "Convert delimited data into structured JSON with headers, type inference and preview." },
  { id: "json-to-csv", category: "data-tools", title: "JSON to CSV", description: "Flatten an array of JSON objects into clean CSV you can open in any spreadsheet app." },
  { id: "csv-to-excel", category: "data-tools", title: "CSV to Excel", description: "Convert CSV files into a real .xlsx workbook with properly typed cells." },
  { id: "excel-to-csv", category: "data-tools", title: "Excel to CSV", description: "Extract a sheet from an .xlsx file as standard CSV, choosing the sheet and delimiter." },
  { id: "json-to-xml", category: "data-tools", title: "JSON to XML", description: "Transform JSON objects and arrays into well-formed XML with configurable root element." },
  { id: "xml-to-json", category: "data-tools", title: "XML to JSON", description: "Parse XML documents into equivalent JSON structures, with attributes preserved." },

  // ─── Business Tools ──────────────────────────────────────────
  { id: "invoice-generator", category: "business-tools", title: "Invoice Generator", description: "Create a professional invoice with line items, tax and totals, and download it as a PDF." },
  { id: "quotation-generator", category: "business-tools", title: "Quotation Generator", description: "Build a client-ready quotation with items, validity date and your terms, exported as PDF." },
  { id: "receipt-generator", category: "business-tools", title: "Receipt Generator", description: "Generate a clean payment receipt with items, amount paid and payment method as a PDF." },
  { id: "business-card-maker", category: "business-tools", title: "Business Card Maker", description: "Design a simple two-sided business card layout and export it as a print-ready PDF." },

  // ─── Productivity Tools ──────────────────────────────────────
  { id: "pomodoro-timer", category: "productivity-tools", title: "Pomodoro Timer", description: "Work in 25-minute focus sessions with automatic breaks and session tracking." },
  { id: "stopwatch", category: "productivity-tools", title: "Stopwatch", description: "A precise stopwatch with laps, accurate to hundredths of a second." },
  { id: "countdown-timer", category: "productivity-tools", title: "Countdown Timer", description: "Set a countdown with an alarm sound when time runs out — stays accurate in background tabs." },
  { id: "calendar-generator", category: "productivity-tools", title: "Calendar Generator", description: "Generate a printable monthly or yearly calendar for any year and month." },
  { id: "random-number-generator", category: "productivity-tools", title: "Random Number Generator", description: "Draw random numbers in any range using the browser's cryptographic source." },
  { id: "random-name-picker", category: "productivity-tools", title: "Random Name Picker", description: "Paste a list of names and pick one or more winners fairly with cryptographically random draws." },
];

export const TOOL_MAP: Record<string, Tool> = Object.fromEntries(
  TOOLS.map((t) => [t.id, t]),
);

export function toolsByCategory(category: string): Tool[] {
  return TOOLS.filter((t) => t.category === category);
}
