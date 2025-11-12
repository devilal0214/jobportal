import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { emailHost, emailPort, emailUser, emailPassword, emailFrom } = body

    // Validate required fields
    if (!emailHost || !emailPort || !emailUser || !emailPassword) {
      return NextResponse.json(
        { success: false, message: 'Please fill in all SMTP configuration fields.' },
        { status: 400 }
      )
    }

    // Create transporter with provided settings
    const transporter = nodemailer.createTransport({
      host: emailHost,
      port: parseInt(emailPort),
      secure: parseInt(emailPort) === 465, // true for 465, false for other ports
      auth: {
        user: emailUser,
        pass: emailPassword,
      },
    })

    // Verify connection
    await transporter.verify()

    // Send test email
    await transporter.sendMail({
      from: emailFrom || emailUser,
      to: emailUser, // Send test email to the configured email address
      subject: 'SMTP Test - Job Portal',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">SMTP Configuration Test</h2>
          <p>Congratulations! Your SMTP settings are configured correctly.</p>
          <p>This is a test email sent from your Job Portal application.</p>
          <hr style="border: 1px solid #E5E7EB; margin: 20px 0;">
          <p style="color: #6B7280; font-size: 14px;">
            <strong>SMTP Details:</strong><br>
            Host: ${emailHost}<br>
            Port: ${emailPort}<br>
            Username: ${emailUser}
          </p>
          <p style="color: #6B7280; font-size: 14px; margin-top: 20px;">
            If you received this email, your email configuration is working properly.
          </p>
        </div>
      `,
      text: `SMTP Configuration Test - Your SMTP settings are configured correctly. This is a test email sent from your Job Portal application.`
    })

    return NextResponse.json({
      success: true,
      message: `✓ Test email sent successfully to ${emailUser}`
    })
  } catch (error: unknown) {
    console.error('SMTP test error:', error)
    
    let errorMessage = 'SMTP connection failed. Please check your settings.'
    
    if (error instanceof Error) {
      // Provide more specific error messages
      if (error.message.includes('EAUTH')) {
        errorMessage = '✗ Authentication failed. Please check your username and password.'
      } else if (error.message.includes('ECONNREFUSED')) {
        errorMessage = '✗ Connection refused. Please check your host and port.'
      } else if (error.message.includes('ETIMEDOUT')) {
        errorMessage = '✗ Connection timeout. Please check your host and firewall settings.'
      } else if (error.message.includes('ENOTFOUND')) {
        errorMessage = '✗ Host not found. Please check your SMTP host address.'
      } else {
        errorMessage = `✗ ${error.message}`
      }
    }

    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 400 }
    )
  }
}
