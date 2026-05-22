const path = require('path');

let binding;
if (process.platform === 'darwin') {
  // In packaged app, asar-unpacked .node files are at app.asar.unpacked/
  const tryPaths = [
    path.join(__dirname, 'build/Release/macos_vibrancy.node'),
    path.join(__dirname.replace('app.asar', 'app.asar.unpacked'), 'build/Release/macos_vibrancy.node'),
    path.join(__dirname, 'build/Debug/macos_vibrancy.node'),
  ];
  for (const p of tryPaths) {
    try {
      binding = require(p);
      break;
    } catch {}
  }
  if (!binding) {
    console.warn('[macos-vibrancy] Native addon not found, vibrancy disabled');
    binding = { setVibrancy() {}, removeVibrancy() {}, setBackgroundBlurRadius() {} };
  }
} else {
  binding = { setVibrancy() {}, removeVibrancy() {}, setBackgroundBlurRadius() {} };
}

module.exports = binding;
