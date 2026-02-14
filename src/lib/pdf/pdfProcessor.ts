import * as pdfjsLib from 'pdfjs-dist'

// PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString()

export interface PDFPage {
  pageNumber: number
  imageData: string // data URL
  width: number
  height: number
}

export interface PDFMetadata {
  title?: string
  author?: string
  subject?: string
  creator?: string
  pageCount: number
}

export interface ExtractPDFOptions {
  onProgress?: (current: number, total: number) => void
  scale?: number
}

/**
 * Load PDF document from ArrayBuffer
 */
export async function loadPDF(arrayBuffer: ArrayBuffer): Promise<pdfjsLib.PDFDocumentProxy> {
  const typedArray = new Uint8Array(arrayBuffer)
  return await pdfjsLib.getDocument({ data: typedArray }).promise
}

/**
 * Extract PDF metadata
 */
export async function extractPDFMetadata(
  pdf: pdfjsLib.PDFDocumentProxy
): Promise<PDFMetadata> {
  const metadata = await pdf.getMetadata().catch(() => ({}))
  const info = metadata.info || {}

  return {
    title: info.Title,
    author: info.Author,
    subject: info.Subject,
    creator: info.Creator,
    pageCount: pdf.numPages,
  }
}

/**
 * Render PDF page to image (data URL)
 */
export async function renderPDFPage(
  pdf: pdfjsLib.PDFDocumentProxy,
  pageNumber: number,
  scale: number = 1.5
): Promise<PDFPage> {
  const page = await pdf.getPage(pageNumber)
  const viewport = page.getViewport({ scale })

  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('Failed to get canvas context')
  }

  canvas.width = viewport.width
  canvas.height = viewport.height

  await page.render({
    canvasContext: context,
    viewport,
  }).promise

  const imageData = canvas.toDataURL('image/webp', 0.85)

  return {
    pageNumber,
    imageData,
    width: viewport.width,
    height: viewport.height,
  }
}

/**
 * Extract all pages from PDF as images
 */
export async function extractPDFPages(
  arrayBuffer: ArrayBuffer,
  options: ExtractPDFOptions = {}
): Promise<PDFPage[]> {
  const { onProgress, scale = 1.5 } = options

  const pdf = await loadPDF(arrayBuffer)
  const total = pdf.numPages
  const pages: PDFPage[] = []

  for (let i = 1; i <= total; i++) {
    const page = await renderPDFPage(pdf, i, scale)
    pages.push(page)
    onProgress?.(i, total)
  }

  return pages
}

/**
 * Validate PDF file
 */
export async function isValidPDF(arrayBuffer: ArrayBuffer): Promise<boolean> {
  try {
    const pdf = await loadPDF(arrayBuffer)
    return pdf.numPages > 0
  } catch {
    return false
  }
}
