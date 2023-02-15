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
        "firstName": "",
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
      }).catch(async (err) => {
        if (doc?._id) {
          await updateById(_client, { dbName: db, collectionName: collection, filterId: String(doc?._id) }, {
            pendingActivateSSOUser: false,
            userSSO: {
              username,
              errorMessage: err?.response?.data?.errorMessage
            }
          })
        }
      })

    }

  }
}

export { createUserSSOFromCanBo }

