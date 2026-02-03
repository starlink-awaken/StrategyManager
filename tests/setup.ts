/**
 * Jest 测试环境设置
 *
 * 在所有测试运行之前执行的设置代码
 */

// 设置测试超时时间
jest.setTimeout(10000);

// 模拟环境变量
process.env.NODE_ENV = 'test';

// 全局测试设置
beforeAll(async () => {
  // 在所有测试之前执行的代码
  console.log('开始测试套件...');
});

afterAll(() => {
  // 在所有测试之后执行的代码
  console.log('测试套件完成');
});

// 每个测试之前
beforeEach(() => {
  // 清理或重置操作
});

// 每个测试之后
afterEach(() => {
  // 清理操作
});
