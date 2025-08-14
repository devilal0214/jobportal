import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface FormFieldData {
  label: string
  fieldType: string
  placeholder?: string
  options?: string[]
  cssClass?: string
  fieldId?: string
  fieldWidth?: string
  isRequired: boolean
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    
    if (!decoded || typeof decoded === 'string') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      include: { role: true } as any
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Only allow admin users to update forms
    if (!user.role || !['Administrator', 'Human Resources'].includes((user.role as any).name)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const resolvedParams = await params
    const { name, description, isDefault, fields } = await request.json()

    // If this is set as default, remove default from other forms
    if (isDefault) {
      // @ts-expect-error - Prisma client type issue after generation
      await prisma.form.updateMany({
        where: { 
          isDefault: true,
          id: { not: resolvedParams.id }
        },
        data: { isDefault: false }
      })
    }

    // Delete existing fields
    // @ts-ignore - Prisma client formId field recognition issue
    await prisma.formField.deleteMany({
      where: { formId: resolvedParams.id }
    })

    // Update form with new fields
    // @ts-expect-error - Prisma client type issue after generation
    const form = await prisma.form.update({
      where: { id: resolvedParams.id },
      data: {
        name,
        description: description || '',
        isDefault: isDefault || false,
        fields: {
          create: fields.map((field: FormFieldData, index: number) => ({
            fieldName: field.label.toLowerCase().replace(/\s+/g, '_'),
            fieldType: field.fieldType,
            label: field.label,
            placeholder: field.placeholder || '',
            options: field.options ? JSON.stringify(field.options) : null,
            cssClass: field.cssClass || '',
            fieldId: field.fieldId || '',
            fieldWidth: field.fieldWidth || '100%',
            isRequired: field.isRequired || false,
            order: index
          }))
        }
      },
      include: {
        fields: {
          orderBy: {
            order: 'asc'
          }
        }
      }
    })

    return NextResponse.json(form)
  } catch (error) {
    console.error('Failed to update form:', error)
    return NextResponse.json(
      { error: 'Failed to update form' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    
    if (!decoded || typeof decoded === 'string') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      include: { role: true } as any
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Only allow admin users to delete forms
    if (!user.role || !['Administrator', 'Human Resources'].includes((user.role as any).name)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const resolvedParams = await params

    // Delete form (fields will be deleted due to cascade)
    // @ts-expect-error - Prisma client type issue after generation
    await prisma.form.delete({
      where: { id: resolvedParams.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete form:', error)
    return NextResponse.json(
      { error: 'Failed to delete form' },
      { status: 500 }
    )
  }
}
