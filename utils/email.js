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
    const dataToSend = `
    <html>
      <head>
        <style>
          /* Add your CSS styles here for formatting */
          body {
            font-family: Arial, sans-serif;
            background-color: #333;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #444;
            padding: 20px;
            border-radius: 5px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          h1 {
            color: #fff;
          }
          a.button {
            display: inline-block;
            background-color: #007bff;
            color: #fff;
            text-decoration: none;
            padding: 10px 20px;
            border-radius: 5px;
            margin-top: 20px;
          }
          a.button:hover {
            background-color: #0056b3;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>${template}</h1>
          <a href="${this.url}" class="button">Go to change password page</a>
        </div>
      </body>
    </html>
  `;

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
      "Password reset",
      "Your password reset token (valid for only 10 minutes)"
    );
  }
};



