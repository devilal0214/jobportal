// Fix job form assignments
const { PrismaClient } = require('@prisma/client')

async function fixJobFormAssignments() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔧 FIXING JOB FORM ASSIGNMENTS\n')
    
    // Get all jobs without forms
    const jobsWithoutForms = await prisma.job.findMany({
      where: { formId: null },
      include: { form: true }
    })
    
    // Get available forms
    const forms = await prisma.form.findMany()
    const defaultForm = forms.find(f => f.isDefault) || forms[0]
    
    console.log(`📋 Found ${jobsWithoutForms.length} jobs without forms`)
    console.log(`📝 Available forms: ${forms.length}`)
    console.log(`🎯 Default form: ${defaultForm?.name || 'None'}`)
    
    if (jobsWithoutForms.length > 0 && defaultForm) {
      console.log('\n🔄 Assigning default form to jobs without forms...')
      
      for (const job of jobsWithoutForms) {
        await prisma.job.update({
          where: { id: job.id },
          data: { formId: defaultForm.id }
        })
        console.log(`   ✅ ${job.title} → ${defaultForm.name}`)
      }
      
      console.log(`\n✅ Updated ${jobsWithoutForms.length} jobs`)
    } else if (jobsWithoutForms.length > 0 && !defaultForm) {
      console.log('\n❌ No default form available to assign!')
      console.log('💡 Create forms first using create-sample-forms.js')
    } else {
      console.log('\n✅ All jobs already have forms assigned')
    }
    
    // Show final status
    console.log('\n📊 FINAL STATUS')
    const allJobs = await prisma.job.findMany({
      include: { form: true }
    })
    
    allJobs.forEach(job => {
      console.log(`   💼 ${job.title} → ${job.form?.name || 'NO FORM ⚠️'}`)
    })
    
  } catch (error) {
    console.error('❌ Fix failed:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

fixJobFormAssignments()
