import KcAdminClient from '@keycloak/keycloak-admin-client';
import * as dotenv from 'dotenv'
import https from 'https'
dotenv.config()
const kcAdminClient = new KcAdminClient({
  baseUrl: process.env.KEYCLOAK_HOST, // https://sso.ceid.gov.vn/auth
  realmName: 'sso-ceid',
  requestConfig: {
    httpsAgent: new https.Agent({ rejectUnauthorized: false }),
  }
});

await kcAdminClient.auth({
  username: process.env.KEYCLOAK_USERNAME,
  password: process.env.KEYCLOAK_PASSWORD,
  grantType: 'password',
  clientId: 'sso-ceid',
})

export {
  kcAdminClient
}