import bodyParser from 'body-parser';
import https from 'https';
import express from 'express';
import nodecron from 'node-cron'
import KeycloakRouter from "@routes/index";
import { createUserSSOFromCanBo } from 'service/can_bo';


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
app.use('/keycloak', KeycloakRouter)
app.listen(9000, async () => {
  console.log("Server is up in http://0.0.0.0:9000");
  cronjob()
})

function cronjob() {
  nodecron.schedule('5 * * * *', () => {
    createUserSSOFromCanBo('CSDL_SSO', 'T_CanBO')
  });
}
