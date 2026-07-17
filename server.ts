import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import nodemailer from 'nodemailer';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON parsing middleware
  app.use(express.json());

  interface SmtpSettings {
    host?: string;
    port?: number | string;
    username?: string;
    password?: string;
    senderName?: string;
    senderEmail?: string;
  }

  // Nodemailer transporter helper
  const getTransporter = (smtpSettings?: SmtpSettings) => {
    const host = (smtpSettings?.host && smtpSettings.host.trim()) || process.env.SMTP_HOST;
    const port = Number(smtpSettings?.port || process.env.SMTP_PORT || 587);
    const user = (smtpSettings?.username && smtpSettings.username.trim()) || process.env.SMTP_USER;
    const pass = (smtpSettings?.password && smtpSettings.password.trim()) || process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      return null;
    }

    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for other ports
      auth: {
        user,
        pass,
      },
    });
  };

  // API endpoints FIRST

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // SMTP Connection & Dispatch Test Endpoint
  app.post('/api/test-smtp', async (req, res) => {
    const { 
      recipient, 
      smtpHost, 
      smtpPort, 
      smtpUsername, 
      smtpPassword, 
      senderName, 
      senderEmail, 
      language 
    } = req.body;

    if (!recipient) {
      return res.status(400).json({ success: false, error: 'Recipient email is required.' });
    }

    const host = smtpHost && smtpHost.trim();
    const port = Number(smtpPort || 587);
    const user = smtpUsername && smtpUsername.trim();
    const pass = smtpPassword && smtpPassword.trim();

    if (!host || !user || !pass) {
      return res.status(400).json({ 
        success: false, 
        error: 'Incomplete SMTP server configuration. Host, Username, and Password are required.' 
      });
    }

    const isEn = language !== 'hi';
    const subject = isEn 
      ? `[Rathi Build Mart] Secure SMTP Gateway Dispatch Test`
      : `[राठी बिल्डमार्ट] सुरक्षित SMTP गेटवे प्रेषण परीक्षण`;

    const htmlContent = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f7f6; padding: 40px 10px; text-align: center;">
        <div style="max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; text-align: left;">
          <div style="background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%); padding: 25px; text-align: center; color: #ffffff;">
            <h2 style="margin: 0; font-size: 18px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;">SMTP Connection Test</h2>
            <p style="margin: 5px 0 0 0; font-size: 11px; opacity: 0.8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Rathi Build Mart Mailer</p>
          </div>
          <div style="padding: 30px 25px; color: #334155;">
            <p style="font-size: 13px; color: #4f46e5; font-weight: 800; margin-top: 0; text-transform: uppercase; letter-spacing: 0.5px;">Connection Successful!</p>
            <p style="font-size: 14px; font-weight: 700;">Hello Administrator,</p>
            <p style="font-size: 13px; line-height: 1.6; font-weight: 500;">
              This is a secure live test email dispatched automatically from your Rathi Build Mart Employee Portal settings. 
              If you are reading this message, your custom SMTP outbound mail server routing and authentication credentials have been successfully validated.
            </p>
            
            <div style="background-color: #f8fafc; border-radius: 12px; padding: 18px; margin: 20px 0; border: 1px solid #e2e8f0; font-size: 11px;">
              <span style="font-size: 10px; color: #64748b; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">DISPATCH METADATA</span>
              <table style="width: 100%; border-collapse: collapse; font-family: monospace;">
                <tr>
                  <td style="padding: 4px 0; color: #64748b; width: 35%;">SMTP Host:</td>
                  <td style="padding: 4px 0; font-weight: 700; color: #1e293b;">${host}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #64748b;">SMTP Port:</td>
                  <td style="padding: 4px 0; font-weight: 700; color: #1e293b;">${port}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #64748b;">Sender Alias:</td>
                  <td style="padding: 4px 0; font-weight: 700; color: #1e293b;">${senderName || 'Rathi Build Mart'}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #64748b;">Sender Email:</td>
                  <td style="padding: 4px 0; font-weight: 700; color: #1e293b;">${senderEmail || user}</td>
                </tr>
              </table>
            </div>
            
            <p style="font-size: 11px; color: #64748b; line-height: 1.5; margin-bottom: 0;">
              This test confirms active mail delivery. No further action is required. You can now securely use this gateway for all portal OTP credentials and automated team onboarding messages.
            </p>
          </div>
          <div style="background-color: #f8fafc; padding: 15px; text-align: center; border-top: 1px solid #f1f5f9; font-size: 10px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
            © ${new Date().getFullYear()} Rathi Build Mart • Systems Gateway
          </div>
        </div>
      </div>
    `;

    const textContent = `SMTP Connection Test Successful!\n\nThis is a live SMTP gateway dispatch test email.\n\nHost: ${host}\nPort: ${port}\nSender Alias: ${senderName || 'Rathi Build Mart'}`;

    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: {
          user,
          pass,
        },
      });

      const fromAddress = senderEmail && senderEmail.trim()
        ? `"${senderName || 'Rathi Build Mart'}" <${senderEmail.trim()}>`
        : `"${senderName || 'Rathi Build Mart'}" <${user}>`;

      await transporter.sendMail({
        from: fromAddress,
        to: recipient,
        subject,
        text: textContent,
        html: htmlContent,
      });

      console.log(`[SMTP Test] Test email successfully dispatched to ${recipient}`);
      return res.json({ success: true, message: 'Test email dispatched successfully.' });
    } catch (error: any) {
      console.error('[SMTP Test Error] Failed to dispatch test email:', error);
      return res.status(500).json({ success: false, error: error.message || 'Failed to dispatch test email over specified SMTP configuration.' });
    }
  });

  // 1. Send OTP Endpoint
  app.post('/api/send-otp', async (req, res) => {
    const { email, otp, empName, purpose, language, smtpSettings } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, error: 'Email and OTP are required.' });
    }

    const isEn = language !== 'hi';
    const subject = isEn 
      ? `[Rathi Build Mart] OTP for Secure ${purpose === 'login' ? 'Login' : 'Password Reset'}`
      : `[राठी बिल्डमार्ट] सुरक्षित ${purpose === 'login' ? 'लॉगिन' : 'पासवर्ड रीसेट'} के लिए ओटीपी`;

    const titleText = isEn
      ? `${purpose === 'login' ? 'Secure Login Verification' : 'Password Reset Request'}`
      : `${purpose === 'login' ? 'सुरक्षित लॉगिन सत्यापन' : 'पासवर्ड रीसेट अनुरोध'}`;

    const greetingText = isEn
      ? `Hello ${empName || 'Employee'},`
      : `नमस्कार ${empName || 'कर्मचारी'},`;

    const bodyText = isEn
      ? `You have requested to ${purpose === 'login' ? 'log in' : 'reset your password'} for your Rathi Build Mart Employee Portal account. Use the secure One-Time Password (OTP) below to complete the action.`
      : `आपने अपने राठी बिल्डमार्ट कर्मचारी पोर्टल खाते के लिए ${purpose === 'login' ? 'लॉगिन' : 'पासवर्ड रीसेट'} करने का अनुरोध किया है। कार्रवाई को पूरा करने के लिए नीचे दिए गए सुरक्षित वन-टाइम पासवर्ड (ओटीपी) का उपयोग करें।`;

    const footerText = isEn
      ? `This OTP is valid for 10 minutes. If you did not initiate this request, please change your password immediately or contact your systems administrator.`
      : `यह ओटीपी 10 मिनट के लिए मान्य है। यदि आपने यह अनुरोध नहीं किया है, तो कृपया तुरंत अपना पासवर्ड बदलें या अपने सिस्टम व्यवस्थापक से संपर्क करें।`;

    const htmlContent = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f8fafc; padding: 40px 10px; text-align: center;">
        <div style="max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; text-align: left;">
          <div style="background: linear-gradient(135deg, #0f172a 0%, #022c22 100%); padding: 25px; text-align: center; color: #ffffff;">
            <h2 style="margin: 0; font-size: 18px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;">Rathi Build Mart</h2>
            <p style="margin: 5px 0 0 0; font-size: 11px; opacity: 0.8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Employee Portal Security</p>
          </div>
          <div style="padding: 30px 25px;">
            <p style="font-size: 13px; color: #64748b; font-weight: 700; margin-top: 0; text-transform: uppercase; letter-spacing: 0.5px;">${titleText}</p>
            <p style="font-size: 14px; color: #334155; font-weight: 700;">${greetingText}</p>
            <p style="font-size: 13px; color: #475569; line-height: 1.6; font-weight: 500;">${bodyText}</p>
            
            <div style="background-color: #f1f5f9; border-radius: 12px; padding: 20px; text-align: center; margin: 25px 0; border: 1px dashed #cbd5e1;">
              <span style="font-size: 10px; color: #64748b; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">ONE-TIME OTP CODE</span>
              <span style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 900; color: #059669; letter-spacing: 6px; display: inline-block; padding: 5px 15px;">${otp}</span>
            </div>

            <p style="font-size: 11px; color: #64748b; line-height: 1.6; margin-bottom: 0; font-weight: 500;">${footerText}</p>
          </div>
          <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #f1f5f9; font-size: 10px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
            © ${new Date().getFullYear()} Rathi Build Mart • Security Gateway
          </div>
        </div>
      </div>
    `;

    const textContent = `${subject}\n\n${greetingText}\n\n${bodyText}\n\nOTP Code: ${otp}\n\n${footerText}`;

    try {
      const transporter = getTransporter(smtpSettings);
      if (transporter) {
        let fromAddress = process.env.SMTP_FROM || '"Rathi Build Mart" <noreply@rathibuildmart.com>';
        if (smtpSettings?.senderEmail && smtpSettings.senderEmail.trim()) {
          const senderNameAlias = (smtpSettings.senderName && smtpSettings.senderName.trim()) || 'Rathi Build Mart';
          fromAddress = `"${senderNameAlias}" <${smtpSettings.senderEmail.trim()}>`;
        } else if (process.env.SMTP_USER) {
          fromAddress = `"Rathi Build Mart" <${process.env.SMTP_USER}>`;
        }

        await transporter.sendMail({
          from: fromAddress,
          to: email,
          subject,
          text: textContent,
          html: htmlContent,
        });
        console.log(`[SMTP] OTP email successfully sent to ${email}`);
        return res.json({ success: true, method: 'SMTP', message: 'Email sent successfully via real SMTP server.' });
      } else {
        // Fallback simulation mode
        console.log(`[SIMULATION] No SMTP configuration found. OTP for ${email} is ${otp}`);
        return res.json({ 
          success: true, 
          method: 'SIMULATION', 
          message: 'Running in simulation mode (no SMTP configured in .env). Email logged on server terminal.',
          debugPayload: {
            to: email,
            subject,
            otp,
            html: htmlContent
          }
        });
      }
    } catch (error: any) {
      console.error('[SMTP Error] Failed to send OTP email:', error);
      return res.status(500).json({ success: false, error: error.message || 'SMTP Server failed to dispatch email.' });
    }
  });

  // 2. Send Welcome Email Endpoint
  app.post('/api/send-welcome', async (req, res) => {
    const { email, empId, empName, tempPassword, language, smtpSettings } = req.body;

    if (!email || !empId || !empName) {
      return res.status(400).json({ success: false, error: 'Email, Employee ID and Name are required.' });
    }

    const isEn = language !== 'hi';
    const subject = isEn 
      ? `Welcome to Rathi Build Mart! Your Employee Access Credentials`
      : `राठी बिल्डमार्ट में आपका स्वागत है! आपके कर्मचारी लॉगिन क्रेडेंशियल`;

    const titleText = isEn
      ? `Welcome to the Team!`
      : `टीम में आपका स्वागत है!`;

    const bodyText = isEn
      ? `Congratulations on your onboarding! An official employee account has been securely created for you in the Rathi Build Mart HR & Payroll Portal. Use the secure credentials below to access your workspace, log attendance, view payslips, and raise leaves.`
      : `आपके ऑनबोर्डिंग पर बधाई! राठी बिल्डमार्ट एचआर और पेरोल पोर्टल में आपके लिए एक आधिकारिक कर्मचारी खाता सुरक्षित रूप से बनाया गया है। अपने कार्यक्षेत्र तक पहुंचने, उपस्थिति दर्ज करने, सैलरी स्लिप देखने और छुट्टी का अनुरोध करने के लिए नीचे दिए गए क्रेडेंशियल का उपयोग करें।`;

    const credentialsTitle = isEn ? 'YOUR ACCESS CREDENTIALS' : 'आपके लॉगिन क्रेडेंशियल';
    const empIdLabel = isEn ? 'Employee ID (User ID):' : 'कर्मचारी आईडी (यूज़र आईडी):';
    const passwordLabel = isEn ? 'Default Password:' : 'डिफ़ॉल्ट पासवर्ड:';
    const loginLinkLabel = isEn ? 'Portal Access Link:' : 'पोर्टल एक्सेस लिंक:';

    const noticeText = isEn
      ? `For security, you must log in and change your password during your first portal visit. This account is subject to device locking policy.`
      : `सुरक्षा के लिए, आपको अपनी पहली पोर्टल विज़िट के दौरान लॉग इन करना होगा और अपना पासवर्ड बदलना होगा। यह खाता डिवाइस लॉकिंग नीति के अधीन है।`;

    const htmlContent = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f8fafc; padding: 40px 10px; text-align: center;">
        <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; text-align: left;">
          <div style="background: linear-gradient(135deg, #022c22 0%, #065f46 100%); padding: 30px 25px; text-align: center; color: #ffffff;">
            <h2 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;">Rathi Build Mart</h2>
            <p style="margin: 5px 0 0 0; font-size: 11px; opacity: 0.9; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Onboarding & HR Management</p>
          </div>
          <div style="padding: 30px 25px;">
            <p style="font-size: 15px; color: #059669; font-weight: 800; margin-top: 0; text-transform: uppercase; letter-spacing: 0.5px;">${titleText}</p>
            <p style="font-size: 14px; color: #1e293b; font-weight: 700;">Hello ${empName},</p>
            <p style="font-size: 13px; color: #475569; line-height: 1.6; font-weight: 500;">${bodyText}</p>
            
            <div style="background-color: #f8fafc; border-radius: 12px; padding: 22px; margin: 25px 0; border: 1px solid #e2e8f0;">
              <span style="font-size: 10px; color: #059669; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 12px; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px;">${credentialsTitle}</span>
              
              <table style="width: 100%; font-size: 13px; color: #334155; border-collapse: collapse;">
                <tr>
                  <td style="padding: 6px 0; font-weight: 700; width: 40%; color: #64748b;">${empIdLabel}</td>
                  <td style="padding: 6px 0; font-weight: 800; font-family: monospace; color: #1e293b; font-size: 14px;">${empId}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: 700; color: #64748b;">${passwordLabel}</td>
                  <td style="padding: 6px 0; font-weight: 800; font-family: monospace; color: #1e293b; font-size: 14px;">${tempPassword || '123456'}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: 700; color: #64748b;">${loginLinkLabel}</td>
                  <td style="padding: 6px 0; font-weight: 700; color: #0284c7;"><a href="${process.env.APP_URL || 'https://rathibuildmart.com'}" style="text-decoration: none; color: #0284c7;">Launch Portal</a></td>
                </tr>
              </table>
            </div>

            <div style="background-color: #fffbeb; border-radius: 8px; padding: 12px 15px; border-left: 4px solid #f59e0b; font-size: 11px; color: #78350f; font-weight: 600; line-height: 1.5; margin-bottom: 5px;">
              ⚠️ ${noticeText}
            </div>
          </div>
          <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #f1f5f9; font-size: 10px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
            © ${new Date().getFullYear()} Rathi Build Mart • HR Department
          </div>
        </div>
      </div>
    `;

    const textContent = `${subject}\n\nHello ${empName},\n\n${bodyText}\n\nEmployee ID: ${empId}\nPassword: ${tempPassword || '123456'}\n\n${noticeText}`;

    try {
      const transporter = getTransporter(smtpSettings);
      if (transporter) {
        let fromAddress = process.env.SMTP_FROM || '"Rathi Build Mart" <noreply@rathibuildmart.com>';
        if (smtpSettings?.senderEmail && smtpSettings.senderEmail.trim()) {
          const senderNameAlias = (smtpSettings.senderName && smtpSettings.senderName.trim()) || 'Rathi Build Mart';
          fromAddress = `"${senderNameAlias}" <${smtpSettings.senderEmail.trim()}>`;
        } else if (process.env.SMTP_USER) {
          fromAddress = `"Rathi Build Mart" <${process.env.SMTP_USER}>`;
        }

        await transporter.sendMail({
          from: fromAddress,
          to: email,
          subject,
          text: textContent,
          html: htmlContent,
        });
        console.log(`[SMTP] Welcome email successfully sent to ${email}`);
        return res.json({ success: true, method: 'SMTP', message: 'Welcome email sent successfully via real SMTP server.' });
      } else {
        // Fallback simulation mode
        console.log(`[SIMULATION] No SMTP configuration found. Welcome email logged for ${email}`);
        return res.json({ 
          success: true, 
          method: 'SIMULATION', 
          message: 'Running in simulation mode (no SMTP configured in .env). Welcome email logged on server terminal.',
          debugPayload: {
            to: email,
            subject,
            html: htmlContent
          }
        });
      }
    } catch (error: any) {
      console.error('[SMTP Error] Failed to send welcome email:', error);
      return res.status(500).json({ success: false, error: error.message || 'SMTP Server failed to dispatch welcome email.' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
