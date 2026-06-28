const moduleRepository = require('../repositories/moduleRepository');
const entryRepository = require('../repositories/entryRepository');
const userRepository = require('../repositories/userRepository');
const rewardService = require('./rewardService');
const {
  startOfDay, endOfDay, getWeekRange, getMonthRange,
  getQuarterRange, getYearRange, calculateGrowth, getNumericValue,
} = require('../utils/dateUtils');

class AnalyticsService {
  /** Single optimized payload for the admin dashboard (one round trip). */
  async getOverview(businessId) {
    const now = new Date();
    const rangeStart = startOfDay(new Date(now));
    rangeStart.setDate(rangeStart.getDate() - 90);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalModules,
      staffResult,
      totalEntries,
      modules,
      entries,
      leaderboardData,
    ] = await Promise.all([
      moduleRepository.countByBusiness(businessId),
      userRepository.findByBusiness(businessId, { role: 'staff', isActive: true }, 1, 1),
      entryRepository.countByBusiness(businessId),
      moduleRepository.findByBusiness(businessId, {}),
      entryRepository.findByBusinessDateRange(businessId, rangeStart, endOfDay(now)),
      rewardService.getLeaderboard(businessId, 'monthly'),
    ]);

    const activeModules = modules.filter((m) => m.isActive !== false);
    const moduleGrowth = activeModules
      .map((mod) => ({
        moduleId: mod._id,
        name: mod.name,
        growth: this._getModuleOverallGrowthFromEntries(entries, mod, now),
      }))
      .sort((a, b) => b.growth - a.growth);

    const dashboard = {
      totalModules,
      totalStaff: staffResult.total,
      totalEntries,
      bestPerformingModule: moduleGrowth[0] || null,
      worstPerformingModule: moduleGrowth[moduleGrowth.length - 1] || null,
    };

    const entries30 = entries.filter((e) => new Date(e.entryDate) >= thirtyDaysAgo);
    const insightsGrowth = moduleGrowth.map((m) => ({
      module: m.name,
      moduleId: m.moduleId,
      growth: m.growth,
    }));

    const insights = {
      fastestGrowingChannel: insightsGrowth[0] || null,
      slowestGrowingChannel: insightsGrowth[insightsGrowth.length - 1] || null,
      bestWeek: this._getBestPeriodFromEntries(entries, activeModules, 'weekly'),
      bestMonth: this._getBestPeriodFromEntries(entries, activeModules, 'monthly'),
      highestEngagementDay: this._getHighestEngagementDay(entries30),
      consistencyScore: this._getConsistencyScore(entries30),
    };

    const chartModule = activeModules.find((m) => m.slug === 'instagram') || activeModules[0];
    let chartData = [];
    if (chartModule) {
      const field = this._getPrimaryNumericField(chartModule);
      if (field) {
        const moduleEntries = entries.filter((e) => String(e.moduleId) === String(chartModule._id));
        chartData = this._buildGrowthSeries(moduleEntries, field.slug, 'daily');
      }
    }

    return {
      dashboard,
      insights,
      chartData,
      leaderboard: leaderboardData.leaderboard || [],
    };
  }

  async getDashboard(businessId) {
    const [totalModules, staffResult, totalEntries, modules] = await Promise.all([
      moduleRepository.countByBusiness(businessId),
      userRepository.findByBusiness(businessId, { role: 'staff', isActive: true }, 1, 1),
      entryRepository.countByBusiness(businessId),
      moduleRepository.findByBusiness(businessId, { isActive: true }),
    ]);

    const moduleGrowth = await Promise.all(
      modules.map(async (mod) => {
        const growth = await this._getModuleOverallGrowth(businessId, mod);
        return { moduleId: mod._id, name: mod.name, growth };
      })
    );

    moduleGrowth.sort((a, b) => b.growth - a.growth);

    return {
      totalModules,
      totalStaff: staffResult.total,
      totalEntries,
      bestPerformingModule: moduleGrowth[0] || null,
      worstPerformingModule: moduleGrowth[moduleGrowth.length - 1] || null,
    };
  }

  async getGrowth(businessId, query) {
    const { moduleId, fieldSlug, period = 'monthly', startDate, endDate } = query;
    const mod = await moduleRepository.findById(moduleId);
    if (!mod) return { data: [], summary: {} };

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const entries = await entryRepository.findByDateRange(
      businessId, moduleId, startOfDay(start), endOfDay(end)
    );

    const periods = this._groupByPeriod(entries, fieldSlug, period);
    const data = [];
    let previousValue = null;

    for (const [label, value] of periods) {
      const growth = previousValue !== null ? calculateGrowth(value, previousValue) : 0;
      const netChange = previousValue !== null ? value - previousValue : 0;
      data.push({ period: label, value, growth, netChange });
      previousValue = value;
    }

    const growthValues = data.filter((d) => d.growth !== 0).map((d) => d.growth);
    const summary = {
      averageGrowth: growthValues.length
        ? parseFloat((growthValues.reduce((a, b) => a + b, 0) / growthValues.length).toFixed(2))
        : 0,
      totalGrowth: data.length >= 2
        ? calculateGrowth(data[data.length - 1].value, data[0].value)
        : 0,
      highestValue: Math.max(...data.map((d) => d.value), 0),
      lowestValue: Math.min(...data.map((d) => d.value), 0),
    };

    return { module: { id: mod._id, name: mod.name }, fieldSlug, period, data, summary };
  }

  async getInsights(businessId) {
    const modules = await moduleRepository.findByBusiness(businessId, { isActive: true });
    const moduleGrowth = [];

    for (const mod of modules) {
      const growth = await this._getModuleOverallGrowth(businessId, mod);
      moduleGrowth.push({ module: mod.name, moduleId: mod._id, growth });
    }

    moduleGrowth.sort((a, b) => b.growth - a.growth);

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const entries = await entryRepository.findByBusiness(
      businessId, { entryDate: { $gte: thirtyDaysAgo } }, 1, 1000
    );

    const daysWithEntries = new Set(entries.entries.map((e) => e.entryDate.toISOString().split('T')[0]));
    const consistencyScore = parseFloat(((daysWithEntries.size / 30) * 100).toFixed(1));

    let highestEngagementDay = null;
    let maxValue = 0;
    for (const entry of entries.entries) {
      const total = entry.values.reduce((sum, v) => sum + (parseFloat(v.value) || 0), 0);
      if (total > maxValue) {
        maxValue = total;
        highestEngagementDay = { date: entry.entryDate, value: total };
      }
    }

    return {
      fastestGrowingChannel: moduleGrowth[0] || null,
      slowestGrowingChannel: moduleGrowth[moduleGrowth.length - 1] || null,
      bestWeek: await this._getBestPeriod(businessId, 'weekly'),
      bestMonth: await this._getBestPeriod(businessId, 'monthly'),
      highestEngagementDay,
      consistencyScore,
    };
  }

  async getChartData(businessId, moduleId, query) {
    const { fieldSlug, chartType = 'line', period = 'monthly', months = 6 } = query;
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - parseInt(months));

    const result = await this.getGrowth(businessId, {
      moduleId, fieldSlug, period, startDate: start, endDate: end,
    });

    return { chartType, ...result };
  }

  _getPrimaryNumericField(mod) {
    return mod.fields?.find((f) =>
      ['number', 'currency', 'percentage'].includes(f.type) && f.isActive !== false
    );
  }

  _getModuleOverallGrowthFromEntries(entries, mod, now = new Date()) {
    const numericField = this._getPrimaryNumericField(mod);
    if (!numericField) return 0;

    const monthAgo = new Date(now);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    const twoMonthsAgo = new Date(now);
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    const modId = String(mod._id);
    const recentEntries = entries.filter((e) => {
      if (String(e.moduleId) !== modId) return false;
      const d = new Date(e.entryDate);
      return d >= startOfDay(monthAgo) && d <= endOfDay(now);
    });
    const olderEntries = entries.filter((e) => {
      if (String(e.moduleId) !== modId) return false;
      const d = new Date(e.entryDate);
      return d >= startOfDay(twoMonthsAgo) && d <= endOfDay(monthAgo);
    });

    return calculateGrowth(
      this._averageValue(recentEntries, numericField.slug),
      this._averageValue(olderEntries, numericField.slug)
    );
  }

  _buildGrowthSeries(entries, fieldSlug, period) {
    const periods = this._groupByPeriod(entries, fieldSlug, period);
    const data = [];
    let previousValue = null;

    for (const [label, value] of periods) {
      const growth = previousValue !== null ? calculateGrowth(value, previousValue) : 0;
      const netChange = previousValue !== null ? value - previousValue : 0;
      data.push({ period: label, value, growth, netChange });
      previousValue = value;
    }

    return data;
  }

  _getConsistencyScore(entries30) {
    const daysWithEntries = new Set(
      entries30.map((e) => new Date(e.entryDate).toISOString().split('T')[0])
    );
    return parseFloat(((daysWithEntries.size / 30) * 100).toFixed(1));
  }

  _getHighestEngagementDay(entries) {
    let highestEngagementDay = null;
    let maxValue = 0;
    for (const entry of entries) {
      const total = (entry.values || []).reduce((sum, v) => sum + (parseFloat(v.value) || 0), 0);
      if (total > maxValue) {
        maxValue = total;
        highestEngagementDay = { date: entry.entryDate, value: total };
      }
    }
    return highestEngagementDay;
  }

  _getBestPeriodFromEntries(entries, modules, periodType) {
    let bestPeriod = null;
    let bestGrowth = -Infinity;

    for (const mod of modules) {
      const field = this._getPrimaryNumericField(mod);
      if (!field) continue;

      const modEntries = entries.filter((e) => String(e.moduleId) === String(mod._id));
      const series = this._buildGrowthSeries(modEntries, field.slug, periodType);
      for (const item of series) {
        if (item.growth > bestGrowth) {
          bestGrowth = item.growth;
          bestPeriod = { period: item.period, growth: item.growth, module: mod.name };
        }
      }
    }

    return bestPeriod;
  }

  async _getModuleOverallGrowth(businessId, mod) {
    const numericField = mod.fields.find((f) =>
      ['number', 'currency', 'percentage'].includes(f.type) && f.isActive
    );
    if (!numericField) return 0;

    const now = new Date();
    const monthAgo = new Date(now);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    const twoMonthsAgo = new Date(now);
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    const recentEntries = await entryRepository.findByDateRange(
      businessId, mod._id, startOfDay(monthAgo), endOfDay(now)
    );
    const olderEntries = await entryRepository.findByDateRange(
      businessId, mod._id, startOfDay(twoMonthsAgo), endOfDay(monthAgo)
    );

    const recentAvg = this._averageValue(recentEntries, numericField.slug);
    const olderAvg = this._averageValue(olderEntries, numericField.slug);

    return calculateGrowth(recentAvg, olderAvg);
  }

  _averageValue(entries, fieldSlug) {
    if (!entries.length) return 0;
    const sum = entries.reduce((acc, e) => acc + getNumericValue(e.values, fieldSlug), 0);
    return sum / entries.length;
  }

  _groupByPeriod(entries, fieldSlug, period) {
    const groups = new Map();

    for (const entry of entries) {
      let label;
      const d = new Date(entry.entryDate);
      switch (period) {
        case 'daily':
          label = d.toISOString().split('T')[0];
          break;
        case 'weekly': {
          const { start } = getWeekRange(d);
          label = `W${this._getWeekNumber(start)}-${start.getFullYear()}`;
          break;
        }
        case 'quarterly': {
          const q = Math.floor(d.getMonth() / 3) + 1;
          label = `Q${q}-${d.getFullYear()}`;
          break;
        }
        case 'yearly':
          label = `${d.getFullYear()}`;
          break;
        default: {
          label = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        }
      }

      const value = getNumericValue(entry.values, fieldSlug);
      if (!groups.has(label)) groups.set(label, []);
      groups.get(label).push(value);
    }

    const result = new Map();
    for (const [label, values] of groups) {
      result.set(label, values.reduce((a, b) => a + b, 0) / values.length);
    }

    return new Map([...result.entries()].sort((a, b) => a[0].localeCompare(b[0])));
  }

  _getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  }

  async _getBestPeriod(businessId, periodType) {
    const modules = await moduleRepository.findByBusiness(businessId, { isActive: true });
    let bestPeriod = null;
    let bestGrowth = -Infinity;

    for (const mod of modules) {
      const numericField = mod.fields.find((f) =>
        ['number', 'currency', 'percentage'].includes(f.type)
      );
      if (!numericField) continue;

      const result = await this.getGrowth(businessId, {
        moduleId: mod._id,
        fieldSlug: numericField.slug,
        period: periodType,
      });

      for (const item of result.data) {
        if (item.growth > bestGrowth) {
          bestGrowth = item.growth;
          bestPeriod = { period: item.period, growth: item.growth, module: mod.name };
        }
      }
    }

    return bestPeriod;
  }
}

module.exports = new AnalyticsService();
