const ft = require('file-type');

const { loggedIn } = require('../../../../middleware/auth');
const { can } = require('../../../../middleware');
const logger = require('../../../../logger')('auth certifications get');

const { getFile: get } = require('../../../../files');

const {
  generateFileName: generateName
} = require('../../../../util/fileUtils');

module.exports = (
  app,
  { getFile = get, generateFileName = generateName } = {}
) => {
  logger.silly('setting up GET /auth/certifications/files/:fileID route');

  app.get(
    '/auth/certifications/files/:fileID',
    loggedIn,
    can('view-state-certifications'),
    async (req, res, next) => {
      try {
        const file = await getFile(req.params.fileID);
        if (file) {
          let fileName;
          try {
            // Generate filename
            fileName = await generateFileName(file, req.params.fileID);
          } catch (e) {
            const { ext = null } = await ft.fromBuffer(file);
            fileName = `untitled.${ext}`;
          }

          res.setHeader('Content-Type', 'application/octet-stream');
          res.setHeader(
            'Content-Disposition',
            `attachment; filename=${fileName}`
          );
          res.send(file).end();
        } else {
          res.status(400).end();
        }
      } catch (e) {
        logger.error({ id: req.id, message: 'error fetching file' });
        logger.error({ id: req.id, message: e });
        next(e);
      }
    }
  );
};
