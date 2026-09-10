"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findOneAndDelete = exports.deleteMany = exports.deleteOne = exports.findByIdAndUpdate = exports.findOneAndUpdate = exports.updateOne = exports.insertMany = exports.createOne = exports.create = exports.find = exports.findById = exports.findOne = void 0;
// ============================
// Helper - فحص وجود الموديل قبل أي عملية
// ============================
const ensureModel = (model) => {
    if (!model) {
        throw new Error('DB layer: "model" is required');
    }
};
const findOne = async ({ model, filter = {}, select = "", options = {}, }) => {
    ensureModel(model);
    const doc = model.findOne(filter);
    if (select.length)
        doc.select(select);
    if (options.populate)
        doc.populate(options.populate);
    if (options.lean)
        doc.lean();
    return await doc.exec();
};
exports.findOne = findOne;
const findById = async ({ model, id, select = "", options = {}, }) => {
    ensureModel(model);
    const doc = model.findById(id);
    if (select.length)
        doc.select(select);
    if (options.populate)
        doc.populate(options.populate);
    if (options.lean)
        doc.lean();
    return await doc.exec();
};
exports.findById = findById;
const find = async ({ model, filter = {}, select = "", options = {}, }) => {
    ensureModel(model);
    const doc = model.find(filter);
    if (select.length)
        doc.select(select);
    if (options.populate)
        doc.populate(options.populate);
    if (options.sort)
        doc.sort(options.sort);
    if (options.limit)
        doc.limit(options.limit);
    if (options.skip)
        doc.skip(options.skip);
    if (options.lean)
        doc.lean();
    return await doc.exec();
};
exports.find = find;
// ============================
// CREATE OPERATIONS
// ============================
const create = async ({ model, data, options = { validateBeforeSave: true }, }) => {
    ensureModel(model);
    const payload = Array.isArray(data) ? data : [data];
    return await model.create(payload, options);
};
exports.create = create;
const createOne = async ({ model, data, options = { validateBeforeSave: true }, }) => {
    const [doc] = await (0, exports.create)({ model, data, options });
    return doc;
};
exports.createOne = createOne;
const insertMany = async ({ model, data, }) => {
    ensureModel(model);
    return (await model.insertMany(data));
};
exports.insertMany = insertMany;
const updateOne = async ({ model, filter, update = {}, options = {}, }) => {
    ensureModel(model);
    return await model.updateOne(filter, update, options);
};
exports.updateOne = updateOne;
const findOneAndUpdate = async ({ model, filter, update = {}, options = {}, }) => {
    ensureModel(model);
    return await model.findOneAndUpdate(filter, update, {
        ...options,
        new: true,
        runValidators: true,
    });
};
exports.findOneAndUpdate = findOneAndUpdate;
const findByIdAndUpdate = async ({ model, id, update = {}, options = {}, }) => {
    ensureModel(model);
    return await model.findByIdAndUpdate(id, update, {
        ...options,
        new: true,
        runValidators: true,
    });
};
exports.findByIdAndUpdate = findByIdAndUpdate;
// ============================
// DELETE OPERATIONS
// ⚠️ IMPORTANT: استخدم findOneAndDelete لو بدك تشغل cascade-delete hooks
// (pre('findOneAndDelete') المعرفة بالـ models). deleteOne/deleteMany
// ما بيشغلوا نفس الـ query middleware هاد.
// ============================
const deleteOne = async ({ model, filter, }) => {
    ensureModel(model);
    return await model.deleteOne(filter);
};
exports.deleteOne = deleteOne;
const deleteMany = async ({ model, filter, }) => {
    ensureModel(model);
    return await model.deleteMany(filter);
};
exports.deleteMany = deleteMany;
const findOneAndDelete = async ({ model, filter, }) => {
    ensureModel(model);
    return await model.findOneAndDelete(filter);
};
exports.findOneAndDelete = findOneAndDelete;
