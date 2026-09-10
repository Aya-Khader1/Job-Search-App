import { Model, FilterQuery, UpdateQuery, Types } from "mongoose";

type DBParams<T> = {
  model: Model<T>;
  filter?: FilterQuery<T>;
  data?: Partial<T>;
  update?: UpdateQuery<T>;
  select?: string;
  options?: any;
};

export const findOne = async <T>({
  model,
  filter = {},
  select = "",
  options = {},
}: DBParams<T>) => {
  const doc = model.findOne(filter);

  if (select) doc.select(select);
  if (options.populate) doc.populate(options.populate);
  if (options.lean) doc.lean();

  return await doc.exec();
};

export const create = async <T>({
  model,
  data,
  options = { validateBeforeSave: true },
}: DBParams<T>) => {
  return await model.create(data, options);
};

export const createOne = async <T>({
  model,
  data,
  options = { validateBeforeSave: true },
}: DBParams<T>) => {
  const [doc] = await model.create([data], options);
  return doc;
};

export const findById = async <T>({
  model,
  id,
  select = "",
  options = {},
}: DBParams<T> & { id: string | Types.ObjectId }) => {
  const doc = model.findById(id);

  if (select) doc.select(select);
  if (options.sort) doc.sort(options.sort);
  if (options.populate) doc.populate(options.populate);
  if (options.lean) doc.lean();

  return await doc.exec();
};

export const find = async <T>({
  model,
  filter = {},
  select = "",
  options = {},
}: DBParams<T>) => {
  const doc = model.find(filter);

  if (select) doc.select(select);
  if (options.populate) doc.populate(options.populate);
  if (options.lean) doc.lean();
  if (options.sort) doc.sort(options.sort);
  if (options.limit) doc.limit(options.limit);
  if (options.skip) doc.skip(options.skip);

  return await doc.exec();
};

export const insertMany = async <T>({ model, data }: DBParams<T>) => {
  return await model.insertMany(data);
};

export const updateOne = async <T>({
  model,
  filter,
  update = {},
  options = {},
}: DBParams<T>) => {
  return await model.updateOne(
    filter,
    { ...update, $inc: { __v: 1 } },
    options,
  );
};

export const findOneAndUpdate = async <T>({
  model,
  filter,
  update = {},
  options = {},
}: DBParams<T>) => {
  return await model.findOneAndUpdate(
    filter,
    { ...update, $inc: { __v: 1 } },
    { ...options, new: true, runValidators: true },
  );
};

export const findByIdAndUpdate = async <T>({
  model,
  id,
  update = {},
  options = {},
}: DBParams<T> & { id: string }) => {
  return await model.findByIdAndUpdate(
    id,
    { ...update, $inc: { __v: 1 } },
    { ...options, new: true, runValidators: true },
  );
};

export const deleteOne = async <T>({ model, filter }: DBParams<T>) => {
  return await model.deleteOne(filter);
};

export const deleteMany = async <T>({ model, filter }: DBParams<T>) => {
  return await model.deleteMany(filter);
};

export const findOneAndDelete = async <T>({ model, filter }: DBParams<T>) => {
  return await model.findOneAndDelete(filter);
};

export const count = async <T>({ model, filter }: DBParams<T>) => {
  return await model.countDocuments(filter);
};
