const tap = require('tap');
const sinon = require('sinon');

const { can } = require('../../../middleware');
const { loggedIn } = require('../../../middleware/auth');

const deleteEndpoint = require('./delete');

const mockExpress = require('../../../util/mockExpress');
const mockResponse = require('../../../util/mockResponse');

let app;
let res;
let next;

tap.test('state certifications delete endpoint', async deleteTest => {
  const di = {
    archiveStateAdminCertification: sinon.stub()
  };

  deleteTest.beforeEach(() => {
    app = mockExpress();
    res = mockResponse();
    next = sinon.stub();
  });

  deleteTest.test('setup', async setupTest => {
    deleteEndpoint(app);

    setupTest.ok(
      app.delete.calledWith(
        '/auth/certifications',
        loggedIn,
        can('edit-state-certifications'),
        sinon.match.func
      ),
      '/auth/certifications DELETE endpoint is setup'
    );
  });

  deleteTest.test('DELETE endpoint for returning the list of state admin certifications', async tests => {
    let handler;

    tests.beforeEach(async () => {
      deleteEndpoint(app, { ...di });
      handler = app.delete.args.find(
        args => args[0] === '/auth/certifications'
      ).pop();
    });

    tests.test('the db fails to save', async test => {
      const req = {
        body: {
          certificationId: '1234'
        },
        user: {
          id: '123'
        }
      };

      const err = { error: "cant save" }
      di.archiveStateAdminCertification.throws(err)

      await handler(req, res, next);

      test.ok(next.called, 'next is called')
      test.ok(next.calledWith(err), 'pass error to middleware');
    });

    tests.test('with valid request', async test => {
      const req = {
        body: {
          certificationId: '1234'
        },
        user: {
          id: '123'
        }
      };

      di.archiveStateAdminCertification.resolves({error: null});

      await handler(req, res, next);

      test.ok(res.send.calledWith(200), 'sends a 200 success response');
    });

  })
})
