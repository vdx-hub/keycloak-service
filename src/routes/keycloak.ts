import { kcAdminClient } from "@controller/keycloak";
import express from 'express';

const router = express.Router();
router.post('/createUser', async function (req, res) {
  const body = req?.body;
  const response = await kcAdminClient.users.create({
    username: body?.username,
    email: body?.email || "",
    enabled: body?.enabled,
    "credentials": [
      {
        "type": "password",
        "value": body?.password,
        "temporary": body?.temporary || false
      }
    ],
    "emailVerified": true,
    "firstName": body?.firstName || "",
    "lastName": body?.lastName || "",
  }).then((res) => {
    return {
      status: 200,
      id: res?.id,
    };

  }).catch((error) => {
    if (error.response) {
      return {
        status: error.response.status,
        data: error.response.data,
      }
    } else if (error.request) {
      // The request was made but no response was received
      // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
      // http.ClientRequest in node.js
      console.error(error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error', error.message);
    }
  })
  res.status(response?.status).send(response)
})
router.post('/send-email', async function (req, res) {
  const body = req?.body;
  const response = await kcAdminClient.users.sendVerifyEmail({
    id: '0dbaca42-ed12-4e3d-a18d-116dbc592506',
    clientId: 'sso-ceid',
    redirectUri: 'http://abc.com'
  }).then((res) => {
    return {
      status: 200,
      // id: res?.id,
    };
  }).catch((error) => {
    if (error.response) {
      return {
        status: error.response.status,
        data: error.response.data,
      }
    } else if (error.request) {
      // The request was made but no response was received
      // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
      // http.ClientRequest in node.js
      console.error(error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error', error.message);
    }
  })
  res.status(response?.status).send(response)
})
router.post('/reset-password', async function (req, res) {
  const body = req?.body;
  const response = await kcAdminClient.users.executeActionsEmail({
    id: '0dbaca42-ed12-4e3d-a18d-116dbc592506',
    clientId: 'quantridulieu-ceid-gov-vn',
    actions: ["UPDATE_PASSWORD"],
    redirectUri: 'https://quantridulieu.ceid.gov.vn/#/web/csdl_mt/trang_chu'
  }).then((res) => {
    return {
      status: 200,
      // id: res?.id,
    };
  }).catch((error) => {
    if (error.response) {
      return {
        status: error.response.status,
        data: error.response.data,
      }
    } else if (error.request) {
      // The request was made but no response was received
      // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
      // http.ClientRequest in node.js
      console.error(error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error', error.message);
    }
  })
  res.status(response?.status).send(response)
})
export default router