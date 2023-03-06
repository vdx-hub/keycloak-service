import bodyParser from 'body-parser';
import https from 'https';
import express from 'express';
import nodecron from 'node-cron'
import KeycloakRouter from "@routes/index";
import MailRouter from "@routes/mail-custom";
import { createUserSSOFromCanBo } from 'service/can_bo';
import { autoSendEmail } from 'service/mail';


https.globalAgent.options.rejectUnauthorized = false;

const app = express();
app.use(bodyParser.json({
  limit: "50mb"
}));
app.use(
  bodyParser.urlencoded({
    limit: "50mb",
    extended: true,
    parameterLimit: 50000,
  })
);
app.use((err: any, _req: any, res: any, _next: any) => {
  res.status(err.status || 500);
  res.json({
    message: err.message,
    error: err,
  });
});
app.get('/', (_req, _res) => {
  _res.send('Hello, service is running')
})
app.use('/keycloak', KeycloakRouter)
app.use('/mail', MailRouter)
app.listen(9000, async () => {
  console.log("Server is up in http://0.0.0.0:9000");
  createUserSSOFromCanBo('CSDL_SSO', 'T_CanBo')
  autoSendEmail('CSDL_SSO', 'T_EmailToSend')
  cronjob()
})

function cronjob() {
  nodecron.schedule('*/2 * * * *', () => {
    createUserSSOFromCanBo('CSDL_SSO', 'T_CanBo')
  });
  nodecron.schedule('*/5 * * * *', () => {
    autoSendEmail('CSDL_SSO', 'T_EmailToSend')
  });
}
