const { RESULT_CODES } = require('../utils/constants');
const postDataAccess = require('../dataaccess/post');

const EDIT_WINDOW_MS = 60 * 60 * 1000;

const create = async (data, user) => {
  try {
    const post = await postDataAccess.create({
      title: data.title,
      content: data.content,
      userId: user.id,
    });
    return { code: RESULT_CODES.SUCCESS, data: post };
  } catch (error) {
    return { code: RESULT_CODES.ERROR, data: error };
  }
};

const edit = async (id, data, user) => {
  try {
    const post = await postDataAccess.findById(id);

    if (!post) {
      return { code: RESULT_CODES.NOT_FOUND, data: null };
    }

    if (post.userId !== user.id) {
      return { code: RESULT_CODES.FORBIDDEN, data: null };
    }

    const elapsed = Date.now() - new Date(post.createdAt).getTime();
    if (elapsed >= EDIT_WINDOW_MS) {
      return { code: RESULT_CODES.EDIT_WINDOW_EXPIRED, data: null };
    }

    const updated = await postDataAccess.update(id, data);
    return { code: RESULT_CODES.SUCCESS, data: updated };
  } catch (error) {
    return { code: RESULT_CODES.ERROR, data: error };
  }
};

module.exports = { create, edit };
