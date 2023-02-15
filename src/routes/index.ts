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
      console.error(error.request);
      return {
        status: 204,
        data: "The request was made but no response was received",
      }
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error', error.message);
      return {
        status: 204,
        data: error.message
      }
    }
  })
  res.status(response?.status).send(response)
})
router.post('/send-email', async function (req, res) {
  const body = req?.body;
  const response = await kcAdminClient.users.sendVerifyEmail({
    id: body?.userId,
    clientId: body?.clientId,
    redirectUri: body?.redirectUri
  }).then((res) => {
    return {
      status: 200,
      data: "User created"
    };
  }).catch((error) => {
    if (error.response) {
      return {
        status: error.response.status,
        data: error.response.data,
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error(error.request);
      return {
        status: 204,
        data: "The request was made but no response was received",
      }
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error', error.message);
      return {
        status: 204,
        data: error.message
      }
    }
  })
  res.status(response?.status).send(response)
})
router.post('/reset-password', async function (req, res) {
  const body = req?.body;
  const response = await kcAdminClient.users.executeActionsEmail({
    id: body?.userId,
    clientId: body?.clientId,
    actions: ["UPDATE_PASSWORD"],
    redirectUri: body?.redirectUri
  }).then((res) => {
    return {
      status: 200,
      data: "Action email success!"
    };
  }).catch((error) => {
    if (error.response) {
      return {
        status: error.response.status,
        data: error.response.data,
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error(error.request);
      return {
        status: 204,
        data: "The request was made but no response was received",
      }
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error', error.message);
      return {
        status: 204,
        data: error.message
      }
    }
  })
  res.status(response?.status).send(response)
})
export default router