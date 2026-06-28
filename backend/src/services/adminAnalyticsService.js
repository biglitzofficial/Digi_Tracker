const businessRepository = require('../repositories/businessRepository');
const moduleRepository = require('../repositories/moduleRepository');
const entryRepository = require('../repositories/entryRepository');
const userRepository = require('../repositories/userRepository');
const AppError = require('../utils/AppError');
const {
  startOfDay, endOfDay, getWeekRange, getMonthRange, getQuarterRange, getYearRange,
  calculateGrowth, getNumericValue,
} = require('../utils/dateUtils');

const NUMERIC_TYPES = ['number', 'currency', 'percentage'];

function getPeriodRange(period = 'monthly', refDate = new Date()) {
  switch (period) {
    case 'weekly': return getWeekRange(refDate);
    case 'quarterly': return getQuarterRange(refDate);
    case 'yearly': return getYearRange(refDate);
    default: return getMonthRange(refDate);
  }
}

function daysInRange(start, end) {
  return Math.max(1, Math.ceil((endOfDay(end) - startOfDay(start)) / 86400000));
}

function getPrimaryNumericField(mod) {
  return mod.fields?.find((f) => NUMERIC_TYPES.includes(f.type) && f.isActive !== false);
}

function getOpeningBalance(mod, fieldSlug) {
  const field = mod.fields?.find((f) => f.slug === fieldSlug);
  if (field?.openingBalance == null || field.openingBalance === '') return null;
  const value = parseFloat(field.openingBalance);
  return Number.isNaN(value) ? null : value;
}

function computeMetricGrowth(entries, fieldSlug, mod) {
  if (!fieldSlug || !entries.length) return 0;
  const sorted = [...entries].sort(
    (a, b) => new Date(a.entryDate) - new Date(b.entryDate)
  );
  const firstVal = getNumericValue(sorted[0].values, fieldSlug);
  const lastVal = getNumericValue(sorted[sorted.length - 1].values, fieldSlug);
  const baseline = getOpeningBalance(mod, fieldSlug) ?? firstVal;
  return calculateGrowth(lastVal, baseline);
}

function computeCompletionRate(entryCount, days) {
  return parseFloat(Math.min(100, (entryCount / days) * 100).toFixed(1));
}

function classifyPerformance(growth, businessAvg, entryCount) {
  if (entryCount === 0) return 'no_data';
  if (growth >= businessAvg + 5 || (businessAvg <= 0 && growth > 0)) return 'high';
  if (growth < businessAvg - 5 || growth < 0) return 'low';
  return 'average';
}

function buildRecommendations(modulePerformance) {
  const tips = [];
  const low = modulePerformance.filter((m) => m.performance === 'low');
  const missing = modulePerformance.filter((m) => m.performance === 'no_data');

  for (const m of low) {
    tips.push(`Improve ${m.moduleName} — growth ${m.growth}% vs team avg ${m.businessAvgGrowth}%`);
  }
  for (const m of missing) {
    tips.push(`No ${m.moduleName} entries this period — ensure daily submissions`);
  }
  const high = modulePerformance.filter((m) => m.performance === 'high');
  if (high.length && low.length) {
    tips.push(`Leverage strong ${high.map((h) => h.moduleName).join(', ')} performance to coach weaker channels`);
  }
  if (!tips.length) {
    tips.push('Consistent performance across channels — maintain current submission habits');
  }
  return tips.slice(0, 4);
}

class AdminAnalyticsService {
  async getBusinessComparison({ period = 'monthly' } = {}) {
    const { start, end } = getPeriodRange(period);
    const days = daysInRange(start, end);
    const { businesses } = await businessRepository.findAll({}, 1, 500);

    const rows = await Promise.all(
      businesses.map(async (business) => {
        const businessId = business._id;
        const [staffResult, modules, entries] = await Promise.all([
          userRepository.findByBusiness(businessId, { role: 'staff', isActive: true }, 1, 500),
          moduleRepository.findByBusiness(businessId, {}),
          entryRepository.findByBusinessDateRange(businessId, startOfDay(start), endOfDay(end)),
        ]);

        const activeModules = modules.filter((m) => m.isActive !== false);
        const moduleStats = activeModules.map((mod) => {
          const field = getPrimaryNumericField(mod);
          const modEntries = entries.filter((e) => String(e.moduleId) === String(mod._id));
          const growth = computeMetricGrowth(modEntries, field?.slug, mod);
          const expected = Math.max(1, staffResult.total * days);
          const submissionRate = parseFloat(
            Math.min(100, (modEntries.length / expected) * 100).toFixed(1)
          );
          return {
            moduleId: mod._id,
            name: mod.name,
            slug: mod.slug,
            icon: mod.icon,
            color: mod.color,
            growth,
            entries: modEntries.length,
            submissionRate,
          };
        }).sort((a, b) => b.growth - a.growth);

        const growthValues = moduleStats.filter((m) => m.entries > 0).map((m) => m.growth);
        const avgGrowth = growthValues.length
          ? parseFloat((growthValues.reduce((a, b) => a + b, 0) / growthValues.length).toFixed(2))
          : 0;

        return {
          businessId,
          name: business.name,
          type: business.type,
          email: business.email,
          staffCount: staffResult.total,
          moduleCount: activeModules.length,
          periodEntries: entries.length,
          avgGrowth,
          submissionRate: staffResult.total && activeModules.length
            ? parseFloat(
              Math.min(
                100,
                (entries.length / (staffResult.total * activeModules.length * days)) * 100
              ).toFixed(1)
            )
            : 0,
          bestModule: moduleStats[0] || null,
          worstModule: moduleStats.length ? moduleStats[moduleStats.length - 1] : null,
          modules: moduleStats,
        };
      })
    );

    rows.sort((a, b) => b.avgGrowth - a.avgGrowth);

    return {
      period,
      start,
      end,
      businesses: rows,
      summary: {
        totalBusinesses: rows.length,
        totalEntries: rows.reduce((s, b) => s + b.periodEntries, 0),
        topBusiness: rows[0] || null,
      },
    };
  }

  async getStaffPerformance(businessId, { period = 'monthly' } = {}) {
    if (!businessId) throw new AppError('businessId is required', 400);

    const business = await businessRepository.findById(businessId);
    if (!business) throw new AppError('Business not found', 404);

    const { start, end } = getPeriodRange(period);
    const days = daysInRange(start, end);

    const [staffResult, modules, entries] = await Promise.all([
      userRepository.findByBusiness(businessId, { role: 'staff', isActive: true }, 1, 500),
      moduleRepository.findByBusiness(businessId, {}),
      entryRepository.findByBusinessDateRange(businessId, startOfDay(start), endOfDay(end)),
    ]);

    const activeModules = modules.filter((m) => m.isActive !== false);

    const moduleAvgs = {};
    for (const mod of activeModules) {
      const field = getPrimaryNumericField(mod);
      const modEntries = entries.filter((e) => String(e.moduleId) === String(mod._id));
      moduleAvgs[mod._id] = computeMetricGrowth(modEntries, field?.slug, mod);
    }

    const staffReports = staffResult.users.map((staff) => {
      const modulePerformance = activeModules.map((mod) => {
        const field = getPrimaryNumericField(mod);
        const staffEntries = entries.filter(
          (e) => String(e.userId) === String(staff._id) && String(e.moduleId) === String(mod._id)
        );
        const growth = computeMetricGrowth(staffEntries, field?.slug, mod);
        const businessAvgGrowth = moduleAvgs[mod._id] ?? 0;
        const performance = classifyPerformance(growth, businessAvgGrowth, staffEntries.length);

        return {
          moduleId: mod._id,
          moduleName: mod.name,
          icon: mod.icon,
          color: mod.color,
          entries: staffEntries.length,
          growth,
          completionRate: computeCompletionRate(staffEntries.length, days),
          performance,
          businessAvgGrowth,
        };
      });

      const scored = modulePerformance.filter((m) => m.performance !== 'no_data');
      const avgCompletion = scored.length
        ? scored.reduce((s, m) => s + m.completionRate, 0) / scored.length
        : 0;
      const avgGrowth = scored.length
        ? scored.reduce((s, m) => s + m.growth, 0) / scored.length
        : 0;
      const overallScore = parseFloat(
        (avgCompletion * 0.4 + Math.max(0, avgGrowth) * 0.3 + (staff.rewardPoints || 0) * 0.01 + (staff.currentStreak || 0) * 2).toFixed(1)
      );

      const strengths = modulePerformance.filter((m) => m.performance === 'high').map((m) => m.moduleName);
      const weaknesses = modulePerformance.filter((m) => m.performance === 'low').map((m) => m.moduleName);

      return {
        userId: staff._id,
        name: `${staff.firstName} ${staff.lastName}`,
        email: staff.email,
        points: staff.rewardPoints || 0,
        streak: staff.currentStreak || 0,
        longestStreak: staff.longestStreak || 0,
        overallScore,
        avgCompletion: parseFloat(avgCompletion.toFixed(1)),
        avgGrowth: parseFloat(avgGrowth.toFixed(2)),
        strengths,
        weaknesses,
        modules: modulePerformance,
        recommendations: buildRecommendations(modulePerformance),
      };
    }).sort((a, b) => b.overallScore - a.overallScore);

    return {
      business: { _id: business._id, name: business.name, type: business.type },
      period,
      start,
      end,
      staff: staffReports,
    };
  }
}

module.exports = new AdminAnalyticsService();
