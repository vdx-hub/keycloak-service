import fs from 'fs-extra';
import dotobject from 'dot-object'
import { DeleteResult, InsertOneResult, UpdateResult, WithId, Document, ObjectId, MongoClient, FindCursor, FindOptions, GridFSBucket } from 'mongodb';
interface mongoCollectionInfo {
  dbName: string;
  collectionName: string;
  filterId?: string;
}

function addMetadataCreate(data: Object): any {
  let now = new Date().getTime();
  let metadata = { createdAt: now, modifiedAt: now };
  return dotobject.object({ ...data, ...metadata });
}

function addMetadataUpdate(data: Object): any {
  let now = new Date().getTime();
  let metadata = { modifiedAt: now };
  return dotobject.object({ ...data, ...metadata });
}

async function createOne(client: MongoClient, { dbName, collectionName }: mongoCollectionInfo, data: object): Promise<InsertOneResult> {
  return await client.db(dbName).collection(collectionName).insertOne(addMetadataCreate(data));
}
async function deleteOne(client: MongoClient, { dbName, collectionName }: mongoCollectionInfo, filter: object): Promise<DeleteResult> {
  return await client.db(dbName).collection(collectionName).deleteOne(filter);
}
async function updateOne(client: MongoClient, { dbName, collectionName }: mongoCollectionInfo, filter: object, updateData: object): Promise<UpdateResult> {
  return await client.db(dbName).collection(collectionName).updateOne(filter, addMetadataUpdate(updateData));
}
async function updateMany(client: MongoClient, { dbName, collectionName }: mongoCollectionInfo, filter: object, updateData: object): Promise<Document | UpdateResult> {
  return client
    .db(dbName)
    .collection(collectionName)
    .updateMany(filter, {
      $set: addMetadataUpdate(updateData),
    });
}
async function updateById(client: MongoClient, { dbName, collectionName, filterId }: mongoCollectionInfo, updateData: object): Promise<UpdateResult> {
  return await client
    .db(dbName)
    .collection(collectionName)
    .updateOne({ _id: new ObjectId(filterId) }, { $set: addMetadataUpdate(updateData) });
}
async function findOneById(client: MongoClient, { dbName, collectionName, filterId }: mongoCollectionInfo): Promise<WithId<Document> | null> {
  return await client
    .db(dbName)
    .collection(collectionName)
    .findOne({ _id: new ObjectId(filterId) });
}
async function createOneIfNotExist(client: MongoClient, { dbName, collectionName, filter, insertData }: { dbName: string; collectionName: string; filter: object; insertData: object }) {
  return await client.db(dbName).collection(collectionName).updateOne(filter, { $setOnInsert: addMetadataCreate(insertData) }, { upsert: true });
}


async function bulkCreateOneIfNotExist(client: MongoClient, { dbName, collectionName }: { dbName: string; collectionName: string; }) {
  var bulk = client.db(dbName).collection(collectionName).initializeUnorderedBulkOp();
  var bulkUpsertAdd = async (filter: object, insertData: object) => {
    bulk.find(filter).upsert().update({ $setOnInsert: addMetadataCreate(insertData) })

  }
  return { bulk, bulkUpsertAdd }
}

async function uploadExpressFile(client: MongoClient, bucket: string, fileName: string, file: Express.Multer.File) {
  const gridfs = new GridFSBucket(client.db("oauth2"), {
    bucketName: bucket
  })
  let fileUpload;
  if (await fs.pathExists(file.path)) {
    fileUpload = fs.createReadStream(file.path).pipe(gridfs.openUploadStream(fileName, {
      chunkSizeBytes: 102400,
      contentType: file.mimetype || "",
      aliases: ["/upload/:bucket"],
    }))
  }
  return fileUpload;
}

async function uploadFileFS(client: MongoClient, bucket: string, fileName: string, filePath: string) {
  const gridfs = new GridFSBucket(client.db("oauth2"), {
    bucketName: bucket
  })
  let fileUpload;
  const upload = (filePath: string) => {
    let file = fs.createReadStream(filePath).pipe(gridfs.openUploadStream(fileName, {
      chunkSizeBytes: 102400,
      metadata: {
        sourceRef: filePath,
      },
      aliases: ["/upload/:bucket"],
    }))
    return file;
  };

  if (await fs.pathExists(filePath)) {
    fileUpload = upload(filePath);
  }
  else if (await fs.pathExists(filePath.replace('&', '_'))) {
    fileUpload = upload(filePath.replace('&', '_'))
  }
  else if (await fs.pathExists(filePath.replace('.pdf', '.PDF'))) {
    fileUpload = upload(filePath.replace('&', '_'))
  }
  else if (await fs.pathExists(filePath.replace('.PDF', '.pdf'))) {
    fileUpload = upload(filePath.replace('&', '_'))
  }
  else {
    console.log('filePath', filePath, 'not found!')
  }
  return fileUpload;
}

async function bulkUpdate(client: MongoClient, { dbName, collectionName }: { dbName: string; collectionName: string; }) {
  var bulk = client.db(dbName).collection(collectionName).initializeUnorderedBulkOp();
  var bulkUpsertAdd = async (filter: object, insertData: object) => {
    bulk.find(filter).upsert().update({ $set: addMetadataCreate(insertData) })
  }
  return { bulk, bulkUpsertAdd }
}

export { createOne, deleteOne, updateById, updateOne, updateMany, findOneById, createOneIfNotExist, bulkCreateOneIfNotExist, uploadExpressFile, uploadFileFS, bulkUpdate };