const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkWidgetLogos() {
  try {
    const result = await prisma.settings.findUnique({
      where: { key: 'careers_footer_widgets' }
    })
    
    if (!result) {
      console.log('❌ No careers_footer_widgets found in database')
      return
    }
    
    const widgets = JSON.parse(result.value)
    console.log('\n📊 Footer Widgets Data:\n')
    console.log(JSON.stringify(widgets, null, 2))
    
    console.log('\n🖼️  Widget Logo Paths:\n')
    widgets.forEach((widget, index) => {
      console.log(`Widget ${index + 1} (${widget.title || 'Untitled'}):`)
      console.log(`  - type: ${widget.type}`)
      console.log(`  - id: ${widget.id}`)
      if (widget.type === 'logo') {
        console.log(`  - logoImage: ${widget.logoImage || 'NOT SET'}`)
        console.log(`  - Is placeholder: ${widget.logoImage?.startsWith('WIDGET_LOGO_') ? 'YES ❌' : 'NO ✅'}`)
        console.log(`  - Is base64: ${widget.logoImage?.startsWith('data:') ? 'YES ❌' : 'NO ✅'}`)
        console.log(`  - Is path: ${widget.logoImage?.startsWith('/uploads/') ? 'YES ✅' : 'NO ❌'}`)
      }
    })
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkWidgetLogos()
