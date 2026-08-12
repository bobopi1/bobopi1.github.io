(function () {
  const email = "info@lateliersalledebain.com";

  function encodeLine(label, value) {
    return `${label}: ${String(value || "").trim()}`;
  }

  document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("[data-contact-form]");
    if (!form) return;

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const formData = new FormData(form);
      const name = String(formData.get("name") || "").trim();
      const senderEmail = String(formData.get("email") || "").trim();
      const subject = String(formData.get("subject") || "").trim();
      const message = String(formData.get("message") || "").trim();

      const translate = window.LatelierI18n?.translateText || ((value) => value);
      const mailSubject = subject || translate("Demande de contact");
      const mailBody = [
        encodeLine(translate("Nom"), name),
        encodeLine(translate("Courriel"), senderEmail),
        "",
        message
      ].join("\n");

      const mailto = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(mailBody)}`;
      window.location.href = mailto;
    });
  });
}());
