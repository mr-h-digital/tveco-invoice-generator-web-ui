import type { ExportJob, ExportJobDocument, ExportJobPaymentMilestone } from '../types/exportJob';
import { formatCurrency } from './formatCurrency';
import { formatDate } from './formatDate';
import { TVECO_COMPANY_PROFILE } from '../constants/companyProfile';

const APP_URL = (import.meta.env.VITE_PUBLIC_APP_URL || 'https://app.tveco.co.za').replace(/\/$/, '');

interface ExportEmail {
  subject: string;
  text: string;
  html: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderEmailLayout(title: string, summary: string, content: string, footerNote: string): string {
  return `
  <!doctype html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${escapeHtml(title)}</title>
    </head>
    <body style="margin:0;padding:0;background:#0E131A;font-family:Arial,Helvetica,sans-serif;color:#D6DFEA;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#0E131A;padding:24px 10px;">
        <tr>
          <td align="center">
            <table role="presentation" cellpadding="0" cellspacing="0" width="620" style="max-width:620px;background:#151C25;border:1px solid #273140;border-radius:14px;overflow:hidden;">
              <tr>
                <td style="padding:18px 22px;background:#111722;border-bottom:1px solid #2B3645;">
                  <div style="font-size:22px;line-height:1;font-weight:700;letter-spacing:1px;color:#FF6B00;">TVECO</div>
                  <div style="margin-top:6px;font-size:12px;color:#8FA1B8;">Vehicle Export Operations Update</div>
                </td>
              </tr>
              <tr>
                <td style="padding:22px;">
                  <h2 style="margin:0 0 8px 0;font-size:20px;color:#F3F6FA;">${escapeHtml(title)}</h2>
                  <p style="margin:0 0 14px 0;font-size:14px;line-height:1.5;color:#C8D4E0;">${escapeHtml(summary)}</p>
                  ${content}
                  <p style="margin:16px 0 0 0;font-size:13px;color:#9AB0C9;line-height:1.5;">${escapeHtml(footerNote)}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:14px 22px;background:#111722;border-top:1px solid #2B3645;font-size:11px;color:#7F91A8;line-height:1.5;">
                  Timeline Vehicle Export Company (Pty) Ltd<br/>
                  Reg No: ${escapeHtml(TVECO_COMPANY_PROFILE.registrationNumber)} | Customs Code: ${escapeHtml(TVECO_COMPANY_PROFILE.customsCode)}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>`;
}

function trackingLink(job: ExportJob) {
  return `${APP_URL}/#/track/${encodeURIComponent(job.publicTrackingToken)}`;
}

export function buildStatusChangedEmail(job: ExportJob): ExportEmail {
  const subject = `TVECO Update: ${job.jobNumber} now ${job.status}`;
  const summary = `${job.clientSnapshot.companyName}, your export workflow has moved to ${job.status}.`;
  const link = trackingLink(job);
  const html = renderEmailLayout(
    `Export Stage Updated - ${job.jobNumber}`,
    summary,
    `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
      <tr><td style="padding:8px 0;border-top:1px solid #2B3645;font-size:13px;color:#9FB1C5;width:34%;">Job Number</td><td style="padding:8px 0;border-top:1px solid #2B3645;font-size:13px;color:#FFFFFF;">${escapeHtml(job.jobNumber)}</td></tr>
      <tr><td style="padding:8px 0;border-top:1px solid #2B3645;font-size:13px;color:#9FB1C5;">Current Stage</td><td style="padding:8px 0;border-top:1px solid #2B3645;font-size:13px;color:#FFFFFF;">${escapeHtml(job.status)}</td></tr>
      <tr><td style="padding:8px 0;border-top:1px solid #2B3645;font-size:13px;color:#9FB1C5;">Destination</td><td style="padding:8px 0;border-top:1px solid #2B3645;font-size:13px;color:#FFFFFF;">${escapeHtml(job.destinationCountry)}</td></tr>
      <tr><td style="padding:8px 0;border-top:1px solid #2B3645;border-bottom:1px solid #2B3645;font-size:13px;color:#9FB1C5;">Tracking Portal</td><td style="padding:8px 0;border-top:1px solid #2B3645;border-bottom:1px solid #2B3645;font-size:13px;"><a href="${escapeHtml(link)}" style="color:#FF6B00;text-decoration:none;">Open tracking page</a></td></tr>
    </table>
    `,
    'If you have questions, reply to this email and our team will assist immediately.'
  );

  const text = [
    `TVECO Export Update`,
    `Job: ${job.jobNumber}`,
    `Current stage: ${job.status}`,
    `Destination: ${job.destinationCountry}`,
    `Tracking: ${link}`,
  ].join('\n');

  return { subject, text, html };
}

export function buildDocumentCompletedEmail(job: ExportJob, document: ExportJobDocument): ExportEmail {
  const subject = `TVECO Document Confirmed: ${document.label}`;
  const summary = `We have completed ${document.label} for export job ${job.jobNumber}.`;
  const link = trackingLink(job);
  const html = renderEmailLayout(
    `Document Completed - ${job.jobNumber}`,
    summary,
    `
    <p style="margin:0 0 12px 0;font-size:14px;color:#D4DEEA;line-height:1.5;">This confirms that <strong style="color:#FFFFFF;">${escapeHtml(document.label)}</strong> has been checked off by TVECO operations.</p>
    <p style="margin:0;font-size:13px;color:#A9B8CC;">Follow your progress: <a href="${escapeHtml(link)}" style="color:#FF6B00;text-decoration:none;">${escapeHtml(link)}</a></p>
    `,
    'Your export process remains on track. We will keep sharing milestone updates.'
  );

  const text = [
    `TVECO Document Completed`,
    `Job: ${job.jobNumber}`,
    `Completed document: ${document.label}`,
    `Tracking: ${link}`,
  ].join('\n');

  return { subject, text, html };
}

export function buildPaymentReminderEmail(job: ExportJob, milestone: ExportJobPaymentMilestone): ExportEmail {
  const subject = `TVECO Payment Reminder: ${job.jobNumber}`;
  const summary = `${milestone.label} is overdue for job ${job.jobNumber}.`;
  const dueDate = formatDate(milestone.dueDate);
  const amount = formatCurrency(milestone.amount);
  const html = renderEmailLayout(
    `Payment Reminder - ${job.jobNumber}`,
    summary,
    `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
      <tr><td style="padding:8px 0;border-top:1px solid #2B3645;font-size:13px;color:#9FB1C5;width:34%;">Milestone</td><td style="padding:8px 0;border-top:1px solid #2B3645;font-size:13px;color:#FFFFFF;">${escapeHtml(milestone.label)}</td></tr>
      <tr><td style="padding:8px 0;border-top:1px solid #2B3645;font-size:13px;color:#9FB1C5;">Amount</td><td style="padding:8px 0;border-top:1px solid #2B3645;font-size:13px;color:#FFFFFF;">${escapeHtml(amount)}</td></tr>
      <tr><td style="padding:8px 0;border-top:1px solid #2B3645;border-bottom:1px solid #2B3645;font-size:13px;color:#9FB1C5;">Due Date</td><td style="padding:8px 0;border-top:1px solid #2B3645;border-bottom:1px solid #2B3645;font-size:13px;color:#FFFFFF;">${escapeHtml(dueDate)}</td></tr>
    </table>
    `,
    'Please settle this milestone to avoid delays in export processing or release timelines.'
  );

  const text = [
    `TVECO Payment Reminder`,
    `Job: ${job.jobNumber}`,
    `Milestone: ${milestone.label}`,
    `Amount: ${amount}`,
    `Due date: ${dueDate}`,
  ].join('\n');

  return { subject, text, html };
}
