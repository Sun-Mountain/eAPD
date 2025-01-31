exports.seed = async knex => {
  await knex('state_admin_certifications').insert([
    {
      id: 5004, // manually set for testing
      state: 'ak',
      ffy: 2022,
      name: 'State Admin Test',
      email: 'stateadminmatch@email.com',
      phone: '4105555555',
      fileUrl: 'http://localhost:8081/auth/certifications/files/test-123',
      uploadedBy: 'fed-admin',
      uploadedOn: new Date(),
      affiliationId: null,
      status: 'active'
    },
  ]);
};
