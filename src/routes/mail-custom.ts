import express from 'express';
const router = express.Router();
import { sendMail } from '../service/mail'
router.post('/sendMail', async function (req, res) {
  const body = req?.body;
  res.send(await sendMail({
    to: body?.to,
    data: body?.data,
    subject: body?.subject,
    templateName: body?.templateName
  }))
})
export default router