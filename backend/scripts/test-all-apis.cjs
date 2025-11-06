/**
 * 运行所有 API 测试的脚本
 * 
 * 依次运行所有模块的测试，并汇总结果
 */

const { spawn } = require('child_process');
const path = require('path');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 测试配置
const tests = [
  { name: 'Pet API', script: 'test-pet-api.cjs', emoji: '🐾' },
  { name: 'Weight API', script: 'test-weight-api.cjs', emoji: '⚖️' },
  { name: 'Feeding API', script: 'test-feeding-api.cjs', emoji: '🍖' },
  { name: 'Medical API', script: 'test-medical-api.cjs', emoji: '💊' },
  { name: 'Reminder API', script: 'test-reminder-api.cjs', emoji: '⏰' }
];

// 测试结果统计
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
};

// 运行单个测试脚本
function runTest(testConfig) {
  return new Promise((resolve) => {
    log(`\n${'='.repeat(70)}`, 'cyan');
    log(`${testConfig.emoji}  开始测试: ${testConfig.name}`, 'bright');
    log(`${'='.repeat(70)}`, 'cyan');

    const scriptPath = path.join(__dirname, testConfig.script);
    const child = spawn('node', [scriptPath], {
      stdio: 'inherit',
      shell: true
    });

    child.on('close', (code) => {
      if (code === 0) {
        log(`\n✅ ${testConfig.name} 测试通过`, 'green');
        results.passed++;
      } else {
        log(`\n❌ ${testConfig.name} 测试失败 (退出码: ${code})`, 'red');
        results.failed++;
        results.errors.push({ name: testConfig.name, code });
      }
      results.total++;
      resolve();
    });

    child.on('error', (err) => {
      log(`\n💥 ${testConfig.name} 运行出错: ${err.message}`, 'red');
      results.failed++;
      results.errors.push({ name: testConfig.name, error: err.message });
      results.total++;
      resolve();
    });
  });
}

// 主测试函数
async function runAllTests() {
  const startTime = Date.now();

  log('\n', 'reset');
  log('╔═══════════════════════════════════════════════════════════════════╗', 'magenta');
  log('║                                                                   ║', 'magenta');
  log('║        🚀  Little Friend Garden - 完整 API 测试套件  🚀        ║', 'magenta');
  log('║                                                                   ║', 'magenta');
  log('╚═══════════════════════════════════════════════════════════════════╝', 'magenta');
  log('\n', 'reset');

  log(`📋 测试计划: 共 ${tests.length} 个模块`, 'yellow');
  tests.forEach((test, index) => {
    log(`   ${index + 1}. ${test.emoji} ${test.name}`, 'cyan');
  });

  log('\n⏱️  开始测试...', 'yellow');
  log(`📅 开始时间: ${new Date().toLocaleString('zh-CN')}`, 'yellow');

  // 依次运行每个测试
  for (const test of tests) {
    await runTest(test);
  }

  const duration = Date.now() - startTime;

  // 输出最终总结
  log('\n', 'reset');
  log('╔═══════════════════════════════════════════════════════════════════╗', 'magenta');
  log('║                         📊 测试总结报告                          ║', 'magenta');
  log('╚═══════════════════════════════════════════════════════════════════╝', 'magenta');
  log('', 'reset');

  log(`📈 测试模块总数: ${results.total}`, 'cyan');
  log(`✅ 通过的模块:   ${results.passed}`, results.passed === results.total ? 'green' : 'yellow');
  log(`❌ 失败的模块:   ${results.failed}`, results.failed > 0 ? 'red' : 'green');
  log(`⏱️  总耗时:       ${(duration / 1000).toFixed(2)} 秒`, 'cyan');
  log(`📅 结束时间:     ${new Date().toLocaleString('zh-CN')}`, 'cyan');

  if (results.errors.length > 0) {
    log('\n❌ 失败详情:', 'red');
    results.errors.forEach((err, index) => {
      log(`   ${index + 1}. ${err.name}`, 'red');
      if (err.code !== undefined) {
        log(`      退出码: ${err.code}`, 'red');
      }
      if (err.error) {
        log(`      错误: ${err.error}`, 'red');
      }
    });
  }

  log('\n', 'reset');

  if (results.failed === 0) {
    log('╔═══════════════════════════════════════════════════════════════════╗', 'green');
    log('║                                                                   ║', 'green');
    log('║                    🎉 所有测试全部通过！ 🎉                     ║', 'green');
    log('║                                                                   ║', 'green');
    log('╚═══════════════════════════════════════════════════════════════════╝', 'green');
  } else {
    log('╔═══════════════════════════════════════════════════════════════════╗', 'red');
    log('║                                                                   ║', 'red');
    log('║                  ⚠️  部分测试失败，请检查！ ⚠️                 ║', 'red');
    log('║                                                                   ║', 'red');
    log('╚═══════════════════════════════════════════════════════════════════╝', 'red');
  }

  log('\n', 'reset');

  process.exit(results.failed > 0 ? 1 : 0);
}

// 运行所有测试
runAllTests().catch(err => {
  log(`\n💥 测试套件运行出错: ${err.message}`, 'red');
  console.error(err);
  process.exit(1);
});

