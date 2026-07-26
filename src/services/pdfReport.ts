export async function exportElementToPdf(element: HTMLElement, filename: string) {
  const [{ jsPDF }, html2canvasModule] = await Promise.all([import('jspdf'), import('html2canvas')])
  const canvas = await html2canvasModule.default(element, {
    backgroundColor: '#fbfaf7',
    scale: 2,
    logging: false,
  })
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 24
  const imageWidth = pageWidth - margin * 2
  const imageHeight = (canvas.height / canvas.width) * imageWidth
  const printableHeight = pageHeight - margin * 2
  const imageData = canvas.toDataURL('image/png')
  const pageCount = Math.max(1, Math.ceil(imageHeight / printableHeight))

  for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
    if (pageIndex > 0) pdf.addPage()
    pdf.addImage(imageData, 'PNG', margin, margin - pageIndex * printableHeight, imageWidth, imageHeight)
  }

  pdf.save(filename)
}
