import KcAdminClient from '@keycloak/keycloak-admin-client';
import * as dotenv from 'dotenv'
dotenv.config()
const kcAdminClient = new KcAdminClient({
  baseUrl: process.env.KEYCLOAK_HOST,
  realmName: 'sso-ceid',
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