import { downloadBlob } from '../utils/dashboardHelpers'

export async function exportElementToPdf(element: HTMLElement, filename: string) {
  const [{ jsPDF }, html2canvasModule] = await Promise.all([import('jspdf'), import('html2canvas')])
  const bounds = element.getBoundingClientRect()
  if (!bounds.width || !bounds.height) throw new Error('The report has no printable area')
  const scale = Math.min(2, Math.sqrt(4_000_000 / (bounds.width * bounds.height)))
  const canvas = await html2canvasModule.default(element, {
    backgroundColor: '#fbfaf7',
    scale,
    logging: false,
    ignoreElements: node => !!element.ownerDocument.body.contains(node)
      && !node.contains(element) && !element.contains(node),
    onclone: (_doc, report) => {
      report.style.position = 'static'
      report.style.margin = '0'
    },
  })
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 24
  const imageWidth = pageWidth - margin * 2
  const context = canvas.getContext('2d')
  if (!context || !canvas.width || !canvas.height) throw new Error('Cannot read rendered report pixels')
  const pixelsPerPoint = canvas.width / imageWidth
  const rowsPerPage = Math.max(1, Math.floor((pageHeight - margin * 2) * pixelsPerPoint))
  try {
    for (let top = 0; top < canvas.height; top += rowsPerPage) {
      const rows = Math.min(rowsPerPage, canvas.height - top)
      const pixels = context.getImageData(0, top, canvas.width, rows)
      if (top > 0) pdf.addPage()
      pdf.addImage(pixels, 'RGBA', margin, margin, imageWidth, rows / pixelsPerPoint)
    }
  } finally {
    canvas.width = 0
    canvas.height = 0
  }

  downloadBlob(pdf.output('blob'), 'application/pdf', filename)
}
