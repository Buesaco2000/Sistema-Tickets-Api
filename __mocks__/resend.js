// Mock automático de Jest para el paquete 'resend' en tests.
// Ubicado junto a node_modules → Jest lo usa sin necesidad de jest.mock('resend').
const Resend = function () {
  return {
    emails: {
      send: jest.fn().mockResolvedValue({ id: 'mock-email-id' }),
    },
  };
};

module.exports = { Resend };
