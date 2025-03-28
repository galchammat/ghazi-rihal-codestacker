import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);

const DEFAULT_SENDER = 'dccms.sender@alcham.me';
const DEFAULT_RECIPIENT = process.env.COMMUNITY_EMAIL;

interface SendEmailOptions {
  subject: string;
  text: string;
}

export const sendEmail = async (params: SendEmailOptions): Promise<void> => {
  const { subject, text } = params;

  const msg = {
    to: DEFAULT_RECIPIENT,
    from: DEFAULT_SENDER,
    subject,
    text,
  };

  try {
    await sgMail.send(msg);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
};