
export interface RegistrationData {
  firstName: string;
  lastName: string;
  phone: string;
  telegram: string;
  region: string;
  district: string;
  neighborhood: string;
  age: string;
}

const escapeHTML = (str: any = "") => {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
};

export const templates = {
  newRegistration: (data: RegistrationData) => `
🌐 <b>YANGI ARIZA KELIB TUSHDI!</b>
━━━━━━━━━━━━━━━━━━
👤 <b>F.I.SH:</b> ${escapeHTML(data.lastName)} ${escapeHTML(data.firstName)}
📞 <b>Telefon:</b> <code>${escapeHTML(data.phone)}</code>
📨 <b>Telegram:</b> @${escapeHTML(data.telegram)}
🎂 <b>Yoshi:</b> ${escapeHTML(data.age)} yosh

📍 <b>HUDUDIY MA'LUMOTLAR:</b>
🏢 <b>Viloyat:</b> ${escapeHTML(data.region)}
🏙 <b>Tuman:</b> ${escapeHTML(data.district)}
🏠 <b>Mahalla:</b> ${escapeHTML(data.neighborhood)}
━━━━━━━━━━━━━━━━━━
📅 <i>Sana: ${new Date().toLocaleDateString('uz-UZ')} | ${new Date().toLocaleTimeString('uz-UZ')}</i>

#yangi_ariza #turon_robotics_park #ro_yxatdan_o_tish
  `.trim(),

  testMessage: () => `
🚀 <b>BOT TIZIMI TEKSHIRILDI</b>
━━━━━━━━━━━━━━━━━━
✅ <b>Status:</b> Muvaffaqiyatli ulangan
🛠 <b>Vazifa:</b> Bildirishnomalarni yuborish
🛰 <b>Server:</b> AI Studio Cloud Run

<i>Ushbu xabar bot sozlamalarining to'g'ri ishlashini tasdiqlash uchun yuborildi.</i>
  `.trim(),

  otpMessage: (phone: string, code: string) => `
🔑 <b>TASDIQLASH KODI</b>
━━━━━━━━━━━━━━━━━━
📞 <b>Telefon:</b> <code>${phone}</code>
🔢 <b>Kod:</b> <code>${code}</code>

<i>Ushbu kodni ro'yxatdan o'tish formasiga kiriting. Kod 2 daqiqa davomida amal qiladi.</i>
  `.trim()
};
