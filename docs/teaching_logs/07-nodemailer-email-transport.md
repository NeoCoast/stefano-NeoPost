# 07 — Nodemailer and Email Transports

**Date:** 2026-02-19
**Concept:** Sending email from Node.js — SMTP, Nodemailer, Ethereal dev / Brevo SMTP prod

---

## What was taught

Nodemailer is the standard library for sending email from Node.js. It works by connecting to an SMTP server — the same protocol email clients have used since the 1980s.

### What is SMTP?

SMTP (Simple Mail Transfer Protocol) is the protocol for transferring email between servers — like HTTP is for web pages, SMTP is for email. You connect to an SMTP server, authenticate, and hand it a message. It handles delivery.

### Nodemailer's model

```
nodemailer.createTransport(config)   // create a connection to an SMTP server
transporter.sendMail(options)        // send one email
```

A **transport** is the configured connection. In production you point it at Brevo's SMTP relay. In development you want to catch emails without actually sending them — that's Ethereal.

### Ethereal Email

Ethereal is a fake SMTP service made by the Nodemailer team. Emails sent to it are caught (not delivered) and viewable at ethereal.email. `nodemailer.createTestAccount()` gives you temporary credentials.

This matters because: in development you want to test that emails are sent correctly without spamming real inboxes or needing real SMTP credentials.

Rails comparison: like Action Mailer's `delivery_method :letter_opener` in development.

### Lazy initialization

The transporter is created lazily (only when the first email is sent), not at module load time. Why?

`nodemailer.createTestAccount()` makes a network call to Ethereal. If we called it at `require` time, the email module would make a network call the moment any file imported it — even in contexts where email is never sent. Lazy init defers that cost.

We also cache the transporter promise (`transporterPromise`) so subsequent calls reuse the same connection, not create a new one per email.

---

## Questions asked and responses

**"Why do we need a fake email service in development instead of just skipping email sending?"**
Student said: "to test that the email sends." Correct — if we skip it, we can't verify the email was triggered with the right content and recipient. Ethereal lets us assert `info.messageId` is defined and see the actual email content.

**"Why create the transporter lazily instead of at the top of the file?"**
Student initially thought it was to avoid importing too early, but then correctly identified it was about the async network call — you can't `await` at module top level in CommonJS, and creating the test account at import time would be a side effect.

**"What should happen if the email fails to send but the user was already created?"**
Student's first answer: "delete the user and return 500." Discussed: this is the right instinct for atomicity, but email is an external service you can't wrap in a database transaction. The practical answer: create the user, attempt the email, and if it fails — log it and let the user request a resend later. We accept eventual consistency here.

---

## Key insight

The student connected the lazy init pattern to a familiar JS concept: you can't `await` at the top level of a CommonJS module, so async initialization has to happen inside a function.

---

## Sources

- [Nodemailer documentation](https://nodemailer.com)
- [Ethereal Email](https://ethereal.email)
- [Brevo SMTP docs](https://help.brevo.com/hc/en-us/articles/209462765)
