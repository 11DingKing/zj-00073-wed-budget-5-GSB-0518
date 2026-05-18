import "reflect-metadata";
import { AppDataSource } from "./data-source";
import { User } from "./entities/User";
import { BudgetCategory } from "./entities/BudgetCategory";
import { BudgetItem } from "./entities/BudgetItem";
import { Expense } from "./entities/Expense";
import { Installment } from "./entities/Installment";
import { Income } from "./entities/Income";
import { Split } from "./entities/Split";
import { RecurringExpense } from "./entities/RecurringExpense";
import { ExchangeRate } from "./entities/ExchangeRate";
import { BudgetTemplate } from "./entities/BudgetTemplate";
import { AlertRule } from "./entities/AlertRule";
import { Alert } from "./entities/Alert";
import { SharedAccess } from "./entities/SharedAccess";
import crypto from "crypto";

async function seed() {
  await AppDataSource.initialize();
  console.log("开始初始化数据...");

  const userRepository = AppDataSource.getRepository(User);
  const categoryRepository = AppDataSource.getRepository(BudgetCategory);
  const itemRepository = AppDataSource.getRepository(BudgetItem);
  const expenseRepository = AppDataSource.getRepository(Expense);
  const installmentRepository = AppDataSource.getRepository(Installment);
  const incomeRepository = AppDataSource.getRepository(Income);
  const splitRepository = AppDataSource.getRepository(Split);
  const recurringExpenseRepository =
    AppDataSource.getRepository(RecurringExpense);
  const exchangeRateRepository = AppDataSource.getRepository(ExchangeRate);
  const templateRepository = AppDataSource.getRepository(BudgetTemplate);
  const alertRuleRepository = AppDataSource.getRepository(AlertRule);
  const alertRepository = AppDataSource.getRepository(Alert);
  const sharedAccessRepository = AppDataSource.getRepository(SharedAccess);

  console.log("1. 创建用户账号...");
  const hashedAdminPassword = crypto
    .createHash("sha256")
    .update("admin123456")
    .digest("hex");
  const hashedCouplePassword = crypto
    .createHash("sha256")
    .update("couple123456")
    .digest("hex");

  const admin = userRepository.create({
    username: "admin",
    password: hashedAdminPassword,
    role: "Admin",
  });
  await userRepository.save(admin);

  const couple = userRepository.create({
    username: "couple1",
    password: hashedCouplePassword,
    role: "Couple",
  });
  await userRepository.save(couple);

  console.log("2. 创建 12 个预算分类...");
  const categoriesData = [
    { name: "场地租赁", budgetLimit: 50000, description: "婚宴场地租赁费用" },
    {
      name: "婚庆布置",
      budgetLimit: 30000,
      description: "现场布置、花艺装饰等",
    },
    { name: "摄影摄像", budgetLimit: 15000, description: "婚纱照、婚礼跟拍" },
    { name: "婚纱礼服", budgetLimit: 20000, description: "婚纱、礼服、西装等" },
    { name: "婚车", budgetLimit: 10000, description: "婚车租赁费用" },
    { name: "喜糖伴手礼", budgetLimit: 8000, description: "喜糖、伴手礼等" },
    { name: "请柬", budgetLimit: 3000, description: "请柬设计与制作" },
    { name: "司仪", budgetLimit: 6000, description: "婚礼主持费用" },
    { name: "化妆", budgetLimit: 5000, description: "新娘化妆、造型" },
    { name: "花艺", budgetLimit: 8000, description: "手捧花、胸花等" },
    { name: "灯光音响", budgetLimit: 12000, description: "灯光、音响设备" },
    { name: "婚宴酒席", budgetLimit: 150000, description: "婚宴餐费、酒水等" },
    { name: "蜜月旅行", budgetLimit: 30000, description: "蜜月旅行费用" },
    { name: "其他", budgetLimit: 10000, description: "其他杂项费用" },
  ];

  const categories: BudgetCategory[] = [];
  for (const catData of categoriesData) {
    const category = categoryRepository.create(catData);
    categories.push(await categoryRepository.save(category));
  }

  console.log("3. 创建预算子项...");
  const itemsData = [
    { category: categories[0], name: "场地定金", estimatedCost: 10000 },
    { category: categories[0], name: "场地尾款", estimatedCost: 40000 },
    { category: categories[1], name: "主舞台布置", estimatedCost: 15000 },
    { category: categories[1], name: "迎宾区布置", estimatedCost: 8000 },
    { category: categories[2], name: "婚纱照", estimatedCost: 8000 },
    { category: categories[2], name: "婚礼跟拍", estimatedCost: 7000 },
    { category: categories[3], name: "新娘婚纱", estimatedCost: 12000 },
    { category: categories[3], name: "新郎西装", estimatedCost: 8000 },
    { category: categories[11], name: "每桌餐费", estimatedCost: 3000 },
    { category: categories[11], name: "酒水饮料", estimatedCost: 20000 },
  ];

  for (const itemData of itemsData) {
    const item = itemRepository.create(itemData);
    await itemRepository.save(item);
  }

  console.log("4. 创建 30 笔支出记录...");
  const suppliers = [
    "XX婚庆公司",
    "YY摄影工作室",
    "ZZ婚纱店",
    "AA花艺",
    "BB酒店",
    "CC租车行",
    "DD彩妆工作室",
  ];
  const paymentMethods: any = ["现金", "转账", "信用卡", "微信", "支付宝"];
  const statuses: any = ["已付", "待付", "已付"];

  const expensesData = [];
  let expenseIndex = 0;

  for (const category of categories) {
    for (let j = 0; j < 2; j++) {
      const amount = Math.floor(Math.random() * 10000) + 500;
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 90));

      expensesData.push({
        amount,
        category: category.name,
        subItem: `子项${expenseIndex + 1}`,
        supplierName: suppliers[Math.floor(Math.random() * suppliers.length)],
        paymentMethod:
          paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
        paymentDate: date,
        voucherImageUrl:
          expenseIndex % 5 === 0
            ? `https://example.com/voucher${expenseIndex}.jpg`
            : undefined,
        remarks: expenseIndex % 3 === 0 ? "备注信息" : undefined,
        status: statuses[Math.floor(Math.random() * statuses.length)],
      });
      expenseIndex++;
    }
  }

  const remainingCount = 30 - expensesData.length;
  for (let i = 0; i < remainingCount; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const amount = Math.floor(Math.random() * 10000) + 500;
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 90));

    expensesData.push({
      amount,
      category: category.name,
      subItem: `子项${expenseIndex + 1}`,
      supplierName: suppliers[Math.floor(Math.random() * suppliers.length)],
      paymentMethod:
        paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
      paymentDate: date,
      voucherImageUrl:
        expenseIndex % 5 === 0
          ? `https://example.com/voucher${expenseIndex}.jpg`
          : undefined,
      remarks: expenseIndex % 3 === 0 ? "备注信息" : undefined,
      status: statuses[Math.floor(Math.random() * statuses.length)],
    });
    expenseIndex++;
  }

  const expenses: Expense[] = [];
  for (const expData of expensesData) {
    const expense = expenseRepository.create(expData);
    expenses.push(await expenseRepository.save(expense));
  }

  console.log("5. 创建 3 个分期合同...");
  const today = new Date();
  const installmentContracts = [
    {
      supplierName: "BB酒店",
      totalAmount: 150000,
      installmentCount: 3,
      perInstallmentAmount: 50000,
      firstDueDate: new Date(today.getFullYear(), today.getMonth(), 1),
    },
    {
      supplierName: "XX婚庆公司",
      totalAmount: 80000,
      installmentCount: 2,
      perInstallmentAmount: 40000,
      firstDueDate: new Date(today.getFullYear(), today.getMonth() + 1, 15),
    },
    {
      supplierName: "YY摄影工作室",
      totalAmount: 20000,
      installmentCount: 2,
      perInstallmentAmount: 10000,
      firstDueDate: new Date(today.getFullYear(), today.getMonth() - 1, 10),
    },
  ];

  for (const contract of installmentContracts) {
    for (let i = 0; i < contract.installmentCount; i++) {
      const dueDate = new Date(contract.firstDueDate);
      dueDate.setMonth(dueDate.getMonth() + i);
      const installment = installmentRepository.create({
        supplierName: contract.supplierName,
        totalAmount: contract.totalAmount,
        installmentCount: contract.installmentCount,
        perInstallmentAmount: contract.perInstallmentAmount,
        installmentNumber: i + 1,
        dueDate,
        status: i === 0 ? "已付" : dueDate < today ? "逾期" : "待付",
      });
      await installmentRepository.save(installment);
    }
  }

  console.log("6. 创建 5 笔收入记录...");
  const incomeSources: any = ["份子钱", "红包", "赞助", "其他"];
  const fromNames = ["张叔叔", "李阿姨", "王总", "朋友小明", "公司福利"];

  for (let i = 0; i < 5; i++) {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 60));

    const income = incomeRepository.create({
      amount: Math.floor(Math.random() * 5000) + 500,
      source: incomeSources[Math.floor(Math.random() * incomeSources.length)],
      from: fromNames[i],
      receivedDate: date,
      remarks: i % 2 === 0 ? "礼金" : undefined,
    });
    await incomeRepository.save(income);
  }

  console.log("7. 创建 2 笔分摊记录...");
  const parties: any = ["男方家", "女方家", "双方共担"];

  for (let i = 0; i < 2; i++) {
    const expense = expenses[i];
    const splitData = [
      { party: parties[0], percentage: 50 },
      { party: parties[1], percentage: 50 },
    ];

    for (const sd of splitData) {
      const amountDue = (expense.amount as any) * (sd.percentage / 100);
      const split = splitRepository.create({
        expenseId: expense.id,
        party: sd.party,
        percentage: sd.percentage,
        amountDue,
        amountPaid: i === 0 ? amountDue : 0,
        remarks: "婚礼费用分摊",
      });
      await splitRepository.save(split);
    }
  }

  console.log("8. 创建 3 条待审批支出记录...");
  const adminUser = await userRepository.findOneBy({ username: "admin" });
  const coupleUser = await userRepository.findOneBy({ username: "couple1" });

  const pendingExpensesData = [
    {
      amount: 8888,
      category: "蜜月旅行",
      supplierName: "海外旅行社",
      paymentMethod: "信用卡" as any,
      paymentDate: new Date(),
      remarks: "马尔代夫蜜月旅行定金",
      status: "待付" as any,
      approvalStatus: "待审批" as any,
      submittedBy: coupleUser,
    },
    {
      amount: 15000,
      category: "摄影摄像",
      supplierName: "国际婚纱摄影",
      paymentMethod: "转账" as any,
      paymentDate: new Date(),
      remarks: "欧洲婚纱照拍摄",
      status: "待付" as any,
      approvalStatus: "待审批" as any,
      submittedBy: coupleUser,
    },
    {
      amount: 6666,
      category: "婚庆布置",
      supplierName: "高端婚礼策划",
      paymentMethod: "微信" as any,
      paymentDate: new Date(),
      remarks: "鲜花布置费用",
      status: "待付" as any,
      approvalStatus: "待审批" as any,
      submittedBy: coupleUser,
    },
  ];

  const pendingExpenses: Expense[] = [];
  for (const expData of pendingExpensesData) {
    const expense = expenseRepository.create(expData);
    pendingExpenses.push(await expenseRepository.save(expense));
  }

  console.log("9. 创建 2 条周期性支出...");
  const weddingDate = new Date();
  weddingDate.setMonth(weddingDate.getMonth() + 6);

  const recurringExpensesData = [
    {
      category: "场地租赁",
      supplierName: "五星级酒店",
      amount: 50000,
      paymentMethod: "转账" as any,
      dayOfMonth: 1,
      startDate: new Date(),
      endDate: weddingDate,
      remarks: "婚宴场地月租",
    },
    {
      category: "司仪",
      supplierName: "知名主持人工作室",
      amount: 8000,
      paymentMethod: "微信" as any,
      dayOfMonth: 15,
      startDate: new Date(),
      endDate: weddingDate,
      remarks: "策划师月费",
    },
  ];

  for (const reData of recurringExpensesData) {
    const recurringExpense = recurringExpenseRepository.create(reData);
    await recurringExpenseRepository.save(recurringExpense);
  }

  console.log("10. 创建 3 种常用汇率...");
  const exchangeRatesData = [
    {
      currency: "USD" as any,
      currencyName: "美元",
      rate: 7.25,
      remarks: "人民币对美元汇率",
    },
    {
      currency: "EUR" as any,
      currencyName: "欧元",
      rate: 7.85,
      remarks: "人民币对欧元汇率",
    },
    {
      currency: "JPY" as any,
      currencyName: "日元",
      rate: 0.048,
      remarks: "人民币对日元汇率",
    },
  ];

  for (const erData of exchangeRatesData) {
    const exchangeRate = exchangeRateRepository.create({
      ...erData,
      lastUpdated: new Date(),
    });
    await exchangeRateRepository.save(exchangeRate);
  }

  console.log("11. 创建 5 套预算模板...");
  const budgetTemplatesData = [
    {
      name: "经济型" as any,
      totalBudget: 50000,
      description: "适合预算有限的新人，侧重性价比",
      categories: [
        { name: "场地租赁", percentage: 30 },
        { name: "婚庆布置", percentage: 15 },
        { name: "摄影摄像", percentage: 10 },
        { name: "婚纱礼服", percentage: 10 },
        { name: "婚车", percentage: 5 },
        { name: "喜糖伴手礼", percentage: 5 },
        { name: "请柬", percentage: 2 },
        { name: "司仪", percentage: 5 },
        { name: "化妆", percentage: 3 },
        { name: "花艺", percentage: 5 },
        { name: "灯光音响", percentage: 5 },
        { name: "婚宴酒席", percentage: 5 },
      ],
    },
    {
      name: "标准型" as any,
      totalBudget: 150000,
      description: "经典标准配置，适合大多数婚礼",
      categories: [
        { name: "场地租赁", percentage: 25 },
        { name: "婚庆布置", percentage: 15 },
        { name: "摄影摄像", percentage: 10 },
        { name: "婚纱礼服", percentage: 10 },
        { name: "婚车", percentage: 5 },
        { name: "喜糖伴手礼", percentage: 5 },
        { name: "请柬", percentage: 2 },
        { name: "司仪", percentage: 5 },
        { name: "化妆", percentage: 3 },
        { name: "花艺", percentage: 5 },
        { name: "灯光音响", percentage: 5 },
        { name: "婚宴酒席", percentage: 10 },
      ],
    },
    {
      name: "豪华型" as any,
      totalBudget: 300000,
      description: "豪华配置，品质与体验并重",
      categories: [
        { name: "场地租赁", percentage: 25 },
        { name: "婚庆布置", percentage: 20 },
        { name: "摄影摄像", percentage: 10 },
        { name: "婚纱礼服", percentage: 12 },
        { name: "婚车", percentage: 5 },
        { name: "喜糖伴手礼", percentage: 5 },
        { name: "请柬", percentage: 2 },
        { name: "司仪", percentage: 5 },
        { name: "化妆", percentage: 3 },
        { name: "花艺", percentage: 5 },
        { name: "灯光音响", percentage: 5 },
        { name: "婚宴酒席", percentage: 3 },
      ],
    },
    {
      name: "奢华型" as any,
      totalBudget: 500000,
      description: "高端奢华配置，打造梦幻婚礼",
      categories: [
        { name: "场地租赁", percentage: 20 },
        { name: "婚庆布置", percentage: 25 },
        { name: "摄影摄像", percentage: 12 },
        { name: "婚纱礼服", percentage: 15 },
        { name: "婚车", percentage: 5 },
        { name: "喜糖伴手礼", percentage: 5 },
        { name: "请柬", percentage: 2 },
        { name: "司仪", percentage: 5 },
        { name: "化妆", percentage: 3 },
        { name: "花艺", percentage: 5 },
        { name: "灯光音响", percentage: 3 },
      ],
    },
    {
      name: "定制型" as any,
      totalBudget: 1000000,
      description: "完全定制化配置，根据个性需求调整",
      categories: [
        { name: "场地租赁", percentage: 20 },
        { name: "婚庆布置", percentage: 20 },
        { name: "摄影摄像", percentage: 15 },
        { name: "婚纱礼服", percentage: 15 },
        { name: "婚车", percentage: 5 },
        { name: "喜糖伴手礼", percentage: 5 },
        { name: "请柬", percentage: 2 },
        { name: "司仪", percentage: 5 },
        { name: "化妆", percentage: 3 },
        { name: "花艺", percentage: 5 },
        { name: "灯光音响", percentage: 5 },
      ],
    },
  ];

  const templates: BudgetTemplate[] = [];
  for (const tData of budgetTemplatesData) {
    const template = templateRepository.create({
      ...tData,
      isActive: true,
    });
    templates.push(await templateRepository.save(template));
  }

  console.log("12. 创建 3 条预警规则...");
  const alertRulesData = [
    {
      name: "婚宴酒席周支出预警",
      ruleType: "category_weekly_spend" as any,
      thresholdAmount: 20000,
      categoryName: "婚宴酒席",
      severity: "medium" as any,
      isEnabled: true,
      description: "婚宴酒席分类周支出超过20000元时触发",
    },
    {
      name: "总支出增速预警",
      ruleType: "total_spend_growth" as any,
      thresholdPercentage: 20,
      severity: "high" as any,
      isEnabled: true,
      description: "周总支出较上周增长超过20%时触发",
    },
    {
      name: "XX婚庆公司付款逾期",
      ruleType: "supplier_payment_overdue" as any,
      thresholdDays: 7,
      supplierName: "XX婚庆公司",
      severity: "critical" as any,
      isEnabled: true,
      description: "XX婚庆公司款项逾期7天未付时触发",
    },
  ];

  const alertRules: AlertRule[] = [];
  for (const arData of alertRulesData) {
    const rule = alertRuleRepository.create(arData);
    alertRules.push(await alertRuleRepository.save(rule));
  }

  console.log("13. 创建 2 条预警记录...");
  const now = new Date();
  const alertsData = [
    {
      rule: alertRules[0],
      message: "婚宴酒席本周支出 25000 已超过阈值 20000",
      severity: "medium" as any,
      status: "pending" as any,
      actualValue: 25000,
      categoryName: "婚宴酒席",
      createdAt: now,
      updatedAt: now,
    },
    {
      rule: alertRules[1],
      message: "总支出增长率 25.5% 已超过阈值 20%",
      severity: "high" as any,
      status: "acknowledged" as any,
      actualValue: 25.5,
      acknowledgedAt: now,
      createdAt: now,
      updatedAt: now,
    },
  ];

  for (const aData of alertsData) {
    const alert = alertRepository.create(aData);
    await alertRepository.save(alert);
  }

  console.log("14. 创建 1 个账单共享链接...");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  const sharedAccess = sharedAccessRepository.create({
    shareToken: "demo-share-token-12345",
    accessPassword: "123456",
    shareName: "婚礼账单-父母查看",
    shareRole: "parent" as any,
    allowedCategories: ["场地租赁", "婚宴酒席", "婚庆布置"],
    expiresAt,
    viewCount: 3,
    isActive: true,
    description: "给父母查看主要支出分类的只读链接",
  });
  await sharedAccessRepository.save(sharedAccess);

  console.log("\n✅ 数据初始化完成!");
  console.log("\n📝 账号信息:");
  console.log("   - 管理员: admin / admin123456");
  console.log("   - 用户: couple1 / couple123456");
  console.log("\n📊 统计:");
  console.log(`   - 预算分类: ${categories.length} 个`);
  console.log(`   - 支出记录: ${expenses.length + pendingExpenses.length} 笔`);
  console.log(`   - 待审批支出: ${pendingExpenses.length} 笔`);
  console.log(
    `   - 周期性支出: ${(await recurringExpenseRepository.find()).length} 条`,
  );
  console.log(
    `   - 汇率配置: ${(await exchangeRateRepository.find()).length} 种`,
  );
  console.log(
    `   - 分期付款: ${(await installmentRepository.find()).length} 笔`,
  );
  console.log(`   - 收入记录: ${(await incomeRepository.find()).length} 笔`);
  console.log(`   - 分摊记录: ${(await splitRepository.find()).length} 笔`);
  console.log(`   - 预算模板: ${(await templateRepository.find()).length} 套`);
  console.log(`   - 预警规则: ${(await alertRuleRepository.find()).length} 条`);
  console.log(`   - 预警记录: ${(await alertRepository.find()).length} 条`);
  console.log(
    `   - 共享链接: ${(await sharedAccessRepository.find()).length} 个`,
  );
  console.log("\n🚀 启动服务: npm run dev");
  console.log("📚 Swagger 文档: http://localhost:3000/api/docs");

  process.exit(0);
}

seed().catch((error) => {
  console.error("❌ 数据初始化失败:", error);
  process.exit(1);
});
