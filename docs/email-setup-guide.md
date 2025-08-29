# Email Setup Guide

## Overview

The school management system now includes email functionality for sending welcome emails to students and parents with their login credentials. This feature uses Resend as the email service provider.

## Setup Instructions

### 1. Create a Resend Account

1. Go to [resend.com](https://resend.com)
2. Sign up for a free account
3. Verify your email address

### 2. Get Your API Key

1. After logging in, go to the API Keys section
2. Create a new API key
3. Copy the API key (it starts with `re_`)

### 3. Configure Environment Variables

Add the following environment variable to your `.env.local` file:

```bash
RESEND_API_KEY=re_your_api_key_here
```

### 4. Verify Domain (Optional but Recommended)

For production use, you should verify your domain with Resend:

1. Go to the Domains section in your Resend dashboard
2. Add your domain (e.g., `gbhs-yaounde.cm`)
3. Follow the DNS verification instructions
4. Update the `from` email address in `lib/email-service.ts` to use your verified domain

## Features

### Welcome Email Functionality

When a new student is enrolled, the system will:

1. **Generate passwords** for both student and parent accounts
2. **Create user accounts** in the database with the generated passwords
3. **Send welcome emails** to both student and parent with their login credentials
4. **Display credentials** in the enrollment success dialog for manual copying

### Email Content

The welcome emails include:

- **Student Email:**
  - Student ID and password
  - Class information
  - Next steps for enrollment completion
  - Security reminders

- **Parent Email:**
  - Parent access code and password
  - Student information
  - Available parent portal features
  - Security reminders

### Email Templates

The emails are sent as HTML with:
- Professional styling
- School branding
- Clear credential display
- Important security notices
- Contact information

## Testing

To test the email functionality:

1. Ensure your `RESEND_API_KEY` is set correctly
2. Enroll a new student with valid email addresses
3. Click "Send Email Notification" in the enrollment success dialog
4. Check the email addresses for the welcome emails

## Troubleshooting

### Common Issues

1. **Emails not sending:**
   - Check that `RESEND_API_KEY` is set correctly
   - Verify the API key is valid in your Resend dashboard
   - Check the browser console for error messages

2. **Emails going to spam:**
   - Verify your domain with Resend
   - Use a verified domain in the `from` address
   - Ensure proper email content and formatting

3. **API rate limits:**
   - Resend free tier allows 100 emails/day
   - Upgrade to paid plan for higher limits

### Error Handling

The system includes error handling for:
- Invalid API keys
- Network connectivity issues
- Invalid email addresses
- Rate limiting

## Security Considerations

1. **Password Security:**
   - Passwords are generated using secure algorithms
   - Passwords expire after 30 days
   - Users are prompted to change passwords on first login

2. **Email Security:**
   - Credentials are sent only to verified email addresses
   - Emails include security reminders
   - No sensitive data is logged

3. **API Security:**
   - API keys are stored in environment variables
   - Never commit API keys to version control
   - Use different keys for development and production

## Production Deployment

For production deployment:

1. **Use a verified domain** for sending emails
2. **Set up proper DNS records** for email deliverability
3. **Monitor email delivery** through Resend dashboard
4. **Implement email logging** for audit purposes
5. **Set up email templates** with your school's branding

## Support

For issues with the email functionality:

1. Check the browser console for error messages
2. Verify your Resend account and API key
3. Test with a simple email first
4. Contact the development team if issues persist
