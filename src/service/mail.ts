import nodemailer from 'nodemailer';
import handlebars from 'handlebars';
import { _client } from "@db/mongodb";

import * as dotenv from 'dotenv'
dotenv.config()
const databaseName = process.env.DATABASE_NAME || 'CSDL_SSO';
const mailTemplateCollection = process.env.MAIL_TEMPLATE_COLLECTION || 'C_EmailTemplate';
const systemMail = process.env.SYSTEM_MAIL;
const systemMailPass = process.env.SYSTEM_MAIL_PASS;

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: systemMail,
    pass: systemMailPass
  }
});

async function renderHTMLfromTemplateWithData(source: any, data: any) {
  const template = await handlebars.compile(source);
  return await template(data);
}

async function getTemplate(templateName, dbTemplate, collectionTemplate) {
  let templateRecord = await _client.db(dbTemplate || databaseName).collection(collectionTemplate || mailTemplateCollection).findOne({
    $and: [
      { MaMuc: templateName },
      { storage: 'regular' },
    ]
  });
  return templateRecord?.templateData
}

async function autoSendEmail(dbEmail, collectionTemplate) {
  console.log('AutoSendMail', new Date().toLocaleString('vi'));

  const DB = dbEmail || databaseName;
  const COLLECTION = collectionTemplate || mailTemplateCollection;
  let myCursor = await _client.db(DB).collection(COLLECTION).find({
    $and: [
      { "isSent": false },
      { "isFail": { $ne: true } }
    ]
  });
  let count = 0;
  let fail = 0;
  while (await myCursor.hasNext()) {
    let mail = await myCursor.next()
    if (mail?.mailTo?.indexOf('@') > -1 && mail?.mailTemplate && mail?.mailTemplateData) {
      let sentStatus = await sendMail({
        to: mail?.mailTo, //single mail !!! multiple => fix check success
        subject: mail?.mailSubject,
        templateName: mail?.mailTemplate._source.MaMuc,
        data: mail?.mailTemplateData
      })
      if (sentStatus?.accepted && sentStatus?.accepted.indexOf(mail?.mailTo) > -1) {
        // mail success
        await _client.db(DB).collection(COLLECTION).updateOne({
          _id: mail?._id
        }, {
          $set: {
            isSent: true
          }
        });
        count++;
      }
      else {
        await _client.db(DB).collection(COLLECTION).updateOne({
          _id: mail._id
        }, {
          $set: {
            isFail: true
          }
        });
        fail++;
      }
    }
    else {
      await _client.db(DB).collection(COLLECTION).updateOne({
        _id: mail?._id
      }, {
        $set: {
          isFail: true
        }
      });
      fail++;
    }

  }
  return (count > 0 || fail > 0) ? {
    success: `Successfully Sent ${count} mail(s)`,
    fail: `Fail to send ${fail} mail(s)`
  } : ''
}

async function sendMail({ to, subject, templateName, data }) {
  let template = await getTemplate(templateName, null, null);
  if (!template) return 'Fail to get template'
  let htmlToSend = await renderHTMLfromTemplateWithData(template, data);
  let mailOption = {
    from: `<${systemMail}>`,
    to: to, // "bar@example.com, baz@example.com"
    subject: subject, // "Hello ✔" Subject line
    html: htmlToSend, // html body
  }
  let info;
  try {
    info = await transporter.sendMail(mailOption);
  }
  catch (e) {
    console.log(e);
  }
  return info
}

export {
  sendMail,
  autoSendEmail
}