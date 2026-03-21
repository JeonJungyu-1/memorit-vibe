const React = require('react');
const { View } = require('react-native');

function MockToast() {
  return React.createElement(View, { testID: 'toast-mock' });
}
MockToast.show = jest.fn();

module.exports = {
  __esModule: true,
  default: MockToast,
};
