import { Tool } from "@/data/tools";
import { Category } from "@/data/categories";

/**
 * Category-aware editorial content for tool pages. Each tool page gets
 * a how-to, a privacy note and FAQs that reference the tool by name —
 * written per category so pages are not copy-pasted duplicates.
 */
export function toolHowTo(tool: Tool): string[] {
  switch (tool.category) {
    case "pdf-tools":
      return [
        `Add your PDF file (or images) using the drop zone — the file opens directly in your browser.`,
        `Choose the options you need; a live preview shows what the result will look like.`,
        `Press the action button and wait for the progress indicator to finish.`,
        `Download the result and verify it opens correctly in your PDF reader.`,
      ];
    case "image-tools":
      return [
        `Drop your image into the upload area, or click to browse your device.`,
        `Adjust the size, quality or format settings to suit your needs.`,
        `Preview the processed image before committing to a download.`,
        `Save the output file to your device — the original stays untouched.`,
      ];
    case "qr-tools":
      return [
        `Enter the content you want to encode, or upload an image to decode.`,
        `Pick your styling options such as size and colours where offered.`,
        `Generate or scan — everything happens locally in your browser.`,
        `Download the code as a PNG or copy the decoded text.`,
      ];
    case "network-tools":
      return [
        `Enter an IP address or domain, or use the automatic lookup for your own connection.`,
        `Results are fetched from documented free public endpoints with request timeouts.`,
        `Review the structured results and copy any values you need.`,
      ];
    case "developer-tools":
      return [
        `Paste your input text into the editor, or type directly.`,
        `Choose formatting options where relevant.`,
        `Run the operation and check the highlighted output.`,
        `Copy the result to your clipboard or download it as a file.`,
      ];
    case "text-tools":
      return [
        `Type or paste your text into the editor.`,
        `Live statistics and previews update as you type.`,
        `Apply the transformation with a single click.`,
        `Copy or download the cleaned-up text.`,
      ];
    case "calculators":
      return [
        `Fill in the values you know — labels explain exactly what each field means.`,
        `Results update immediately, with the formula shown below for transparency.`,
        `Adjust the inputs to compare different scenarios side by side.`,
      ];
    case "data-tools":
      return [
        `Upload your data file or paste its contents into the input area.`,
        `Check the detected structure in the preview table.`,
        `Convert and download the result in the format you selected.`,
      ];
    case "business-tools":
      return [
        `Fill in your business details, the client's information and the line items.`,
        `Totals, tax and discounts are calculated automatically.`,
        `Preview the document, then export it as a PDF ready to send.`,
      ];
    case "productivity-tools":
      return [
        `Open the tool and configure the settings such as duration or list of items.`,
        `Start the timer or run the action — it keeps working even if you switch tabs.`,
        `Use the results or reset and run it again as often as you like.`,
      ];
    default:
      return ["Open the tool, provide your input, and download the result."];
  }
}

export function toolPrivacy(tool: Tool): string {
  if (tool.category === "network-tools") {
    return "This tool queries documented free public endpoints (such as ipify, ipwho.is, Cloudflare DNS and Google DNS) to answer your lookup. Only the IP address or domain you type is sent to those services. We do not store your queries.";
  }
  if (tool.category === "qr-tools") {
    return "QR and barcode generation and scanning run entirely in your browser. Images from your camera or files are processed on your device and never uploaded to any server.";
  }
  return "This tool processes everything locally in your browser. Your files and text are never uploaded to a server — nothing you do here is stored, logged or transmitted.";
}

export function toolFaqs(tool: Tool, category: Category): Array<{ q: string; a: string }> {
  return [
    {
      q: `Is ${tool.title} free to use?`,
      a: "Yes. Every tool on BuiltByUmer is completely free, with no account required and no usage caps beyond reasonable file-size limits that protect your browser's memory.",
    },
    {
      q: `Does ${tool.title} upload my files to a server?`,
      a: tool.category === "network-tools"
        ? "No files are uploaded. For network lookups, only the address or domain you type is sent to the free public API that answers the query."
        : "No. All processing happens in your browser using modern web APIs, so your files stay on your device the whole time.",
    },
    {
      q: `What file types does ${tool.title} support?`,
      a: `${category.short} The supported formats and limits are shown in the upload area of the tool itself.`,
    },
    {
      q: "Can I use this tool on my phone?",
      a: "Yes — the whole site is built mobile-first and every tool works on Android and iOS browsers, including camera access where relevant.",
    },
  ];
}
