import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(404).json({ error: "Not found" });

  try {
    const { requesterEmail, orderName, company, contact, phone, notes, cart } = req.body;

    if (!company || !contact || !cart?.length) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!process.env.RESEND_API_KEY) {
      return res.status(500).json({ error: "RESEND_API_KEY is not set in this environment" });
    }

    const itemRows = cart.map(
      (i) => `<tr>
        <td style="padding:6px 10px;border-bottom:1px solid #eee;">${i.product}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee;">${i.badge}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee;">${i.color || "-"}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee;">${i.size || "-"}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee;">${i.quantity}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee;">$${(i.unitPrice || 0).toFixed(2)}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee;">$${((i.unitPrice || 0) * i.quantity).toFixed(2)}</td>
      </tr>`
    ).join("");
    const estimatedTotal = cart.reduce((sum, i) => sum + (i.unitPrice || 0) * i.quantity, 0);
    // Note: badge color removed â€” badges are always signature navy now.

    const html = `
      <h2>New Wholesale Quote Request</h2>
      ${orderName ? `<p><strong>Order Name/ID:</strong> ${orderName}</p>` : ""}
      <p><strong>Company:</strong> ${company}<br/>
      <strong>Contact:</strong> ${contact}<br/>
      <strong>Email:</strong> ${requesterEmail}<br/>
      <strong>Phone:</strong> ${phone || "-"}</p>
      <table style="border-collapse:collapse;width:100%;">
        <thead><tr>
          <th style="text-align:left;padding:6px 10px;">Product</th>
          <th style="text-align:left;padding:6px 10px;">Badge</th>
          <th style="text-align:left;padding:6px 10px;">Color</th>
          <th style="text-align:left;padding:6px 10px;">Size</th>
          <th style="text-align:left;padding:6px 10px;">Qty</th>
          <th style="text-align:left;padding:6px 10px;">Unit Price</th>
          <th style="text-align:left;padding:6px 10px;">Line Total</th>
        </tr></thead>
        <tbody>${itemRows}</tbody>
      </table>
      <p style="text-align:right;font-size:16px;margin-top:12px;"><strong>Estimated Total: $${estimatedTotal.toFixed(2)}</strong></p>
      ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ""}
    `;

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Wholesale Portal <wholesale@proudlyaddicted.com>",
        to: ["proudlyaddicted@gmail.com"],
        reply_to: requesterEmail,
        subject: `Wholesale Quote Request${orderName ? ` â€” ${orderName}` : ""} â€” ${company}`,
        html,
      }),
    });

    if (!emailRes.ok) {
      const errText = await emailRes.text();
      console.error("Resend error:", errText);
      return res.status(500).json({ error: `Resend error: ${errText}` });
    }

    await supabase.from("wholesale_requests").insert({
      order_name: orderName || null,
      requester_email: requesterEmail,
      company,
      contact,
      phone: phone || null,
      notes: notes || null,
      cart,
      created_at: new Date().toISOString(),
    });

    return res.json({ success: true });
  } catch (err) {
    console.error("Quote submission error:", err);
    return res.status(500).json({ error: err.message });
  }
}