"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.count = exports.findOneAndDelete = exports.deleteMany = exports.deleteOne = exports.findByIdAndUpdate = exports.findOneAndUpdate = exports.updateOne = exports.insertMany = exports.find = exports.findById = exports.createOne = exports.create = exports.findOne = void 0;
const findOne = async ({ model, filter = {}, select = "", options = {}, }) => {
    const doc = model.findOne(filter);
    if (select)
        doc.select(select);
    if (options.populate)
        doc.populate(options.populate);
    if (options.lean)
        doc.lean();
    return await doc.exec();
};
exports.findOne = findOne;
const create = async ({ model, data, options = { validateBeforeSave: true }, }) => {
    return await model.create(data, options);
};
exports.create = create;
const createOne = async ({ model, data, options = { validateBeforeSave: true }, }) => {
    const [doc] = await model.create([data], options);
    return doc;
};
exports.createOne = createOne;
const findById = async ({ model, id, select = "", options = {}, }) => {
    const doc = model.findById(id);
    if (select)
        doc.select(select);
    if (options.sort)
        doc.sort(options.sort);
    if (options.populate)
        doc.populate(options.populate);
    if (options.lean)
        doc.lean();
    return await doc.exec();
};
exports.findById = findById;
const find = async ({ model, filter = {}, select = "", options = {}, }) => {
    const doc = model.find(filter);
    if (select)
        doc.select(select);
    if (options.populate)
        doc.populate(options.populate);
    if (options.lean)
        doc.lean();
    if (options.sort)
        doc.sort(options.sort);
    if (options.limit)
        doc.limit(options.limit);
    if (options.skip)
        doc.skip(options.skip);
    return await doc.exec();
};
exports.find = find;
const insertMany = async ({ model, data }) => {
    return await model.insertMany(data);
};
exports.insertMany = insertMany;
const updateOne = async ({ model, filter, update = {}, options = {}, }) => {
    return await model.updateOne(filter, { ...update, $inc: { __v: 1 } }, options);
};
exports.updateOne = updateOne;
const findOneAndUpdate = async ({ model, filter, update = {}, options = {}, }) => {
    return await model.findOneAndUpdate(filter, { ...update, $inc: { __v: 1 } }, { ...options, new: true, runValidators: true });
};
exports.findOneAndUpdate = findOneAndUpdate;
const findByIdAndUpdate = async ({ model, id, update = {}, options = {}, }) => {
    return await model.findByIdAndUpdate(id, { ...update, $inc: { __v: 1 } }, { ...options, new: true, runValidators: true });
};
exports.findByIdAndUpdate = findByIdAndUpdate;
const deleteOne = async ({ model, filter }) => {
    return await model.deleteOne(filter);
};
exports.deleteOne = deleteOne;
const deleteMany = async ({ model, filter }) => {
    return await model.deleteMany(filter);
};
exports.deleteMany = deleteMany;
const findOneAndDelete = async ({ model, filter }) => {
    return await model.findOneAndDelete(filter);
};
exports.findOneAndDelete = findOneAndDelete;
const count = async ({ model, filter }) => {
    return await model.countDocuments(filter);
};
exports.count = count;
