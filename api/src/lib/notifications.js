import nodemailer from "nodemailer";

let transporter = null;

function getEmailTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST?.trim();
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();

  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  } else {
    // Development fallback
    transporter = {
      isDevMock: true,
      async sendMail(opts) {
        console.log("\n=======================================================");
        console.log("[RentRide Email Notification - DEV MODE]");
        console.log(`To:      ${opts.to}`);
        console.log(`From:    ${opts.from}`);
        console.log(`Subject: ${opts.subject}`);
        console.log("-------------------------------------------------------");
        console.log(opts.text || "(HTML email rendered)");
        console.log("=======================================================\n");
        return { messageId: `mock-${Date.now()}` };
      },
    };
  }
  return transporter;
}

export async function sendEmail({ to, subject, html, text }) {
  if (!to) return null;
  try {
    const mailer = getEmailTransporter();
    const from = process.env.EMAIL_FROM || "RentRide <noreply@rentride.com>";
    const info = await mailer.sendMail({
      from,
      to,
      subject,
      text: text || subject,
      html,
    });
    return { success: true, info };
  } catch (err) {
    console.error(`[notifications] Failed to send email to ${to}:`, err.message);
    return { success: false, error: err.message };
  }
}

export async function sendSms({ to, message }) {
  if (!to) return null;
  const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const token = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = process.env.TWILIO_PHONE_NUMBER?.trim();

  if (sid && token && from) {
    try {
      const auth = Buffer.from(`${sid}:${token}`).toString("base64");
      const body = new URLSearchParams({
        To: to,
        From: from,
        Body: message,
      });

      const res = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: body.toString(),
        }
      );

      const json = await res.json();
      if (!res.ok) {
        console.error("[notifications] Twilio SMS error:", json.message);
        return { success: false, error: json.message };
      }
      return { success: true, sid: json.sid };
    } catch (err) {
      console.error(`[notifications] Failed to send SMS to ${to}:`, err.message);
      return { success: false, error: err.message };
    }
  }

  // Development Fallback
  console.log("\n-------------------------------------------------------");
  console.log("[RentRide SMS Notification - DEV MODE]");
  console.log(`To:      ${to}`);
  console.log(`Message: ${message}`);
  console.log("-------------------------------------------------------\n");
  return { success: true, devMode: true };
}

function formatDate(date) {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function renderHtmlEmail({ title, badgeText, badgeColor, recipientName, introText, booking, vehicle, actionUrl, actionText }) {
  const primaryColor = "#16a34a"; // RentRide brand emerald
  const darkBg = "#0f172a";
  const cardBg = "#ffffff";
  const lightGray = "#f8fafc";
  const borderColor = "#e2e8f0";
  const textColor = "#1e293b";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: ${textColor}; line-height: 1.6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: ${cardBg}; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.06); border: 1px solid ${borderColor};">
          
          <!-- Header -->
          <tr>
            <td style="background-color: ${darkBg}; padding: 24px 30px; text-align: left;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                      Rent<span style="color: ${primaryColor};">Ride</span>
                    </span>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; padding: 5px 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; border-radius: 20px; background-color: ${badgeColor}; color: #ffffff;">
                      ${badgeText}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 30px;">
              <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: ${textColor};">
                ${title}
              </h2>
              <p style="margin: 0 0 20px 0; font-size: 15px; color: #475569;">
                Hello <strong>${recipientName || "there"}</strong>,
              </p>
              <p style="margin: 0 0 24px 0; font-size: 14px; color: #475569;">
                ${introText}
              </p>

              <!-- Vehicle Summary Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${lightGray}; border-radius: 12px; border: 1px solid ${borderColor}; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="vertical-align: top;">
                          <h3 style="margin: 0 0 4px 0; font-size: 17px; font-weight: 700; color: ${textColor};">
                            ${vehicle?.brand || ""} ${vehicle?.name || "Vehicle"}
                          </h3>
                          <p style="margin: 0 0 10px 0; font-size: 12px; color: #64748b;">
                            Model: ${vehicle?.vehicleModel || "Standard"} • ${vehicle?.type || "Vehicle"} • Reg: ${vehicle?.vehicleNumber || "Verified"}
                          </p>
                          <p style="margin: 0; font-size: 13px; color: #475569;">
                            📍 <strong>Location:</strong> ${vehicle?.location || "Designated pickup hub"}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Booking Details Table -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid ${borderColor}; border-radius: 12px; overflow: hidden; margin-bottom: 28px;">
                <tr style="background-color: ${lightGray};">
                  <td style="padding: 12px 16px; font-size: 12px; font-weight: 600; color: #64748b; border-bottom: 1px solid ${borderColor};">Booking ID</td>
                  <td style="padding: 12px 16px; font-size: 13px; font-weight: 700; text-align: right; border-bottom: 1px solid ${borderColor}; color: ${textColor};">#${booking?.id?.slice(-8) || "N/A"}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; font-size: 13px; color: #64748b; border-bottom: 1px solid ${borderColor};">Trip Duration</td>
                  <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; text-align: right; border-bottom: 1px solid ${borderColor}; color: ${textColor};">${booking?.totalDays || 1} day(s) (${booking?.duration || "daily"})</td>
                </tr>
                <tr style="background-color: ${lightGray};">
                  <td style="padding: 12px 16px; font-size: 13px; color: #64748b; border-bottom: 1px solid ${borderColor};">Start Date</td>
                  <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; text-align: right; border-bottom: 1px solid ${borderColor}; color: ${textColor};">${formatDate(booking?.startDate)} ${booking?.startTime ? `at ${booking.startTime}` : ""}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; font-size: 13px; color: #64748b; border-bottom: 1px solid ${borderColor};">End Date</td>
                  <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; text-align: right; border-bottom: 1px solid ${borderColor}; color: ${textColor};">${formatDate(booking?.endDate)} ${booking?.endTime ? `at ${booking.endTime}` : ""}</td>
                </tr>
                <tr style="background-color: #ecfdf5;">
                  <td style="padding: 14px 16px; font-size: 14px; font-weight: 700; color: #065f46;">Total Rental Amount</td>
                  <td style="padding: 14px 16px; font-size: 18px; font-weight: 800; text-align: right; color: #047857;">₹${(booking?.totalPrice || 0).toLocaleString()}</td>
                </tr>
              </table>

              <!-- Call to Action -->
              ${actionUrl ? `
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <a href="${actionUrl}" style="display: inline-block; background-color: ${primaryColor}; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; padding: 14px 28px; border-radius: 12px; box-shadow: 0 4px 12px rgba(22, 163, 74, 0.25);">
                      ${actionText || "View on RentRide"}
                    </a>
                  </td>
                </tr>
              </table>
              ` : ""}

              <p style="margin: 0; font-size: 12px; color: #94a3b8; text-align: center;">
                Need assistance? Contact our support team or reply directly to this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: ${lightGray}; padding: 18px 30px; text-align: center; border-top: 1px solid ${borderColor};">
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                © ${new Date().getFullYear()} RentRide Vehicle Rental Management System. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Triggered when a new booking is created (status: pending)
 */
export async function notifyBookingCreated({ booking, vehicle, customer, agency }) {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

  // 1. Notify Customer
  if (customer?.email) {
    const html = renderHtmlEmail({
      title: "Booking Request Received",
      badgeText: "Pending Approval",
      badgeColor: "#f59e0b",
      recipientName: customer.name,
      introText: `Your booking request for <strong>${vehicle.brand} ${vehicle.name}</strong> has been received and sent to <strong>${agency?.agencyName || agency?.name || "Speed Rentals"}</strong> for approval.`,
      booking,
      vehicle,
      actionUrl: `${frontendUrl}/bookings`,
      actionText: "View My Bookings",
    });

    sendEmail({
      to: customer.email,
      subject: `[RentRide] Booking Request Received: ${vehicle.brand} ${vehicle.name} (#${booking.id.slice(-6)})`,
      html,
      text: `Hello ${customer.name}, your RentRide booking request for ${vehicle.brand} ${vehicle.name} (${formatDate(booking.startDate)} - ${formatDate(booking.endDate)}) is currently pending agency approval. Total: ₹${booking.totalPrice}. View at ${frontendUrl}/bookings`,
    }).catch((err) => console.error("[notifyBookingCreated] Customer email error:", err));
  }

  if (customer?.phone) {
    sendSms({
      to: customer.phone,
      message: `RentRide: Hi ${customer.name?.split(" ")[0]}, your booking request for ${vehicle.brand} ${vehicle.name} (#${booking.id.slice(-6)}) was received! Total: Rs.${booking.totalPrice}. We will notify you once approved.`,
    }).catch((err) => console.error("[notifyBookingCreated] Customer SMS error:", err));
  }

  // 2. Notify Agency
  if (agency?.email) {
    const html = renderHtmlEmail({
      title: "New Booking Request",
      badgeText: "Action Required",
      badgeColor: "#2563eb",
      recipientName: agency.agencyName || agency.name,
      introText: `A new rental request has been placed by <strong>${customer?.name || "Customer"}</strong> (${customer?.phone || "No phone provided"}) for your vehicle <strong>${vehicle.brand} ${vehicle.name}</strong>.`,
      booking,
      vehicle,
      actionUrl: `${frontendUrl}/agency`,
      actionText: "Open Agency Dashboard",
    });

    sendEmail({
      to: agency.email,
      subject: `[RentRide Action Required] New Booking Request for ${vehicle.brand} ${vehicle.name} by ${customer?.name || "Customer"}`,
      html,
      text: `Hello ${agency.agencyName || agency.name}, you have a new booking request for ${vehicle.brand} ${vehicle.name} by ${customer?.name} (${formatDate(booking.startDate)} to ${formatDate(booking.endDate)}). Please log in to approve or reject: ${frontendUrl}/agency`,
    }).catch((err) => console.error("[notifyBookingCreated] Agency email error:", err));
  }

  if (agency?.phone) {
    sendSms({
      to: agency.phone,
      message: `RentRide: New booking request for ${vehicle.brand} ${vehicle.name} by ${customer?.name || "Customer"} (${booking.totalDays} days). Check your agency dashboard: ${frontendUrl}/agency`,
    }).catch((err) => console.error("[notifyBookingCreated] Agency SMS error:", err));
  }
}

/**
 * Triggered when a booking status changes (approved, rejected, cancelled, active, completed)
 */
export async function notifyBookingStatusUpdated({ booking, vehicle, customer, agency, newStatus, prevStatus }) {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

  switch (newStatus) {
    case "approved": {
      // Notify Customer of approval
      if (customer?.email) {
        const html = renderHtmlEmail({
          title: "🎉 Your Booking is Confirmed!",
          badgeText: "Confirmed",
          badgeColor: "#16a34a",
          recipientName: customer.name,
          introText: `Great news! <strong>${agency?.agencyName || agency?.name || "The agency"}</strong> has approved your booking for <strong>${vehicle.brand} ${vehicle.name}</strong>. Your ride is ready for pickup!`,
          booking,
          vehicle,
          actionUrl: `${frontendUrl}/bookings`,
          actionText: "View Confirmed Booking",
        });

        sendEmail({
          to: customer.email,
          subject: `[RentRide Confirmed] Your booking for ${vehicle.brand} ${vehicle.name} is Approved!`,
          html,
          text: `Hi ${customer.name}, your booking for ${vehicle.brand} ${vehicle.name} from ${formatDate(booking.startDate)} to ${formatDate(booking.endDate)} is APPROVED! Pickup at: ${vehicle.location}. Details: ${frontendUrl}/bookings`,
        }).catch((err) => console.error("[notifyStatus] Customer approved email error:", err));
      }

      if (customer?.phone) {
        sendSms({
          to: customer.phone,
          message: `RentRide: Congratulations! Your booking for ${vehicle.brand} ${vehicle.name} is APPROVED. Pickup location: ${vehicle.location}. Have a great trip!`,
        }).catch((err) => console.error("[notifyStatus] Customer approved SMS error:", err));
      }
      break;
    }

    case "rejected": {
      // Notify Customer of rejection
      if (customer?.email) {
        const html = renderHtmlEmail({
          title: "Booking Request Update",
          badgeText: "Rejected",
          badgeColor: "#dc2626",
          recipientName: customer.name,
          introText: `We regret to inform you that your booking request for <strong>${vehicle.brand} ${vehicle.name}</strong> could not be accepted by the agency for the selected dates.`,
          booking,
          vehicle,
          actionUrl: `${frontendUrl}/vehicles`,
          actionText: "Browse Other Vehicles",
        });

        sendEmail({
          to: customer.email,
          subject: `[RentRide] Update regarding your booking request for ${vehicle.brand} ${vehicle.name}`,
          html,
          text: `Hi ${customer.name}, unfortunately your booking request for ${vehicle.brand} ${vehicle.name} was rejected. Browse other available vehicles at: ${frontendUrl}/vehicles`,
        }).catch((err) => console.error("[notifyStatus] Customer rejected email error:", err));
      }

      if (customer?.phone) {
        sendSms({
          to: customer.phone,
          message: `RentRide: Your booking request for ${vehicle.brand} ${vehicle.name} could not be accepted. Please explore alternative rides on ${frontendUrl}/vehicles`,
        }).catch((err) => console.error("[notifyStatus] Customer rejected SMS error:", err));
      }
      break;
    }

    case "cancelled": {
      // Notify agency that customer cancelled
      if (agency?.email) {
        const html = renderHtmlEmail({
          title: "Booking Cancelled",
          badgeText: "Cancelled",
          badgeColor: "#64748b",
          recipientName: agency.agencyName || agency.name,
          introText: `Booking #${booking.id.slice(-6)} for <strong>${vehicle.brand} ${vehicle.name}</strong> was cancelled. The vehicle availability has been automatically restored.`,
          booking,
          vehicle,
          actionUrl: `${frontendUrl}/agency`,
          actionText: "View Fleet",
        });

        sendEmail({
          to: agency.email,
          subject: `[RentRide] Booking Cancelled: ${vehicle.brand} ${vehicle.name} (#${booking.id.slice(-6)})`,
          html,
          text: `Booking #${booking.id.slice(-6)} for ${vehicle.brand} ${vehicle.name} was cancelled. Availability is restored. ${frontendUrl}/agency`,
        }).catch((err) => console.error("[notifyStatus] Agency cancelled email error:", err));
      }

      if (agency?.phone) {
        sendSms({
          to: agency.phone,
          message: `RentRide: Booking #${booking.id.slice(-6)} for ${vehicle.brand} ${vehicle.name} was cancelled by the customer.`,
        }).catch((err) => console.error("[notifyStatus] Agency cancelled SMS error:", err));
      }
      break;
    }

    case "active": {
      // Notify Customer that trip has started
      if (customer?.email) {
        const html = renderHtmlEmail({
          title: "🚀 Your Ride is Active — Safe Travels!",
          badgeText: "Trip Active",
          badgeColor: "#2563eb",
          recipientName: customer.name,
          introText: `You have picked up your <strong>${vehicle.brand} ${vehicle.name}</strong>. Enjoy your ride and remember to follow all traffic safety guidelines.`,
          booking,
          vehicle,
          actionUrl: `${frontendUrl}/bookings`,
          actionText: "View Trip Details",
        });

        sendEmail({
          to: customer.email,
          subject: `[RentRide] Trip Started! Safe travels with ${vehicle.brand} ${vehicle.name}`,
          html,
          text: `Hi ${customer.name}, your rental of ${vehicle.brand} ${vehicle.name} is now ACTIVE! Scheduled return: ${formatDate(booking.endDate)}. Drive safely!`,
        }).catch((err) => console.error("[notifyStatus] Customer active email error:", err));
      }
      break;
    }

    case "completed": {
      // Notify Customer that trip is completed
      if (customer?.email) {
        const html = renderHtmlEmail({
          title: "Trip Completed — Thank You!",
          badgeText: "Completed",
          badgeColor: "#10b981",
          recipientName: customer.name,
          introText: `Your trip with <strong>${vehicle.brand} ${vehicle.name}</strong> has been marked completed. Thank you for renting with RentRide!`,
          booking,
          vehicle,
          actionUrl: `${frontendUrl}/bookings`,
          actionText: "View Rental History",
        });

        sendEmail({
          to: customer.email,
          subject: `[RentRide Receipt] Trip Completed for ${vehicle.brand} ${vehicle.name}`,
          html,
          text: `Hi ${customer.name}, your trip with ${vehicle.brand} ${vehicle.name} is complete. Total paid: ₹${booking.totalPrice}. Thank you for riding with RentRide!`,
        }).catch((err) => console.error("[notifyStatus] Customer completed email error:", err));
      }
      break;
    }

    default:
      break;
  }
}
