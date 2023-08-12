const nodemailer = require("nodemailer");

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(" ")[0];
    this.url = url;
  }
  newTransport() {
    return nodemailer.createTransport({
      service: "gmail",

      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async send(template, subject) {
    const dataToSend = `<h1>${template}</h1>
    </br>
    <a href=${this.url}>Go to change password page </a>`;

    const mailOptions = {
      from: process.env.EMAIL_USERNAME,
      to: this.to,
      subject,
      html: dataToSend,
    };

    await this.newTransport().sendMail(mailOptions);
  }



  async sendPasswordReset() {
    await this.send(
      "passwordReset",
      "Your password reset token (valid for only 10 minutes)"
    );
  }
};



