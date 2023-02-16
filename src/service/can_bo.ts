import { kcAdminClient } from "@controller/keycloak";
import { updateById } from "@controller/mongodb";
import { _client, _clientGridFS } from "@db/mongodb";
import { warn } from "console";

async function createUserSSOFromCanBo(db: string, collection: string) {
  warn('createUserSSOFromCanBo', db, collection, new Date().toLocaleString('vi'))
  let collectionObj = _client.db(db).collection(collection)
  let cursor = collectionObj.find({
    $and: [
      {
        pendingActivateSSOUser: true,
      }
    ]
  });
  while (await cursor.hasNext()) {
    let doc = await cursor.next();
    const username = String(doc?.DanhBaLienLac?.ThuDienTu)?.split('@')?.[0];
    if (username) {
      await kcAdminClient.users.create({
        "username": username,
        "credentials": [
          {
            "type": "password",
            "value": String(doc?.TaiKhoanDienTu?.MatKhau),
            "temporary": false
          }
        ],
        "enabled": true,
        "emailVerified": true,
        "firstName": doc?.HoVaTen,
        "lastName": "",
        "email": String(doc?.DanhBaLienLac?.ThuDienTu)
      }).then(async (res) => {
        if (doc?._id) {
          await updateById(_client, { dbName: db, collectionName: collection, filterId: String(doc._id) }, {
            pendingActivateSSOUser: false,
            TrangThaiSSO: {
              _source: {
                MaMuc: '01',
                TenMuc: 'Đã tạo'
              }
            },
            userSSO: {
              username,
              id: res.id,
            },
          })
        }

        await kcAdminClient.users.executeActionsEmail({
          id: res.id,
          clientId: 'sso-ceid',
          actions: ["UPDATE_PASSWORD"],
          redirectUri: doc?.TaiKhoanDienTu?.redirectUri,
        }).catch((error) => {
          if (error.response) {
            warn({
              status: error.response.status,
              data: error.response.data,
            })
          } else if (error.request) {
            // The request was made but no response was received
            warn(error.request);
          } else {
            // Something happened in setting up the request that triggered an Error
            warn('Error', error.message);
          }
        })

      }).catch(async (err) => {
        console.log(err);
        if (doc?._id) {
          await updateById(_client, { dbName: db, collectionName: collection, filterId: String(doc?._id) }, {
            pendingActivateSSOUser: false,
            'userSSO.username': username,
            'userSSO.errorMessage': err?.response?.data?.errorMessage,
          })
        }
      })

    }

  }
}

export { createUserSSOFromCanBo }

